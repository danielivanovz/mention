import { startTransition, useEffect, useState } from "react";
import type { MentionFetcher, MentionItems, MentionStatus } from "../types.ts";
import type { CoreChannelConfig } from "./useMentionCore.ts";
import { useLatest } from "./use-latest.ts";

interface UseChannelQueryParams {
  readonly channel: CoreChannelConfig | undefined;
  readonly query: string;
  readonly isOpen: boolean;
}

interface UseChannelQueryReturn {
  readonly items: readonly unknown[];
  readonly status: MentionStatus;
}

function isFetcher(
  items: MentionItems<unknown>,
): items is MentionFetcher<unknown> {
  return typeof items === "function";
}

function defaultMatch(label: string, query: string): boolean {
  return label.toLowerCase().includes(query.toLowerCase());
}

/**
 * Single-writer for the data path: filter the active channel's items
 * (sync) or invoke its fetcher (async), with full `AbortController`
 * lifecycle and `MentionStatus` tracking.
 *
 * Identity-stability pattern (mirroring `useMentionCore`): the channel
 * is read through a `useLatest` ref so consumer-side prop churn doesn't
 * re-fire the effect. Effect deps narrow to primitives + the items
 * reference (the one signal that genuinely indicates "data changed").
 *
 * Owns:
 *   - the filter-vs-fetcher branch + the `defaultMatch` predicate
 *   - the `AbortController` lifecycle (per-effect-cycle)
 *   - the full `MentionStatus` machine: idle / loading / success / error
 *   - `startTransition` wrapping so listbox re-renders can yield
 *
 * Does NOT own:
 *   - active-channel resolution (caller passes the resolved channel)
 *   - reducer sync (`ITEMS_CHANGED` dispatch stays in core)
 */
export function useChannelQuery({
  channel,
  query,
  isOpen,
}: UseChannelQueryParams): UseChannelQueryReturn {
  const [items, setItems] = useState<readonly unknown[]>([]);
  const [status, setStatus] = useState<MentionStatus>("idle");

  const channelRef = useLatest(channel);
  const items_ = channel?.items;

  useEffect(() => {
    if (!isOpen || items_ === undefined) {
      setItems([]);
      setStatus("idle");
      return;
    }
    // Read getLabel from the latest channel ref — its identity may flip
    // every render in unstabilised consumer code, but the function it
    // points at always reflects what the consumer most recently declared.
    const liveChannel = channelRef.current;
    if (liveChannel === undefined) return;

    if (!isFetcher(items_)) {
      const next = items_.filter((item) =>
        defaultMatch(liveChannel.getLabel(item), query),
      );
      // Sync filter writes at normal priority. The downstream
      // items_changed effect in useMentionCore depends on
      // filtered.length to dispatch ITEMS_CHANGED → highlightedIndex=0;
      // deferring this with startTransition opens a race where Enter
      // is pressed before highlightedIndex has been seeded. For typical
      // 5–50 item lists the cost is trivial. The async path below
      // keeps its transition because fetch latency dominates anyway.
      setItems(next);
      setStatus("success");
      return;
    }

    setStatus("loading");
    const controller = new AbortController();
    items_(query, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        startTransition(() => {
          setItems(next);
          setStatus("success");
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if ((err as { name?: string }).name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [isOpen, query, items_, channelRef]);

  return { items, status };
}
