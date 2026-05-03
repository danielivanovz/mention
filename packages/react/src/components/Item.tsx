import type { MentionItemProps } from "../types.ts";
import { useItemIndex, useMentionInternal } from "./context.ts";

/**
 * `<Mention.Item>` — a single option. Reads its index from
 * `ItemIndexProvider` (injected by `<Mention.List>`) and falls back to
 * an `indexOf` scan only when rendered outside a List (escape-hatch
 * consumers driving custom layouts). Drops list rendering from O(N²)
 * to O(N) on the dominant path.
 */
export function Item<TItem>(props: MentionItemProps<TItem>): React.ReactNode {
  const ctx = useMentionInternal();
  const indexFromList = useItemIndex();
  const index =
    indexFromList ?? ctx.items.indexOf(props.value as unknown);
  if (index < 0) return null;
  const itemProps = ctx.getItemProps(props.value as unknown, index);
  return (
    <div {...itemProps} {...(ctx.unstyled ? {} : { "data-mention-item": "" })}>
      {props.children}
    </div>
  );
}
