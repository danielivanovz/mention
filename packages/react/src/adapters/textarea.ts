import { getCaretCoordinates } from "../text/caret.ts";
import type { MentionInsertResult } from "../text/replace.ts";
import type { EditorAdapter } from "./types.ts";

/**
 * Adapter for `<textarea>` hosts — extracted from `useMentionCore` +
 * `text/replace.ts:60` (the prior `commitMentionToTextarea`). Same
 * native-setter trick so React's synthetic-event tracker sees the
 * change; same `getCaretCoordinates` mirror-div for caret rect.
 */
export function createTextareaAdapter(
  textarea: HTMLTextAreaElement,
): EditorAdapter {
  return {
    element: textarea,
    getValue: () => textarea.value,
    getCaretOffset: () => textarea.selectionStart,
    getCaretRect: () => {
      const rect = textarea.getBoundingClientRect();
      try {
        const caret = getCaretCoordinates(textarea, textarea.selectionStart);
        const x = rect.left + caret.left - textarea.scrollLeft;
        const y = rect.top + caret.top - textarea.scrollTop;
        return new DOMRect(x, y, 1, caret.height);
      } catch {
        return null;
      }
    },
    applyInsert: (result: MentionInsertResult) => {
      const nativeSet = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      nativeSet?.call(textarea, result.value);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.setSelectionRange(result.caret, result.caret);
    },
    focus: () => textarea.focus(),
  };
}
