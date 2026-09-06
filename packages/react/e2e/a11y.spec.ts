import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("idle textareas pass all automated accessibility rules", async ({
  page,
}) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("scrollable suggestions report only the keyboard-scroll heuristic", async ({
  page,
}) => {
  await page.goto("/?popup=inline");
  const input = page.getByRole("textbox", { name: "Comment", exact: true });
  await input.fill("@");
  await expect(
    page.getByRole("listbox", { name: "People", exact: true }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  // Axe exempts controlled combobox popups from this heuristic, but not textboxes.
  // editing.spec.ts verifies keyboard access to options beyond the scroll boundary.
  expect(results.violations.map((v) => v.id)).toEqual([
    "scrollable-region-focusable",
  ]);
});

test("a body portal adds only the landmark finding, with no role exception", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Comment", exact: true }).fill("@");
  await expect(
    page.getByRole("listbox", { name: "People", exact: true }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => v.id).sort()).toEqual([
    "region",
    "scrollable-region-focusable",
  ]);
});
