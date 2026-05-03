// @vitest-environment happy-dom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createTextareaAdapter } from "../adapters/textarea.ts";
import { useMentionMulti } from "./useMentionMulti.ts";

interface User {
  id: number;
  name: string;
}
interface Channel {
  id: string;
  name: string;
}

const USERS: User[] = [
  { id: 1, name: "Daniel" },
  { id: 2, name: "Daria" },
];
const CHANNELS: Channel[] = [
  { id: "general", name: "general" },
  { id: "random", name: "random" },
];

const TRIGGERS = {
  "@": {
    items: USERS,
    getKey: (u: User) => u.id,
    getLabel: (u: User) => u.name,
  },
  "#": {
    items: CHANNELS,
    getKey: (c: Channel) => c.id,
    getLabel: (c: Channel) => c.name,
    getInsertText: (c: Channel) => `#${c.name}`,
  },
} as const;

describe("useMentionMulti", () => {
  // User need: the headless escape hatch returns the same shape as
  //   `useMention` plus an `activeTrigger` field that lets consumers
  //   narrow on which channel is active.
  it("returns a closed-state context when no trigger has fired", () => {
    const { result } = renderHook(() =>
      useMentionMulti<{ "@": User; "#": Channel }>({
        triggers: TRIGGERS,
        onSelect: () => {},
      }),
    );

    expect(result.current.open).toBe(false);
    expect(result.current.activeTrigger).toBeNull();
    expect(result.current.items).toEqual([]);
    expect(result.current.query).toBe("");
  });

  // User need: when the dispatcher resolves a trigger, the hook
  //   exposes which channel is active so consumers can render
  //   appropriate UI (e.g., "Pick a person" vs "Pick a channel").
  it("exposes activeTrigger and active-channel items on open", () => {
    const { result } = renderHook(() =>
      useMentionMulti<{ "@": User; "#": Channel }>({
        triggers: TRIGGERS,
        onSelect: () => {},
      }),
    );

    // Drive the dispatcher manually via a synthetic change event,
    // mirroring what an inline-suggestions consumer would do.
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    result.current.hostRef.current = textarea;
    result.current.adapterRef.current = createTextareaAdapter(textarea);

    act(() => {
      textarea.value = "Hi @";
      textarea.setSelectionRange(4, 4);
      const inputProps = result.current.getInputProps() as {
        onChange: (e: { target: HTMLTextAreaElement }) => void;
      };
      inputProps.onChange({ target: textarea });
    });

    expect(result.current.open).toBe(true);
    expect(result.current.activeTrigger).toBe("@");
    expect(result.current.items).toEqual(USERS);
    document.body.removeChild(textarea);
  });

  // User need: switching channels mid-typing should swap active items.
  //   This is the multi-channel routing the hook exists to expose.
  it("switches activeTrigger + items when a different trigger fires", () => {
    const { result } = renderHook(() =>
      useMentionMulti<{ "@": User; "#": Channel }>({
        triggers: TRIGGERS,
        onSelect: () => {},
      }),
    );

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    result.current.hostRef.current = textarea;
    result.current.adapterRef.current = createTextareaAdapter(textarea);
    const inputProps = result.current.getInputProps() as {
      onChange: (e: { target: HTMLTextAreaElement }) => void;
    };

    // First — type @ to open the users channel.
    act(() => {
      textarea.value = "@";
      textarea.setSelectionRange(1, 1);
      inputProps.onChange({ target: textarea });
    });
    expect(result.current.activeTrigger).toBe("@");

    // Now — type a # after a space, switching channels.
    act(() => {
      textarea.value = "@ #";
      textarea.setSelectionRange(3, 3);
      // getInputProps may have re-stabilised; grab fresh.
      const fresh = result.current.getInputProps() as typeof inputProps;
      fresh.onChange({ target: textarea });
    });
    expect(result.current.activeTrigger).toBe("#");
    expect(result.current.items).toEqual(CHANNELS);
    document.body.removeChild(textarea);
  });

  // User need: the discriminated `onSelect` payload carries the
  //   active trigger as the key so consumers can narrow with
  //   `'@' in payload`. This is the typing the locked surface
  //   commits to in `types.ts`.
  it("packages onSelect payload as { [activeTrigger]: item }", () => {
    type Payload = { "@": User } | { "#": Channel };
    let captured: Payload | null = null;
    const { result } = renderHook(() =>
      useMentionMulti<{ "@": User; "#": Channel }>({
        triggers: TRIGGERS,
        onSelect: (payload) => {
          captured = payload;
        },
      }),
    );

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    result.current.hostRef.current = textarea;
    result.current.adapterRef.current = createTextareaAdapter(textarea);
    const inputProps = result.current.getInputProps() as {
      onChange: (e: { target: HTMLTextAreaElement }) => void;
    };

    act(() => {
      textarea.value = "@";
      textarea.setSelectionRange(1, 1);
      inputProps.onChange({ target: textarea });
    });

    // Commit the first user via the imperative API.
    act(() => {
      const user = result.current.items[0];
      if (user === undefined) throw new Error("expected an item");
      result.current.commit(user);
    });

    expect(captured).toEqual({ "@": USERS[0] });
    document.body.removeChild(textarea);
  });

  // Regression — the perf refactor's claim is that `commit` and
  //   `getInputProps` keep referential equality across renders even
  //   when the consumer rebuilds the `triggers` record inline. Without
  //   this, the hook would force consumers to defensively memoise; the
  //   recipe documented "you must hoist" as a workaround. The fix is
  //   that the core uses `useLatest`-backed refs so identity churn
  //   on consumer-side props doesn't propagate into handler closures.
  it("keeps commit + getInputProps identity stable across consumer re-renders", () => {
    let renderCount = 0;
    const { result, rerender } = renderHook(() => {
      renderCount += 1;
      // Intentionally rebuild the triggers record every render — this
      // simulates the inline `triggers={{...}}` pattern.
      return useMentionMulti<{ "@": User }>({
        triggers: {
          "@": {
            items: USERS,
            getKey: (u) => u.id,
            getLabel: (u) => u.name,
          },
        },
        onSelect: () => {
          /* fresh closure each render */
        },
      });
    });

    const firstCommit = result.current.commit;
    const firstGetInputProps = result.current.getInputProps;

    // Force a parent re-render — every props field gets a new identity.
    rerender();
    rerender();
    rerender();

    expect(renderCount).toBeGreaterThan(1);
    expect(result.current.commit).toBe(firstCommit);
    expect(result.current.getInputProps).toBe(firstGetInputProps);
  });
});
