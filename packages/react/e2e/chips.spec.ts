import { expect, test } from "@playwright/test";

// C2 — atomic chip rendering. Same combobox-as-substring contract as
// the Editable spec, plus chip semantics: commit inserts a
// contenteditable=false element, the chip's data-mention-text matches
// the resolved insertText, the React content portaled by
// <Mention.Chips> is interactive inside the chip, and the chip-aware
// walker reconstructs plain text correctly.

test.beforeEach(async ({ page }) => {
  await page.goto("/?host=editable&shape=node");
  await page.getByRole("combobox", { name: /comment/i }).focus();
});

test("Enter commits a chip element with data-mention-id and contenteditable=false", async ({
  page,
}) => {
  const host = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("Hi @al");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Enter");

  const chip = host.locator("[data-mention-id]").first();
  await expect(chip).toHaveCount(1);
  await expect(chip).toHaveAttribute("contenteditable", "false");
  await expect(chip).toHaveAttribute("data-mention-text", "@alice");
  await expect(chip).toHaveAttribute("aria-label", /alice/i);
});

test("the React content rendered by <Mention.Chips> is portaled into the chip placeholder", async ({
  page,
}) => {
  const host = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("@al");
  await page.keyboard.press("Enter");

  const portaled = host.locator("[data-testid^='chip-']").first();
  await expect(portaled).toBeVisible();
  // The portaled span lives inside the chip placeholder.
  const placeholder = host.locator("[data-mention-id]").first();
  await expect(placeholder.locator("[data-testid^='chip-']")).toHaveCount(1);
});

test("typing after a committed chip extends a real text node, not the chip", async ({
  page,
}) => {
  const host = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("@al");
  await page.keyboard.press("Enter");
  await page.keyboard.type("hello");

  // Browser-flat textContent: chip's portal content + " " + "hello".
  await expect(host).toContainText(/@\w+\s?hello/);
  // The chip element is unchanged — text didn't fuse into it.
  const chipText = await host
    .locator("[data-mention-id]")
    .first()
    .getAttribute("data-mention-text");
  expect(chipText).toBe("@alice");
});
