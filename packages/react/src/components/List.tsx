import type { MentionListProps } from "../types.ts";
import { ItemIndexProvider, useMentionInternal } from "./context.ts";

/**
 * `<Mention.List>` — render-prop list. Calls the child function for each
 * filtered item with `(item, index)`. The render prop must return a
 * `<Mention.Item>`; `Item` itself wires the per-option ARIA.
 *
 * Each rendered element is wrapped in an `ItemIndexProvider` carrying
 * the React `key` and injecting the option's index into context. React
 * 19 forbids spreading a `key` into JSX, so key application moved out
 * of `getItemProps` into this mapping site (which already has the key
 * source). The injected index also lets `<Mention.Item>` skip the
 * O(N) indexOf scan it would otherwise need.
 *
 * Multi-trigger: pass `trigger="X"` to scope this list to a specific
 * channel. The library guarantees that whenever `activeTrigger === X`,
 * `ctx.items` are items from channel X — so consumers can safely type
 * the render-prop with channel X's item type via `<Mention.List<TItem>>`.
 */
export function List<TItem>(props: MentionListProps<TItem>): React.ReactNode {
  const ctx = useMentionInternal();
  // Channel filter — only render when the active trigger matches.
  // Lets multi-trigger consumers compose typed lists per channel.
  if (props.trigger !== undefined && ctx.activeTrigger !== props.trigger) {
    return null;
  }
  if (ctx.items.length === 0) return null;
  return ctx.items.map((item, index) => (
    <ItemIndexProvider key={ctx.getKey(item)} value={index}>
      {props.children(item as TItem, index)}
    </ItemIndexProvider>
  ));
}
