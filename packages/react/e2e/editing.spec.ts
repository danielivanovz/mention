import { expect, test } from "@playwright/test";

test("controlled textarea publishes one value and preserves native undo and redo", async ({
  page,
  browserName,
}) => {
  await page.goto("/?controlled=1");
  const input = page.getByRole("combobox", { name: "Controlled", exact: true });
  await input.focus();
  await page.keyboard.type("hello @al");
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue("hello @alice ");
  await expect(page.getByTestId("controlled-value")).toHaveText(
    "hello @alice ",
  );
  expect(
    await page
      .locator("form")
      .evaluate((form) => new FormData(form as HTMLFormElement).get("message")),
  ).toBe("hello @alice ");
  await page.keyboard.press("ControlOrMeta+z");
  // WebKit may group preceding typing with insertText, depending on native history timing.
  await expect(input).toHaveValue(browserName === "webkit" ? /^(?:hello @al)?$/ : "hello @al");
  await page.keyboard.press("ControlOrMeta+Shift+Z");
  await expect(input).toHaveValue("hello @alice ");
  await expect(page.getByTestId("controlled-value")).toHaveText(
    "hello @alice ",
  );
});
test("standalone hook supports insertion without compound Input", async ({
  page,
}) => {
  await page.goto("/?controlled=1");
  const input = page.getByRole("combobox", { name: "Standalone", exact: true });
  await input.focus();
  await page.keyboard.type("@al");
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue("@alice ");
});
test("moving the caret before committing never rewrites unrelated text", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("combobox", { name: "Comment", exact: true });
  await input.focus();
  await page.keyboard.type("hello @al");
  await input.evaluate((el) =>
    (el as HTMLTextAreaElement).setSelectionRange(0, 0),
  );
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue("\nhello @al");
});
test("keyboard navigation reveals options below the popup scroll boundary", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("combobox", { name: "Comment", exact: true });
  await input.focus();
  await page.keyboard.type("@");
  for (let i = 0; i < 18; i++) await page.keyboard.press("ArrowDown");
  const active = page.locator('[role="option"][aria-selected="true"]');
  const option = await active.boundingBox();
  const list = await page.getByRole("listbox").boundingBox();
  expect(option!.y).toBeGreaterThanOrEqual(list!.y);
  expect(option!.y + option!.height).toBeLessThanOrEqual(
    list!.y + list!.height + 1,
  );
});
