/**
 * Mention insertion — the symmetric write-side counterpart of
 * `findActiveMention`. Splits the commit pipeline into a pure step
 * (text + caret math) and a thin DOM step (textarea mutation).
 *
 * **Pure step — `applyMentionInsert`.** Given the textarea's current
 * value, where the caret sits, where the trigger character lived, and
 * the resolved replacement string, returns the post-commit `value` and
 * `caret`. The replacement spans `[triggerOffset, selectionStart)` —
 * i.e. the trigger character plus the in-progress query — and a single
 * trailing space is appended so the next keystroke doesn't fuse onto
 * the inserted token. (Spike 001's "double-space fix": consumers who
 * passed an `insertText` already ending in a space saw `"@Alice  "`;
 * the trailing space is *always* one character, regardless of whether
 * `insertText` ends in whitespace.)
 *
 * **DOM step — `commitMentionToTextarea`.** Performs the React-friendly
 * value mutation: native value setter (so React's synthetic-event
 * machinery reads the change), bubbling `input` event dispatch, and
 * `setSelectionRange` to place the caret. Kept thin so the pure math
 * carries the property-based test surface.
 */

export interface MentionInsertInput {
  /** The textarea's full current value at commit time. */
  readonly value: string;
  /** Caret position (collapsed selection). The replacement region is `[triggerOffset, selectionStart)`. */
  readonly selectionStart: number;
  /** Index where the trigger character sits — at commit time, `selectionStart - query.length - 1`. */
  readonly triggerOffset: number;
  /** Resolved replacement text — typically `${trigger}${label}` or the consumer's `getInsertText` output. */
  readonly insertText: string;
}

export interface MentionInsertResult {
  /** Post-commit textarea value. */
  readonly value: string;
  /** Post-commit caret position. */
  readonly caret: number;
}

export function applyMentionInsert(
  input: MentionInsertInput,
): MentionInsertResult {
  const before = input.value.slice(0, input.triggerOffset);
  const after = input.value.slice(input.selectionStart);
  const value = `${before}${input.insertText} ${after}`;
  const caret = before.length + input.insertText.length + 1;
  return { value, caret };
}

/**
 * Mutates the textarea to reflect an `applyMentionInsert` result.
 *
 * Uses the prototype's native `value` setter so React's synthetic-event
 * machinery sees the change — assigning `textarea.value = next` directly
 * skips React's tracker and the resulting `input` event would carry
 * stale `target.value`. Pattern from React's own test utilities.
 */
export function commitMentionToTextarea(
  textarea: HTMLTextAreaElement,
  result: MentionInsertResult,
): void {
  const nativeSet = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )?.set;
  nativeSet?.call(textarea, result.value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.setSelectionRange(result.caret, result.caret);
}
