import { expect, test } from "@playwright/test";

// C1 — contract spec for `<Mention.Editable>`. The textarea-host
// contracts live in `contract.spec.ts`; this file re-runs the
// minimum-viable subset against the contenteditable host so we know
// the adapter seam preserves the combobox-as-substring contract end-
// to-end (DOM focus stays in the host, popover anchors at caret,
// commit replaces the trigger substring, popover dismisses on Esc).

test.beforeEach(async ({ page }) => {
  await page.goto("/?host=editable");
  await page.getByRole("combobox", { name: /comment/i }).focus();
});

test("the editable host advertises the combobox-as-substring contract", async ({
  page,
}) => {
  const host = page.getByRole("combobox", { name: /comment/i });
  await expect(host).toBeFocused();
  await expect(host).toHaveAttribute("aria-haspopup", "listbox");
  await expect(host).toHaveAttribute("aria-autocomplete", "list");
  await expect(host).toHaveAttribute("aria-expanded", "false");
});

test("typing @ opens the listbox; DOM focus stays on the host", async ({
  page,
}) => {
  const host = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("@");

  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();

  // Focus must stay on the host — same combobox-as-substring rule
  // the textarea variant enforces. Otherwise IMEs and soft keyboards
  // break.
  await expect(host).toBeFocused();
  await expect(host).toHaveAttribute("aria-expanded", "true");
});

test("Enter commits the highlighted item; the trigger substring is replaced", async ({
  page,
}) => {
  const host = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("Hi @al");

  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("listbox")).toHaveCount(0);
  // textContent — contenteditable does not have a `value`. The
  // harness uses `getInsertText: u => "@" + u.username` so commits
  // land as `@alice ` (trigger + username + trailing space).
  await expect(host).toContainText(/Hi @\w+\s/);
});

test("Escape dismisses the popover without committing", async ({ page }) => {
  const host = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("@al");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(host).toContainText("@al");
});
