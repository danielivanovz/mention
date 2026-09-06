import { expect, test } from "@playwright/test";

for (const popup of ["inline", "portal"]) {
  test(`pointer selection in the ${popup} popup waits for release and keeps editor focus`, async ({
    page,
  }) => {
    await page.goto(`/?popup=${popup}`);
    const input = page.getByRole("textbox", { name: "Comment", exact: true });
    await input.fill("@al");
    const option = page.getByRole("option", { name: /@alice/ });
    await option.hover();
    await page.mouse.down();
    await expect(input).toHaveValue("@al");
    await expect(input).toBeFocused();
    await page.mouse.up();
    await expect(input).toHaveValue("@alice ");
    await expect(input).toBeFocused();
    await expect(page.getByRole("listbox")).toHaveCount(0);
  });

  test(`dragging away from an option in the ${popup} popup cancels selection`, async ({
    page,
  }) => {
    await page.goto(`/?popup=${popup}`);
    const input = page.getByRole("textbox", { name: "Comment", exact: true });
    await input.fill("@");
    await page.getByRole("option", { name: /@alice/ }).hover();
    await page.mouse.down();
    await page.getByRole("option", { name: /@bob/ }).hover();
    await page.mouse.up();
    await expect(input).toHaveValue("@");
    await expect(input).toBeFocused();

    await page.getByRole("option", { name: /@alice/ }).hover();
    await page.mouse.down();
    await page.mouse.move(5, 5);
    await page.mouse.up();
    await expect(input).toHaveValue("@");
    await expect(input).toBeFocused();
    await page.getByRole("option", { name: /@alice/ }).click();
    await expect(input).toHaveValue("@alice ");
  });
}

test("a pointer release cannot insert after the editor selection changes", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Comment", exact: true });
  await input.fill("hello @al");
  await page.getByRole("option", { name: /@alice/ }).hover();
  await page.mouse.down();
  await input.evaluate((element) =>
    (element as HTMLTextAreaElement).setSelectionRange(0, 0),
  );
  await page.mouse.up();
  await expect(input).toHaveValue("hello @al");
  await expect(input).toBeFocused();
});

test("clicking a rich-editor suggestion inserts only on release", async ({
  page,
}) => {
  await page.goto("/?editor=1");
  const editor = page.getByRole("textbox", { name: "Rich message" });
  await editor.fill("@Al");
  await page.getByRole("option", { name: "Alice", exact: true }).hover();
  await page.mouse.down();
  await expect(editor).toHaveText("@Al");
  await expect(editor).toBeFocused();
  await page.mouse.up();
  await expect(editor.locator("[data-mention-id=alice]")).toHaveCount(1);
  await expect(editor).toBeFocused();
});

test("touch tap commits a suggestion and keeps editor focus", async ({
  browser,
  browserName,
  baseURL,
}) => {
  test.skip(
    browserName === "firefox",
    "Playwright Firefox has no touch emulation.",
  );
  const context = await browser.newContext({
    ...(baseURL ? { baseURL } : {}),
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto("/");
    const input = page.getByRole("textbox", { name: "Comment", exact: true });
    await input.fill("@al");
    await page.getByRole("option", { name: /@alice/ }).tap();
    await expect(input).toHaveValue("@alice ");
    await expect(input).toBeFocused();
  } finally {
    await context.close();
  }
});

test("touch scrolling the suggestion list does not select an item", async ({
  browser,
  browserName,
  baseURL,
}) => {
  test.skip(
    browserName !== "chromium",
    "Native gesture injection uses Chromium CDP.",
  );
  const context = await browser.newContext({
    ...(baseURL ? { baseURL } : {}),
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto("/");
    const input = page.getByRole("textbox", { name: "Comment", exact: true });
    await input.fill("@");
    const list = page.getByRole("listbox");
    const bounds = await list.boundingBox();
    if (!bounds) throw new Error("The suggestion list must be rendered.");
    const client = await context.newCDPSession(page);
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height - 30;
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (let offset = 20; offset <= 140; offset += 20)
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y - offset }],
      });
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(() => list.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    await expect(input).toHaveValue("@");
    await expect(input).toBeFocused();
  } finally {
    await context.close();
  }
});

test("pen release outside the pressed option cancels selection", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Pen input injection uses Chromium CDP.",
  );
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Comment", exact: true });
  await input.fill("@al");
  const option = page.getByRole("option", { name: /@alice/ });
  const bounds = await option.boundingBox();
  if (!bounds) throw new Error("The suggestion must be rendered.");
  const client = await page.context().newCDPSession(page);
  const point = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  const press = () =>
    client.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      ...point,
      button: "left",
      buttons: 1,
      clickCount: 1,
      pointerType: "pen",
    });
  const release = (x: number, y: number) =>
    client.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x,
      y,
      button: "left",
      buttons: 0,
      clickCount: 1,
      pointerType: "pen",
    });
  await press();
  await expect(input).toHaveValue("@al");
  await expect(input).toBeFocused();
  await client.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: 5,
    y: 5,
    button: "left",
    buttons: 1,
    pointerType: "pen",
  });
  await release(5, 5);
  await expect(input).toHaveValue("@al");
  await press();
  await release(point.x, point.y);
  await expect(input).toHaveValue("@alice ");
  await expect(input).toBeFocused();
});
