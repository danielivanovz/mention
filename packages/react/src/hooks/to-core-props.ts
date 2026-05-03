import type React from "react";
import { useCallback } from "react";
import type {
  MentionItems,
  MentionRootMultiProps,
  MentionRootProps,
  MentionSelectMeta,
  UseMentionMultiProps,
  UseMentionProps,
} from "../types.ts";
import type { CoreChannelConfig, CoreProps } from "./useMentionCore.ts";

/**
 * Shared adapter hooks. Collapse the four wrappers (`useMention`,
 * `useMentionMulti`, `RootSingle`, `RootMulti`) to ~3 lines each by
 * centralising the channel-record synthesis and `onCommit` wrapping.
 *
 * Boundary cast: the `MentionItems<TItem>` → `MentionItems<unknown>`
 * direction at the channel record is the single point in the codebase
 * where TItem is type-erased. The cast is safe by construction —
 * channels only enter the core via the wrappers, which build them from
 * `TItem`-typed inputs. All callable fields (getKey, getLabel, …) flow
 * through unchanged because function-parameter contravariance lets a
 * `(item: TItem) => X` accept `(item: unknown) => X`'s shape under
 * `strictFunctionTypes`.
 *
 * The `useCallback` dep on `onCommit` is `[onSelect]` only —
 * intentionally narrow. Including the full `props` would defeat the
 * identity-stability work the core relies on and cascade re-renders
 * into every <Mention.Item>.
 */

type SingleAdapterInput<TItem> =
  | UseMentionProps<TItem>
  | (MentionRootProps<TItem> & { onValueChange?: never });

/**
 * Single-trigger adapter. Both `useMention` and `<Mention.Root>`
 * single-trigger feed in the same shape minus the children/handleRef/
 * unstyled fields (which are compound-API-specific). `onValueChange`
 * is hook-only and absent on Root — we accept it as optional and
 * conditionally spread so both call sites work uniformly.
 */
export function useSingleCoreProps<TItem>(
  props: SingleAdapterInput<TItem>,
): CoreProps {
  const trigger = props.trigger ?? "@";
  const onSelect = props.onSelect;

  const onCommit = useCallback(
    (item: unknown, meta: MentionSelectMeta) => {
      onSelect(item as TItem, meta);
    },
    [onSelect],
  );

  const channel: CoreChannelConfig = {
    items: props.items as MentionItems<unknown>,
    getKey: props.getKey as (item: unknown) => string | number,
    getLabel: props.getLabel as (item: unknown) => string,
    ...(props.getInsertText !== undefined && {
      getInsertText: props.getInsertText as (
        item: unknown,
        meta: MentionSelectMeta,
      ) => string,
    }),
    ...(props.shape !== undefined && { shape: props.shape }),
    ...(props.getInsertNode !== undefined && {
      getInsertNode: props.getInsertNode as (
        item: unknown,
        meta: MentionSelectMeta,
      ) => React.ReactNode,
    }),
  };

  return {
    triggers: [trigger],
    channels: { [trigger]: channel },
    onCommit,
    ...(props.debounceMs !== undefined && { debounceMs: props.debounceMs }),
    ...(props.onValueChange !== undefined && {
      onValueChange: props.onValueChange,
    }),
  };
}

type MultiAdapterInput<TItemMap extends Record<string, unknown>> =
  | UseMentionMultiProps<TItemMap>
  | (MentionRootMultiProps<TItemMap> & { onValueChange?: never });

/**
 * Multi-trigger adapter. Builds the channel record by passthrough: the
 * consumer's `triggers` map already has the right shape (channel config
 * keyed by trigger char); we just type-erase TItemMap[K] → unknown at
 * the channel-record edge.
 */
export function useMultiCoreProps<TItemMap extends Record<string, unknown>>(
  props: MultiAdapterInput<TItemMap>,
): CoreProps {
  const onSelect = props.onSelect;

  // Discriminated-union packaging: `{ [activeTrigger]: item }`. Consumer
  // narrows via `'@' in payload` etc — TypeScript flows the per-channel
  // item type from their `TItemMap`.
  const onCommit = useCallback(
    (item: unknown, meta: MentionSelectMeta, activeTrigger: string) => {
      const payload = { [activeTrigger]: item } as Parameters<
        typeof onSelect
      >[0];
      onSelect(payload, meta);
    },
    [onSelect],
  );

  const channels: Record<string, CoreChannelConfig> = {};
  for (const key of Object.keys(props.triggers)) {
    const channel = (props.triggers as Record<string, CoreChannelConfig>)[key];
    if (channel === undefined) continue;
    channels[key] = channel;
  }

  return {
    triggers: Object.keys(props.triggers),
    channels,
    onCommit,
    ...(props.debounceMs !== undefined && { debounceMs: props.debounceMs }),
    ...(props.onValueChange !== undefined && {
      onValueChange: props.onValueChange,
    }),
  };
}
