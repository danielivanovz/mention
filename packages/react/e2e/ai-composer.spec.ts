import { expect, type Page, test } from "@playwright/test";

const textbox = (page: Page) =>
  page.getByRole("textbox", { name: "Message with context" });
async function reference(page: Page, query = "pricing") {
  await textbox(page).focus();
  await page.keyboard.type(`@${query}`);
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.keyboard.press("Enter");
}
async function payload(page: Page) {
  await expect(page.getByTestId("submitted-context")).toBeAttached();
  return JSON.parse(
    (await page.getByTestId("submitted-context").textContent()) ?? "[]",
  );
}
test.beforeEach(async ({ page }) => {
  await page.goto("/?example=ai-composer");
});

test("Enter inserts before sending, then submits current stable references", async ({
  page,
}) => {
  await reference(page);
  await expect(
    textbox(page).locator("[data-mention-id=doc-pricing]"),
  ).toHaveCount(1);
  await expect(page.getByTestId("submitted-context")).toHaveCount(0);
  await page.keyboard.type("and ");
  await reference(page, "customer research");
  await page.keyboard.press("Enter");
  expect(await payload(page)).toEqual([
    { type: "text", text: "@pricing.md and @customer research.md " },
    {
      type: "data-mentions",
      data: [
        { id: "doc-pricing", name: "pricing.md" },
        { id: "doc-research", name: "customer research.md" },
      ],
    },
  ]);
  await expect(
    page.getByRole("button", { name: "Stop response" }),
  ).toBeHidden();
  await expect(textbox(page)).toHaveText("");
  await expect(page.locator('[data-reference-id="doc-pricing"]')).toHaveText(
    "pricing.md",
  );
});

test("deleted references leave the submitted context", async ({ page }) => {
  await reference(page);
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await expect(textbox(page).locator("[data-mention-id]")).toHaveCount(0);
  await page.keyboard.type("No documents now");
  await page.getByRole("button", { name: "Send message" }).click();
  expect(await payload(page)).toEqual([
    { type: "text", text: "No documents now" },
  ]);
});

test("undo restores reference identity and repeated mentions submit one reference", async ({
  page,
}) => {
  await reference(page);
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("ControlOrMeta+z");
  await expect(
    textbox(page).locator("[data-mention-id=doc-pricing]"),
  ).toHaveCount(1);
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.type(" ");
  await reference(page);
  await page.getByRole("button", { name: "Send message" }).click();
  expect((await payload(page))[1].data).toEqual([
    { id: "doc-pricing", name: "pricing.md" },
  ]);
});

test("failed responses retain the draft and retry keeps a single user message", async ({
  page,
}) => {
  await page.getByRole("checkbox", { name: "Fail the next response" }).check();
  await reference(page);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    textbox(page).locator("[data-mention-id=doc-pricing]"),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Retry response" }).click();
  await expect(page.getByRole("alert")).toBeHidden();
  await expect(textbox(page)).toHaveText("", { timeout: 10000 });
  await expect(
    page.locator('[data-slot="message-header"]').filter({ hasText: /^You$/ }),
  ).toHaveCount(1);
});

test("retrying an earlier message preserves a subsequently edited draft", async ({
  page,
}) => {
  await page.getByRole("checkbox", { name: "Fail the next response" }).check();
  await reference(page);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await textbox(page).focus();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.type("A new thought");
  await page.getByRole("button", { name: "Retry response" }).click();
  await expect(page.getByRole("button", { name: "Stop response" })).toBeHidden({
    timeout: 10000,
  });
  await expect(textbox(page)).toContainText("A new thought");
  expect((await payload(page))[0].text).not.toContain("A new thought");
});

test("stop preserves the draft and composition or Shift+Enter does not send", async ({
  page,
}) => {
  await textbox(page).focus();
  await page.keyboard.type("One line");
  await page.keyboard.press("Shift+Enter");
  await page.keyboard.type("Another line");
  await expect(page.getByTestId("submitted-context")).toHaveCount(0);
  await textbox(page).dispatchEvent("compositionstart");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("submitted-context")).toHaveCount(0);
  await textbox(page).dispatchEvent("compositionend");
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByRole("button", { name: "Stop response" }).click();
  await expect(textbox(page)).toContainText("One line");
  await expect(
    page.getByRole("button", { name: "Send message" }),
  ).toBeVisible();
});
