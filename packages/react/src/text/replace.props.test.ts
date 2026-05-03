import * as fc from "fast-check";
import { describe, it } from "vitest";

import { findActiveMention } from "../state/find-active-mention.ts";
import { applyMentionInsert } from "./replace.ts";

// Property-based fuzz over arbitrary commit inputs. The symmetric
// pairing of the two text-math helpers — `findActiveMention` on the
// read side, `applyMentionInsert` on the write side — admits invariants
// that pin down behavior across all inputs, not just the cases someone
// thought to enumerate. Mirrors the discipline already in place for
// `popover-reducer.props.test.ts`.

const TRIGGER = "@";

// A "boundary char" is anything that satisfies `findActiveMention`'s
// isolation rule for what sits to the left of the trigger: whitespace
// (start of input is also fine — represented by an empty prefix). We
// keep generation conservative — any ASCII whitespace works, and we
// avoid Unicode soft-boundary chars (CJK / Thai) so the property is
// only stating the strictest case.
const arbitraryPrefix: fc.Arbitrary<string> = fc.oneof(
  fc.constant(""),
  fc
    .tuple(
      fc
        .string({ minLength: 0, maxLength: 8 })
        .filter((s) => !s.includes(TRIGGER)),
      fc.constantFrom(" ", "\n", "\t"),
    )
    .map(([head, sep]) => `${head}${sep}`),
);

// A query is any sequence of non-whitespace, non-trigger characters.
// Non-trigger because a second `@` would fork the active-mention scan;
// non-whitespace because a space ends the active mention upstream.
const arbitraryQuery: fc.Arbitrary<string> = fc
  .string({ minLength: 0, maxLength: 12 })
  .filter((s) => !/\s/.test(s) && !s.includes(TRIGGER));

// The suffix can be anything — including text that itself contains an
// `@`. Whatever the consumer's wider message looks like, the helper
// must preserve it verbatim past the caret.
const arbitrarySuffix: fc.Arbitrary<string> = fc.string({
  minLength: 0,
  maxLength: 16,
});

// `insertText` typically starts with the trigger char (the default
// formatter is `${trigger}${label}`), but a consumer's `getInsertText`
// may return any non-empty string. We assert the contract holds for
// arbitrary content as long as it's non-empty — empty insertText is a
// degenerate case we don't promise to handle (and it would render the
// commit a no-op, which is its own bug at the consumer layer).
const arbitraryInsertText: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 16 })
  .filter((s) => !/\n/.test(s));

describe("applyMentionInsert — invariants over arbitrary commits", () => {
  it("after commit, the caret is no longer inside an active mention", () => {
    // Use case: the entire point of committing — the user's caret
    //   leaves the active-mention region so the popover dismisses
    //   and the next keystroke is a fresh non-trigger input.
    // Anti-outcome: a regression where a malformed insertText (e.g.
    //   one that itself contains the trigger char without a leading
    //   space) leaves the caret inside a *new* active mention,
    //   making the popover stick around forever after a commit.
    // Historical thread: this is the round-trip property that pairs
    //   `findActiveMention` (state/) with `applyMentionInsert` (text/).
    //   They are designed as symmetric read / write sides of the same
    //   text math; this property pins the symmetry.
    fc.assert(
      fc.property(
        arbitraryPrefix,
        arbitraryQuery,
        arbitrarySuffix,
        arbitraryInsertText,
        (prefix, query, suffix, insertText) => {
          const value = `${prefix}${TRIGGER}${query}${suffix}`;
          const triggerOffset = prefix.length;
          const selectionStart = prefix.length + TRIGGER.length + query.length;

          // Sanity precondition — the generated input must itself
          // expose an active mention; if not, the property is
          // vacuous on this input. (Catches generation bugs early.)
          const before = findActiveMention(value, selectionStart);
          if (before === null) return true;

          const result = applyMentionInsert({
            value,
            selectionStart,
            triggerOffset,
            insertText,
          });

          return findActiveMention(result.value, result.caret) === null;
        },
      ),
      { numRuns: 200 },
    );
  });

  it("text before the trigger and text after the caret are preserved verbatim", () => {
    // Use case: the consumer's wider message must survive the
    //   commit untouched. The user typed a paragraph; only the
    //   active-mention substring should change.
    // Anti-outcome: a regression where the helper accidentally
    //   alters whitespace, mangles unicode, or off-by-ones the
    //   slice boundaries — silently corrupting message content.
    fc.assert(
      fc.property(
        arbitraryPrefix,
        arbitraryQuery,
        arbitrarySuffix,
        arbitraryInsertText,
        (prefix, query, suffix, insertText) => {
          const value = `${prefix}${TRIGGER}${query}${suffix}`;
          const selectionStart = prefix.length + TRIGGER.length + query.length;

          const result = applyMentionInsert({
            value,
            selectionStart,
            triggerOffset: prefix.length,
            insertText,
          });

          // Prefix is preserved exactly.
          if (!result.value.startsWith(prefix)) return false;
          // Suffix is preserved exactly (after the inserted token + space).
          if (!result.value.endsWith(suffix)) return false;
          // The middle is `${insertText} ` (one trailing space, always).
          const middle = result.value.slice(
            prefix.length,
            result.value.length - suffix.length,
          );
          return middle === `${insertText} `;
        },
      ),
      { numRuns: 200 },
    );
  });

  it("caret lands one past the trailing space — `triggerOffset + insertText.length + 1`", () => {
    // Use case: the contract on caret placement — the next keystroke
    //   the user types must land outside the inserted token, with no
    //   space-bar required. The "+1" is the always-appended trailing
    //   space.
    // Anti-outcome: the caret lands inside the inserted text, fusing
    //   the user's next keystroke onto the mention; or it lands two
    //   past, requiring a backspace before continuing.
    fc.assert(
      fc.property(
        arbitraryPrefix,
        arbitraryQuery,
        arbitrarySuffix,
        arbitraryInsertText,
        (prefix, query, suffix, insertText) => {
          const value = `${prefix}${TRIGGER}${query}${suffix}`;
          const selectionStart = prefix.length + TRIGGER.length + query.length;

          const result = applyMentionInsert({
            value,
            selectionStart,
            triggerOffset: prefix.length,
            insertText,
          });

          return result.caret === prefix.length + insertText.length + 1;
        },
      ),
      { numRuns: 200 },
    );
  });
});
