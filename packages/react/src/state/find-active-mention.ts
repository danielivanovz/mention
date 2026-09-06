/**
 * Backwards scan from `caret` looking for an active mention — a trigger
 * character that sits at a word boundary (start-of-string, after
 * Unicode whitespace, or — for non-whitespace-segmented scripts like
 * CJK / Thai / Khmer / Lao / Myanmar — directly after a character in
 * one of those scripts) with no whitespace between it and the caret.
 *
 * Used by `useMention`'s `handleChange` to decide whether to dispatch
 * `OPEN_AT` (active) or `DISMISS` (no longer active). This is the only
 * source of truth for trigger detection; the reducer is a pure
 * transition machine that reflects the resolved (trigger, query).
 *
 * Unicode word boundaries:
 *   `/\s/` already matches every Unicode whitespace codepoint correctly
 *   — including U+3000 ideographic space, ZWJ-bound emoji clusters, etc.
 *   The remaining gap is **non-whitespace-segmented scripts**: CJK
 *   languages don't put visible gaps between words, so `こんにちは@田中`
 *   would never trigger under a strict whitespace rule.
 *
 *   We use a Unicode property regex to recognise the major
 *   non-whitespace-segmented scripts and treat any character in those
 *   ranges as a "soft" word boundary. Latin-derived scripts (Latin,
 *   Cyrillic, Greek, Arabic, Hebrew) keep the strict whitespace rule
 *   because they routinely embed `@` mid-token (emails, usernames).
 *
 *   Known limitation: `用户@example` (Han + `@` + Latin) triggers
 *   because the Han character immediately preceding `@` is treated as
 *   a soft boundary. There is no way to distinguish this from the
 *   intended `こんにちは@田中` case at the dispatcher layer (both
 *   patterns segment identically under `Intl.Segmenter`). Documented
 *   in the troubleshooting guide; users press Escape if undesired.
 *
 *   No bundle cost — Unicode property regex is a built-in.
 */

// Scripts that don't use whitespace between words. A character in any of
// these classes is treated as a word-end — so the trigger directly after
// one is a valid trigger position.
const SOFT_BOUNDARY =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}\p{Script=Khmer}\p{Script=Lao}\p{Script=Myanmar}]/u;

function isWordBoundaryBefore(value: string, index: number): boolean {
  if (index === 0) return true;
  const end = value.charCodeAt(index - 1);
  const prev = value.slice(
    end >= 0xdc00 && end <= 0xdfff ? index - 2 : index - 1,
    index,
  );
  if (/\s/.test(prev)) return true;
  if (SOFT_BOUNDARY.test(prev)) return true;
  return false;
}

export interface ActiveMention {
  readonly trigger: string;
  /** Substring between the trigger and the caret. Empty iff caret is right after the trigger. */
  readonly query: string;
}

/**
 * `trigger` accepts a single character or a list of characters. The
 * returned `trigger` field reports which char actually matched, so
 * callers can route by channel without re-scanning.
 *
 * The backwards scan is "first match wins" — whichever trigger char the
 * scan hits first (closest to the caret) takes priority. That matches
 * user intent: typing `Hey @al #ch` with caret at end should resolve the
 * `#` channel, not the `@` channel.
 */
export function findActiveMention(
  value: string,
  caret: number,
  trigger: string | readonly string[] = "@",
): ActiveMention | null {
  if (!Number.isInteger(caret) || caret < 0 || caret > value.length)
    return null;
  const triggers = typeof trigger === "string" ? [trigger] : trigger;
  if (triggers.length === 0) return null;
  for (let i = caret - 1; i >= 0; i--) {
    const c = value.charAt(i);
    if (triggers.includes(c)) {
      if (isWordBoundaryBefore(value, i)) {
        return { trigger: c, query: value.substring(i + 1, caret) };
      }
      // Mid-word trigger (e.g. "foo@bar") — the isolation rule blocks
      // false positives like email addresses or usernames.
      return null;
    }
    if (/\s/.test(c)) return null;
  }
  return null;
}
