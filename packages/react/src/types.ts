/**
 * @danielivanov/mention — public type surface.
 *
 * Reading order:
 *   1. `MentionRootProps<TItem>`            — single-trigger public surface (80% case)
 *   2. `useMention<TItem>` return shape     — escape hatch (20% case)
 *   3. `MentionRootMultiProps<TItemMap>`    — multi-trigger
 *   4. Imperative ref handle                — controlled flows
 *   5. Sub-component prop types             — the parts hanging off `Mention.*`
 *
 * Architectural note: the internal state machine and trigger detector are
 * channel-keyed (each "channel" = an active trigger character + its config
 * bundle). Single-trigger mode is the N=1 case; the multi-trigger surface
 * exposes the same internal capability via `MentionRootMultiProps`.
 */

import type {
  HTMLAttributes,
  ReactNode,
  Ref,
  RefObject,
  TextareaHTMLAttributes,
} from "react";
import type { EditorAdapter } from "./adapters/types.ts";

// ─────────────────────────────────────────────────────────────────────────────
// 1. MentionRootProps — the 80% case
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Async fetcher for items. The library passes an `AbortSignal` so callers can
 * wire it to `fetch` and get free cancellation when the query changes.
 */
export type MentionFetcher<TItem> = (
  query: string,
  signal: AbortSignal,
) => Promise<readonly TItem[]>;

export type MentionItems<TItem> = readonly TItem[] | MentionFetcher<TItem>;

/**
 * Metadata passed to `onSelect`. Exposes the trigger character that opened the
 * menu (relevant when `trigger` is an array) and the raw search string the
 * user typed, so consumers can implement custom analytics or chip rendering
 * without re-deriving them.
 */
export interface MentionSelectMeta {
  /** The trigger character that opened the menu (e.g., '@'). */
  readonly trigger: string;
  /** The substring the user typed between the trigger and the caret. */
  readonly query: string;
  /** Caret offset in the textarea where the trigger sits. */
  readonly triggerOffset: number;
}

/**
 * Props for the single-trigger form of `<Mention.Root>`. For the
 * multi-trigger form, see `MentionRootMultiProps` below — the component
 * is overloaded.
 *
 * Architectural note: the internal state machine and trigger detector are
 * channel-keyed (channel = "active trigger character + its config
 * bundle"). Single-trigger mode is the N=1 case of the same machinery;
 * `MentionRootMultiProps` exposes the channel-keyed shape directly.
 */
export interface MentionRootProps<TItem> {
  /**
   * Trigger character. Mid-word triggers are suppressed (e.g. `foo@bar`
   * email patterns will not summon the menu).
   * @default "@"
   */
  trigger?: string;

  /**
   * Items to filter. Pass an array for sync data, or a function for async.
   * The async function receives the user's query and an `AbortSignal` —
   * wire the signal to `fetch` for free cancellation on rekey.
   */
  items: MentionItems<TItem>;

  /**
   * Stable key per item. Used as React `key` in the rendered list and for
   * memoization. Must return distinct values for distinct items.
   */
  getKey: (item: TItem) => string | number;

  /**
   * Display label per item — the human-readable text rendered inside
   * `<Mention.Item>` and used as the default insertion text. To customize
   * what lands in the textarea, pass `getInsertText` instead.
   */
  getLabel: (item: TItem) => string;

  /**
   * Optional formatter that controls what text gets inserted when a user
   * commits a selection. Defaults to `` `${trigger}${getLabel(item)}` ``
   * followed by a trailing space.
   *
   * Use this to insert markdown links, custom chip syntax, or
   * @[Daniel](id-style) anchors:
   *
   * @example
   *   getInsertText={(user) => `[@${user.username}](/users/${user.id})`}
   *
   * @default item => `${trigger}${getLabel(item)}`
   */
  getInsertText?: (item: TItem, meta: MentionSelectMeta) => string;

  /**
   * MentionShape discriminator. Defaults to `"substring"`.
   * `"node"` opts into atomic-chip rendering — must be paired with
   * `getInsertNode` and a chip-capable host (`<Mention.Editable>`).
   */
  shape?: "substring" | "node";

  /**
   * Required when `shape === "node"`. Returns the React content
   * portaled into the chip placeholder by `<Mention.Chips>`. The
   * placeholder's `data-mention-text` attribute holds the plain-text
   * equivalent (from `getInsertText`) for caret math.
   */
  getInsertNode?: (item: TItem, meta: MentionSelectMeta) => ReactNode;

  /**
   * Pure side-effect notifier called when the user commits a selection
   * (Enter, Tab, or click). Use for analytics, optimistic UI, draft
   * persistence, or anything that should run alongside the insertion.
   *
   * Does **not** control what gets inserted — see `getInsertText` for that.
   * Always returns void; returning a string has no effect.
   */
  onSelect: (item: TItem, meta: MentionSelectMeta) => void;

  /**
   * Debounce window for query changes feeding the async fetcher. Pass `0`
   * to disable debouncing entirely.
   * @default 150
   */
  debounceMs?: number;

  /**
   * Suppress the default popover styling — only the structural ARIA wiring
   * is emitted. For consumers shipping their own design system.
   * @default false
   */
  unstyled?: boolean;

  /**
   * Imperative handle. Forwarded ref pattern; the handle exposes
   * `open`, `close`, `commit(item)`, and direct access to the textarea.
   */
  handleRef?: RefObject<MentionImperativeHandle<TItem> | null>;

  children: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. useMention — the escape hatch
// ─────────────────────────────────────────────────────────────────────────────

export type MentionStatus = "idle" | "loading" | "error" | "success";

/**
 * Return shape from `useMention<TItem>()`. All fields are stable per render;
 * the `getXxxProps` helpers are memoized so consumers can spread them onto
 * any DOM element without bypass-fragmenting the tree.
 */
export interface MentionContext<TItem> {
  /** Current query (the substring after the trigger up to the caret). */
  readonly query: string;
  /** Whether the popover is open. */
  readonly open: boolean;
  /** Index of the highlighted option in the current list. -1 if none. */
  readonly highlightedIndex: number;
  /** Filtered (and possibly fetched) items currently displayed. */
  readonly items: readonly TItem[];
  /** Status of the current items query — for loading/error UI. */
  readonly status: MentionStatus;
  /**
   * Active trigger character — `null` when the popover is closed.
   * Single-trigger consumers can ignore (it's always their configured
   * trigger). Multi-trigger consumers narrow on this to determine
   * which channel is rendering.
   */
  readonly activeTrigger: string | null;

  /**
   * Spread onto the textarea or contenteditable host. Wires the full ARIA
   * combobox contract: `role`, `aria-controls`, `aria-activedescendant`,
   * `aria-expanded`, `aria-haspopup`, `aria-autocomplete`, plus key handlers
   * for arrows, Enter, Tab, Escape, and trigger detection.
   */
  getInputProps: () => Record<string, unknown>;

  /** Spread onto the popover container — wires `role="listbox"`, ids, etc. */
  getPopoverProps: () => Record<string, unknown>;

  /** Spread onto each option — wires `role="option"`, ids, hover handlers. */
  getItemProps: (item: TItem, index: number) => Record<string, unknown>;

  /** Imperative open/close — escape hatch for unusual flows. */
  setOpen: (open: boolean) => void;

  /** Imperative commit — same effect as the user pressing Enter on `item`. */
  commit: (item: TItem) => void;

  /**
   * Registered chips for `shape: "node"` channels. Empty for substring-
   * only consumers. `<Mention.Chips>` consumes this; escape-hatch
   * consumers can read it directly to roll their own portal layer.
   */
  readonly chips: readonly MentionChip<TItem>[];

  /**
   * Id of the chip currently in the "selected, press Backspace again to
   * delete" state, or `null`. `<Mention.Chips>` reads this
   * to apply the `data-mention-selected` attribute + drive aria-live
   * announcement.
   */
  readonly chipSelected: string | null;

  /**
   * Live ref to the host element (textarea or contenteditable).
   * Exposed publicly so consumers integrating with rich-text editor
   * frameworks can target the host directly for focus management or
   * measurement.
   */
  readonly hostRef: RefObject<HTMLElement | null>;

  /**
   * Live ref to the registered `EditorAdapter`. Consumers wiring
   * custom adapters (rich-text editor framework integrations) write
   * to this ref from a bridge component to register their adapter.
   * `<Mention.Input>` and `<Mention.Editable>` register the textarea /
   * contenteditable adapters automatically.
   */
  readonly adapterRef: RefObject<EditorAdapter | null>;
}

/**
 * Props for `<Mention.Chips>` — the optional portal orchestrator that
 * mounts each registered chip's React content into its placeholder
 * inside the contenteditable host. Render alongside `<Mention.Editable>`
 * inside `<Mention.Root>`.
 */
export interface MentionChipsProps {
  /**
   * Optional render-prop wrapping each chip's portaled content. Useful
   * for adding hover popovers, click handlers, or per-chip styling
   * without modifying the channel's `getInsertNode`.
   */
  children?: (chip: MentionChip) => ReactNode;
}

/** Props for the standalone `useMention<TItem>()` hook. Mirrors `MentionRootProps`. */
export interface UseMentionProps<TItem>
  extends Pick<
    MentionRootProps<TItem>,
    | "trigger"
    | "items"
    | "getKey"
    | "getLabel"
    | "getInsertText"
    | "shape"
    | "getInsertNode"
    | "onSelect"
    | "debounceMs"
  > {
  /** Optional controlled value of the underlying textarea. */
  value?: string;
  /** Called whenever the textarea value changes (whether due to user input or commit). */
  onValueChange?: (value: string) => void;
}

export type UseMention = <TItem>(
  props: UseMentionProps<TItem>,
) => MentionContext<TItem>;

/**
 * Props for the multi-trigger `useMentionMulti<TItemMap>()` hook —
 * the typed escape hatch for consumers who want to drive the dispatcher
 * themselves without the compound API. Mirrors `MentionRootMultiProps`
 * minus the children/handleRef/unstyled fields (which are
 * compound-API-specific) plus the controlled-input fields the hook
 * exposes for headless integration.
 */
export interface UseMentionMultiProps<
  TItemMap extends Record<string, unknown>,
> {
  triggers: { [K in keyof TItemMap]: MentionChannelConfig<TItemMap[K]> };
  onSelect: (
    payload: {
      [K in keyof TItemMap]: { [P in K]: TItemMap[K] };
    }[keyof TItemMap],
    meta: MentionSelectMeta,
  ) => void;
  debounceMs?: number;
  value?: string;
  onValueChange?: (value: string) => void;
}

/**
 * Return shape for `useMentionMulti<TItemMap>()`. Extends the base
 * `MentionContext` over the union of all channels' item types, plus
 * `activeTrigger` so consumers can narrow on which channel the
 * popover is currently sourced from.
 */
export interface MentionMultiContext<TItemMap extends Record<string, unknown>>
  extends Omit<MentionContext<TItemMap[keyof TItemMap]>, "activeTrigger"> {
  /**
   * Which trigger character opened the popover, narrowed to the keys
   * of *your* `TItemMap`. `null` when closed.
   */
  readonly activeTrigger: keyof TItemMap | null;
}

export type UseMentionMulti = <TItemMap extends Record<string, unknown>>(
  props: UseMentionMultiProps<TItemMap>,
) => MentionMultiContext<TItemMap>;

// ─────────────────────────────────────────────────────────────────────────────
// 3. Multi-trigger — channel-keyed config record
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Multi-trigger lets one `<Mention.Root>` host several trigger characters
 * in the same editor (e.g., `@` for users + `#` for channels). The
 * internal state machine is channel-keyed; this shape exposes it
 * directly.
 *
 * Design choices:
 *   - **One `triggers` prop** maps each trigger char → a self-contained
 *     channel config (`items`, `getKey`, `getLabel`, `getInsertText`). No
 *     parallel records of per-prop functions; one bag per channel.
 *   - **Single `onSelect`** receives a discriminated-union payload keyed
 *     by trigger char. Narrow with `'@' in payload`.
 *   - **Top-level common props** (`debounceMs`, `unstyled`, `children`,
 *     etc.) stay where they are — only the channel-specific items move.
 */
export interface MentionChannelBase<TItem> {
  items: MentionItems<TItem>;
  getKey: (item: TItem) => string | number;
  getLabel: (item: TItem) => string;
  getInsertText?: (item: TItem, meta: MentionSelectMeta) => string;
}

/**
 * Registered chip — produced by a `shape: "node"` channel commit.
 * `<Mention.Chips>` portals `node` into `placeholder` so consumer-
 * supplied React content (avatars, popovers on hover, click-to-edit)
 * stays interactive inside the otherwise-inert chip element.
 */
export interface MentionChip<TItem = unknown> {
  /** Stable id matching the placeholder's `data-mention-id` attribute. */
  readonly id: string;
  /** Trigger character that opened the channel (e.g. `"@"`). */
  readonly trigger: string;
  /** The committed item — typed when consumed via `useMention<T>()`. */
  readonly item: TItem;
  /** Plain-text equivalent (matches `data-mention-text` on the placeholder). */
  readonly insertText: string;
  /** Live DOM placeholder inside the contenteditable host. */
  readonly placeholder: HTMLElement;
  /** React content rendered into the placeholder via portal. */
  readonly node: ReactNode;
}

/**
 * Discriminator that determines how a committed mention lands in the host.
 * Two arms:
 *
 *   - `"substring"` (default, omitted) — replace the `[trigger…caret)`
 *     substring with the resolved insert text. Works identically across
 *     textarea and plain-text contenteditable hosts.
 *   - `"node"` — replace the `[trigger…caret)` substring with an atomic
 *     React node (a chip). Requires a chip-capable host
 *     (`<Mention.Editable>`).
 *
 * Mutually-exclusive arms — supplying `getInsertNode` without
 * `shape: "node"`, or `shape: "node"` without `getInsertNode`, is a
 * compile error (verified in `test-d.ts`).
 */
export type MentionChannelConfig<TItem> =
  | (MentionChannelBase<TItem> & {
      shape?: "substring";
      /** Mutually exclusive with the substring arm — pin via `never`. */
      getInsertNode?: never;
    })
  | (MentionChannelBase<TItem> & {
      shape: "node";
      getInsertNode: (item: TItem, meta: MentionSelectMeta) => ReactNode;
    });

export interface MentionRootMultiProps<
  TItemMap extends Record<string, unknown>,
> {
  triggers: { [K in keyof TItemMap]: MentionChannelConfig<TItemMap[K]> };
  onSelect: (
    payload: {
      [K in keyof TItemMap]: { [P in K]: TItemMap[K] };
    }[keyof TItemMap],
    meta: MentionSelectMeta,
  ) => void;
  debounceMs?: number;
  unstyled?: boolean;
  handleRef?: RefObject<MentionImperativeHandle<
    TItemMap[keyof TItemMap]
  > | null>;
  children: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Imperative handle
// ─────────────────────────────────────────────────────────────────────────────

export interface MentionImperativeHandle<TItem> {
  /** Open the popover programmatically. */
  open: () => void;
  /** Close the popover programmatically. */
  close: () => void;
  /** Commit a selection programmatically. */
  commit: (item: TItem) => void;
  /**
   * Direct access to the host element — textarea or contenteditable.
   * Use this for focus management across both `<Mention.Input>` and
   * `<Mention.Editable>` consumers.
   */
  host: HTMLElement | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Sub-component props (the parts hanging off Mention.*)
// ─────────────────────────────────────────────────────────────────────────────

/** Forwarded to the underlying `<textarea>`. */
export type MentionInputProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  // The library owns these — overriding would break the ARIA contract.
  | "role"
  | "aria-controls"
  | "aria-expanded"
  | "aria-haspopup"
  | "aria-autocomplete"
  | "aria-activedescendant"
  // The library composes these via getInputProps; consumer-supplied values
  // are merged, not replaced.
  | "onChange"
  | "onKeyDown"
> & {
  /** Optional ref forwarded to the underlying textarea. */
  ref?: Ref<HTMLTextAreaElement>;
};

/**
 * Forwarded to the underlying contenteditable `<div>`. Twin of
 * `MentionInputProps`; same library-owned ARIA attrs are excluded so
 * consumers can't accidentally break the combobox contract.
 *
 * Additive — `<Mention.Editable>` ships alongside `<Mention.Input>`,
 * not as a replacement. Pick the one matching your host element.
 */
export type MentionEditableProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  | "role"
  | "aria-controls"
  | "aria-expanded"
  | "aria-haspopup"
  | "aria-autocomplete"
  | "aria-activedescendant"
  | "contentEditable"
  | "suppressContentEditableWarning"
  | "onChange"
  | "onInput"
  | "onKeyDown"
> & {
  /** Optional ref forwarded to the underlying contenteditable host. */
  ref?: Ref<HTMLDivElement>;
};

/** Container for the listbox + Empty + Loading states. */
export interface MentionPopoverProps {
  /**
   * Where to portal the popover. Pass `null` to render in-place (no portal) —
   * useful when TalkBack swipe order breaks with portaled popovers.
   * @default document.body
   */
  container?: HTMLElement | null;

  /**
   * Maximum height of the popover before it scrolls.
   * @default 280
   */
  maxHeight?: number;

  /**
   * Accessible name for the listbox. Screen readers announce this when the
   * user enters the popover (e.g. "People to mention listbox"). Without it,
   * AT falls back to the generic "listbox" role announcement.
   *
   * Pass either `aria-label` (literal string) or `aria-labelledby` (id of a
   * visible label element); the WAI-ARIA APG combobox pattern requires one
   * or the other when the listbox isn't already labelled by the input.
   */
  "aria-label"?: string;
  "aria-labelledby"?: string;

  children: ReactNode;
}

/**
 * Renders the list of items. Accepts a render-prop function — generic
 * over the item type the consumer declares.
 *
 * In **multi-trigger** setups, set `trigger="X"` so this list only
 * renders while channel `X` is active. That lets you compose multiple
 * type-safe lists, one per channel, without runtime casts:
 *
 * @example
 *   <Mention.List<Command> trigger="/">
 *     {(cmd) => <Mention.Item value={cmd}>/{cmd.name}</Mention.Item>}
 *   </Mention.List>
 *   <Mention.List<Person> trigger="@">
 *     {(p) => <Mention.Item value={p}>@{p.handle}</Mention.Item>}
 *   </Mention.List>
 */
export interface MentionListProps<TItem = unknown> {
  /**
   * Channel filter — if set, this list only renders while the
   * popover's active trigger character equals this value. Used to
   * compose per-channel typed lists in multi-trigger setups. When
   * omitted, renders for any active channel (single-trigger case).
   */
  trigger?: string;
  children: (item: TItem, index: number) => ReactNode;
}

/** A single option within the list. Spreads `getItemProps` internally. */
export interface MentionItemProps<TItem> {
  value: TItem;
  children: ReactNode;
}

/** Rendered when the filtered/fetched list is empty. */
export interface MentionEmptyProps {
  children: ReactNode;
}

/** Rendered while an async fetcher is pending. */
export interface MentionLoadingProps {
  children: ReactNode;
}
