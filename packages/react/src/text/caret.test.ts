// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";

import { getCaretCoordinates } from "./caret.ts";

const MIRROR_SELECTOR = "div";

afterEach(() => {
  // Defensive: if a test ever leaks a mirror div, make the next one start
  // clean. The implementation guarantees cleanup via try/finally — these
  // assertions verify that contract per-test.
  document.body.innerHTML = "";
});

function makeTextarea(value: string, position: number): HTMLTextAreaElement {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setSelectionRange(position, position);
  document.body.appendChild(textarea);
  return textarea;
}

describe("getCaretCoordinates — structural contract", () => {
  // happy-dom doesn't compute layout, so `offsetTop` / `offsetLeft` are
  // always 0. These tests cover the *shape* and *cleanup* contract;
  // pixel-correctness lands in I8 e2e against real browsers.

  it("returns { top, left, height } with numeric fields", () => {
    const textarea = makeTextarea("hello", 3);
    const result = getCaretCoordinates(textarea, 3);

    expect(typeof result.top).toBe("number");
    expect(typeof result.left).toBe("number");
    expect(typeof result.height).toBe("number");
  });

  it("does not throw at offset = 0 (start of textarea)", () => {
    const textarea = makeTextarea("hello", 0);
    expect(() => getCaretCoordinates(textarea, 0)).not.toThrow();
  });

  it("does not throw at offset = value.length (end of textarea)", () => {
    const textarea = makeTextarea("hello world", 11);
    expect(() => getCaretCoordinates(textarea, 11)).not.toThrow();
  });

  it("does not throw when offset > value.length (defensive)", () => {
    const textarea = makeTextarea("hi", 2);
    expect(() => getCaretCoordinates(textarea, 999)).not.toThrow();
  });

  it("does not throw with empty textarea (offset 0, no text)", () => {
    const textarea = makeTextarea("", 0);
    expect(() => getCaretCoordinates(textarea, 0)).not.toThrow();
  });

  it("removes the mirror div on success", () => {
    const textarea = makeTextarea("hello", 3);
    const before = document.querySelectorAll(MIRROR_SELECTOR).length;
    getCaretCoordinates(textarea, 3);
    const after = document.querySelectorAll(MIRROR_SELECTOR).length;

    // Only the textarea wrapper remains (no element of `div` tag was
    // added by the call). The textarea itself is not a div, so the count
    // returns to zero divs.
    expect(after).toBe(before);
  });

  it("removes the mirror div even if reading layout throws", () => {
    // Force a throw inside the layout-read path by stubbing
    // getComputedStyle to return a getter that throws on a copied prop.
    // The cleanup is in a finally block, so the div must still be gone.
    const textarea = makeTextarea("hi", 1);
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
      // No leftover divs — the only div was the mirror, and it was cleaned
      // up by the finally block.
      expect(document.querySelectorAll(MIRROR_SELECTOR)).toHaveLength(0);
    } finally {
      window.getComputedStyle = original;
    }
  });

  // M5 — RTL structural test. happy-dom can't measure layout so we
  //   can't assert pixel positions; the contract this guards is "the
  //   function reads `direction` from the textarea and doesn't throw on
  //   the RTL branch". Pixel correctness is in caret.browser.test.ts.
  it("does not throw on a direction:rtl textarea", () => {
    const textarea = makeTextarea("שלום עולם", 5);
    textarea.dir = "rtl";
    expect(() => getCaretCoordinates(textarea, 5)).not.toThrow();
    const result = getCaretCoordinates(textarea, 5);
    expect(typeof result.left).toBe("number");
    expect(typeof result.top).toBe("number");
    expect(typeof result.height).toBe("number");
  });

  it("throws a clear error when called outside a browser", () => {
    // We can't truly remove `document` in happy-dom — but the runtime
    // check guards SSR. The error message is the contract; if the guard
    // ever changes, this catches the regression.
    const originalDocument = globalThis.document;
    // @ts-expect-error — test-only undef
    delete globalThis.document;
    try {
      const fakeTextarea = {} as HTMLTextAreaElement;
      expect(() => getCaretCoordinates(fakeTextarea, 0)).toThrow(
        /browser environment/,
      );
    } finally {
      globalThis.document = originalDocument;
    }
  });
});
