import { useEffect, useState } from "react";
import type {
  MentionChannelConfig,
  MentionFetcher,
  MentionStatus,
} from "../types.ts";

interface QueryResult {
  key: object;
  fetcher: MentionFetcher<unknown>;
  signal: AbortSignal;
  items: readonly unknown[];
  status: MentionStatus;
}
export function useChannelQuery({
  channel,
  query,
  requestKey,
  debounceMs,
}: {
  channel: MentionChannelConfig<unknown> | undefined;
  query: string;
  requestKey: object | null;
  debounceMs: number;
}): { items: readonly unknown[]; status: MentionStatus } {
  const [result, setResult] = useState<QueryResult | null>(null);
  const fetcher = typeof channel?.items === "function" ? channel.items : null;

  useEffect(() => {
    if (!fetcher || !requestKey) return;
    const controller = new AbortController();
    const run = async () => {
      try {
        const items = await fetcher(query, controller.signal);
        if (!controller.signal.aborted)
          setResult({
            key: requestKey,
            fetcher,
            signal: controller.signal,
            items,
            status: "success",
          });
      } catch {
        if (!controller.signal.aborted)
          setResult({
            key: requestKey,
            fetcher,
            signal: controller.signal,
            items: [],
            status: "error",
          });
      }
    };
    const timer = debounceMs > 0 ? setTimeout(run, debounceMs) : undefined;
    if (timer === undefined) void run();
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [fetcher, query, requestKey, debounceMs]);

  if (!channel || !requestKey) return { items: [], status: "idle" };
  if (typeof channel.items !== "function") {
    return {
      items: channel.items.filter((item) =>
        channel.filter
          ? channel.filter(item, query)
          : channel.getLabel(item).toLowerCase().includes(query.toLowerCase()),
      ),
      status: "success",
    };
  }
  // Old results are hidden even before the new request's effect runs.
  if (
    result?.key !== requestKey ||
    result.fetcher !== fetcher ||
    result.signal.aborted
  ) {
    return { items: [], status: "loading" };
  }
  return result;
}
