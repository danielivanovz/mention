import { describe, expect, it } from "vitest";

import { type PopoverState, popoverReducer } from "./popover-reducer.ts";

// Factories keep each test focused on the field it cares about; new fields
// added to PopoverState only need a default here, not in every fixture.
const closed = (overrides: Partial<PopoverState> = {}): PopoverState => ({
  phase: "closed",
  trigger: null,
  query: "",
  highlightedIndex: -1,
  itemCount: 0,
  chipSelected: null,
  ...overrides,
});

const open = (overrides: Partial<PopoverState> = {}): PopoverState => ({
  phase: "open",
  trigger: "@",
  query: "",
  highlightedIndex: -1,
  itemCount: 0,
  chipSelected: null,
  ...overrides,
});

describe("popoverReducer — chip selection (C3)", () => {
  it("CHIP_SELECT closes any open popover and pins the id", () => {
    const next = popoverReducer(open({ trigger: "@", query: "al" }), {
      type: "CHIP_SELECT",
      id: "mc-1",
    });
    expect(next.phase).toBe("closed");
    expect(next.chipSelected).toBe("mc-1");
    expect(next.trigger).toBeNull();
  });

  it("CHIP_SELECT is identity-preserving when the same id is already selected", () => {
    const start = closed({ chipSelected: "mc-1" });
    const next = popoverReducer(start, { type: "CHIP_SELECT", id: "mc-1" });
    expect(next).toBe(start);
  });

  it("CHIP_DESELECT clears chipSelected", () => {
    const next = popoverReducer(closed({ chipSelected: "mc-1" }), {
      type: "CHIP_DESELECT",
    });
    expect(next.chipSelected).toBeNull();
  });

  it("CHIP_DESELECT is identity-preserving when nothing is selected", () => {
    const start = closed();
    const next = popoverReducer(start, { type: "CHIP_DESELECT" });
    expect(next).toBe(start);
  });

  it("DISMISS preserves chipSelected (chip selection survives popover close)", () => {
    const next = popoverReducer(
      open({ trigger: "@", query: "x", chipSelected: "mc-1" }),
      { type: "DISMISS" },
    );
    expect(next.phase).toBe("closed");
    expect(next.chipSelected).toBe("mc-1");
  });
});

describe("popoverReducer", () => {
  // User need: when the filtered/fetched item list refreshes, the
  //   highlight must point at the first option so Enter has a sensible
  //   default — and the count must be tracked for arrow-key wrap math.
  // Anti-outcome: stale `highlightedIndex` after an items refresh would
  //   either point past the end of the list (Enter does nothing) or
  //   point at a different item than the one visually highlighted (the
  //   classic "wrong row selected" bug).
  it("seeds highlightedIndex to 0 and stores itemCount on ITEMS_CHANGED", () => {
    const next = popoverReducer(open({ query: "dan", highlightedIndex: -1 }), {
      type: "ITEMS_CHANGED",
      itemCount: 5,
    });

    expect(next).toEqual(
      open({ query: "dan", highlightedIndex: 0, itemCount: 5 }),
    );
  });

  // Edge case: ITEMS_CHANGED with zero items leaves highlightedIndex at -1
  //   so the AT contract's `aria-activedescendant` stays unset and the
  //   <Mention.Empty> branch can render without a phantom selection.
  it("collapses highlightedIndex to -1 when ITEMS_CHANGED reports zero items", () => {
    const next = popoverReducer(open({ highlightedIndex: 2, itemCount: 5 }), {
      type: "ITEMS_CHANGED",
      itemCount: 0,
    });

    expect(next).toEqual(open({ highlightedIndex: -1, itemCount: 0 }));
  });

  // User need: ArrowDown moves the visual highlight to the next option,
  //   so a screen-reader user can step through candidates with arrow keys.
  // Anti-outcome: the highlight skipping or jumping by more than one
  //   would desync `aria-activedescendant` from what's visually styled,
  //   causing AT to announce the wrong option (a Spike 001 finding —
  //   `expect.poll` was needed precisely because this is the kind of
  //   transient state that flakes against React render boundaries).
  it("HIGHLIGHT_NEXT advances the highlight by one within the list", () => {
    const next = popoverReducer(open({ highlightedIndex: 0, itemCount: 3 }), {
      type: "HIGHLIGHT_NEXT",
    });

    expect(next.highlightedIndex).toBe(1);
  });

  // Wrap behavior matches the WAI-ARIA APG combobox example: pressing
  //   ArrowDown on the last option returns to the first. Slack, Notion,
  //   GitHub, Linear all do this — APG calls it the "circular" model.
  it("HIGHLIGHT_NEXT wraps from the last index back to 0", () => {
    const next = popoverReducer(open({ highlightedIndex: 2, itemCount: 3 }), {
      type: "HIGHLIGHT_NEXT",
    });

    expect(next.highlightedIndex).toBe(0);
  });

  // Defensive: if no items are present, navigation is a no-op rather
  //   than throwing or producing a phantom index.
  it("HIGHLIGHT_NEXT is a no-op when itemCount is 0", () => {
    const initial = open({ highlightedIndex: -1, itemCount: 0 });

    const next = popoverReducer(initial, { type: "HIGHLIGHT_NEXT" });

    // Referential identity (see HIGHLIGHT_PREV no-op test for rationale).
    expect(next).toBe(initial);
  });

  // ArrowUp is the symmetric of ArrowDown — moves the highlight up.
  it("HIGHLIGHT_PREV moves the highlight back by one", () => {
    const next = popoverReducer(open({ highlightedIndex: 2, itemCount: 3 }), {
      type: "HIGHLIGHT_PREV",
    });

    expect(next.highlightedIndex).toBe(1);
  });

  // ArrowUp at the top wraps to the last item — circular model again.
  it("HIGHLIGHT_PREV wraps from index 0 to the last item", () => {
    const next = popoverReducer(open({ highlightedIndex: 0, itemCount: 3 }), {
      type: "HIGHLIGHT_PREV",
    });

    expect(next.highlightedIndex).toBe(2);
  });

  it("HIGHLIGHT_PREV is a no-op when itemCount is 0", () => {
    const initial = open({ highlightedIndex: -1, itemCount: 0 });

    const next = popoverReducer(initial, { type: "HIGHLIGHT_PREV" });

    // Referential identity: the early-return is the contract, not just
    // shape equality. Without `toBe`, a mutant that drops the guard
    // and falls through coincidentally produces a deep-equal state
    // (last = -1, highlightedIndex <= 0 ? last : -2 → -1) and survives.
    expect(next).toBe(initial);
  });

  // User need: Escape, blur, or click-outside must close the popover and
  //   leave the textarea text untouched. This is the WAI-ARIA APG dismiss
  //   contract for combobox.
  // Anti-outcome: leaving the popover open after Escape would trap focus
  //   in a state that screen-reader users perceive as "stuck" — a known
  //   complaint against several existing mention libraries.
  it("DISMISS closes the popover and clears trigger/query/highlight", () => {
    const next = popoverReducer(
      open({ trigger: "@", query: "dan", highlightedIndex: 1, itemCount: 3 }),
      { type: "DISMISS" },
    );

    expect(next).toEqual(closed());
  });

  // DISMISS while already closed is a no-op (idempotent). Useful when
  //   the consumer wires both Escape AND blur — both fire, only the first
  //   matters.
  it("DISMISS is a no-op when already closed", () => {
    const initial = closed();

    const next = popoverReducer(initial, { type: "DISMISS" });

    expect(next).toBe(initial);
  });

  // User need: pressing Enter / Tab / clicking on an option commits the
  //   selection. The popover must close and the state must reset so the
  //   next typed character starts fresh.
  // Anti-outcome: leaving query/highlight populated after commit would
  //   cause the popover to immediately re-open showing the previous
  //   filter — surprising and AT-noisy.
  it("COMMIT closes the popover and resets transient state", () => {
    const next = popoverReducer(
      open({ trigger: "@", query: "dan", highlightedIndex: 1, itemCount: 3 }),
      { type: "COMMIT" },
    );

    expect(next).toEqual(closed());
  });

  // COMMIT while closed is a programmer error (commit() called with no
  //   open menu). Reducer returns state unchanged rather than throwing —
  //   throwing would crash the consumer's render and is overkill for
  //   what's likely a stale event handler firing late.
  it("COMMIT is a no-op when already closed", () => {
    const initial = closed();

    const next = popoverReducer(initial, { type: "COMMIT" });

    expect(next).toBe(initial);
  });

  // Regression — caught by the property-based suite (cycle 10).
  // User need: an in-flight async fetch must not "wake" a dismissed popover.
  //   If the user dismissed (Escape, blur) before fetch resolved, the
  //   late-arriving ITEMS_CHANGED should be ignored.
  // Anti-outcome: phantom items in closed state would either re-open the
  //   popover unexpectedly or leave the AT contract pointing at items
  //   that aren't visible.
  it("ITEMS_CHANGED while closed is a no-op (late async fetch resolution)", () => {
    const initial = closed();

    const next = popoverReducer(initial, {
      type: "ITEMS_CHANGED",
      itemCount: 5,
    });

    expect(next).toBe(initial);
  });

  // User need: pointer hover should move the visual highlight so mouse
  //   and keyboard share one notion of "what Enter would commit". Drives
  //   the `onPointerMove → HIGHLIGHT_AT` wire on `<Mention.Item>`.
  // Anti-outcome: keyboard-active and pointer-hover painting different
  //   rows simultaneously — the v0.0 trap that sent us into Spike 004.
  it("HIGHLIGHT_AT moves the highlight to the requested in-range index", () => {
    const next = popoverReducer(open({ itemCount: 5, highlightedIndex: 0 }), {
      type: "HIGHLIGHT_AT",
      index: 3,
    });

    expect(next).toEqual(open({ itemCount: 5, highlightedIndex: 3 }));
  });

  // User need: the popover renders under a stationary cursor on first
  //   open; without the upstream `mouseMoving` guard, a synthetic
  //   pointermove could race past index 0. Even if it slips through, the
  //   reducer must reject indices outside the current item count rather
  //   than producing a phantom highlight.
  it("HIGHLIGHT_AT with an out-of-range index is a no-op", () => {
    const initial = open({ itemCount: 3, highlightedIndex: 1 });

    expect(popoverReducer(initial, { type: "HIGHLIGHT_AT", index: -1 })).toBe(
      initial,
    );
    expect(popoverReducer(initial, { type: "HIGHLIGHT_AT", index: 3 })).toBe(
      initial,
    );
    expect(popoverReducer(initial, { type: "HIGHLIGHT_AT", index: 99 })).toBe(
      initial,
    );
  });

  // User need: identity preservation — re-firing the same index (a
  //   pointermove that didn't cross a row boundary) must not spawn a
  //   new state object and trigger downstream re-renders.
  it("HIGHLIGHT_AT to the already-highlighted index returns the same state", () => {
    const initial = open({ itemCount: 5, highlightedIndex: 2 });

    const next = popoverReducer(initial, { type: "HIGHLIGHT_AT", index: 2 });

    expect(next).toBe(initial);
  });

  // User need: late-arriving pointer events after the popover has
  //   dismissed (Escape, blur, commit) must not wake the menu — same
  //   posture as ITEMS_CHANGED while closed.
  it("HIGHLIGHT_AT while closed is a no-op", () => {
    const initial = closed();

    const next = popoverReducer(initial, { type: "HIGHLIGHT_AT", index: 0 });

    expect(next).toBe(initial);
  });

  // User need: cursor placed inside an existing `@…` substring + a
  //   keystroke must re-open the popover with the resolved query. The
  //   dispatcher resolves the active mention via a backwards scan and
  //   dispatches OPEN_AT with the result. ADR-0003 / Spike 005.
  it("OPEN_AT opens from closed with the resolved trigger and query", () => {
    const next = popoverReducer(closed(), {
      type: "OPEN_AT",
      trigger: "@",
      query: "ali",
    });

    expect(next).toEqual(open({ trigger: "@", query: "ali" }));
  });

  // User need: typing inside an active mention shifts the query (e.g.
  //   `@al|i` → user inserts `i` → `@ali|i`, query="alii"). Reflects the
  //   backward scan's new result.
  it("OPEN_AT updates the query while open", () => {
    const next = popoverReducer(open({ trigger: "@", query: "al" }), {
      type: "OPEN_AT",
      trigger: "@",
      query: "ali",
    });

    expect(next).toEqual(open({ trigger: "@", query: "ali" }));
  });

  // User need: when OPEN_AT is dispatched after the query advanced and
  //   items have already populated, the highlight resets to index 0 so
  //   the user's first <Enter> commits the most relevant suggestion —
  //   same posture as ITEMS_CHANGED.
  it("OPEN_AT resets highlightedIndex to 0 when items are present", () => {
    const next = popoverReducer(
      open({ trigger: "@", query: "al", itemCount: 5, highlightedIndex: 3 }),
      { type: "OPEN_AT", trigger: "@", query: "ali" },
    );

    expect(next).toEqual(
      open({ trigger: "@", query: "ali", itemCount: 5, highlightedIndex: 0 }),
    );
  });

  // User need: identity preservation. The dispatcher fires OPEN_AT on
  //   every relevant change; if the resolved (trigger, query) hasn't
  //   moved (e.g. a selection-change without text change), the reducer
  //   must return the same object so memoized consumers don't re-render.
  it("OPEN_AT to the same trigger and query returns the same state", () => {
    const initial = open({
      trigger: "@",
      query: "ali",
      itemCount: 5,
      highlightedIndex: 2,
    });

    const next = popoverReducer(initial, {
      type: "OPEN_AT",
      trigger: "@",
      query: "ali",
    });

    expect(next).toBe(initial);
  });
});
