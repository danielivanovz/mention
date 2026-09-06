// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { createTextareaAdapter } from "./textarea.ts";

describe("textarea transactions", () => {
  it("reads a collapsed selection and rejects ranges", () => {
    const textarea = document.createElement("textarea");
    textarea.value = "hello @a";
    textarea.setSelectionRange(8, 8);
    const editor = createTextareaAdapter(textarea);
    expect(editor.read()).toEqual({ text: "hello @a", caret: 8 });
    textarea.setSelectionRange(6, 8);
    expect(editor.read()).toBeNull();
  });
  it("replaces only the range, restoring the caret before notifying React", () => {
    const textarea = document.createElement("textarea");
    textarea.value = "hello @a tail";
    const changed = vi.fn(() => {
      expect(textarea.value).toBe("hello @Alice tail");
      expect(textarea.selectionStart).toBe(12);
    });
    textarea.addEventListener("input", changed);
    createTextareaAdapter(textarea).replace(
      { from: 6, to: 8, text: "@Alice" },
      null,
      { trigger: "@", query: "a", triggerOffset: 6 },
    );
    expect(changed).toHaveBeenCalledOnce();
  });
});
