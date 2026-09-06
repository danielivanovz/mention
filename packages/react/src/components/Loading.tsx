import type { MentionLoadingProps } from "../types.ts";
import { useMentionInternal } from "./context.ts";
export function Loading(props: MentionLoadingProps) {
  const ctx = useMentionInternal();
  if (ctx.status !== "loading") return null;
  return (
    <div {...props} {...(ctx.unstyled ? {} : { "data-mention-loading": "" })} />
  );
}
