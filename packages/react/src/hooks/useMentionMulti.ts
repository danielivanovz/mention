import type {
  MentionMultiContext,
  UseMentionMultiProps,
} from "../types.ts";
import { useMultiCoreProps } from "./to-core-props.ts";
import { type CoreReturn, useMentionCore } from "./useMentionCore.ts";

/**
 * Return shape — extends `MentionMultiContext<TItemMap>` with the
 * listbox/option id helpers and textarea ref. Built from
 * `CoreReturn<TItemMap[keyof TItemMap]>` with `activeTrigger` narrowed
 * from `string | null` to `keyof TItemMap | null` (the runtime always
 * sets it from a configured trigger key, so the narrowing matches
 * reality — TypeScript can't prove it without dependent types).
 */
export type UseMentionMultiReturn<TItemMap extends Record<string, unknown>> =
  Omit<CoreReturn<TItemMap[keyof TItemMap]>, "activeTrigger"> &
    Pick<MentionMultiContext<TItemMap>, "activeTrigger">;

/**
 * Public multi-trigger hook. Returns a context with `activeTrigger:
 * keyof TItemMap | null` so consumers can narrow on which channel is
 * active. The discriminated `onSelect` payload (`{ [activeTrigger]: TItem }`)
 * narrows for free via TypeScript.
 *
 * @example
 *   const ctx = useMentionMulti<{ "/": Command; "@": Person }>({
 *     triggers: TRIGGERS,
 *     onSelect: (payload) => {
 *       if ("/" in payload) runCommand(payload["/"]);
 *       if ("@" in payload) tagPerson(payload["@"]);
 *     },
 *   });
 */
export function useMentionMulti<TItemMap extends Record<string, unknown>>(
  props: UseMentionMultiProps<TItemMap>,
): UseMentionMultiReturn<TItemMap> {
  // The single boundary cast: narrows `activeTrigger` from `string` to
  // `keyof TItemMap`. TypeScript can't statically prove the runtime
  // invariant that `activeTrigger` only takes values from configured
  // trigger keys; the cast documents it.
  return useMentionCore<TItemMap[keyof TItemMap]>(
    useMultiCoreProps(props),
  ) as UseMentionMultiReturn<TItemMap>;
}
