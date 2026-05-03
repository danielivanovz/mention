// Browser-mode tests for `getCaretCoordinates`. The happy-dom suite in
// `caret.test.ts` covers the *structural* contract (cleanup, error
// shape) but cannot validate pixel correctness because happy-dom skips
// layout. These tests run in real chromium under `@vitest/browser` so
// `offsetTop`/`offsetLeft` and `getComputedStyle` return real numbers.
//
// **Why this file exists:** I9 mutation testing capped caret at 26.67%
// because pixel-math mutants (borderTopWidth + → -, offsetTop swapped
// with offsetLeft, parseInt of the wrong border edge) are unobservable
// under happy-dom — every layout read is 0, so `0 + 0` and `0 - 0`
// produce identical output. Real layout makes those mutants visible.
//
// **Test design.** The pixel arithmetic in `caret.ts` only adds
// `border{Top,Left}Width` to `span.offset{Top,Left}`. To kill mutations
// of those exact additions, we need assertions that depend on the
// border value with no slack on the sign — i.e., we anchor on absolute
// pixel ranges where a `+ → -` flip moves the result by `2 *
// borderWidth` and out of the asserted range. Setting border-top: 4px
// with offset 0 means correct = `~0 + 4 = 4`, mutant = `0 - 4 = -4`.
// We then assert `top ∈ [3, 5]` so the mutant fails.
//
// Equivalent-mutant ceiling: chromium-only testing can't kill mutations
// inside the Firefox-detection branch (`isFirefox()` returns false; the
// branch's body is dead code in this run) or mutations to the SSR
// guard (`typeof document === "undefined"` is always false in a
// browser). Those are documented in the run summary, not patched
// around — running each mutant under both browsers and SSR would
// triple CI cost for a couple of percentage points.

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getCaretCoordinates } from "./caret.ts";

afterEach(() => {
  document.body.innerHTML = "";
});

/**
 * Build a textarea with deterministic font metrics + known border /
 * padding values. The caret math sums `span.offsetLeft +
 * borderLeftWidth` (offsetLeft is measured against the textarea's
 * border-edge, so the result is the pixel column relative to the
 * textarea origin); a 4px border + 8px padding gives correct[0] = 12px,
 * mutant `+ → -` gives 4px (8 - 4). With slack window [10, 14] we kill
 * the mutant cleanly.
 */
const BORDER = 4;
const PADDING = 8;
const LINE_HEIGHT = 20;

function makeTextarea(value: string): HTMLTextAreaElement {
  const textarea = document.createElement("textarea");
  textarea.style.cssText = [
    "font-family: monospace",
    "font-size: 16px",
    `line-height: ${LINE_HEIGHT}px`,
    `padding: ${PADDING}px`,
    `border: ${BORDER}px solid black`,
    "box-sizing: border-box",
    "width: 600px",
    "height: 200px",
    "margin: 0",
    "resize: none",
    "white-space: pre-wrap",
    "word-wrap: break-word",
  ].join("; ");
  textarea.value = value;
  document.body.appendChild(textarea);
  return textarea;
}

describe("getCaretCoordinates — browser pixel correctness", () => {
  let initialDivs = 0;

  beforeEach(() => {
    initialDivs = document.querySelectorAll("div").length;
  });

  it("`top` at offset 0 equals padding-top + border-top-width within ±2px", () => {
    // span.offsetTop is measured from the mirror div's border edge,
    // which means it equals the mirror's padding-top (8) for a span
    // at the top of content. The implementation then adds the
    // textarea's borderTopWidth (4) to translate into textarea-box
    // coordinates: total = 8 + 4 = 12. Window [10, 14].
    // Mutant `+ → -`: 8 - 4 = 4. Outside window. Killed.
    const textarea = makeTextarea("hello");
    const result = getCaretCoordinates(textarea, 0);

    const expected = PADDING + BORDER;
    expect(result.top).toBeGreaterThanOrEqual(expected - 2);
    expect(result.top).toBeLessThanOrEqual(expected + 2);
  });

  it("`left` at offset 0 equals border-left + padding-left within ±2px", () => {
    // span.offsetLeft = padding-left (8) + borderLeftWidth (4) = 12.
    // Wait — span.offsetLeft is measured from the textarea's
    // border-edge, so it already equals padding-left. The
    // implementation adds borderLeftWidth on top, which is what makes
    // the result coordinate-system match Floating UI's expectation
    // (caret position relative to the element box). Correct = 12,
    // mutant `+ → -` = 8 - 4 = 4. Window [10, 14] kills the mutant.
    const textarea = makeTextarea("hello");
    const result = getCaretCoordinates(textarea, 0);

    const expected = BORDER + PADDING;
    expect(result.left).toBeGreaterThanOrEqual(expected - 2);
    expect(result.left).toBeLessThanOrEqual(expected + 2);
  });

  it("asymmetric border: `top` uses border-top, not border-left", () => {
    // borderTop=2, borderLeft=20, padding=8. Correct top = 8 + 2 = 10;
    // mutant that accidentally reads borderLeftWidth gives 8 + 20 = 28.
    // Window [8, 12] catches the swap.
    const textarea = makeTextarea("x");
    textarea.style.borderTopWidth = "2px";
    textarea.style.borderLeftWidth = "20px";

    const result = getCaretCoordinates(textarea, 0);

    expect(result.top).toBeGreaterThanOrEqual(8);
    expect(result.top).toBeLessThanOrEqual(12);
  });

  it("asymmetric border: `left` uses border-left, not border-top", () => {
    // borderTop=2, borderLeft=20. padding-left=8. Correct left ≈
    // 8 + 20 = 28; mutant that reads borderTopWidth gives 8 + 2 = 10.
    // Window [25, 31] catches the swap.
    const textarea = makeTextarea("x");
    textarea.style.borderTopWidth = "2px";
    textarea.style.borderLeftWidth = "20px";

    const result = getCaretCoordinates(textarea, 0);

    expect(result.left).toBeGreaterThanOrEqual(25);
    expect(result.left).toBeLessThanOrEqual(31);
  });

  it("`left` advances strictly with offset within a single line", () => {
    const textarea = makeTextarea("hello world");
    const at0 = getCaretCoordinates(textarea, 0);
    const at5 = getCaretCoordinates(textarea, 5);
    const at11 = getCaretCoordinates(textarea, 11);

    expect(at5.left).toBeGreaterThan(at0.left);
    expect(at11.left).toBeGreaterThan(at5.left);
  });

  it("`top` stays constant across a single non-wrapping line", () => {
    const textarea = makeTextarea("hello world");
    const at0 = getCaretCoordinates(textarea, 0);
    const at5 = getCaretCoordinates(textarea, 5);

    expect(at5.top).toBe(at0.top);
  });

  it("`top` advances by line-height across an explicit newline", () => {
    const textarea = makeTextarea("line one\nline two");
    const beforeNewline = getCaretCoordinates(textarea, 0);
    const afterNewline = getCaretCoordinates(textarea, 9);

    const delta = afterNewline.top - beforeNewline.top;
    expect(delta).toBeGreaterThanOrEqual(LINE_HEIGHT - 2);
    expect(delta).toBeLessThanOrEqual(LINE_HEIGHT + 2);
  });

  it("`height` matches computed line-height within ±1px", () => {
    const textarea = makeTextarea("hi");
    const result = getCaretCoordinates(textarea, 1);

    expect(result.height).toBeGreaterThanOrEqual(LINE_HEIGHT - 1);
    expect(result.height).toBeLessThanOrEqual(LINE_HEIGHT + 1);
  });

  it("`left` advances by ~character-width per ASCII column", () => {
    const textarea = makeTextarea("aaaaa");
    const at0 = getCaretCoordinates(textarea, 0);
    const at1 = getCaretCoordinates(textarea, 1);
    const at5 = getCaretCoordinates(textarea, 5);

    const oneCharWidth = at1.left - at0.left;
    const fiveCharWidth = at5.left - at0.left;

    expect(oneCharWidth).toBeGreaterThan(0);
    expect(Math.abs(fiveCharWidth - 5 * oneCharWidth)).toBeLessThanOrEqual(2);
  });

  it("offset = value.length lands at the end of the rendered text", () => {
    // Critical for killing the `|| "."` fallback mutation. With
    // `|| ""`, the span has empty content and may collapse to width 0,
    // so the trailing-position result aliases offset 0. Our assertion
    // that end-of-text is strictly to the right of start-of-text fails
    // on the mutant.
    const textarea = makeTextarea("abc");
    const atStart = getCaretCoordinates(textarea, 0);
    const atEnd = getCaretCoordinates(textarea, 3);

    expect(atEnd.left).toBeGreaterThan(atStart.left);
    expect(atEnd.top).toBe(atStart.top);
  });

  it("offset > value.length: position behaves like end-of-text", () => {
    // The defensive case — substring(999) returns "" so the same
    // `|| "."` fallback runs. Pinned separately so it shows up as a
    // distinct kill.
    const textarea = makeTextarea("ab");
    const atOver = getCaretCoordinates(textarea, 999);
    const atStart = getCaretCoordinates(textarea, 0);

    expect(atOver.left).toBeGreaterThan(atStart.left);
  });

  it("two textareas with different border widths: top reflects the delta", () => {
    const a = makeTextarea("x");
    const b = makeTextarea("x");
    b.style.borderTopWidth = "20px";

    const aTop = getCaretCoordinates(a, 0).top;
    const bTop = getCaretCoordinates(b, 0).top;

    // a has border-top 4, b has border-top 20 → delta ≈ 16.
    expect(bTop - aTop).toBeGreaterThanOrEqual(13);
    expect(bTop - aTop).toBeLessThanOrEqual(19);
  });

  it("at offset = value.length on a multi-line value, `top` lands on the last line", () => {
    // Kills mutants that strip or replace the `value.substring(position)
    // || "."` expression: e.g. `... || ""` (empty span collapses, top
    // wrong), `value || "."` (full value gets re-injected and the span
    // wraps onto a third line), and `true` / `false` literals (span
    // text becomes "true"/"false" but its position remains correct —
    // these are killed instead by the precise-line check on the
    // top delta below: the wrong-content mutants don't move it the
    // right amount).
    const textarea = makeTextarea("line1\nline2");
    const at0 = getCaretCoordinates(textarea, 0);
    const atEnd = getCaretCoordinates(textarea, "line1\nline2".length);

    // Position end-of-line2 sits exactly one line below line1.
    const delta = atEnd.top - at0.top;
    expect(delta).toBeGreaterThanOrEqual(LINE_HEIGHT - 2);
    expect(delta).toBeLessThanOrEqual(LINE_HEIGHT + 2);
  });

  it("`white-space: pre-wrap` on the mirror is required for newline rendering", () => {
    // If the mirror loses `pre-wrap` (e.g. style.whiteSpace = "" mutant),
    // `\n` collapses to a space and the second-line caret aliases the
    // first line. The `top` delta on a newline collapses below 1 line
    // height, killing the mutant.
    const textarea = makeTextarea("a\nb");
    const at0 = getCaretCoordinates(textarea, 0);
    const at2 = getCaretCoordinates(textarea, 2);

    expect(at2.top - at0.top).toBeGreaterThanOrEqual(LINE_HEIGHT - 2);
  });

  it("removes the mirror div on success — kills cleanup-block mutations", () => {
    // The `finally { document.body.removeChild(div) }` is testable
    // even in the success path — the count of <div>s should return to
    // baseline. Killing this kills mutants that strip the finally body.
    const textarea = makeTextarea("hello");
    getCaretCoordinates(textarea, 3);
    expect(document.querySelectorAll("div").length).toBe(initialDivs);
  });

  // M5 — RTL pixel correctness.
  //
  // In an RTL textarea, character offset 0 is at the visual right edge.
  // For Hebrew/Arabic content the trailing span (which represents the
  // caret position) renders to the visual *left* of the prefix, so its
  // right edge is what aligns with the caret. We assert the caret at
  // start-of-content lands in the right half of the textarea — a
  // generous-but-decisive bound that catches a regression flipping the
  // sign while tolerating browser rendering nuances.
  it("RTL: caret at offset 0 sits in the right half of the textarea", () => {
    const textarea = makeTextarea("שלום עולם");
    textarea.dir = "rtl";
    const halfWidth = textarea.clientWidth / 2;

    const result = getCaretCoordinates(textarea, 0);

    // RTL start-of-content is on the right; caret-x should be > half.
    expect(result.left).toBeGreaterThan(halfWidth);
  });

  // LTR baseline for diff comparison — same string would land in the
  //   *left* half of the textarea under the default direction.
  it("LTR baseline: caret at offset 0 sits in the left half of the textarea", () => {
    const textarea = makeTextarea("hello world");
    const halfWidth = textarea.clientWidth / 2;

    const result = getCaretCoordinates(textarea, 0);

    expect(result.left).toBeLessThan(halfWidth);
  });

  // M7 — RTL end-of-content pixel correctness.
  //
  // Symmetric to the offset-0 RTL test: at end-of-content in an RTL
  // paragraph, the caret should land at the visual *left* of the last
  // character (the position one character past the leftmost rendered
  // glyph). The pre-M7 implementation used "." as the fallback for the
  // empty trailing span; that's a UBA-neutral character (bidi class CS)
  // which chromium repositions based on bidi-run-resolution at end of
  // an RTL paragraph, drifting the caret position by the period's own
  // offset width. M7 swapped the fallback to a strong-RTL character
  // (Hebrew Alef U+05D0, class R) so the trailing span sits in the
  // RTL run unambiguously.
  //
  // **Test design** — assert via the relative-position invariant
  // (`atEnd.left < at0.left` minus a meaningful gap) rather than an
  // absolute-pixel window. Hebrew character widths in monospace fonts
  // vary enough between fontconfig backends that any absolute window
  // tight enough to be meaningful would be flaky across runners. The
  // invariant is what M7 actually establishes: in RTL flow, advancing
  // through positions 0 → length moves the caret leftward, period.
  it("dir=rtl: end-of-content caret sits strictly left of offset-0 caret", () => {
    const value = "שלום עולם";
    const textarea = makeTextarea(value);
    textarea.dir = "rtl";

    const at0 = getCaretCoordinates(textarea, 0);
    const atEnd = getCaretCoordinates(textarea, value.length);

    // Gap must be at least one character-width — pre-fix the period
    // could drift to within sub-pixel of offset-0, defeating the M7
    // contract. The 9-char Hebrew string spans many character widths.
    const oneCharWidth = (at0.left - atEnd.left) / value.length;
    expect(oneCharWidth).toBeGreaterThan(2);
    expect(atEnd.left).toBeLessThan(at0.left - 8);
  });

  it("dir=auto with RTL content: end-of-content caret sits strictly left of offset-0", () => {
    // dir="auto" resolves direction from the first strong character in
    // the content. A textarea starting with Hebrew resolves to RTL, and
    // the M7 fix must trigger on `getComputedStyle(...).direction`,
    // not on `textarea.dir`. This pins both the resolution path and
    // the same end-of-content invariant as the explicit-dir test.
    const value = "שלום עולם";
    const textarea = makeTextarea(value);
    textarea.dir = "auto";

    // Sanity: dir=auto did resolve to rtl.
    expect(window.getComputedStyle(textarea).direction).toBe("rtl");

    const at0 = getCaretCoordinates(textarea, 0);
    const atEnd = getCaretCoordinates(textarea, value.length);

    expect(atEnd.left).toBeLessThan(at0.left - 8);
  });

  it("removes the mirror div even when getComputedStyle throws — kills try/finally drops", () => {
    const textarea = makeTextarea("hi");
    const original = window.getComputedStyle;
    window.getComputedStyle = ((el: Element) => {
      const real = original(el);
      return new Proxy(real, {
        get(target, prop) {
          if (prop === "borderTopWidth") {
            throw new Error("synthetic-failure");
          }
          return Reflect.get(target, prop);
        },
      });
    }) as typeof window.getComputedStyle;

    try {
      expect(() => getCaretCoordinates(textarea, 1)).toThrow(
        "synthetic-failure",
      );
      expect(document.querySelectorAll("div").length).toBe(initialDivs);
    } finally {
      window.getComputedStyle = original;
    }
  });
});
