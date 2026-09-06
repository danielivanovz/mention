import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?editor=1");
  await page.getByRole("combobox", { name: "Rich message" }).focus();
});
test("chips are document nodes and survive later mentions in another paragraph", async ({
  page,
}) => {
  const editor = page.getByRole("combobox", { name: "Rich message" });
  await page.keyboard.type("@Al");
  await page.keyboard.press("Enter");
  await expect(editor.locator("[data-mention-id=alice]")).toHaveText("@Alice");
  await page.keyboard.type("hello");
  await page.keyboard.press("Enter");
  await page.keyboard.type("@Bo");
  await page.keyboard.press("Enter");
  await expect(editor.locator("p")).toHaveCount(2);
  await expect(editor.locator("[data-mention-id]")).toHaveCount(2);
  const doc = JSON.parse(
    (await page.getByTestId("editor-document").textContent()) ?? "{}",
  );
  expect(doc.content[0].content[0]).toMatchObject({
    type: "mention",
    attrs: { id: "alice", label: "Alice" },
  });
  expect(doc.content[1].content[0]).toMatchObject({
    type: "mention",
    attrs: { id: "bob", label: "Bob" },
  });
});
test("undo restores the query, redo restores the chip, and deletion is undoable", async ({
  page,
}) => {
  const editor = page.getByRole("combobox", { name: "Rich message" });
  await page.keyboard.type("@Al");
  await page.keyboard.press("Enter");
  await page.keyboard.press("ControlOrMeta+z");
  await expect(editor.locator("[data-mention-id]")).toHaveCount(0);
  await expect(editor).toHaveText("@Al");
  await page.keyboard.press("ControlOrMeta+Shift+Z");
  await expect(editor.locator("[data-mention-id=alice]")).toHaveCount(1);
  await page.keyboard.press("Backspace"); // separator
  await page.keyboard.press("Backspace"); // node selection or deletion, owned by ProseMirror
  if (await editor.locator("[data-mention-id]").count())
    await page.keyboard.press("Backspace");
  await expect(editor.locator("[data-mention-id]")).toHaveCount(0);
  await page.keyboard.press("ControlOrMeta+z");
  await expect(editor.locator("[data-mention-id=alice]")).toHaveCount(1);
});
test("rich paste and mention insertion preserve formatting and block boundaries", async ({
  page,
}) => {
  const editor = page.getByRole("combobox", { name: "Rich message" });
  await editor.evaluate((el) => {
    const data = new DataTransfer();
    data.setData("text/html", "<p><strong>Heading</strong></p><p>@Bo</p>");
    data.setData("text/plain", "Heading\n@Bo");
    const event = new Event("paste", { bubbles: true, cancelable: true });
    // Supply the clipboard payload explicitly: Firefox does not preserve
    // clipboardData passed to an untrusted ClipboardEvent constructor.
    Object.defineProperty(event, "clipboardData", { value: data });
    el.dispatchEvent(event);
  });
  await expect(editor.locator("strong")).toHaveText("Heading");
  await expect(page.getByRole("option", { name: "Bob" })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(editor.locator("strong")).toHaveText("Heading");
  await expect(editor.locator("p")).toHaveCount(2);
  await expect(editor.locator("[data-mention-id=bob]")).toHaveCount(1);
});
