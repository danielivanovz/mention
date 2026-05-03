import type { MentionLoadingProps } from "../types.ts";
import { useMentionInternal } from "./context.ts";

/**
 * `<Mention.Loading>` — rendered while an async fetcher is in flight.
 */
export function Loading(props: MentionLoadingProps): React.ReactNode {
  const ctx = useMentionInternal();
  if (ctx.status !== "loading") return null;
  return (
    <div {...(ctx.unstyled ? {} : { "data-mention-loading": "" })}>
      {props.children}
    </div>
  );
}
