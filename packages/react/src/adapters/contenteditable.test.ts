// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";

import { createContentEditableAdapter } from "./contenteditable.ts";

function makeHost(text = ""): HTMLElement {
  const host = document.createElement("div");
  host.contentEditable = "true";
  if (text) host.textContent = text;
  document.body.appendChild(host);
  return host;
}

function placeCaret(host: HTMLElement, offset: number) {
  const range = document.createRange();
  const node = host.firstChild ?? host;
  range.setStart(node, offset);
  range.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createContentEditableAdapter — getChipBeforeCaret (C3)", () => {
  function chip(text = "@Alice", id = "c1"): HTMLElement {
    const el = document.createElement("span");
    el.setAttribute("data-mention-id", id);
    el.setAttribute("data-mention-text", text);
    el.setAttribute("contenteditable", "false");
    el.textContent = text;
    return el;
  }

  it("returns the chip when caret sits at offset 0 of the text node directly after a chip", () => {
    const host = makeHost("");
    const c = chip();
    host.appendChild(c);
    const tail = document.createTextNode(" hi");
    host.appendChild(tail);
    const range = document.createRange();
    range.setStart(tail, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    const a = createContentEditableAdapter(host);
    expect(a.getChipBeforeCaret?.()).toBe(c);
  });

  it("returns null when caret is mid-text (offset > 0)", () => {
    const host = makeHost("hi");
    placeCaret(host, 1);
    const a = createContentEditableAdapter(host);
    expect(a.getChipBeforeCaret?.()).toBeNull();
  });

  it("returns the chip via host+childIndex addressing (anchorNode === host)", () => {
    const host = makeHost("");
    const c = chip();
    host.appendChild(c);
    const range = document.createRange();
    range.setStart(host, 1); // after chip
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    const a = createContentEditableAdapter(host);
    expect(a.getChipBeforeCaret?.()).toBe(c);
  });

  it("returns null when caret is at host start with no chip preceding", () => {
    const host = makeHost("hi");
    const range = document.createRange();
    const t = host.firstChild as Text;
    range.setStart(t, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    const a = createContentEditableAdapter(host);
    expect(a.getChipBeforeCaret?.()).toBeNull();
  });
});

describe("createContentEditableAdapter — chip insertion (C2)", () => {
  it("applyChipInsert splices the trigger window and replaces it with the chip + trailing space", () => {
    const host = makeHost("Hi @al");
    placeCaret(host, 6);
    const a = createContentEditableAdapter(host);
    const chip = document.createElement("span");
    chip.setAttribute("data-mention-id", "c1");
    chip.setAttribute("data-mention-text", "@Alice");
    chip.setAttribute("contenteditable", "false");
    chip.textContent = "@Alice";
    a.applyChipInsert?.({ triggerOffset: 3, selectionStart: 6, chip });
    expect(a.getValue()).toBe("Hi @Alice");
    // Caret lands directly at the chip's right boundary (no
    // trailing space — see C3 rationale in applyChipInsert).
    expect(a.getCaretOffset()).toBe(9);
    // Chip is in the host DOM with chip-aware data attrs.
    expect(host.querySelector("[data-mention-id='c1']")).toBe(chip);
  });

  it("applyChipInsert dispatches an input event so React handlers see the change", () => {
    const host = makeHost("@a");
    placeCaret(host, 2);
    const a = createContentEditableAdapter(host);
    const onInput = vi.fn();
    host.addEventListener("input", onInput);
    const chip = document.createElement("span");
    chip.setAttribute("data-mention-id", "c2");
    chip.setAttribute("data-mention-text", "@Alice");
    a.applyChipInsert?.({ triggerOffset: 0, selectionStart: 2, chip });
    expect(onInput).toHaveBeenCalledTimes(1);
  });
});

describe("createContentEditableAdapter", () => {
  it("getValue returns plain textContent", () => {
    const host = makeHost("Hi @al");
    const a = createContentEditableAdapter(host);
    expect(a.getValue()).toBe("Hi @al");
  });

  it("getCaretOffset returns the selection's char offset", () => {
    const host = makeHost("Hi @al");
    placeCaret(host, 6);
    const a = createContentEditableAdapter(host);
    expect(a.getCaretOffset()).toBe(6);
  });

  it("applyInsert rewrites value, restores caret, and dispatches input event", () => {
    const host = makeHost("Hi @al");
    placeCaret(host, 6);
    const a = createContentEditableAdapter(host);
    const onInput = vi.fn();
    host.addEventListener("input", onInput);
    a.applyInsert({ value: "Hi @Alice ", caret: 10 });
    expect(host.textContent).toBe("Hi @Alice ");
    expect(a.getCaretOffset()).toBe(10);
    expect(onInput).toHaveBeenCalledTimes(1);
  });

  it("getCaretRect returns null when there is no selection in host", () => {
    const host = makeHost("Hi");
    window.getSelection()?.removeAllRanges();
    const a = createContentEditableAdapter(host);
    expect(a.getCaretRect()).toBeNull();
  });

  it("focus delegates to host.focus()", () => {
    const host = makeHost("");
    const spy = vi.spyOn(host, "focus");
    createContentEditableAdapter(host).focus();
    expect(spy).toHaveBeenCalled();
  });
});
