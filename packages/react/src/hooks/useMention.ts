import type { UseMentionProps } from "../types.ts";
import { singleCoreProps } from "./to-core-props.ts";
import { useMentionCore } from "./useMentionCore.ts";

export function useMention<T>(props: UseMentionProps<T>) {
  return useMentionCore<T>(singleCoreProps(props));
}
