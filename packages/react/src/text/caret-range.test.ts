// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";

import {
  CHIP_ID_ATTR,
  CHIP_TEXT_ATTR,
  getContenteditableCaretOffset,
  getContenteditableValue,
  setContenteditableCaretOffset,
} from "./caret-range.ts";

function makeChip(text: string, id = "c1"): HTMLElement {
  const el = document.createElement("span");
  el.setAttribute(CHIP_ID_ATTR, id);
  el.setAttribute(CHIP_TEXT_ATTR, text);
  el.setAttribute("contenteditable", "false");
  el.textContent = text;
  return el;
}

function makeHost(html: string): HTMLElement {
  const host = document.createElement("div");
  host.contentEditable = "true";
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

function placeCaret(node: Node, offset: number) {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("getContenteditableCaretOffset", () => {
  it("returns 0 in an empty host", () => {
    const host = makeHost("");
    expect(getContenteditableCaretOffset(host)).toBe(0);
  });

  it("returns the in-text offset for a single text node", () => {
    const host = makeHost("hello world");
    const text = host.firstChild as Text;
    placeCaret(text, 5);
    expect(getContenteditableCaretOffset(host)).toBe(5);
  });

  it("sums lengths of preceding text nodes", () => {
    const host = makeHost("");
    host.appendChild(document.createTextNode("Hi "));
    const second = document.createTextNode("there");
    host.appendChild(second);
    placeCaret(second, 3);
    // "Hi " (3) + 3 = 6
    expect(getContenteditableCaretOffset(host)).toBe(6);
  });

  it("traverses nested span text", () => {
    const host = makeHost("foo<span>bar</span>baz");
    const baz = host.lastChild as Text;
    placeCaret(baz, 2);
    // "foo" (3) + "bar" (3) + 2 = 8
    expect(getContenteditableCaretOffset(host)).toBe(8);
  });

  it("handles caret addressed by host + child index (anchorNode === host)", () => {
    const host = makeHost("a<br>bc");
    placeCaret(host, 2); // after the <br>, before "bc"
    // "a" (1) + "" (br) = 1
    expect(getContenteditableCaretOffset(host)).toBe(1);
  });
});

describe("chip-aware walker (C2)", () => {
  it("getContenteditableValue concatenates text + chip data-mention-text", () => {
    const host = makeHost("Hi ");
    host.appendChild(makeChip("@Alice"));
    host.appendChild(document.createTextNode(" hello"));
    expect(getContenteditableValue(host)).toBe("Hi @Alice hello");
  });

  it("getContenteditableValue prefers data-mention-text over chip textContent", () => {
    const host = makeHost("");
    const chip = makeChip("@alice");
    chip.textContent = "<avatar>"; // visual-only override (e.g. portal mounting)
    host.appendChild(chip);
    expect(getContenteditableValue(host)).toBe("@alice");
  });

  it("getContenteditableCaretOffset treats a chip as one atomic unit of length data-mention-text", () => {
    const host = makeHost("Hi ");
    const chip = makeChip("@Alice");
    host.appendChild(chip);
    const tail = document.createTextNode(" hello");
    host.appendChild(tail);
    placeCaret(tail, 3);
    // "Hi " (3) + "@Alice" (6 atomic) + " he" (3) = 12
    expect(getContenteditableCaretOffset(host)).toBe(12);
  });

  it("getContenteditableCaretOffset positions caret-before-chip via host+childIndex", () => {
    const host = makeHost("Hi ");
    host.appendChild(makeChip("@Alice"));
    placeCaret(host, 1); // after "Hi ", before chip
    expect(getContenteditableCaretOffset(host)).toBe(3);
  });

  it("setContenteditableCaretOffset places caret BEFORE a chip when offset lands at its left boundary", () => {
    const host = makeHost("Hi ");
    host.appendChild(makeChip("@Alice"));
    setContenteditableCaretOffset(host, 3);
    // round-trip
    expect(getContenteditableCaretOffset(host)).toBe(3);
  });

  it("setContenteditableCaretOffset places caret AFTER a chip when offset lands at its right boundary", () => {
    const host = makeHost("Hi ");
    host.appendChild(makeChip("@Alice"));
    host.appendChild(document.createTextNode(" hello"));
    setContenteditableCaretOffset(host, 9); // "Hi @Alice"
    expect(getContenteditableCaretOffset(host)).toBe(9);
  });
});

describe("setContenteditableCaretOffset", () => {
  it("places caret at the given offset and round-trips", () => {
    const host = makeHost("hello world");
    setContenteditableCaretOffset(host, 6);
    expect(getContenteditableCaretOffset(host)).toBe(6);
  });

  it("clamps to end when target exceeds content length", () => {
    const host = makeHost("hi");
    setContenteditableCaretOffset(host, 999);
    expect(getContenteditableCaretOffset(host)).toBe(2);
  });
});
