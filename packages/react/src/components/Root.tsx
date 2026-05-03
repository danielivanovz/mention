import { useImperativeHandle, useMemo } from "react";

import {
  useMultiCoreProps,
  useSingleCoreProps,
} from "../hooks/to-core-props.ts";
import { useMentionCore } from "../hooks/useMentionCore.ts";
import type {
  MentionRootMultiProps,
  MentionRootProps,
} from "../types.ts";
import { type InternalMentionContext, MentionProvider } from "./context.ts";

/**
 * `<Mention.Root>` — provider that wraps `useMentionCore` and exposes
 * its return value via context to the compound parts.
 *
 * Overloaded:
 *   1. **Single-trigger** — `MentionRootProps<TItem>` with top-level
 *      `items` / `getKey` / `getLabel` / `getInsertText` and an
 *      optional `trigger` char.
 *   2. **Multi-trigger** — `MentionRootMultiProps<TItemMap>` with
 *      `triggers: { [char]: ChannelConfig }` and a discriminated-union
 *      `onSelect`. Use `<Mention.List<TItem> trigger="X">` to compose
 *      typed lists per channel.
 *
 * Runtime branches on `'triggers' in props`. Both paths funnel into
 * the same `useMentionCore` workhorse via the shared `to-core-props`
 * adapter — only the channel-record synthesis and `onCommit` packaging
 * differ.
 */
export function Root<TItem>(props: MentionRootProps<TItem>): React.ReactNode;
export function Root<TItemMap extends Record<string, unknown>>(
  props: MentionRootMultiProps<TItemMap>,
): React.ReactNode;
export function Root(
  props:
    | MentionRootProps<unknown>
    | MentionRootMultiProps<Record<string, unknown>>,
): React.ReactNode {
  return "triggers" in props ? (
    <RootMulti {...props} />
  ) : (
    <RootSingle {...props} />
  );
}

function RootSingle<TItem>(props: MentionRootProps<TItem>): React.ReactNode {
  const ctx = useMentionCore(useSingleCoreProps(props));
  return (
    <RootProvider
      ctx={ctx}
      handleRef={props.handleRef as RootProviderProps["handleRef"]}
      unstyled={props.unstyled ?? false}
    >
      {props.children}
    </RootProvider>
  );
}

function RootMulti<TItemMap extends Record<string, unknown>>(
  props: MentionRootMultiProps<TItemMap>,
): React.ReactNode {
  const ctx = useMentionCore(useMultiCoreProps(props));
  return (
    <RootProvider
      ctx={ctx}
      handleRef={props.handleRef as RootProviderProps["handleRef"]}
      unstyled={props.unstyled ?? false}
    >
      {props.children}
    </RootProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Shared provider plumbing
// ─────────────────────────────────────────────────────────────────────

interface RootProviderProps {
  ctx: ReturnType<typeof useMentionCore>;
  handleRef: MentionRootProps<unknown>["handleRef"];
  unstyled: boolean;
  children: React.ReactNode;
}

function RootProvider({
  ctx,
  handleRef,
  unstyled,
  children,
}: RootProviderProps) {
  // Forward the imperative handle, if requested. `host` is a getter so
  // consumers reading `handle.host` after a re-render always see the
  // live node rather than a stale ref-current snapshot.
  useImperativeHandle(
    handleRef ?? null,
    () => ({
      open: () => ctx.setOpen(true),
      close: () => ctx.setOpen(false),
      commit: ctx.commit,
      get host() {
        return ctx.hostRef.current;
      },
    }),
    [ctx.setOpen, ctx.commit, ctx.hostRef],
  );

  // The compound parts read InternalMentionContext, which extends
  // MentionContext<unknown> — the core already returns the unknown form.
  const internal = useMemo<InternalMentionContext>(
    () => ({
      query: ctx.query,
      open: ctx.open,
      highlightedIndex: ctx.highlightedIndex,
      items: ctx.items,
      status: ctx.status,
      activeTrigger: ctx.activeTrigger,
      getInputProps: ctx.getInputProps,
      getPopoverProps: ctx.getPopoverProps,
      getItemProps: ctx.getItemProps,
      setOpen: ctx.setOpen,
      commit: ctx.commit,
      listboxId: ctx.listboxId,
      optionId: ctx.optionId,
      hostRef: ctx.hostRef,
      adapterRef: ctx.adapterRef,
      getKey: ctx.getKey,
      chips: ctx.chips,
      chipSelected: ctx.chipSelected,
      unstyled,
    }),
    [ctx, unstyled],
  );

  return <MentionProvider value={internal}>{children}</MentionProvider>;
}
