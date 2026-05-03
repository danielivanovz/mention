import type { MentionInsertResult } from "../text/replace.ts";

/**
 * Editor-agnostic seam for the host element that drives `useMentionCore`.
 *
 * Substring-shape adapters (textarea + plain-text contenteditable) implement
 * the core five methods. Chip-capable adapters (contenteditable) additionally
 * implement `applyChipInsert` + `getChipBeforeCaret`. The core branches on
 * `channel.shape` and asserts adapter capability.
 */
export interface EditorAdapter {
  /** Live DOM node — used by the Floating UI anchor + focus management. */
  readonly element: HTMLElement;
  /** Plain-text value at commit time. */
  getValue(): string;
  /** Caret offset in character units. Collapsed selection assumed. */
  getCaretOffset(): number;
  /** Caret bounding rect in viewport coordinates, or null on failure. */
  getCaretRect(): DOMRect | null;
  /** Apply a `(value, caret)` transition computed by `applyMentionInsert`. */
  applyInsert(result: MentionInsertResult): void;
  /** Restore focus after a programmatic commit. */
  focus(): void;
  /**
   * Chip insertion. Splices the `[triggerOffset, caret)` substring
   * out of the host and replaces it with the supplied placeholder element
   * (`contenteditable="false"`, `data-mention-id`, `data-mention-text`).
   * Restores caret immediately after the chip + a trailing space.
   * Optional — only chip-capable hosts implement this.
   */
  applyChipInsert?(input: ChipInsertInput): void;
  /**
   * Two-step backspace lookup. Returns the chip element directly
   * preceding the current caret position, or null when the caret is not
   * adjacent to a chip. Optional.
   */
  getChipBeforeCaret?(): HTMLElement | null;
}

/**
 * Input to `applyChipInsert`. Mirrors `MentionInsertInput`'s splice
 * geometry but contributes a DOM node instead of a substring — the
 * placeholder is fully constructed by the core (data attrs set, label
 * text inside) before this method is called.
 */
export interface ChipInsertInput {
  /** Caret offset where the trigger character lives. */
  readonly triggerOffset: number;
  /** Caret offset at commit time (`triggerOffset + 1 + query.length`). */
  readonly selectionStart: number;
  /** The chip placeholder to insert in place of `[triggerOffset, selectionStart)`. */
  readonly chip: HTMLElement;
}
