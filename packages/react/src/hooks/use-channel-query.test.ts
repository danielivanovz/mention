// @vitest-environment happy-dom

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MentionFetcher } from "../types.ts";
import type { CoreChannelConfig } from "./useMentionCore.ts";
import { useChannelQuery } from "./use-channel-query.ts";

// ─── builders ────────────────────────────────────────────────────────
//
// Channels and item arrays are defined at module scope so renderHook
// callbacks see stable references across renders. The hook's effect
// deps include the items reference; an unstable identity would re-fire
// the effect every render and (since each filter pass produces a new
// array) drive an infinite loop. Production consumers are expected to
// hoist their items arrays for the same reason.

const STABLE_LETTERS = ["alpha", "beta"] as const;
const STABLE_NAMED = [{ name: "Alice" }, { name: "Bob" }, { name: "Carol" }];
const STABLE_CJK = ["田中太郎", "山田花子"] as const;
const STABLE_DAN_BOB = ["Daniel", "Bob"] as const;

const lettersChannel: CoreChannelConfig = {
  items: STABLE_LETTERS,
  getKey: (item) => String(item),
  getLabel: (item) => String(item),
};
const namedChannel: CoreChannelConfig = {
  items: STABLE_NAMED,
  getKey: (item) => (item as { name: string }).name,
  getLabel: (item) => (item as { name: string }).name,
};
const cjkChannel: CoreChannelConfig = {
  items: STABLE_CJK,
  getKey: (item) => String(item),
  getLabel: (item) => String(item),
};
const danBobChannel: CoreChannelConfig = {
  items: STABLE_DAN_BOB,
  getKey: (item) => String(item),
  getLabel: (item) => String(item),
};

function fetcherChannel(fn: MentionFetcher<unknown>): CoreChannelConfig {
  return {
    items: fn,
    getKey: (item) => String(item),
    getLabel: (item) => String(item),
  };
}

interface Deferred<T> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(err: unknown): void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useChannelQuery", () => {
  // ─── Group 1: gating ──────────────────────────────────────────────
  //
  // The hook owes consumers a strict closed→idle contract: when the
  // popover isn't open or there's no active channel, it must report
  // empty items and idle status. Otherwise stale state from a prior
  // open would leak into the next open cycle.

  // User need: when the popover is closed, no filter or fetch should run.
  it("returns empty/idle when isOpen is false", () => {
    const { result } = renderHook(() =>
      useChannelQuery({ channel: lettersChannel, query: "", isOpen: false }),
    );
    expect(result.current.items).toEqual([]);
    expect(result.current.status).toBe("idle");
  });

  // User need: when no channel is active (multi-trigger before any
  //   trigger fires), the hook must not throw or fall back to a default
  //   set — it must just stay idle.
  it("returns empty/idle when channel is undefined", () => {
    const { result } = renderHook(() =>
      useChannelQuery({ channel: undefined, query: "", isOpen: true }),
    );
    expect(result.current.items).toEqual([]);
    expect(result.current.status).toBe("idle");
  });

  // ─── Group 2: sync filter ─────────────────────────────────────────

  // User need: an empty query should show every item — typing the
  //   trigger character alone opens the menu in its "browse" mode.
  it("returns all items when query is empty (sync)", async () => {
    const { result } = renderHook(() =>
      useChannelQuery({ channel: lettersChannel, query: "", isOpen: true }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    expect(result.current.items).toEqual(["alpha", "beta"]);
  });

  // User need: typing narrows the list via case-insensitive substring
  //   on getLabel. Default behavior; consumers can pass a fetcher to
  //   override.
  it("filters items by case-insensitive substring on getLabel (sync)", async () => {
    const { result } = renderHook(() =>
      useChannelQuery({ channel: namedChannel, query: "ar", isOpen: true }),
    );
    await waitFor(() => {
      expect(result.current.items).toEqual([{ name: "Carol" }]);
    });
    expect(result.current.status).toBe("success");
  });

  // Edge case: query that matches nothing must still report success
  //   (the fetch/filter completed, just produced zero items) so the
  //   `<Mention.Empty>` branch can render. Reporting "loading" forever
  //   would lock the empty-state UI out.
  it("reports success with empty items when sync filter matches nothing", async () => {
    const { result } = renderHook(() =>
      useChannelQuery({ channel: lettersChannel, query: "zzz", isOpen: true }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    expect(result.current.items).toEqual([]);
  });

  // Sync path is synchronous from React's PoV: it must never observe
  //   "loading" — that status is reserved for async fetchers. Otherwise
  //   consumers showing a spinner on `status === "loading"` would flicker.
  it("never reports loading on the sync path", async () => {
    const { result } = renderHook(() =>
      useChannelQuery({ channel: lettersChannel, query: "", isOpen: true }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    expect(result.current.status).not.toBe("loading");
  });

  // ─── Group 3: async happy path ────────────────────────────────────

  // The fetcher contract: it gets `(query, AbortSignal)`. The signal
  //   matters most for race-condition tests below — but we verify the
  //   wiring here so consumers can rely on it.
  it("invokes the fetcher with (query, AbortSignal) when async", async () => {
    const fetcher = vi.fn<MentionFetcher<unknown>>().mockResolvedValue([]);
    const channel = fetcherChannel(fetcher);
    renderHook(() =>
      useChannelQuery({ channel, query: "dan", isOpen: true }),
    );
    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
    const call = fetcher.mock.calls[0];
    expect(call?.[0]).toBe("dan");
    expect(call?.[1]).toBeInstanceOf(AbortSignal);
  });

  // User need: while the fetch is in flight, status reports "loading"
  //   so the UI can show a spinner. Once it settles, status flips to
  //   "success" and items appear in one paint.
  it("transitions idle → loading → success on async resolve", async () => {
    const d = deferred<readonly unknown[]>();
    const channel = fetcherChannel(() => d.promise);
    const { result } = renderHook(() =>
      useChannelQuery({ channel, query: "x", isOpen: true }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe("loading");
    });
    expect(result.current.items).toEqual([]);

    await act(async () => {
      d.resolve(["one", "two"]);
      await d.promise;
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    expect(result.current.items).toEqual(["one", "two"]);
  });

  // ─── Group 4: async errors ────────────────────────────────────────

  // User need: a fetch failure surfaces as `status === "error"` so the
  //   consumer's UI can show a retry affordance. Items stay empty.
  it("reports error when the fetcher rejects", async () => {
    const d = deferred<readonly unknown[]>();
    const channel = fetcherChannel(() => d.promise);
    const { result } = renderHook(() =>
      useChannelQuery({ channel, query: "x", isOpen: true }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe("loading");
    });
    await act(async () => {
      d.reject(new Error("network down"));
      await d.promise.catch(() => {});
    });
    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
  });

  // AbortError is the consumer's signal that *we* aborted the fetch
  //   (e.g. by changing the query). Treating it as an error would
  //   surface a spurious red state during normal typing.
  it("suppresses AbortError so canceled fetches do not surface as errors", async () => {
    const d = deferred<readonly unknown[]>();
    const channel = fetcherChannel(() => d.promise);
    const { result } = renderHook(() =>
      useChannelQuery({ channel, query: "x", isOpen: true }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe("loading");
    });
    await act(async () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      d.reject(err);
      await d.promise.catch(() => {});
    });
    // Status stays at "loading" (no transition fired); never "error".
    expect(result.current.status).not.toBe("error");
  });

  // Late-settle invariant: a fetch that resolves after the popover
  //   closed must not push items back into state. The cleanup aborts
  //   the controller, and the .then() arm checks `signal.aborted`.
  it("ignores fetcher resolution after the popover closed", async () => {
    const d = deferred<readonly unknown[]>();
    const channel = fetcherChannel(() => d.promise);
    const { result, rerender } = renderHook(
      (props: { isOpen: boolean }) =>
        useChannelQuery({ channel, query: "x", isOpen: props.isOpen }),
      { initialProps: { isOpen: true } },
    );
    await waitFor(() => {
      expect(result.current.status).toBe("loading");
    });

    rerender({ isOpen: false });
    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });

    // Now the late settle arrives — must be a no-op.
    await act(async () => {
      d.resolve(["late"]);
      await d.promise;
    });
    expect(result.current.items).toEqual([]);
    expect(result.current.status).toBe("idle");
  });

  // ─── Group 5: race conditions (the deepening payoff) ──────────────
  //
  // These are the cases that integration tests can't easily exercise.
  // Each verifies the AbortController lifecycle catches a stale fetch
  // before it can clobber fresher state.

  // User need: typing fast must not let an earlier slow fetch overwrite
  //   the results of a later (more relevant) one. Each query change
  //   aborts the prior fetch.
  it("aborts the in-flight fetch when query changes", async () => {
    const aborts: boolean[] = [];
    const fetcher: MentionFetcher<unknown> = (_q, signal) =>
      new Promise((_res, rej) => {
        signal.addEventListener("abort", () => {
          aborts.push(true);
          const err = new Error("aborted");
          err.name = "AbortError";
          rej(err);
        });
      });
    const channel = fetcherChannel(fetcher);
    const { rerender, unmount } = renderHook(
      (props: { query: string }) =>
        useChannelQuery({ channel, query: props.query, isOpen: true }),
      { initialProps: { query: "a" } },
    );
    rerender({ query: "ab" });
    await waitFor(() => {
      expect(aborts.length).toBeGreaterThanOrEqual(1);
    });
    unmount();
  });

  // User need (multi-trigger): switching channels mid-fetch must abort
  //   the old channel's request. Otherwise users typing "@d" then
  //   immediately backspace + "/cmd" would briefly see @-channel results
  //   under the /-channel header.
  it("aborts the in-flight fetch when channel changes", async () => {
    const aborts: boolean[] = [];
    const slowFetcher: MentionFetcher<unknown> = (_q, signal) =>
      new Promise((_res, rej) => {
        signal.addEventListener("abort", () => {
          aborts.push(true);
          const err = new Error("aborted");
          err.name = "AbortError";
          rej(err);
        });
      });
    const otherFetcher: MentionFetcher<unknown> = async () => [];
    const slowChannel = fetcherChannel(slowFetcher);
    const otherChannel = fetcherChannel(otherFetcher);
    const { rerender, unmount } = renderHook(
      (props: { useOther: boolean }) =>
        useChannelQuery({
          channel: props.useOther ? otherChannel : slowChannel,
          query: "x",
          isOpen: true,
        }),
      { initialProps: { useOther: false } },
    );
    rerender({ useOther: true });
    await waitFor(() => {
      expect(aborts.length).toBeGreaterThanOrEqual(1);
    });
    unmount();
  });

  // User need: closing the popover (Escape, blur, commit) must abort
  //   any in-flight fetch and reset to idle so the next open starts
  //   from a clean slate.
  it("aborts and resets to idle when the popover closes mid-fetch", async () => {
    const aborts: boolean[] = [];
    const fetcher: MentionFetcher<unknown> = (_q, signal) =>
      new Promise((_res, rej) => {
        signal.addEventListener("abort", () => {
          aborts.push(true);
          const err = new Error("aborted");
          err.name = "AbortError";
          rej(err);
        });
      });
    const channel = fetcherChannel(fetcher);
    const { result, rerender, unmount } = renderHook(
      (props: { isOpen: boolean }) =>
        useChannelQuery({ channel, query: "x", isOpen: props.isOpen }),
      { initialProps: { isOpen: true } },
    );
    await waitFor(() => {
      expect(result.current.status).toBe("loading");
    });
    rerender({ isOpen: false });
    await waitFor(() => {
      expect(aborts.length).toBeGreaterThanOrEqual(1);
    });
    expect(result.current.status).toBe("idle");
    expect(result.current.items).toEqual([]);
    unmount();
  });

  // ─── Group 6: predicate ───────────────────────────────────────────

  // The default match is case-insensitive — typing "DAN" matches
  //   "Daniel" so users don't have to think about caps.
  it("matches case-insensitively by default", async () => {
    const { result } = renderHook(() =>
      useChannelQuery({ channel: danBobChannel, query: "DAN", isOpen: true }),
    );
    await waitFor(() => {
      expect(result.current.items).toEqual(["Daniel"]);
    });
  });

  // Unicode safety: substring works on multi-byte characters. Modern
  //   JS treats strings as UTF-16, so `.includes` over BMP chars like
  //   `田` is correct without any normalization.
  it("matches unicode substrings (e.g. CJK)", async () => {
    const { result } = renderHook(() =>
      useChannelQuery({ channel: cjkChannel, query: "田", isOpen: true }),
    );
    await waitFor(() => {
      expect(result.current.items).toEqual(["田中太郎", "山田花子"]);
    });
  });
});
