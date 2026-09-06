import type { UseMentionMultiProps } from "../types.ts";
import { multiCoreProps } from "./to-core-props.ts";
import { useMentionCore } from "./useMentionCore.ts";

export function useMentionMulti<M extends Record<string, unknown>>(
  props: UseMentionMultiProps<M>,
) {
  return useMentionCore<M[keyof M]>(multiCoreProps(props));
}
