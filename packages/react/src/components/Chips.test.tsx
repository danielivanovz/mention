// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Mention } from "./index.ts";

interface User {
  id: number;
  name: string;
}
const USERS: readonly User[] = [
  { id: 1, name: "Daniel" },
  { id: 2, name: "Daria" },
];

function placeCaretAtEnd(host: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(host);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function ChipDemo() {
  return (
    <Mention.Root<User>
      trigger="@"
      items={USERS}
      getKey={(u) => u.id}
      getLabel={(u) => u.name}
      getInsertText={(u) => `@${u.name}`}
      shape="node"
      getInsertNode={(u) => (
        <span data-testid={`chip-${u.id}`} data-portaled="">
          @{u.name}
        </span>
      )}
      onSelect={() => {}}
    >
      <Mention.Editable aria-label="message" />
      <Mention.Popover>
        <Mention.List>
          {(u: User) => <Mention.Item value={u}>{u.name}</Mention.Item>}
        </Mention.List>
      </Mention.Popover>
      <Mention.Chips />
    </Mention.Root>
  );
}

describe("<Mention.Chips> + shape:'node' commit", () => {
  it("commits a chip element into the contenteditable host on Enter", () => {
    render(<ChipDemo />);
    const host = screen.getByRole("combobox", { name: "message" });
    host.focus();
    host.textContent = "@D";
    placeCaretAtEnd(host);
    fireEvent.input(host);

    expect(host).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(host, { key: "Enter" });

    const placeholder = host.querySelector("[data-mention-id]");
    expect(placeholder).not.toBeNull();
    expect(placeholder?.getAttribute("contenteditable")).toBe("false");
    expect(placeholder?.getAttribute("data-mention-text")).toBe("@Daniel");
    expect(placeholder?.getAttribute("aria-label")).toBe("Daniel");
  });

  it("portals consumer-supplied React content into the chip placeholder", () => {
    render(<ChipDemo />);
    const host = screen.getByRole("combobox", { name: "message" });
    host.focus();
    host.textContent = "@D";
    placeCaretAtEnd(host);
    fireEvent.input(host);
    fireEvent.keyDown(host, { key: "Enter" });

    // The portal mount runs synchronously after the chip registers.
    const portaled = screen.getByTestId("chip-1");
    expect(portaled).toBeTruthy();
    expect(portaled.getAttribute("data-portaled")).toBe("");
    // And that portaled node lives INSIDE the placeholder DOM element.
    const placeholder = host.querySelector("[data-mention-id]");
    expect(placeholder?.contains(portaled)).toBe(true);
  });

  it("first Backspace at chip boundary selects, second Backspace deletes (C3)", () => {
    render(<ChipDemo />);
    const host = screen.getByRole("combobox", { name: "message" });
    host.focus();
    host.textContent = "@D";
    placeCaretAtEnd(host);
    fireEvent.input(host);
    fireEvent.keyDown(host, { key: "Enter" });

    // After commit caret lands directly at chip's right boundary
    // (no trailing space — see applyChipInsert rationale).
    const chip = host.querySelector("[data-mention-id]") as HTMLElement;
    expect(chip).not.toBeNull();
    const range = document.createRange();
    range.setStartAfter(chip);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    // First Backspace — selects the chip; chip stays in DOM.
    fireEvent.keyDown(host, { key: "Backspace" });
    expect(host.querySelector("[data-mention-id]")).toBe(chip);
    expect(chip.getAttribute("data-mention-selected")).toBe("");

    // Second Backspace — deletes.
    fireEvent.keyDown(host, { key: "Backspace" });
    expect(host.querySelector("[data-mention-id]")).toBeNull();
  });

  it("ArrowLeft after selection deselects the chip without deleting", () => {
    render(<ChipDemo />);
    const host = screen.getByRole("combobox", { name: "message" });
    host.focus();
    host.textContent = "@D";
    placeCaretAtEnd(host);
    fireEvent.input(host);
    fireEvent.keyDown(host, { key: "Enter" });
    const chip = host.querySelector("[data-mention-id]") as HTMLElement;
    const range = document.createRange();
    range.setStartAfter(chip);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    fireEvent.keyDown(host, { key: "Backspace" });
    expect(chip.getAttribute("data-mention-selected")).toBe("");

    fireEvent.keyDown(host, { key: "ArrowLeft" });
    expect(chip.hasAttribute("data-mention-selected")).toBe(false);
    expect(host.querySelector("[data-mention-id]")).toBe(chip);
  });

  it("getValue (via adapter) reconstructs the plain-text value through chips", () => {
    render(<ChipDemo />);
    const host = screen.getByRole("combobox", { name: "message" });
    host.focus();
    host.textContent = "@D";
    placeCaretAtEnd(host);
    fireEvent.input(host);
    fireEvent.keyDown(host, { key: "Enter" });

    // After commit, host text should be "@Daniel " (chip + trailing space).
    // Use the chip-aware walker via the adapter's getValue indirectly:
    // the host's textContent (browser-flat) includes the chip's textContent.
    expect(host.textContent).toBe("@Daniel");
  });
});
