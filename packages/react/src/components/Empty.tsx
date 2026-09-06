import type { MentionEmptyProps } from "../types.ts";
import { useMentionInternal } from "./context.ts";
export function Empty(props: MentionEmptyProps) {
  const ctx = useMentionInternal();
  if (ctx.status !== "success" || ctx.items.length) return null;
  return (
    <div {...props} {...(ctx.unstyled ? {} : { "data-mention-empty": "" })} />
  );
}
