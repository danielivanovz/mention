import type { MentionItemProps } from "../types.ts";
import { useItemIndex, useMentionInternal } from "./context.ts";
export function Item<T>({ value, ...props }: MentionItemProps<T>) {
  const ctx = useMentionInternal();
  const index = useItemIndex() ?? ctx.items.indexOf(value);
  if (index < 0) return null;
  return (
    <div
      {...ctx.getItemProps(value, index, props)}
      {...(ctx.unstyled ? {} : { "data-mention-item": "" })}
    />
  );
}
