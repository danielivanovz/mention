import type { UseMentionProps } from "../types.ts";
import { useSingleCoreProps } from "./to-core-props.ts";
import { type CoreReturn, useMentionCore } from "./useMentionCore.ts";

/**
 * Return shape — `CoreReturn<TItem>` from the workhorse hook. Consumers
 * read `MentionContext<TItem>` fields plus `listboxId`, `optionId`,
 * `hostRef`, and `getKey` for low-level wiring.
 */
export type UseMentionReturn<TItem> = CoreReturn<TItem>;

/**
 * Public single-trigger hook. Synthesises a 1-channel record via the
 * shared `useSingleCoreProps` adapter and delegates to
 * `useMentionCore<TItem>`. The core absorbs consumer-side identity
 * churn via `useLatest`-backed refs, so the wrapper layer doesn't need
 * to memoise inputs.
 */
export function useMention<TItem>(
  props: UseMentionProps<TItem>,
): UseMentionReturn<TItem> {
  return useMentionCore<TItem>(useSingleCoreProps(props));
}
