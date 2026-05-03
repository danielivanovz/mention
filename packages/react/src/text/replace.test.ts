// @vitest-environment happy-dom
//
// Pure-text assertions don't need a DOM, but `commitMentionToTextarea`
// asserts against a real `<textarea>` element + bubbling `input` event,
// so the whole file runs under happy-dom. Cost is ~250 ms env setup —
// acceptable for a file with one DOM test alongside pure-text unit
// tests; the property-based fuzz lives in a sibling node-env file
// (`replace.props.test.ts`) so the watch loop stays fast.

import { describe, expect, it } from "vitest";

import { applyMentionInsert, commitMentionToTextarea } from "./replace.ts";

describe("applyMentionInsert", () => {
  it("user picks a suggestion mid-message — textarea reflects the choice with caret ready for the next word", () => {
    // Use case: the canonical commit path. User typed `Hey @al`,
    //   pressed Enter on Alice; the textarea must show `Hey @Alice `
    //   with the caret one past the trailing space so they can keep
    //   typing without re-positioning.
    // Anti-outcome: the helper produces text that requires the
    //   consumer to add a space (every consumer would forget) or that
    //   leaves the caret inside the inserted token (next keystroke
    //   fuses onto the mention).
    expect(
      applyMentionInsert({
        value: "Hey @al",
        selectionStart: 7,
        triggerOffset: 4,
        insertText: "@Alice",
      }),
    ).toEqual({ value: "Hey @Alice ", caret: 11 });
  });

  it("user picks a suggestion typed at the very start of an empty textarea", () => {
    // Use case: triggerOffset is zero — `before` is empty. Without
    //   this guard the caret math could underflow or the prefix slice
    //   could swallow the trigger.
    // Anti-outcome: a regression where "typing @ first thing in an
    //   empty box" silently drops the inserted text or mis-aligns
    //   the caret. A common kill-shot for splice helpers.
    expect(
      applyMentionInsert({
        value: "@al",
        selectionStart: 3,
        triggerOffset: 0,
        insertText: "@Alice",
      }),
    ).toEqual({ value: "@Alice ", caret: 7 });
  });

  it("text after the caret is preserved verbatim when the user commits", () => {
    // Use case: cursor-into-existing-mention from ADR-0003 / Spike 005.
    //   The user moved the caret into a half-typed mention surrounded
    //   by other words and picked a suggestion. The trailing words
    //   `rest` must survive the commit unchanged.
    // Anti-outcome: the helper accidentally swallows or mangles
    //   text past the caret — silently destroying user content.
    expect(
      applyMentionInsert({
        value: "Hey @al rest",
        selectionStart: 7,
        triggerOffset: 4,
        insertText: "@Alice",
      }),
    ).toEqual({ value: "Hey @Alice  rest", caret: 11 });
  });

  it("consumer's pre-spaced insertText keeps its own whitespace — we still add exactly one space", () => {
    // Use case: a consumer's `getInsertText` returns `"@Alice "`
    //   (already trailing-spaced). The contract is "always one
    //   trailing space, regardless of insertText" — so the result is
    //   `@Alice  ` (two spaces total) and the caret lands past both.
    // Anti-outcome: the original Spike 001 bug — the helper
    //   conditionally appended a space only when insertText didn't
    //   already end in one, which produced inconsistent caret math
    //   for consumers who rolled their own getInsertText. The
    //   "always exactly one" rule eliminates that branch.
    // Historical thread: documented in ADR-0001's implementation
    //   outline as "the double-space fix from Spike 001". This test
    //   is the regression guard that brings the rule out of tribal
    //   knowledge into the test surface.
    const result = applyMentionInsert({
      value: "@al",
      selectionStart: 3,
      triggerOffset: 0,
      insertText: "@Alice ",
    });
    expect(result.value).toBe("@Alice  ");
    expect(result.caret).toBe(8);
  });

  it("cursor-into-existing-mention commits only the typed-so-far prefix — tail of the mention is preserved", () => {
    // Use case: ADR-0003's headline scenario. `Hey @ali`, caret at
    //   position 6 (between `a` and `l`). The user picks Alice; the
    //   replacement must span exactly `[triggerOffset, selectionStart)
    //   = [4, 6) = "@a"` — leaving `li` intact so the user can decide
    //   whether to keep it or delete it.
    // Anti-outcome: the helper greedily extends the replacement past
    //   the caret to the next whitespace, deleting `li` — the kind of
    //   "helpful" auto-completion that destroys user intent.
    expect(
      applyMentionInsert({
        value: "Hey @ali",
        selectionStart: 6,
        triggerOffset: 4,
        insertText: "@Alice",
      }),
    ).toEqual({ value: "Hey @Alice li", caret: 11 });
  });

  it("user commits with empty query — caret was right after the @", () => {
    // Use case: user typed `@`, the popover opened with the full
    //   roster, they pressed Enter on the first option. selectionStart
    //   equals triggerOffset+1; the replacement spans exactly the
    //   trigger character.
    // Anti-outcome: an off-by-one where the trigger char survives
    //   into the result (`@@Alice `) or where the empty-query path
    //   crashes a length calculation.
    expect(
      applyMentionInsert({
        value: "@",
        selectionStart: 1,
        triggerOffset: 0,
        insertText: "@Alice",
      }),
    ).toEqual({ value: "@Alice ", caret: 7 });
  });
});

describe("commitMentionToTextarea", () => {
  it("React-controlled textarea sees the value change and the caret lands at the inserted position", () => {
    // Use case: the helper performs the React-friendly DOM mutation
    //   so a controlled `<textarea value={...}>` consumer sees their
    //   `onChange` fire with the new value, and a focus-following
    //   editor (e.g. autoresize-textarea) sees the caret at the
    //   intended position.
    // Anti-outcome: assigning `textarea.value = next` directly skips
    //   React's value tracker — the resulting `input` event would
    //   carry stale `target.value` and React's onChange would never
    //   fire, breaking every controlled-form consumer. Using the
    //   prototype's native setter is the only reliable path; this
    //   test guards against any "simplification" that drops it.
    // Historical thread: the native-setter pattern is documented in
    //   React's own test utilities; we adopted it here so that a
    //   programmatic mention commit is indistinguishable from user
    //   keystrokes from the consumer's perspective.
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.value = "Hey @al";
    textarea.setSelectionRange(7, 7);

    let inputFiredWithBubbling = false;
    textarea.addEventListener("input", (event) => {
      inputFiredWithBubbling = event.bubbles;
    });

    commitMentionToTextarea(textarea, { value: "Hey @Alice ", caret: 11 });

    expect(textarea.value).toBe("Hey @Alice ");
    expect(textarea.selectionStart).toBe(11);
    expect(textarea.selectionEnd).toBe(11);
    expect(inputFiredWithBubbling).toBe(true);

    document.body.removeChild(textarea);
  });
});
