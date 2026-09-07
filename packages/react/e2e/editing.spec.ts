import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`the popup follows identical queries when the caret moves at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const input = page.getByRole("textbox", { name: "Comment", exact: true });
    await input.evaluate((el) => {
      el.style.fontSize = "16px";
      el.style.lineHeight = "24px";
    });
    await input.fill("@a\n\n@a");
    const popup = page.getByRole("listbox", { name: "People", exact: true });
    await expect(popup).toBeVisible();
    const inputBox = await input.boundingBox();
    if (!inputBox) throw new Error("The input must be visible.");
    // Wait until Floating UI has placed the popup below the third line.
    await expect
      .poll(async () => (await popup.boundingBox())?.y ?? 0)
      .toBeGreaterThan(inputBox.y + 72);
    const original = await popup.boundingBox();
    if (!original) throw new Error("The popup must be positioned.");

    await input.click({ position: { x: 60, y: 20 } });
    await expect
      .poll(() =>
        input.evaluate((el) => (el as HTMLTextAreaElement).selectionStart),
      )
      .toBe(2);
    await expect
      .poll(async () => (await popup.boundingBox())?.y)
      .toBeCloseTo(original.y - 48, 0);
    await expect(input).toBeFocused();
    await input.press("Enter");
    await expect(input).toHaveValue("@alice\n\n@a");
  });
}

for (const popup of ["inline", "portal"]) {
  test(`opening and navigating the ${popup} popup preserves the page scroll position`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/?popup=${popup}`);
    await page.addStyleTag({
      content: "main { margin-block: 1200px !important; }",
    });
    const input = page.getByRole("textbox", { name: "Comment", exact: true });
    await input.click();
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
    await input.pressSequentially("@");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollY);
    for (let i = 0; i < 18; i++) await input.press("ArrowDown");
    await expect(input).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
    const option = await page
      .locator('[role="option"][aria-selected="true"]')
      .boundingBox();
    const list = await page.getByRole("listbox").boundingBox();
    if (!option || !list)
      throw new Error("The list and active option must be rendered.");
    expect(option.y).toBeGreaterThanOrEqual(list.y);
    expect(option.y + option.height).toBeLessThanOrEqual(
      list.y + list.height + 1,
    );
  });
}

test("controlled textarea publishes one value and preserves native undo and redo", async ({
  page,
  browserName,
}) => {
  await page.goto("/?controlled=1");
  const input = page.getByRole("textbox", { name: "Controlled", exact: true });
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
  await expect(input).toHaveValue(
    browserName === "webkit" ? /^(?:hello @al)?$/ : "hello @al",
  );
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
  const input = page.getByRole("textbox", { name: "Standalone", exact: true });
  await input.focus();
  await page.keyboard.type("@al");
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue("@alice ");
});
test("moving the caret before committing never rewrites unrelated text", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Comment", exact: true });
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
  const input = page.getByRole("textbox", { name: "Comment", exact: true });
  await input.focus();
  await page.keyboard.type("@");
  for (let i = 0; i < 18; i++) await page.keyboard.press("ArrowDown");
  const active = page.locator('[role="option"][aria-selected="true"]');
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute(
    "aria-activedescendant",
    (await active.getAttribute("id"))!,
  );
  const option = await active.boundingBox();
  const list = await page.getByRole("listbox").boundingBox();
  expect(option!.y).toBeGreaterThanOrEqual(list!.y);
  expect(option!.y + option!.height).toBeLessThanOrEqual(
    list!.y + list!.height + 1,
  );
});
