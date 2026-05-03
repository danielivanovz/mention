// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { createTextareaAnchor } from "./virtual.ts";

// happy-dom doesn't compute layout — line-height comes back as "normal"
// and offsets are 0 — so caret-rect pixel math returns NaN. These tests
// cover the *structural* and *liveness* contract; visual correctness
// lives in I8 (e2e on real browsers).

function makeTextarea(value = "hello world", caret = 5): HTMLTextAreaElement {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  document.body.appendChild(textarea);
  textarea.setSelectionRange(caret, caret);
  return textarea;
}

describe("createTextareaAnchor", () => {
  it("returns a Floating UI VirtualElement with contextElement = textarea", () => {
    const textarea = makeTextarea();
    const anchor = createTextareaAnchor(textarea);

    expect(typeof anchor.getBoundingClientRect).toBe("function");
    expect(anchor.contextElement).toBe(textarea);

    textarea.remove();
  });

  it("returns a 1px-wide caret rect (not the full textarea rect)", () => {
    const textarea = makeTextarea();
    const anchor = createTextareaAnchor(textarea);
    const rect = anchor.getBoundingClientRect();

    // The caret is a thin vertical bar — width is hard-coded to 1px
    // regardless of browser layout. This is the cheapest assertion that
    // confirms the caret-rect code path ran (textarea bounding rect has
    // a non-1 width).
    expect(rect.width).toBe(1);

    textarea.remove();
  });

  it("re-builds a fresh rect object on each call (no caching)", () => {
    // Floating UI calls getBoundingClientRect on every autoUpdate tick,
    // and Popover calls refs.update() on caret movement. The anchor must
    // not cache — fresh object identity per call is the cheapest
    // observable proof that recomputation happened. Pixel-correct
    // movement is verified in I8 (e2e on real browsers).
    const textarea = makeTextarea();
    const anchor = createTextareaAnchor(textarea);

    const first = anchor.getBoundingClientRect();
    const second = anchor.getBoundingClientRect();

    expect(first).not.toBe(second);

    textarea.remove();
  });

  it("falls back to the textarea bounding rect when caret math throws", () => {
    // Real-browser failure mode: a CSS quirk that makes the mirror-div
    // technique fall over. The anchor must not throw into Floating UI's
    // middleware chain — it returns a usable rect instead (the textarea
    // bounding rect = popover lands at the textarea origin, slightly off
    // but never broken).
    const textarea = makeTextarea();
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = ((el: Element) => {
      if (el === textarea) {
        return new Proxy(originalGetComputedStyle(el), {
          get(target, prop) {
            if (prop === "borderTopWidth") throw new Error("synthetic");
            return Reflect.get(target, prop);
          },
        });
      }
      return originalGetComputedStyle(el);
    }) as typeof window.getComputedStyle;

    try {
      const anchor = createTextareaAnchor(textarea);
      const rect = anchor.getBoundingClientRect();
      // Fallback hit — the rect is the textarea's bounding rect, which
      // has width != 1 (the caret-rect code path forces width = 1).
      expect(rect).toBeDefined();
      expect(rect.width).not.toBe(1);
    } finally {
      window.getComputedStyle = originalGetComputedStyle;
      textarea.remove();
    }
  });
});
