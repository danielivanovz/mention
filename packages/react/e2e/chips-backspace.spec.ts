import { expect, test } from "@playwright/test";

// C3 — Slack/Notion-style two-step backspace. First Backspace at a
// chip's right boundary selects (visual ring + AT re-announce);
// second Backspace deletes; ArrowLeft/ArrowRight/printable
// keystrokes deselect.

test.beforeEach(async ({ page }) => {
  await page.goto("/?host=editable&shape=node");
  await page.getByRole("combobox", { name: /comment/i }).focus();
});

test("first Backspace selects, second Backspace deletes", async ({ page }) => {
  const host = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("@al");
  await page.keyboard.press("Enter");
  // After commit the caret lands directly at the chip's right
  // boundary (no trailing space — see applyChipInsert rationale).
  // First Backspace selects.
  await page.keyboard.press("Backspace");

  const chip = host.locator("[data-mention-id]").first();
  await expect(chip).toHaveCount(1);

  await expect(chip).toHaveAttribute("data-mention-selected", "");
  await expect(chip).toHaveCount(1);

  // Second Backspace — deletes the selected chip.
  await page.keyboard.press("Backspace");
  await expect(host.locator("[data-mention-id]")).toHaveCount(0);
});

test("ArrowLeft after selection deselects without deleting", async ({
  page,
}) => {
  const host = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("@al");
  await page.keyboard.press("Enter");
  // Caret lands at chip's right boundary; first Backspace selects.
  await page.keyboard.press("Backspace");

  const chip = host.locator("[data-mention-id]").first();
  await expect(chip).toHaveAttribute("data-mention-selected", "");

  await page.keyboard.press("ArrowLeft");
  await expect(chip).not.toHaveAttribute("data-mention-selected", "");
  await expect(chip).toHaveCount(1);
});

test("Escape after selection deselects without deleting", async ({ page }) => {
  const host = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("@al");
  await page.keyboard.press("Enter");
  // Caret lands at chip's right boundary; first Backspace selects.
  await page.keyboard.press("Backspace");

  const chip = host.locator("[data-mention-id]").first();
  await expect(chip).toHaveAttribute("data-mention-selected", "");

  await page.keyboard.press("Escape");
  await expect(chip).not.toHaveAttribute("data-mention-selected", "");
  await expect(chip).toHaveCount(1);
});
