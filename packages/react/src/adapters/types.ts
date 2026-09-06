import type { MentionSelectMeta } from "../types.ts";

/** Text and a collapsed selection in one editable region. Offsets use UTF-16. */
export interface EditorSnapshot {
  readonly text: string;
  readonly caret: number;
  /** Distinguishes regions with identical text, such as two paragraphs. */
  readonly key?: unknown;
}
export interface MentionEdit {
  readonly from: number;
  readonly to: number;
  /** Formatted insertion, including any trailing separator. */
  readonly text: string;
}
export interface EditorAdapter<T = unknown> {
  readonly element: HTMLElement;
  /** null for selections, composition, read-only content, or unsupported regions. */
  read(): EditorSnapshot | null;
  getCaretRect(): DOMRect | null;
  /**
   * Replace this range with a host editing transaction. Rich editors may create
   * a mention node from item instead of inserting edit.text. The host owns
   * serialization, rendering, clipboard behavior, and undo/redo.
   * Return false if the transaction cannot be applied.
   */
  // biome-ignore lint/suspicious/noConfusingVoidType: an editor command may return void or explicitly reject with false.
  replace(edit: MentionEdit, item: T, meta: MentionSelectMeta): void | boolean;
}
