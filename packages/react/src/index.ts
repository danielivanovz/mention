/**
 * @danielivanov/mention — public entry point.
 *
 * Single import path for everything:
 *
 *   import { Mention, useMention, type MentionRootProps } from "@danielivanov/mention";
 *
 * Compound parts hang off `Mention.*` (Root, Input, Popover, List, Item,
 * Empty, Loading). The typed hook escape hatch is `useMention<TItem>()`.
 */

export { Mention } from "./components/index.ts";
export { useMention } from "./hooks/useMention.ts";
export { useMentionMulti } from "./hooks/useMentionMulti.ts";

/**
 * Adapter-bridge escape hatch — context hook for components rendered
 * INSIDE `<Mention.Root>`. Mirrors the public `MentionContext<TItem>`
 * shape (item type defaults to `unknown`); use this from a bridge
 * component that wires a custom `EditorAdapter` for a rich-text editor
 * framework.
 *
 * For root-less integrations, use `useMention<T>()` — same context
 * shape, no Root required.
 */
export { useMentionInternal as useMentionContext } from "./components/context.ts";

/**
 * Low-level dispatcher utility — scans a textarea value backwards from
 * the caret looking for an active mention (trigger + query). Exposed
 * for hand-rolled dispatchers and headless integrations that don't
 * use `useMention` / `useMentionMulti` / `<Mention.Root>` but still
 * want the same isolation rules + Unicode word-boundary handling.
 */
export {
  type ActiveMention,
  findActiveMention,
} from "./state/find-active-mention.ts";

export type { EditorAdapter, ChipInsertInput } from "./adapters/types.ts";
export type {
  MentionChannelBase,
  MentionChannelConfig,
  MentionChip,
  MentionChipsProps,
  MentionContext,
  MentionEditableProps,
  MentionEmptyProps,
  MentionFetcher,
  MentionImperativeHandle,
  MentionInputProps,
  MentionItemProps,
  MentionItems,
  MentionListProps,
  MentionLoadingProps,
  MentionMultiContext,
  MentionPopoverProps,
  MentionRootMultiProps,
  MentionRootProps,
  MentionSelectMeta,
  MentionStatus,
  UseMention,
  UseMentionMulti,
  UseMentionMultiProps,
  UseMentionProps,
} from "./types.ts";
