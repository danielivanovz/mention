import {
  CHIP_ID_ATTR,
  getContenteditableCaretOffset,
  getContenteditableCaretRect,
  getContenteditableValue,
  setContenteditableCaretOffset,
} from "../text/caret-range.ts";
import type { MentionInsertResult } from "../text/replace.ts";
import type { ChipInsertInput, EditorAdapter } from "./types.ts";

/**
 * Adapter for plain-text `<div contenteditable>` hosts. Speaks the
 * same `EditorAdapter` contract as `createTextareaAdapter` — caller
 * (the core) never branches on host type.
 *
 * **Plain text + atomic chips.** `getValue()` walks the host serializing
 * `[data-mention-id]` placeholders as their `data-mention-text` / label;
 * substring `applyInsert` rewrites `textContent` and restores the caret
 * via `setContenteditableCaretOffset`; `applyChipInsert` splices in a
 * chip placeholder element while preserving caret math.
 *
 * **Input event.** Mutating `textContent` does not fire `input`
 * automatically — we dispatch one ourselves so the React handler
 * machinery sees the commit (mirrors the textarea adapter's native-
 * setter trick, except contenteditable doesn't have a tracked
 * `value` property).
 */
export function createContentEditableAdapter(
  host: HTMLElement,
): EditorAdapter {
  return {
    element: host,
    getValue: () => getContenteditableValue(host),
    getCaretOffset: () => getContenteditableCaretOffset(host),
    getCaretRect: () => getContenteditableCaretRect(host),
    applyInsert: (result: MentionInsertResult) => {
      // Substring-shape commit. Replace the whole text but preserve
      // chip elements by walking children and rebuilding around them
      // is overkill for the substring path — substring channels never
      // mutate chip-bearing regions (they replace `[trigger…caret)`,
      // a region the dispatcher guarantees is plain text).
      host.textContent = result.value;
      setContenteditableCaretOffset(host, result.caret);
      host.dispatchEvent(new Event("input", { bubbles: true }));
    },
    applyChipInsert: (input: ChipInsertInput) => {
      // Splice `[triggerOffset, selectionStart)` out and replace with
      // the placeholder chip + a trailing space (mirrors the substring
      // commit's invariant that the caret lands one char past the
      // inserted unit). Caret restored after the trailing space.
      const startOffset = input.triggerOffset;
      const endOffset = input.selectionStart;

      // Build a Range covering the splice window using char-offset → DOM
      // by setting caret to start, then to end and capturing both.
      setContenteditableCaretOffset(host, startOffset);
      const sel = host.ownerDocument.defaultView?.getSelection();
      const startRange = sel?.getRangeAt(0).cloneRange();
      setContenteditableCaretOffset(host, endOffset);
      const endRange = sel?.getRangeAt(0).cloneRange();
      if (startRange === undefined || endRange === undefined) return;

      const splice = host.ownerDocument.createRange();
      splice.setStart(startRange.startContainer, startRange.startOffset);
      splice.setEnd(endRange.endContainer, endRange.endOffset);
      splice.deleteContents();
      splice.insertNode(input.chip);

      // Caret lands directly after the chip. We deliberately omit a
      // trailing space (vs. the substring path) — chromium's native
      // Backspace deletes contenteditable=false elements + adjacent
      // whitespace as a single atomic unit, so a trailing space would
      // make the two-step backspace unreachable. Consumers wanting a
      // visual gap should set `margin-right` on their chip's React
      // content instead.
      const after = host.ownerDocument.createRange();
      after.setStartAfter(input.chip);
      after.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(after);

      host.dispatchEvent(new Event("input", { bubbles: true }));
    },
    getChipBeforeCaret: (): HTMLElement | null => {
      const sel = host.ownerDocument.defaultView?.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      const range = sel.getRangeAt(0);
      if (!range.collapsed || !host.contains(range.startContainer)) return null;

      const isChip = (n: Node | null): n is HTMLElement =>
        n !== null && n.nodeType === 1 && (n as Element).hasAttribute(CHIP_ID_ATTR);

      // Caret inside or at a chip (chromium quirk after adjacent
      // text-node deletion).
      let cur: Node | null = range.startContainer;
      while (cur !== null && cur !== host) {
        if (isChip(cur)) return cur;
        cur = cur.parentNode;
      }

      // Caret addressed via element + childIndex.
      if (range.startContainer.nodeType === 1) {
        if (range.startOffset <= 0) return null;
        const cand = range.startContainer.childNodes[range.startOffset - 1] ?? null;
        return isChip(cand) ? cand : null;
      }

      // Caret in a text node — only offset === 0 case matters.
      if (range.startOffset !== 0) return null;
      let node: Node | null = range.startContainer;
      while (node !== null && node !== host) {
        if (node.previousSibling !== null) {
          return isChip(node.previousSibling) ? node.previousSibling : null;
        }
        node = node.parentNode;
      }
      return null;
    },
    focus: () => host.focus(),
  };
}
