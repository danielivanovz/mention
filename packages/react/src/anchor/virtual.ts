import type { VirtualElement } from "@floating-ui/react-dom";

import { getCaretCoordinates } from "../text/caret.ts";

/**
 * `createElementCaretAnchor` — generalized Floating UI `VirtualElement`
 * whose `getBoundingClientRect` returns a 1×lineHeight rect at whatever
 * the supplied `getCaretRect()` reports. The caller (an `EditorAdapter`)
 * owns the host-specific math; this file owns only the Floating-UI plumbing
 * and the fallback to the host's bounding rect.
 *
 * **Live re-reads.** `getBoundingClientRect` is called on every Floating
 * UI tick (`autoUpdate` for scroll/resize, `refs.update()` for caret
 * movement triggered by Popover). The function does no caching.
 *
 * **Failure mode.** If `getCaretRect()` returns `null`, we fall back to
 * the host's bounding rect — popover lands at the host origin instead
 * of the caret. Less precise but never throws into Floating UI.
 *
 * **`contextElement`.** Set to the host so Floating UI's scroll/clipping
 * detection still works inside scrollable ancestors — `flip`, `shift`,
 * and `size` all need a real DOM ancestor for boundary computation.
 */
export function createElementCaretAnchor(
  host: HTMLElement,
  getCaretRect: () => DOMRect | null,
): VirtualElement {
  return {
    getBoundingClientRect: () => getCaretRect() ?? host.getBoundingClientRect(),
    contextElement: host,
  };
}

/**
 * Convenience wrapper for hand-rolled anchors against a `<textarea>`.
 * Uses the vendored mirror-div caret math; equivalent to passing
 * `() => getCaretRect(textarea)` to `createElementCaretAnchor`. The
 * textarea adapter goes through `createElementCaretAnchor` directly.
 */
export function createTextareaAnchor(
  textarea: HTMLTextAreaElement,
): VirtualElement {
  return createElementCaretAnchor(textarea, () => {
    const rect = textarea.getBoundingClientRect();
    try {
      const caret = getCaretCoordinates(textarea, textarea.selectionStart);
      const x = rect.left + caret.left - textarea.scrollLeft;
      const y = rect.top + caret.top - textarea.scrollTop;
      return new DOMRect(x, y, 1, caret.height);
    } catch {
      return null;
    }
  });
}
