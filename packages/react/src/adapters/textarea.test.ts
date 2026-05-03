// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";

import { createTextareaAdapter } from "./textarea.ts";

function makeTA(value = "", caret = value.length): HTMLTextAreaElement {
  const ta = document.createElement("textarea");
  document.body.appendChild(ta);
  ta.value = value;
  ta.setSelectionRange(caret, caret);
  return ta;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createTextareaAdapter", () => {
  it("getValue mirrors textarea.value", () => {
    const ta = makeTA("Hi @al");
    expect(createTextareaAdapter(ta).getValue()).toBe("Hi @al");
  });

  it("getCaretOffset mirrors selectionStart", () => {
    const ta = makeTA("Hi @al", 4);
    expect(createTextareaAdapter(ta).getCaretOffset()).toBe(4);
  });

  it("applyInsert mutates value via native setter and dispatches input event", () => {
    const ta = makeTA("Hi @al", 6);
    const a = createTextareaAdapter(ta);
    const onInput = vi.fn();
    ta.addEventListener("input", onInput);
    a.applyInsert({ value: "Hi @Alice ", caret: 10 });
    expect(ta.value).toBe("Hi @Alice ");
    expect(ta.selectionStart).toBe(10);
    expect(ta.selectionEnd).toBe(10);
    expect(onInput).toHaveBeenCalledTimes(1);
  });

  it("focus delegates to textarea.focus()", () => {
    const ta = makeTA("");
    const spy = vi.spyOn(ta, "focus");
    createTextareaAdapter(ta).focus();
    expect(spy).toHaveBeenCalled();
  });
});
