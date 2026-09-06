import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?natural=1");
});

test("full-name matching inserts the configured text and stays dismissed while continuing", async ({
  page,
}) => {
  const input = page.getByRole("textbox", { name: "Comment", exact: true });
  await input.fill("Hello @alice an");
  await expect(page.getByRole("option")).toHaveText("@aliceAlice Anderson");
  await input.press("Enter");
  await expect(input).toHaveValue("Hello @alice ");
  await input.pressSequentially("is here");
  await expect(page.getByRole("listbox")).toBeHidden();
  await input.pressSequentially(" @jose gar");
  await expect(page.getByRole("option")).toHaveText("@joseJosé García");
  await page.getByRole("option").click();
  await expect(input).toHaveValue("Hello @alice is here @jose ");
  await expect(input).toBeFocused();
});

test("Escape survives forward typing; deleting into the query and a new trigger can reopen it", async ({
  page,
}) => {
  const input = page.getByRole("textbox", { name: "Comment", exact: true });
  await input.fill("@Alice A");
  await input.press("Escape");
  await input.pressSequentially("nderson");
  await expect(page.getByRole("listbox")).toBeHidden();
  for (let i = 0; i < 8; i++) await input.press("Backspace");
  await expect(input).toHaveValue("@Alice ");
  await expect(page.getByRole("option")).toContainText("Alice Anderson");
  await input.press("Escape");
  await input.pressSequentially(" @jose");
  await expect(page.getByRole("option")).toContainText("José García");
});

test("a full name in the middle of a sentence preserves the suffix", async ({
  page,
}) => {
  const input = page.getByRole("textbox", { name: "Comment", exact: true });
  await input.fill("Hello @Alice An tomorrow");
  for (let i = 0; i < 9; i++) await input.press("ArrowLeft");
  await expect(page.getByRole("option")).toContainText("Alice Anderson");
  await input.press("Enter");
  await expect(input).toHaveValue("Hello @alice tomorrow");
});
