import type { UseMentionMultiProps, UseMentionProps } from "../types.ts";
import type { CoreProps } from "./useMentionCore.ts";

// Item types are erased only at the shared core boundary. The core binds
// results and commits to the same channel and request session.
export function singleCoreProps<T>(props: UseMentionProps<T>): CoreProps {
  return {
    channels: { [props.trigger ?? "@"]: props } as CoreProps["channels"],
    onCommit: (item, meta) => props.onSelect?.(item as T, meta),
    debounceMs: props.debounceMs ?? 150,
  };
}
export function multiCoreProps<M extends Record<string, unknown>>(
  props: UseMentionMultiProps<M>,
): CoreProps {
  return {
    channels: props.triggers as CoreProps["channels"],
    onCommit: (item, meta) =>
      props.onSelect?.(
        { [meta.trigger]: item } as {
          [K in keyof M]: { [P in K]: M[K] };
        }[keyof M],
        meta,
      ),
    debounceMs: props.debounceMs ?? 150,
  };
}
