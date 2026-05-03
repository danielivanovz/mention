import * as fc from "fast-check";
import { describe, it } from "vitest";

import {
  type PopoverAction,
  type PopoverState,
  popoverReducer,
} from "./popover-reducer.ts";

// Property-based fuzz over arbitrary action sequences. The reducer is a pure
// function of (state, action), so any starting state plus any sequence of
// actions must keep the invariants below true. If a counterexample shows up
// in CI, fast-check will shrink it to the minimal failing sequence.

const CLOSED: PopoverState = {
  phase: "closed",
  trigger: null,
  query: "",
  highlightedIndex: -1,
  itemCount: 0,
  chipSelected: null,
};

const arbitraryAction: fc.Arbitrary<PopoverAction> = fc.oneof(
  fc.record({
    type: fc.constant("ITEMS_CHANGED" as const),
    itemCount: fc.nat({ max: 10 }),
  }),
  fc.constant({ type: "HIGHLIGHT_NEXT" as const }),
  fc.constant({ type: "HIGHLIGHT_PREV" as const }),
  fc.record({
    type: fc.constant("HIGHLIGHT_AT" as const),
    // Span in-range and out-of-range indices so the action's bounds
    // check is exercised by the fuzzer.
    index: fc.integer({ min: -2, max: 12 }),
  }),
  fc.record({
    type: fc.constant("OPEN_AT" as const),
    trigger: fc.constant("@"),
    query: fc.string({ maxLength: 8 }),
  }),
  fc.constant({ type: "DISMISS" as const }),
  fc.constant({ type: "COMMIT" as const }),
);

function runSequence(actions: readonly PopoverAction[]): PopoverState {
  return actions.reduce(popoverReducer, CLOSED);
}

describe("popoverReducer — invariants under arbitrary action sequences", () => {
  // Invariant: an open popover always has a trigger character recorded.
  // Anti-outcome: an "open with null trigger" state would crash the
  //   <Mention.Item> render path that uses trigger to format insertion text.
  it("phase=open implies trigger is non-null", () => {
    fc.assert(
      fc.property(fc.array(arbitraryAction, { maxLength: 50 }), (actions) => {
        const state = runSequence(actions);
        if (state.phase === "open") {
          return state.trigger !== null;
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });

  // Invariant: a closed popover has no transient state — no leftover query,
  //   no highlight, no items count. Guarantees that re-opening always
  //   starts from a clean slate.
  it("phase=closed implies query/highlight/itemCount are reset", () => {
    fc.assert(
      fc.property(fc.array(arbitraryAction, { maxLength: 50 }), (actions) => {
        const state = runSequence(actions);
        if (state.phase === "closed") {
          return (
            state.trigger === null &&
            state.query === "" &&
            state.highlightedIndex === -1 &&
            state.itemCount === 0
          );
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });

  // Invariant: highlightedIndex is always either -1 (nothing active) or a
  //   valid index into the current items list. Out-of-range indices would
  //   point `aria-activedescendant` at a non-existent option id and break
  //   the AT contract.
  it("highlightedIndex is in [-1, itemCount-1]", () => {
    fc.assert(
      fc.property(fc.array(arbitraryAction, { maxLength: 50 }), (actions) => {
        const state = runSequence(actions);
        if (state.itemCount === 0) {
          return state.highlightedIndex === -1;
        }
        return (
          state.highlightedIndex >= -1 &&
          state.highlightedIndex < state.itemCount
        );
      }),
      { numRuns: 200 },
    );
  });
});
