// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

function Demo({ onSelect }: { onSelect?: (u: User) => void } = {}) {
  return (
    <Mention.Root<User>
      trigger="@"
      items={USERS}
      getKey={(u) => u.id}
      getLabel={(u) => u.name}
      onSelect={onSelect ?? (() => {})}
    >
      <Mention.Editable aria-label="message" />
      <Mention.Popover>
        <Mention.List>
          {(u: User) => <Mention.Item value={u}>{u.name}</Mention.Item>}
        </Mention.List>
        <Mention.Empty>No people found</Mention.Empty>
      </Mention.Popover>
    </Mention.Root>
  );
}

describe("<Mention.Editable>", () => {
  it("renders a contenteditable host with combobox ARIA at rest", () => {
    render(<Demo />);
    const host = screen.getByRole("combobox", { name: "message" });
    expect(host.tagName).toBe("DIV");
    expect(host).toHaveAttribute("contenteditable", "true");
    expect(host).toHaveAttribute("aria-expanded", "false");
    expect(host).toHaveAttribute("aria-haspopup", "listbox");
    expect(host).toHaveAttribute("aria-autocomplete", "list");
  });

  it("opens the popover when the user types '@' and dispatches input", () => {
    render(<Demo />);
    const host = screen.getByRole("combobox", { name: "message" });
    host.focus();
    host.textContent = "@";
    placeCaretAtEnd(host);
    fireEvent.input(host);
    expect(host).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("commits the highlighted item on Enter, replacing the trigger substring", () => {
    const onSelect = vi.fn();
    render(<Demo onSelect={onSelect} />);
    const host = screen.getByRole("combobox", { name: "message" });
    host.focus();
    host.textContent = "@D";
    placeCaretAtEnd(host);
    fireEvent.input(host);

    fireEvent.keyDown(host, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(host.textContent).toBe("@Daniel ");
  });
});
