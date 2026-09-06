import { getCaretCoordinates } from "../text/caret.ts";
import type { EditorAdapter } from "./types.ts";

export function createTextareaAdapter(
  element: HTMLTextAreaElement,
): EditorAdapter {
  return {
    element,
    read() {
      if (
        element.disabled ||
        element.readOnly ||
        element.selectionStart !== element.selectionEnd
      )
        return null;
      return { text: element.value, caret: element.selectionStart };
    },
    getCaretRect() {
      const caret = getCaretCoordinates(element, element.selectionStart);
      const rect = element.getBoundingClientRect();
      return new DOMRect(
        rect.left + caret.left - element.scrollLeft,
        rect.top + caret.top - element.scrollTop,
        0,
        caret.height,
      );
    },
    replace({ from, to, text }) {
      if (element.disabled || element.readOnly) return false;
      const doc = element.ownerDocument;
      const window = doc.defaultView;
      const setter =
        window &&
        Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value",
        )?.set;
      if (!window || !setter) return false;
      element.focus();
      element.setSelectionRange(from, to);
      // insertText preserves native undo history. Some engines/hosts lack it;
      // the setter fallback still supports React's normal onChange contract.
      const expected =
        element.value.slice(0, from) + text + element.value.slice(to);
      if (
        typeof doc.execCommand === "function" &&
        doc.execCommand("insertText", false, text) &&
        element.value === expected
      )
        return true;
      setter.call(element, expected);
      element.setSelectionRange(from + text.length, from + text.length);
      element.dispatchEvent(new window.Event("input", { bubbles: true }));
      return true;
    },
  };
}
