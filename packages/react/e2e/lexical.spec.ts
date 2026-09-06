import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?example=lexical");
  await page.getByRole("textbox", { name: "Lexical message" }).focus();
});

test("inserts token nodes across blocks and saves/restores their IDs and formatting", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", { name: "Lexical message" });
  await page.keyboard.type("@Al");
  await expect(page.getByRole("option", { name: "Alice Chen" })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(editor.locator("[data-mention-id=alice]")).toHaveText(
    "@Alice Chen",
  );
  await page.keyboard.type("hello");
  await page.keyboard.press("Enter");
  await page.keyboard.press("ControlOrMeta+b");
  await page.keyboard.type("@Bo");
  await page.keyboard.press("Enter");
  await expect(editor.locator("p")).toHaveCount(2);
  await expect(editor.locator("[data-mention-id=bob]")).toHaveText(
    "@Bob Rivera",
  );
  const before = JSON.parse(
    (await page.getByTestId("lexical-document").textContent()) ?? "{}",
  );
  expect(before.root.children[0].children[0]).toMatchObject({
    type: "mention",
    mentionId: "alice",
    mentionLabel: "Alice Chen",
    mode: "token",
  });
  expect(before.root.children[1].children[0]).toMatchObject({
    type: "mention",
    mentionId: "bob",
    format: 1,
  });
  await page.getByRole("button", { name: "Save snapshot" }).click();
  await page.getByRole("button", { name: "Clear editor" }).click();
  await expect(editor.locator("[data-mention-id]")).toHaveCount(0);
  await page.getByRole("button", { name: "Restore snapshot" }).click();
  await expect(editor.locator("[data-mention-id]")).toHaveCount(2);
  await expect(page.getByTestId("lexical-document")).toHaveText(
    JSON.stringify(before),
  );
});

test("undo restores the query, redo restores the token, and token deletion is undoable", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", { name: "Lexical message" });
  await page.keyboard.type("@Al");
  await page.keyboard.press("Enter");
  await expect(editor.locator("[data-mention-id=alice]")).toHaveCount(1);
  await page.keyboard.press("ControlOrMeta+z");
  await expect(editor.locator("[data-mention-id]")).toHaveCount(0);
  await expect(editor).toHaveText("@Al");
  await page.keyboard.press("ControlOrMeta+Shift+Z");
  await expect(editor.locator("[data-mention-id=alice]")).toHaveCount(1);
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await expect(editor.locator("[data-mention-id]")).toHaveCount(0);
  await page.keyboard.press("ControlOrMeta+z");
  await expect(editor.locator("[data-mention-id=alice]")).toHaveCount(1);
});

test("maps UTF-16 through formatted text, cancels moved selections, and preserves suffix text", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", { name: "Lexical message" });
  await page.keyboard.insertText("🙂 @A");
  await page.keyboard.press("ControlOrMeta+b");
  await page.keyboard.type("l");
  await expect(page.getByRole("option", { name: "Alice Chen" })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(editor).toHaveText("🙂 @Alice Chen ");
  await page.keyboard.type("@Bo");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Enter");
  await expect(editor.locator("[data-mention-id=bob]")).toHaveCount(0);
  await page.getByRole("button", { name: "Clear editor" }).click();
  await page.keyboard.type("@Al after");
  for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowLeft");
  await expect
    .poll(() => editor.evaluate(() => window.getSelection()?.anchorOffset))
    .toBe(3);
  await expect(page.getByRole("option", { name: "Alice Chen" })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(editor).toHaveText("@Alice Chen after");
});

test("HTML paste imports mention IDs and formatting without flattening blocks", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", { name: "Lexical message" });
  await editor.evaluate((element) => {
    const data = new DataTransfer();
    data.setData(
      "text/html",
      '<p><strong>Heading</strong></p><p><span data-mention-id="alice" data-mention-label="Alice Chen">@Alice Chen</span> @Bo</p>',
    );
    data.setData("text/plain", "Heading\n@Alice Chen @Bo");
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: data });
    element.dispatchEvent(event);
  });
  await expect(editor.locator("strong,b")).toHaveText("Heading");
  await expect(editor.locator("[data-mention-id=alice]")).toHaveText(
    "@Alice Chen",
  );
  await expect(page.getByRole("option", { name: "Bob Rivera" })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(editor.locator("[data-mention-id]")).toHaveCount(2);
  await expect(editor.locator("p")).toHaveCount(2);
});

test("native copy, cut and paste retain token IDs", async ({
  page,
  browserName,
  context,
}) => {
  test.skip(
    browserName !== "chromium",
    "Native clipboard round-trip is covered in Chromium; HTML import runs in every engine.",
  );
  const editor = page.getByRole("textbox", { name: "Lexical message" });
  await page.keyboard.type("@Al");
  await page.keyboard.press("Enter");
  await expect(editor.locator("[data-mention-id=alice]")).toHaveCount(1);
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("ControlOrMeta+c");
  await context.grantPermissions(["clipboard-read"]);
  const copied = await page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    if (!item) throw new Error("Expected copied item");
    return {
      html: await (await item.getType("text/html")).text(),
      text: await navigator.clipboard.readText(),
    };
  });
  expect(copied.html).toContain('data-mention-id="alice"');
  expect(copied.html).toContain('data-mention-label="Alice Chen"');
  expect(copied.text.trim()).toBe("@Alice Chen");
  await page.getByRole("button", { name: "Clear editor" }).click();
  await page.keyboard.press("ControlOrMeta+v");
  await expect(editor.locator("[data-mention-id=alice]")).toHaveCount(1);
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("ControlOrMeta+x");
  await expect(editor.locator("[data-mention-id]")).toHaveCount(0);
  await page.keyboard.press("ControlOrMeta+v");
  await expect(editor.locator("[data-mention-id=alice]")).toHaveCount(1);
});

test("a native caret move cannot commit an obsolete suggestion before selectionchange", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", { name: "Lexical message" });
  await page.keyboard.type("@Al");
  const option = page.getByRole("option", { name: "Alice Chen" });
  await expect(option).toBeVisible();
  await editor.evaluate((element) => {
    const text = element.querySelector("[data-lexical-text]")?.firstChild;
    if (!text) throw new Error("Expected text node");
    element.ownerDocument.getSelection()?.setPosition(text, 0);
    (
      element.ownerDocument.querySelector('[role="option"]') as HTMLElement
    ).click();
  });
  await expect(editor.locator("[data-mention-id]")).toHaveCount(0);
  await expect(editor).toHaveText("@Al");
});

test("composition suspends suggestions and resumes after composition ends", async ({
  page,
  browserName,
}) => {
  const editor = page.getByRole("textbox", { name: "Lexical message" });
  await page.keyboard.type("@Al");
  await expect(page.getByRole("listbox")).toBeVisible();
  await editor.dispatchEvent("compositionstart", { data: "" });
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await editor.dispatchEvent("keydown", {
    key: "Enter",
    isComposing: true,
    keyCode: 229,
  });
  await expect(editor.locator("[data-mention-id]")).toHaveCount(0);
  // Safari commits with insertFromComposition; Firefox follows compositionend with input.
  // A bare compositionend leaves Lexical waiting for these native commit events.
  if (browserName === "webkit") {
    await editor.evaluate((element) =>
      element.dispatchEvent(
        new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          inputType: "insertFromComposition",
          data: "",
          isComposing: false,
        }),
      ),
    );
  }
  await editor.dispatchEvent("compositionend", { data: "" });
  await editor.evaluate((element) =>
    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertCompositionText",
        data: "",
        isComposing: false,
      }),
    ),
  );
  // This emulates lifecycle guards only; it is not a real OS IME claim.
  await page.keyboard.type("i");
  await expect(page.getByRole("option", { name: "Alice Chen" })).toBeVisible();
});

test("pointer selection can be canceled and keeps editor focus when completed", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", { name: "Lexical message" });
  await page.keyboard.type("@Al");
  const option = page.getByRole("option", { name: "Alice Chen" });
  const box = await option.boundingBox();
  if (!box) throw new Error("Expected visible option");
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await expect(editor.locator("[data-mention-id]")).toHaveCount(0);
  await page.mouse.move(1, 1);
  await page.mouse.up();
  await expect(editor.locator("[data-mention-id]")).toHaveCount(0);
  await option.click();
  await expect(editor.locator("[data-mention-id=alice]")).toHaveCount(1);
  await expect(editor).toBeFocused();
});
