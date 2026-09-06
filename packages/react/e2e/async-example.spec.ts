import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const interaction of ["pointer", "keyboard"] as const) {
  test(`async example retries the unchanged query by ${interaction} and announces each outcome`, async ({
    page,
    browserName,
  }) => {
    await page.goto("/?example=async");
    const input = page.getByRole("textbox", { name: "Message", exact: true });
    const status = page.getByRole("status");
    const retry = page.getByRole("button", { name: "Retry search" });
    await expect(status).toBeEmpty();
    await input.fill("@al");
    await expect(status).toHaveText("Searching people…");
    await expect(page.getByRole("listbox")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(status).toHaveText("Could not load people. Try again.");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(input).not.toHaveAttribute("aria-controls");
    await expect(input).not.toHaveAttribute("aria-activedescendant");
    await expect(retry).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    if (interaction === "pointer") {
      await retry.click();
    } else {
      // WebKit's macOS default uses Option-Tab to include buttons.
      const tab =
        browserName === "webkit" && process.platform === "darwin"
          ? "Alt+Tab"
          : "Tab";
      await input.press(tab);
      await expect(retry).toBeFocused();
      await retry.press("Enter");
    }
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("@al");
    await expect(status).toHaveText("Searching people…");
    await expect(status).toHaveText(
      "1 person found. Use the arrow keys to choose.",
    );
    await expect(
      page.getByRole("option", { name: "Alice", exact: true }),
    ).toBeVisible();
    await expect(retry).toHaveCount(0);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await input.press("Enter");
    await expect(input).toHaveValue("@Alice ");
    await expect(input).toBeFocused();
    await input.fill("@nobody");
    await expect(status).toHaveText("Searching people…");
    await expect(status).toHaveText("No people found. Try another name.");
    await expect(page.getByRole("option")).toHaveCount(0);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test("editing during retry cannot reveal or select the obsolete result", async ({
  page,
}) => {
  await page.goto("/?example=async");
  const input = page.getByRole("textbox", { name: "Message", exact: true });
  await input.fill("@al");
  await page.getByRole("button", { name: "Retry search" }).click();
  await input.fill("@bo");
  await expect(
    page.getByRole("option", { name: "Bob", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { name: "Alice", exact: true }),
  ).toHaveCount(0);
  await input.press("Enter");
  await expect(input).toHaveValue("@Bob ");
});

for (const selection of ["caret before the trigger", "selected range"]) {
  test(`a ${selection} selection change clears obsolete recovery feedback`, async ({
    page,
  }) => {
    await page.goto("/?example=async");
    const input = page.getByRole("textbox", { name: "Message", exact: true });
    await input.fill("@al");
    const retry = page.getByRole("button", { name: "Retry search" });
    await expect(retry).toBeVisible();
    if (selection === "selected range") {
      await input.press("Shift+ArrowLeft");
    } else {
      for (let position = 0; position < 3; position++)
        await input.press("ArrowLeft");
    }
    await expect(retry).toHaveCount(0);
    await expect(page.getByRole("status")).toBeEmpty();
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(input).toHaveValue("@al");
  });
}

test("returning focus without changing the snapshot preserves recovery", async ({
  page,
}) => {
  await page.goto("/?example=async");
  const input = page.getByRole("textbox", { name: "Message", exact: true });
  const retry = page.getByRole("button", { name: "Retry search" });
  await input.fill("@al");
  await expect(retry).toBeVisible();
  await retry.focus();
  await input.focus();
  await expect(input).toBeFocused();
  await expect(retry).toBeVisible();
  await retry.click();
  await expect(
    page.getByRole("option", { name: "Alice", exact: true }),
  ).toBeVisible();
});
