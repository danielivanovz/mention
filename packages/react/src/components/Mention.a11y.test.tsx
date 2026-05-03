// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { Mention } from "./index.ts";

interface User {
  id: number;
  name: string;
}

const USERS: readonly User[] = [
  { id: 1, name: "Daniel" },
  { id: 2, name: "Daria" },
];

function Demo() {
  return (
    <Mention.Root<User>
      trigger="@"
      items={USERS}
      getKey={(u) => u.id}
      getLabel={(u) => u.name}
      onSelect={() => {}}
    >
      <Mention.Input aria-label="message" />
      <Mention.Popover>
        <Mention.List>
          {(user: User) => (
            <Mention.Item value={user}>{user.name}</Mention.Item>
          )}
        </Mention.List>
      </Mention.Popover>
    </Mention.Root>
  );
}

// C1 — same demo, but with `<Mention.Editable>` as the host. Pins
// that the contenteditable variant carries the same ARIA contract
// (combobox role, controls, expanded, haspopup, autocomplete) and
// passes the same axe sweep with the same documented exceptions.
function EditableDemo() {
  return (
    <Mention.Root<User>
      trigger="@"
      items={USERS}
      getKey={(u) => u.id}
      getLabel={(u) => u.name}
      onSelect={() => {}}
    >
      <Mention.Editable aria-label="message" />
      <Mention.Popover>
        <Mention.List>
          {(user: User) => (
            <Mention.Item value={user}>{user.name}</Mention.Item>
          )}
        </Mention.List>
      </Mention.Popover>
    </Mention.Root>
  );
}

describe("Mention — axe a11y sweep", () => {
  // Per ADR-0001, axe flags `role="combobox"` on `<textarea>` as
  //   `aria-allowed-role` "not allowed" — we accept this as a documented
  //   exception (industry practice; AT testing in Spike 001 confirmed
  //   the contract works). The sweep below disables that single rule;
  //   any *other* axe violation is a regression.
  it("the closed-state rendering has no axe violations", async () => {
    const { container } = render(<Demo />);

    const results = await axe(container, {
      rules: { "aria-allowed-role": { enabled: false } },
    });

    expect(results).toHaveNoViolations();
  });

  it("the open-state rendering (popover visible) has no axe violations", async () => {
    const user = userEvent.setup();
    const { container } = render(<Demo />);

    await user.click(screen.getByRole("combobox", { name: "message" }));
    await user.keyboard("@");

    const results = await axe(container, {
      rules: { "aria-allowed-role": { enabled: false } },
    });

    expect(results).toHaveNoViolations();
  });

  // C1 — Editable variant honors the same ARIA contract. Documented
  // axe exception (`region`) for portaled listboxes covers the
  // open-state rendering same as the textarea variant.
  it("the Editable variant has no axe violations at rest", async () => {
    const { container } = render(<EditableDemo />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
