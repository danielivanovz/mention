import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("the quickstart's actual component supports selection, empty results and multiline input", async ({
  page,
}) => {
  await page.goto("/?example=composer");
  const input = page.getByRole("textbox", { name: "Message", exact: true });
  await input.fill("@al");
  await expect(
    page.getByRole("option", { name: "Alice", exact: true }),
  ).toBeVisible();
  await input.press("Enter");
  await expect(input).toHaveValue("@Alice ");
  await expect(input).toBeFocused();
  await input.press("Enter");
  await input.pressSequentially("Second line");
  await expect(input).toHaveValue("@Alice \nSecond line");
  await input.fill("@nobody");
  await expect(
    page.getByText("No people found. Try another name.", { exact: true }),
  ).toBeVisible();
  await input.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(input).toHaveValue("@nobody");
});

test("the form validates, preserves selection behavior and submits the actual field value", async ({
  page,
}) => {
  await page.goto("/?example=form");
  const input = page.getByRole("textbox", { name: "Message", exact: true });
  await page
    .getByRole("button", { name: "Submit message", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveText(
    "Enter a message before submitting.",
  );
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toBeFocused();
  await input.fill("@al");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await input.press("Enter");
  await expect(input).toHaveValue("@Alice ");
  await expect(page.getByRole("status")).not.toContainText(
    "Submitted locally:",
  );
  await page
    .getByRole("button", { name: "Submit message", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "Submitted locally: @Alice ",
  );
  await expect(input).toHaveValue("@Alice ");
  await input.fill("Another message");
  await expect(page.getByRole("status")).not.toContainText(
    "Submitted locally:",
  );
});

test("form reset clears controlled state and an open suggestion session, and returns focus", async ({
  page,
}) => {
  await page.goto("/?example=form");
  const input = page.getByRole("textbox", { name: "Message", exact: true });
  await input.fill("@b");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page
    .getByRole("form", { name: "Message form" })
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(input).not.toHaveAttribute("aria-controls");
  // A paste can restore the entire previous query in a single input event.
  await input.fill("@b");
  await expect(page.getByRole("listbox")).toBeVisible();
  await input.press("Tab");
  await expect(input).toHaveValue("@Bob ");
  await expect(input).toBeFocused();
  await input.press("Tab");
  // Native tab destinations depend on the browser's full keyboard access setting.
  await expect(input).not.toBeFocused();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await input.pressSequentially("@b");
  await expect(page.getByRole("listbox")).toBeVisible();
  await input.press("Enter");
  await expect(input).toHaveValue("@Bob ");
});

test("the executable examples pass unfiltered accessibility checks in their relevant states", async ({
  page,
}) => {
  for (const example of ["composer", "form"]) {
    await page.goto(`/?example=${example}`);
    if (example === "form") {
      await page.getByRole("button", { name: "Submit message" }).click();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
    await page.getByRole("textbox", { name: "Message", exact: true }).fill("@");
    await expect(page.getByRole("listbox")).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
});
