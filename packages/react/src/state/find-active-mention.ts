// Scripts without whitespace-delimited words permit a trigger after a letter.
// This also treats Han + @ + Latin as a boundary; callers can dismiss that query.
const SOFT_BOUNDARY =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}\p{Script=Khmer}\p{Script=Lao}\p{Script=Myanmar}]/u;

function isWordBoundaryBefore(value: string, index: number): boolean {
  if (index === 0) return true;
  const end = value.charCodeAt(index - 1);
  const prev = value.slice(
    end >= 0xdc00 && end <= 0xdfff ? index - 2 : index - 1,
    index,
  );
  if (/\s|\uFFFC/.test(prev)) return true;
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
  options: { allowSpaces?: boolean } = {},
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
    if (
      c === "\uFFFC" ||
      (/\s/u.test(c) && !(options.allowSpaces && /\p{Zs}/u.test(c)))
    )
      return null;
  }
  return null;
}
