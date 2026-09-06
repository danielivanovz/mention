/**
 * `getCaretCoordinates(textarea, position)` — pixel coordinates of the caret
 * at character offset `position` inside `textarea`, in textarea-local
 * coordinates (top-left of the textarea content box).
 *
 * **Algorithm — the "mirror div" technique.** A `<textarea>` doesn't expose
 * its internal layout. To know where character N renders in pixels, we
 * build an off-screen `<div>` whose computed style matches the textarea
 * exactly, fill it with the textarea's text up to `position`, append a
 * `<span>` for the rest, and read `span.offsetTop` / `span.offsetLeft`.
 * The browser's wrapping algorithm runs on the mirror div the same way it
 * runs on the textarea, so the span lands where the caret would.
 *
 * **Provenance.** Ported from `component/textarea-caret-position` v3.1.0
 * (MIT — Dan Dascalescu, Jonathan Ong), narrowed to `<textarea>` only
 * (the original also handled `<input>`). Rich editors provide their own
 * selection measurements through the editor adapter.
 *
 * **Known limits.**
 *   - Layout-engine dependent: requires a real browser. happy-dom returns
 *     `offsetTop = 0` for everything because it has no layout engine —
 *     unit tests can only assert the structural contract; visual
 *     correctness is covered by the e2e suite on real browsers.
 *   - RTL: `unicode-bidi` is copied onto the mirror so its bidi
 *     resolution matches the textarea, and the `left` calculation is
 *     direction-aware. In RTL flow the trailing `<span>` ends up at the
 *     visual *left* of the prefix, so the caret's textarea-local x
 *     equals `span.offsetLeft + span.offsetWidth`.
 *
 * @see https://github.com/component/textarea-caret-position
 */

export interface CaretCoordinates {
  /** Pixel offset from the top of the textarea content box. */
  readonly top: number;
  /** Pixel offset from the left of the textarea content box. */
  readonly left: number;
  /** The line height in pixels — useful for sizing the caret rect. */
  readonly height: number;
}

// CSS properties that affect text layout. The mirror div copies every one
// of these from the textarea's computed style. Some browsers (Firefox)
// don't concatenate shorthand properties so we list each long-hand.
const COPIED_STYLE_PROPS = [
  "direction",
  "unicodeBidi",
  "boxSizing",
  "width",
  "height",
  "overflowX",
  "overflowY",

  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",

  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",

  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",

  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",

  "letterSpacing",
  "wordSpacing",

  "tabSize",
  "MozTabSize",
] as const;

/** Firefox lies about overflow on textareas — see Bugzilla #984275. */
function isFirefox(): boolean {
  return (
    typeof window !== "undefined" &&
    (window as unknown as { mozInnerScreenX?: number }).mozInnerScreenX !==
      undefined
  );
}

export function getCaretCoordinates(
  textarea: HTMLTextAreaElement,
  position: number,
): CaretCoordinates {
  if (typeof document === "undefined") {
    throw new Error(
      "getCaretCoordinates must be called in a browser environment",
    );
  }

  const div = document.createElement("div");
  document.body.appendChild(div);

  try {
    const style = div.style;
    const computed = window.getComputedStyle(textarea);

    style.whiteSpace = "pre-wrap";
    style.wordWrap = "break-word";
    style.position = "absolute";
    style.visibility = "hidden";

    for (const prop of COPIED_STYLE_PROPS) {
      // Indexed write into CSSStyleDeclaration — TS can't see the dynamic
      // mapping, so we cast through `Record<string, string>`.
      (style as unknown as Record<string, string>)[prop] = computed[
        prop as keyof CSSStyleDeclaration
      ] as string;
    }

    if (isFirefox()) {
      const computedHeight = parseInt(computed.height, 10);
      if (textarea.scrollHeight > computedHeight) {
        style.overflowY = "scroll";
      }
    } else {
      // Non-Firefox: hide the mirror's scrollbar so wrap math matches.
      style.overflow = "hidden";
    }

    div.textContent = textarea.value.substring(0, position);

    // Computed direction inherits from `dir="rtl"` on the textarea or
    // any ancestor, plus explicit `direction: rtl`. Resolved before the
    // span fallback because the fallback character must match the
    // paragraph's strong-directional class — see comment below.
    const isRTL = computed.direction === "rtl";

    const span = document.createElement("span");
    // Wrapping must be replicated exactly — copy the entire remainder so
    // a long word wrapping just before `position` lands on the right
    // line. Empty span doesn't render, so fall back to a single
    // character. UBA rule: a neutral character ("." has bidi class CS)
    // at the end of an RTL paragraph takes its direction from chromium's
    // run-resolution, drifting the caret by the period's offset width
    // A strong-directional fallback (Hebrew Alef U+05D0, class R)
    // anchors the span in the RTL run unambiguously. LRM/RLM would also
    // satisfy UBA but are zero-width and would collapse the span,
    // defeating the fallback's purpose of giving it layout dimensions.
    const fallback = isRTL ? "א" : ".";
    span.textContent = textarea.value.substring(position) || fallback;
    div.appendChild(span);

    // RTL: the trailing span renders to the visual left of the prefix
    // (RTL inline flow places later siblings further leftward), so the
    // caret's textarea-local x equals the span's right edge, not its
    // left edge.
    const spanLeftLocal = isRTL
      ? span.offsetLeft + span.offsetWidth
      : span.offsetLeft;

    return {
      top: span.offsetTop + parseInt(computed.borderTopWidth, 10),
      left: spanLeftLocal + parseInt(computed.borderLeftWidth, 10),
      height:
        parseFloat(computed.lineHeight) ||
        span.getClientRects()[0]?.height ||
        parseFloat(computed.fontSize),
    };
  } finally {
    // Always clean up the mirror div, even if the layout reads throw.
    document.body.removeChild(div);
  }
}
