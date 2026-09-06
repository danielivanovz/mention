import { describe, expect, it } from "vitest";

import { findActiveMention } from "./find-active-mention.ts";

describe("findActiveMention", () => {
  // User need: a fresh `@` typed at the very start of an empty textarea
  //   must register as an active mention with empty query — the canonical
  //   "user just hit @" path, but expressed as state-derivation rather
  //   than as a transition.
  it("resolves a trigger at the start of input with empty query", () => {
    expect(findActiveMention("@", 1)).toEqual({ trigger: "@", query: "" });
  });

  // User need: caret placed after `@al` (mid-typing) reads as the in-progress
  //   query "al". This is the path the dispatcher uses when the popover
  //   was already open — no behavioral change vs INPUT.
  it("resolves a trigger preceded by whitespace with the in-progress query", () => {
    expect(findActiveMention("Hey @al", 7)).toEqual({
      trigger: "@",
      query: "al",
    });
  });

  // User need: the headline bug from spike 005. Pre-existing `Hey @ali`
  //   with caret moved between `@` and `a`; pressing any key must
  //   re-open the popover. The scan finds `@` before whitespace and
  //   returns the substring between `@` and the caret.
  it("resolves a trigger when the caret is inside an existing mention", () => {
    // value: "Hey @ali", caret at position 5 (between @ and a) → query empty
    expect(findActiveMention("Hey @ali", 5)).toEqual({
      trigger: "@",
      query: "",
    });
    // caret at position 6 (between a and l) → query "a"
    expect(findActiveMention("Hey @ali", 6)).toEqual({
      trigger: "@",
      query: "a",
    });
    // caret at position 7 (between l and i) → query "al"
    expect(findActiveMention("Hey @ali", 7)).toEqual({
      trigger: "@",
      query: "al",
    });
  });

  // User need: writing an email like `foo@bar.com` must not trigger the
  //   popover. The scan finds `@` but its left neighbor is "o" — fails
  //   isolation, returns null.
  // Anti-outcome: the email false-positive is the most common kill-shot
  //   for naive mention detectors (cited in
  //   .misc/spike/research/competitive-landscape.md as the failure mode
  //   that killed react-mentions' default config for many adopters).
  it("does not resolve a mid-word trigger (email pattern)", () => {
    expect(findActiveMention("ping foo@bar.com", 16)).toBeNull();
  });

  // User need: once the user types whitespace the mention is closed.
  //   Caret beyond a space after `@ali` must not re-open the popover.
  it("does not resolve when whitespace separates the trigger from the caret", () => {
    expect(findActiveMention("Hey @ali word", 13)).toBeNull();
  });

  // User need: text without any trigger char must produce null — the
  //   neutral path most keystrokes take.
  it("returns null for value without a trigger", () => {
    expect(findActiveMention("just plain text", 15)).toBeNull();
    expect(findActiveMention("", 0)).toBeNull();
  });

  // Edge case: caret at position 0 — there's nothing to the left to scan.
  it("returns null when caret is at position 0", () => {
    expect(findActiveMention("@hello", 0)).toBeNull();
  });

  // Edge case: text spanning newlines. `\n` is whitespace per /\s/, so a
  //   mention attempt on a previous line shouldn't pollute the next line.
  //   Also: `@` directly after a newline is a valid trigger position.
  it("treats newlines as whitespace boundaries", () => {
    // Mention on line 1 doesn't follow caret on line 2.
    expect(findActiveMention("Hey @ali\nword here", 18)).toBeNull();
    // `@` at start of line 2 IS a valid trigger.
    expect(findActiveMention("first line\n@bob", 15)).toEqual({
      trigger: "@",
      query: "bob",
    });
  });

  // M4 — Unicode word-boundary support.
  //
  // User need: CJK / Thai / Khmer text doesn't use whitespace between
  //   words, so a strict /\s/ rule means `@` after a hiragana/han
  //   character would never trigger. Recognise these scripts as soft
  //   word boundaries so users typing in those languages can mention
  //   without inserting a Latin space first.
  it("triggers when @ follows a CJK character (no Latin whitespace)", () => {
    // "こんにちは@田" with caret after `田` (position 7).
    expect(findActiveMention("こんにちは@田", 7)).toEqual({
      trigger: "@",
      query: "田",
    });
  });

  // U+3000 ideographic (fullwidth) space is matched by JS `/\s/` —
  //   verify the `@ali` after `田中　` triggers via the whitespace
  //   path, not the soft-boundary path.
  it("treats fullwidth (ideographic) space as whitespace", () => {
    expect(findActiveMention("田中　@ali", 7)).toEqual({
      trigger: "@",
      query: "ali",
    });
  });

  // Arabic (RTL Latin-derived script). Whitespace-segmented like Latin,
  //   so the existing /\s/ rule already handles it — this is a
  //   regression guard, not new behavior.
  it("triggers after Arabic text separated by whitespace", () => {
    // "مرحبا @علي" — caret after the last Arabic letter.
    expect(findActiveMention("مرحبا @علي", 10)).toEqual({
      trigger: "@",
      query: "علي",
    });
  });

  // Emoji ZWJ family clusters span multiple codepoints; the cluster
  //   boundary on either side is a regular space, so trigger detection
  //   is unaffected. Regression guard against future heuristics that
  //   might accidentally treat ZWJ as a non-whitespace boundary.
  it("triggers after a ZWJ-joined emoji cluster followed by whitespace", () => {
    // "👨‍👩‍👧 @ali" — emoji family cluster (8 code units), space,
    // then trigger. Caret at end of "@ali".
    const value = "👨‍👩‍👧 @ali";
    expect(findActiveMention(value, value.length)).toEqual({
      trigger: "@",
      query: "ali",
    });
  });

  // User need: the trigger character is configurable. `/` for slash
  //   commands, `#` for channels, `:` for emoji shortcodes — any single
  //   char. The same isolation rule applies (mid-word `/` in URLs like
  //   `/docs/api` doesn't trigger).
  it("supports a custom trigger character (e.g. '/')", () => {
    expect(findActiveMention("/cmd", 4, "/")).toEqual({
      trigger: "/",
      query: "cmd",
    });
    expect(findActiveMention("Hey /cmd", 8, "/")).toEqual({
      trigger: "/",
      query: "cmd",
    });
    // `@` no longer triggers when the configured trigger is `/`.
    expect(findActiveMention("@ali", 4, "/")).toBeNull();
    // Mid-word `/` (URL-like) is still suppressed by the isolation rule.
    expect(findActiveMention("/docs/api", 9, "/")).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────
  // Multi-trigger (C5 / v0.2 unlock)
  // ───────────────────────────────────────────────────────────────────

  // User need: one editor with both `@` for users and `#` for channels.
  //   Whichever trigger fires defines the active channel; the resolver
  //   reports it back in `trigger` so the dispatcher can route.
  it("resolves either trigger when configured with multiple", () => {
    expect(findActiveMention("Hey @ali", 8, ["@", "#"])).toEqual({
      trigger: "@",
      query: "ali",
    });
    expect(findActiveMention("see #gen", 8, ["@", "#"])).toEqual({
      trigger: "#",
      query: "gen",
    });
  });

  // User need: typing `@user #ch` with caret at end should resolve the
  //   `#` channel, not pollute it with the older `@`. The backwards scan
  //   is "first match wins" — closest to caret takes priority.
  it("first match wins — closest trigger to caret resolves", () => {
    expect(findActiveMention("Hey @user #ch", 13, ["@", "#"])).toEqual({
      trigger: "#",
      query: "ch",
    });
    // And the other way around — `#` before `@` near caret.
    expect(findActiveMention("see #ch @us", 11, ["@", "#"])).toEqual({
      trigger: "@",
      query: "us",
    });
  });

  // Edge case: triggers adjacent to each other — `@#foo` is nonsensical
  //   input. Scan hits `#` at index 1; its left neighbor is `@`, which
  //   is neither whitespace nor a soft script boundary, so isolation
  //   fails and we return null. (The `@` is never reached because
  //   `#` matched first and the mid-word path bails immediately.)
  it("adjacent triggers fail isolation (mid-word check)", () => {
    expect(findActiveMention("@#foo", 5, ["@", "#"])).toBeNull();
  });

  // Empty triggers array is a degenerate config — we don't throw,
  //   just always return null. Keeps the dispatcher resilient if a
  //   consumer passes `Object.keys({})` or similar.
  it("returns null when triggers list is empty", () => {
    expect(findActiveMention("@hello", 6, [])).toBeNull();
  });

  // Single-element array is equivalent to passing the string. Lets the
  //   useMentionCore call site uniformly use the array form without
  //   special-casing.
  it("single-element array behaves like the bare-string form", () => {
    expect(findActiveMention("Hey @al", 7, ["@"])).toEqual({
      trigger: "@",
      query: "al",
    });
    // `#` not in the configured triggers → not detected.
    expect(findActiveMention("Hey #al", 7, ["@"])).toBeNull();
  });

  // Mid-word isolation rule applies per-trigger. Email `foo@bar.com`
  //   must not trigger even when `@` is one of several configured
  //   triggers.
  it("mid-word isolation rule applies to all triggers", () => {
    expect(findActiveMention("ping foo@bar.com", 16, ["@", "#"])).toBeNull();
  });

  // Known limitation: Han + @ + Latin (e.g. `用户@example`) cannot be
  //   distinguished from the intended CJK trigger case `こんにちは@田中`
  //   at this layer — Intl.Segmenter produces identical segment patterns
  //   for both. We bias toward triggering (CJK users still get the
  //   feature; the rare Han+@+Latin email-like patterns prompt the
  //   popover, which the user dismisses with Escape). Documented
  //   limitation, captured here as a regression guard so the behavior
  //   doesn't silently change.
  it("(known limitation) triggers after Han characters even mid-string", () => {
    // "用户@" — Han char + @ + caret. We accept the trigger; users
    // press Escape if it wasn't intended.
    expect(findActiveMention("用户@", 3)).toEqual({
      trigger: "@",
      query: "",
    });
  });
});

it("recognizes a supplementary Han character before a trigger", () => {
  expect(findActiveMention("𠀀@a", 4)).toEqual({ trigger: "@", query: "a" });
});
it("rejects caret offsets outside the supplied text", () => {
  for (const caret of [-1, 0.5, 3, Infinity, NaN])
    expect(findActiveMention("@a", caret)).toBeNull();
});
