import type { MentionEmptyProps } from "../types.ts";
import { useMentionInternal } from "./context.ts";

/**
 * `<Mention.Empty>` — rendered when the filtered/fetched list is empty
 * AND the status is not "loading" (so we don't flash Empty before async
 * results arrive).
 */
export function Empty(props: MentionEmptyProps): React.ReactNode {
  const ctx = useMentionInternal();
  if (ctx.items.length > 0) return null;
  if (ctx.status === "loading") return null;
  return (
    <div {...(ctx.unstyled ? {} : { "data-mention-empty": "" })}>
      {props.children}
    </div>
  );
}
