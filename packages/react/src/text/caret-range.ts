/**
 * Range API caret math for contenteditable hosts. Pairs with the
 * mirror-div math in `caret.ts` (textarea-only) — both feed the same
 * `EditorAdapter` contract via `getCaretRect()` / `getCaretOffset()`.
 *
 * **Why two implementations.** Textarea exposes `selectionStart` (a
 * char offset) but no caret rect; contenteditable exposes a Selection
 * (DOM node + offset) and a caret rect via Range, but no char offset.
 * Each adapter trades what its host gives it for the values the core
 * needs.
 *
 * **Chip-aware.** A `[data-mention-id]` element is treated as an
 * atomic unit contributing `data-mention-text.length` characters; the
 * walker never recurses into chip subtrees. `contentEditable="false"`
 * on the chip ensures the browser also treats it as atomic for
 * selection (caret cannot land inside).
 */

/** Hidden marker on chip elements — owned by the chip placeholder. */
export const CHIP_ID_ATTR = "data-mention-id";
/** Plain-text representation cached at commit time so the walker is O(1). */
export const CHIP_TEXT_ATTR = "data-mention-text";

function isChipElement(node: Node): node is HTMLElement {
  return (
    node.nodeType === 1 && (node as Element).hasAttribute(CHIP_ID_ATTR)
  );
}

function chipText(el: Element): string {
  return el.getAttribute(CHIP_TEXT_ATTR) ?? el.textContent ?? "";
}

/**
 * Walks a contenteditable host as a flat character stream. Yields one
 * { node, length } per atomic unit:
 *   - text nodes contribute their `nodeValue.length` characters;
 *   - chip elements contribute `data-mention-text.length` and are NOT
 *     descended into.
 * Used by all three caret/value helpers below to keep the chip
 * semantics consistent.
 */
function* walkAtoms(
  host: HTMLElement,
): Generator<{ node: Node; length: number; isChip: boolean }> {
  const queue: Node[] = Array.from(host.childNodes);
  while (queue.length > 0) {
    const node = queue.shift();
    if (node === undefined) continue;
    if (isChipElement(node)) {
      yield { node, length: chipText(node).length, isChip: true };
      continue;
    }
    if (node.nodeType === 3) {
      yield { node, length: (node.nodeValue ?? "").length, isChip: false };
      continue;
    }
    if (node.nodeType === 1) {
      // Recurse into ordinary elements.
      const children = (node as Element).childNodes;
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (child !== undefined) queue.unshift(child);
      }
    }
  }
}

/**
 * Plain-text value of a contenteditable host with chip serialization.
 * Used by `createContentEditableAdapter().getValue()`.
 */
export function getContenteditableValue(host: HTMLElement): string {
  let out = "";
  for (const atom of walkAtoms(host)) {
    if (atom.isChip) out += chipText(atom.node as Element);
    else out += atom.node.nodeValue ?? "";
  }
  return out;
}

/**
 * Caret bounding rect in viewport coordinates, or `null` if measurement
 * fails twice (caller falls back to `host.getBoundingClientRect()` at
 * the anchor layer).
 *
 * **Edge case.** When the caret sits at the end of an inline element
 * (or in an empty contenteditable), `range.getBoundingClientRect()`
 * collapses to a zero-rect because there's no glyph to measure
 * against. The fallback temporarily inserts a U+200B zero-width-space
 * text node, measures, and removes it — same trick as the
 * textarea-mirror-div approach for end-of-content positioning.
 */
export function getContenteditableCaretRect(host: HTMLElement): DOMRect | null {
  const sel = host.ownerDocument.defaultView?.getSelection();
  if (sel === null || sel === undefined || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0).cloneRange();
  if (!host.contains(range.startContainer)) return null;
  range.collapse(true);

  const rect = range.getBoundingClientRect();
  if (rect.width !== 0 || rect.height !== 0 || rect.top !== 0) {
    return rect;
  }

  // Zero-rect fallback — insert a marker, measure, remove.
  const marker = host.ownerDocument.createTextNode("​");
  try {
    range.insertNode(marker);
    const newRange = host.ownerDocument.createRange();
    newRange.selectNode(marker);
    const measured = newRange.getBoundingClientRect();
    if (measured.width === 0 && measured.height === 0 && measured.top === 0) {
      return null;
    }
    return measured;
  } finally {
    marker.parentNode?.removeChild(marker);
    // Browsers handle text-node coalescing on the next paint —
    // skipping host.normalize() saves ~15 B per the plan's squeeze list.
  }
}

/**
 * Caret offset as a character index into the host's chip-aware text
 * stream. Text nodes contribute their `nodeValue.length`; chip
 * elements (`[data-mention-id]`) contribute their `data-mention-text`
 * length atomically (the walker never recurses into chips).
 */
export function getContenteditableCaretOffset(host: HTMLElement): number {
  const sel = host.ownerDocument.defaultView?.getSelection();
  if (sel === null || sel === undefined || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  const anchorNode = range.startContainer;
  const anchorOffset = range.startOffset;
  if (!host.contains(anchorNode)) return 0;

  // anchorNode addresses a child position of an element (anchorOffset
  // = child index). Sum atom lengths for atoms whose DOM order
  // precedes the addressed position.
  if (anchorNode.nodeType === 1) {
    const containerEl = anchorNode as Element;
    let sum = 0;
    for (const atom of walkAtoms(host)) {
      // The atom is "before" the addressed position when its node is
      // a descendant of one of the first `anchorOffset` children of
      // containerEl, OR when containerEl itself precedes anchorNode in
      // document order. The simple invariant: if containerEl contains
      // atom.node strictly inside one of the first anchorOffset
      // children, count it; otherwise stop.
      let included = false;
      for (let i = 0; i < anchorOffset && i < containerEl.childNodes.length; i++) {
        const child = containerEl.childNodes[i];
        if (child === atom.node || child?.contains(atom.node)) {
          included = true;
          break;
        }
      }
      if (included) sum += atom.length;
      else if (containerEl !== host && atom.node === anchorNode) break;
    }
    return sum;
  }

  // anchorNode is a text node — sum lengths up to (but not including)
  // it, then add `anchorOffset`.
  let offset = 0;
  for (const atom of walkAtoms(host)) {
    if (atom.node === anchorNode) return offset + anchorOffset;
    offset += atom.length;
  }
  return offset;
}

/**
 * Place the selection at character offset `target` inside `host`.
 * Inverse of `getContenteditableCaretOffset` — used by the
 * contenteditable adapter's `applyInsert` to restore caret after a
 * value mutation.
 */
export function setContenteditableCaretOffset(
  host: HTMLElement,
  target: number,
): void {
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  if (win === null) return;
  let remaining = target;
  for (const atom of walkAtoms(host)) {
    if (remaining < atom.length || (remaining === atom.length && atom.isChip)) {
      const range = doc.createRange();
      if (atom.isChip) {
        // Caret cannot land inside a chip — place it adjacent.
        if (remaining === 0) range.setStartBefore(atom.node);
        else range.setStartAfter(atom.node);
      } else {
        range.setStart(atom.node, remaining);
      }
      range.collapse(true);
      const sel = win.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      return;
    }
    remaining -= atom.length;
  }
  // Past end — collapse to host end.
  const range = doc.createRange();
  range.selectNodeContents(host);
  range.collapse(false);
  const sel = win.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}
