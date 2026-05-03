import {
  type CompositionEventHandler,
  type FormEventHandler,
  type KeyboardEventHandler,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { EditorAdapter } from "../adapters/types.ts";
import { findActiveMention } from "../state/find-active-mention.ts";
import type { PopoverState } from "../state/popover-reducer.ts";
import { popoverReducer } from "../state/popover-reducer.ts";
import { CHIP_ID_ATTR, CHIP_TEXT_ATTR } from "../text/caret-range.ts";
import { applyMentionInsert } from "../text/replace.ts";
import type {
  MentionChip,
  MentionContext,
  MentionItems,
  MentionSelectMeta,
} from "../types.ts";
import { ensureMouseMovingGuard, isMouseMoving } from "./mouse-moving-guard.ts";
import { useChannelQuery } from "./use-channel-query.ts";
import { useLatest } from "./use-latest.ts";

/**
 * Per-channel config bundle. The dispatcher resolves an active mention
 * to a trigger char; the core looks up the matching channel here to
 * filter / fetch / render / commit. In single-trigger mode, the core's
 * caller synthesises a 1-channel record keyed on the configured trigger.
 *
 * Type-erased: the public-facing wrappers (useMention, useMentionMulti,
 * Mention.Root) preserve TItem; the internal core only cares about the
 * channel structure, not the item shape.
 */
export interface CoreChannelConfig {
  readonly items: MentionItems<unknown>;
  readonly getKey: (item: unknown) => string | number;
  readonly getLabel: (item: unknown) => string;
  readonly getInsertText?: (item: unknown, meta: MentionSelectMeta) => string;
  /**
   * MentionShape discriminator. `"node"` channels commit as atomic
   * chip elements; `"substring"` (default, omitted) commits as plain
   * text.
   */
  readonly shape?: "substring" | "node";
  /**
   * Required when `shape === "node"`. Returns the React content rendered
   * inside the chip placeholder via `<Mention.Chips>`. The placeholder's
   * `data-mention-text` attribute holds the plain-text equivalent for
   * caret math, regardless of how the React content renders.
   */
  readonly getInsertNode?: (item: unknown, meta: MentionSelectMeta) => ReactNode;
}

export interface CoreProps {
  /**
   * Trigger characters this instance recognises. Backwards scan in
   * findActiveMention checks each char against this list. "First match
   * wins" — closest-to-caret trigger drives the active channel.
   */
  readonly triggers: readonly string[];
  /**
   * Per-trigger channel config. The active channel is resolved via
   * `state.trigger` lookup; effects gracefully no-op when no channel
   * is active (closed popover, or trigger not in the map).
   */
  readonly channels: Readonly<Record<string, CoreChannelConfig>>;
  /**
   * User commit notifier. The wrapper layer translates this into the
   * shape consumers expect (single-trigger: `(item, meta)` directly;
   * multi-trigger: `({ [activeTrigger]: item }, meta)` discriminated
   * union).
   */
  readonly onCommit: (
    item: unknown,
    meta: MentionSelectMeta,
    activeTrigger: string,
  ) => void;
  readonly debounceMs?: number;
  readonly onValueChange?: (value: string) => void;
}

/**
 * Return shape extends the public `MentionContext<TItem>` with the
 * listbox/option id helpers and textarea ref the compound parts need.
 *
 * Generic on `TItem` so wrappers (`useMention<T>`, `useMentionMulti<TItemMap>`)
 * can declare the typed return shape without casting at the boundary.
 * The runtime is identical regardless of `TItem` — TypeScript just
 * surfaces the consumer's declared item type.
 */
export interface CoreReturn<TItem = unknown> extends MentionContext<TItem> {
  readonly listboxId: string;
  readonly optionId: (index: number) => string;
  /**
   * Live ref to the host element (textarea or contenteditable). Used by
   * `<Mention.Popover>` to build the Floating UI virtual anchor and by
   * the imperative handle for focus management.
   */
  readonly hostRef: RefObject<HTMLElement | null>;
  /**
   * Adapter ref — registered by the wrapping component (`<Mention.Input>`
   * for textarea, `<Mention.Editable>` for contenteditable). The core
   * reads `getValue` / `getCaretOffset` / `applyInsert` through this
   * ref, so the same reducer drives both host types.
   */
  readonly adapterRef: RefObject<EditorAdapter | null>;
  readonly getKey: (item: TItem) => string | number;
  /**
   * Registered chips for `shape: "node"` channels. Consumed by
   * `<Mention.Chips>` to portal each chip's React content into its
   * placeholder. Empty for substring-only consumers — `<Mention.Chips>`
   * is opt-in.
   */
  readonly chips: readonly MentionChip<TItem>[];
}

const INITIAL_STATE: PopoverState = {
  phase: "closed",
  trigger: null,
  query: "",
  highlightedIndex: -1,
  itemCount: 0,
  chipSelected: null,
};

/**
 * Workhorse hook. Both `useMention<T>()` (public single-trigger),
 * `useMentionMulti<TItemMap>()` (public multi-trigger), and
 * `<Mention.Root>` delegate here.
 *
 * Identity-stable surface: `commit`, `setOpen`, `getInputProps`,
 * `getPopoverProps`, `getItemProps` keep referential equality across
 * renders even when consumer props (channels, onCommit, onValueChange)
 * are rebuilt inline. Effect deps narrow to primitives + the active
 * channel's `items` reference (the one signal that genuinely should
 * trigger a re-filter when consumers update their data). Latest values
 * of mutable props are read through refs (`useLatest` pattern).
 */
export function useMentionCore<TItem = unknown>(
  props: CoreProps,
): CoreReturn<TItem> {
  const [state, dispatch] = useReducer(popoverReducer, INITIAL_STATE);

  // Latest-value refs. Two refs absorb all consumer-side identity
  // churn: one for props (channels, triggers, onCommit, onValueChange)
  // and one for the reducer state. Effects + callbacks read through
  // these so they never need to subscribe to consumer-prop identity.
  // Without this, parent re-renders that rebuild props inline would
  // re-fire the filter effect and churn handler closures, cascading
  // re-renders into every <Mention.Item>.
  const propsRef = useLatest(props);
  const stateRef = useLatest(state);

  // Install document-level listeners that gate pointer-driven highlight
  // dispatches. Idempotent across mounts; see `mouse-moving-guard.ts`.
  useEffect(() => {
    ensureMouseMovingGuard();
  }, []);

  // Stable ARIA ids — React 19's useId() guarantees uniqueness across SSR
  // and concurrent renders.
  const reactId = useId();
  const listboxId = `mention-listbox-${reactId}`;
  const optionId = useCallback(
    (index: number) => `mention-option-${reactId}-${index}`,
    [reactId],
  );

  const hostRef = useRef<HTMLElement | null>(null);
  // Narrower-typed alias used as the `ref` returned by `getInputProps`,
  // which is destined for a `<textarea>`. Same underlying RefObject as
  // `hostRef` — `<Mention.Editable>` consumers use `hostRef` directly.
  const inputRef = hostRef as unknown as RefObject<HTMLTextAreaElement | null>;
  const adapterRef = useRef<EditorAdapter | null>(null);

  // Chip registry for shape:"node" channels. Plain useState — consumed
  // by <Mention.Chips> to portal each chip's React content into the
  // placeholder DOM element. Empty array for substring-only consumers.
  const [chips, setChips] = useState<readonly MentionChip<unknown>[]>([]);
  const chipCounterRef = useRef(0);

  // IME composition guard. True between `compositionstart` and
  // `compositionend` — `handleChange` bails so the dispatcher doesn't
  // narrow the popover on provisional, half-converted IME text. The
  // final scan + dispatch happens in `handleCompositionEnd` so the
  // popover catches up to the committed value even on browsers that
  // don't fire a follow-up `input` event after the composition closes.
  const isComposingRef = useRef(false);

  // Active channel for the data path. Resolved here (not inside
  // useChannelQuery) so the core stays the single source of truth for
  // channel lookup; the data hook receives the resolved channel and
  // owns only the filter / fetch / status machine.
  const activeChannel: CoreChannelConfig | undefined =
    state.trigger !== null ? props.channels[state.trigger] : undefined;

  const { items: filtered, status } = useChannelQuery({
    channel: activeChannel,
    query: state.query,
    isOpen: state.phase === "open",
  });

  // Keep the reducer's itemCount in sync with the filtered list size.
  useEffect(() => {
    if (state.phase !== "open") return;
    if (state.itemCount !== filtered.length) {
      dispatch({ type: "ITEMS_CHANGED", itemCount: filtered.length });
    }
  }, [filtered.length, state.phase, state.itemCount]);

  // ─── handlers (identity-stable) ──────────────────────────────────────
  //
  // Every handler below uses `[]` as its dep array — they read mutable
  // values from refs. This keeps `commit`, `getInputProps`, `getItemProps`
  // referentially equal across renders, so consumers spreading them
  // onto JSX don't trigger child re-renders on every keystroke.

  const commit = useCallback(
    (item: unknown) => {
      const adapter = adapterRef.current;
      const currentState = stateRef.current;
      const trigger = currentState.trigger;
      if (adapter === null || trigger === null) {
        dispatch({ type: "COMMIT" });
        return;
      }
      const channel = propsRef.current.channels[trigger];
      if (channel === undefined) {
        dispatch({ type: "COMMIT" });
        return;
      }
      const caret = adapter.getCaretOffset();
      const meta = {
        trigger,
        query: currentState.query,
        triggerOffset: caret - currentState.query.length - 1,
      };
      const insertText =
        channel.getInsertText !== undefined
          ? channel.getInsertText(item, meta)
          : `${trigger}${channel.getLabel(item)}`;

      if (channel.shape === "node") {
        if (
          channel.getInsertNode === undefined ||
          typeof adapter.applyChipInsert !== "function"
        ) {
          // Misconfiguration: shape:"node" without getInsertNode or a
          // chip-capable adapter. Bail silently — production users on
          // textarea hosts get an obvious no-op.
          dispatch({ type: "COMMIT" });
          return;
        }
        const id = `mc-${++chipCounterRef.current}`;
        const placeholder = adapter.element.ownerDocument.createElement("span");
        placeholder.setAttribute(CHIP_ID_ATTR, id);
        placeholder.setAttribute(CHIP_TEXT_ATTR, insertText);
        placeholder.setAttribute("contenteditable", "false");
        placeholder.setAttribute("data-mention-chip", "");
        placeholder.setAttribute("aria-label", channel.getLabel(item));
        // Placeholder is intentionally empty — the React portal in
        // <Mention.Chips> owns its visible content. data-mention-text
        // carries the plain-text equivalent for caret math, and the
        // aria-label is what AT reads. Consumers who skip <Mention.Chips>
        // see an empty chip (documented opt-in).
        const node = channel.getInsertNode(item, meta);

        adapter.applyChipInsert({
          triggerOffset: meta.triggerOffset,
          selectionStart: caret,
          chip: placeholder,
        });

        setChips((prev) => [
          ...prev,
          { id, trigger, item, insertText, placeholder, node },
        ]);

        propsRef.current.onCommit(item, meta, trigger);
        dispatch({ type: "COMMIT" });
        return;
      }

      // Substring path — pure text math + thin DOM mutation. See
      // `text/replace.ts` and its property tests.
      const result = applyMentionInsert({
        value: adapter.getValue(),
        selectionStart: caret,
        triggerOffset: meta.triggerOffset,
        insertText,
      });
      adapter.applyInsert(result);

      propsRef.current.onCommit(item, meta, trigger);
      dispatch({ type: "COMMIT" });
    },
    [stateRef, propsRef],
  );

  const filteredRef = useLatest(filtered);

  // Editor-agnostic input handler. Reads value + caret through the
  // adapter so the same closure works for textarea (`onChange`) and
  // contenteditable (`onInput`).
  const handleInput: FormEventHandler<HTMLElement> = useCallback(() => {
    const adapter = adapterRef.current;
    if (adapter === null) return;
    const newValue = adapter.getValue();

    // IME guard — provisional events during composition carry
    // half-converted text. Suppress dispatch and defer to
    // handleCompositionEnd for the final scan.
    if (isComposingRef.current) {
      propsRef.current.onValueChange?.(newValue);
      return;
    }

    const caret = adapter.getCaretOffset();
    const active = findActiveMention(
      newValue,
      caret,
      propsRef.current.triggers,
    );

    if (active !== null) {
      dispatch({
        type: "OPEN_AT",
        trigger: active.trigger,
        query: active.query,
      });
    } else if (stateRef.current.phase === "open") {
      dispatch({ type: "DISMISS" });
    }

    propsRef.current.onValueChange?.(newValue);
  }, [stateRef, propsRef]);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd: CompositionEventHandler<HTMLElement> =
    useCallback(() => {
      isComposingRef.current = false;
      // Re-run the dispatcher scan against the post-commit value via
      // the adapter. OPEN_AT preserves state identity when the resolved
      // (trigger, query) is unchanged, so it's safe to fire even if a
      // post-composition input event already dispatched.
      const adapter = adapterRef.current;
      if (adapter === null) return;
      const newValue = adapter.getValue();
      const caret = adapter.getCaretOffset();
      const active = findActiveMention(
        newValue,
        caret,
        propsRef.current.triggers,
      );
      if (active !== null) {
        dispatch({
          type: "OPEN_AT",
          trigger: active.trigger,
          query: active.query,
        });
      } else if (stateRef.current.phase === "open") {
        dispatch({ type: "DISMISS" });
      }
    }, [stateRef, propsRef]);

  const handleKeyDown: KeyboardEventHandler<HTMLElement> = useCallback(
    (event) => {
      const currentState = stateRef.current;
      const adapter = adapterRef.current;

      // ─── two-step backspace branch ─────────────────────────────────
      // Runs BEFORE the popover-open switch so chip selection wins
      // over Esc/arrow ambiguity once a chip is selected.
      if (currentState.chipSelected !== null) {
        if (event.key === "Backspace") {
          // Second Backspace — delete the selected chip.
          event.preventDefault();
          const chipEl = adapter?.element.querySelector(
            `[data-mention-id="${currentState.chipSelected}"]`,
          );
          if (chipEl !== null && chipEl !== undefined) {
            chipEl.remove();
            // Second-backspace policy is "delete chip only" — the
            // trailing space added at chip-insert time stays put.
            adapter?.element.dispatchEvent(
              new Event("input", { bubbles: true }),
            );
          }
          setChips((prev) =>
            prev.filter((c) => c.id !== currentState.chipSelected),
          );
          dispatch({ type: "CHIP_DESELECT" });
          return;
        }
        // Any arrow key, Escape, or printable character deselects
        // (and lets the original event continue, except Escape which
        // we eat to keep the gesture local).
        if (event.key === "Escape") {
          event.preventDefault();
          dispatch({ type: "CHIP_DESELECT" });
          return;
        }
        if (
          event.key === "ArrowLeft" ||
          event.key === "ArrowRight" ||
          event.key === "ArrowUp" ||
          event.key === "ArrowDown" ||
          event.key.length === 1 // any printable character
        ) {
          dispatch({ type: "CHIP_DESELECT" });
          // fall through — let the keystroke take effect
        }
      } else if (event.key === "Backspace" && adapter !== null) {
        // First Backspace at a chip's right boundary — select instead
        // of deleting on this keystroke.
        const chipEl = adapter.getChipBeforeCaret?.();
        if (chipEl !== null && chipEl !== undefined) {
          const id = chipEl.getAttribute("data-mention-id");
          if (id !== null) {
            event.preventDefault();
            dispatch({ type: "CHIP_SELECT", id });
            return;
          }
        }
      }

      if (currentState.phase !== "open") return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          dispatch({ type: "HIGHLIGHT_NEXT" });
          return;
        case "ArrowUp":
          event.preventDefault();
          dispatch({ type: "HIGHLIGHT_PREV" });
          return;
        case "Enter":
        case "Tab": {
          if (currentState.highlightedIndex < 0) return;
          const item = filteredRef.current[currentState.highlightedIndex];
          if (item === undefined) return;
          event.preventDefault();
          commit(item);
          return;
        }
        case "Escape":
          event.preventDefault();
          dispatch({ type: "DISMISS" });
          return;
      }
    },
    [stateRef, filteredRef, commit],
  );

  // ─── prop spreaders ──────────────────────────────────────────────────

  const open = state.phase === "open";

  // getInputProps re-creates only when its *output* would change —
  // ARIA attribute values depend on `open` and `state.highlightedIndex`,
  // not on the handler closures (which are now stable).
  // `onChange` and `onInput` both delegate to `handleInput`; the
  // wrapping component picks the one that fits its element. React's
  // <textarea> uses onChange (alias for onInput), <div contenteditable>
  // uses onInput. Returning both lets the same props bag spread onto
  // either host. `ref` is the textarea-typed alias of `hostRef` consumed
  // by <Mention.Input>; <Mention.Editable> uses `hostRef` directly.
  const getInputProps = useCallback(
    () => ({
      role: "combobox",
      "aria-controls": listboxId,
      "aria-expanded": open ? "true" : "false",
      "aria-haspopup": "listbox",
      "aria-autocomplete": "list",
      "aria-activedescendant":
        open && state.highlightedIndex >= 0
          ? optionId(state.highlightedIndex)
          : undefined,
      onChange: handleInput,
      onInput: handleInput,
      onKeyDown: handleKeyDown,
      onCompositionStart: handleCompositionStart,
      onCompositionEnd: handleCompositionEnd,
      ref: inputRef,
    }),
    [
      open,
      listboxId,
      state.highlightedIndex,
      optionId,
      handleInput,
      handleKeyDown,
      handleCompositionStart,
      handleCompositionEnd,
      inputRef,
    ],
  );

  const getPopoverProps = useCallback(
    () => ({
      role: "listbox",
      id: listboxId,
    }),
    [listboxId],
  );

  // `key` is intentionally NOT included here — React 19 warns when `key`
  // is spread into JSX. `<Mention.List>` applies the key one level up via
  // a Fragment wrapper. Escape-hatch consumers must pass `key={getKey(item)}`
  // explicitly on their option elements.
  const getItemProps = useCallback(
    (item: unknown, index: number) => ({
      role: "option",
      id: optionId(index),
      "aria-selected": index === state.highlightedIndex,
      onMouseDown: (event: { preventDefault: () => void }) => {
        // mousedown (not click) so the textarea doesn't lose focus
        // before we commit — focus loss would dismiss the popover first.
        event.preventDefault();
        commit(item);
      },
      onPointerMove: () => {
        if (!isMouseMoving()) return;
        if (stateRef.current.highlightedIndex === index) return;
        dispatch({ type: "HIGHLIGHT_AT", index });
      },
    }),
    [optionId, state.highlightedIndex, commit, stateRef],
  );

  const setOpen = useCallback((next: boolean) => {
    if (!next) dispatch({ type: "DISMISS" });
    // Programmatic open is intentionally not supported — the popover
    // only opens via the trigger char to keep AT semantics tied to
    // user-initiated text changes.
  }, []);

  // The active channel's getKey is what `<Mention.List>` uses for keys.
  // Read fresh through the channels ref so unstabilised consumer code
  // doesn't churn the return-shape memo on every render.
  const activeChannelForKey =
    state.trigger !== null ? props.channels[state.trigger] : undefined;
  const getKeyActive: (item: unknown) => string | number =
    activeChannelForKey?.getKey ?? ((item) => String(item));

  // The hook's internal state stores items as `unknown[]` (we don't
  // know TItem at the useState site). The single boundary cast lives
  // here on the `items` field — TypeScript can't statically prove
  // that the runtime items match the wrapper-supplied TItem, but the
  // contract IS preserved: items only enter the core via the channels
  // record the wrapper built from `TItem`-typed inputs, so handing
  // them back as `TItem[]` is safe by construction.
  //
  // All callable fields (`commit`, `getItemProps`, `getKey`) need no
  // cast — function-parameter contravariance lets `(item: unknown) =>
  // X` flow into `(item: TItem) => X` cleanly under
  // `strictFunctionTypes`.
  return useMemo<CoreReturn<TItem>>(
    () => ({
      query: state.query,
      open,
      highlightedIndex: state.highlightedIndex,
      items: filtered as readonly TItem[],
      status,
      activeTrigger: state.trigger,
      getInputProps,
      getPopoverProps,
      getItemProps,
      setOpen,
      commit,
      listboxId,
      optionId,
      hostRef,
      adapterRef,
      getKey: getKeyActive,
      chips: chips as readonly MentionChip<TItem>[],
      chipSelected: state.chipSelected,
    }),
    [
      state.query,
      open,
      state.highlightedIndex,
      filtered,
      status,
      state.trigger,
      getInputProps,
      getPopoverProps,
      getItemProps,
      setOpen,
      commit,
      listboxId,
      optionId,
      getKeyActive,
      chips,
      state.chipSelected,
    ],
  );
}
