import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Automated a11y sweeps. Real-AT testing (NVDA/JAWS/VoiceOver/TalkBack)
// is captured separately in the manual matrix; axe handles the static
// rules.

test.describe("automated a11y (axe-core)", () => {
  test("idle state has no detectable WCAG 2.1 AA violations", async ({
    page,
  }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("with the listbox open, no detectable WCAG 2.1 AA violations", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("combobox", { name: /comment/i }).focus();
    await page.keyboard.type("@");
    await expect(page.getByRole("listbox")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("ARIA-specific rules (best-practice) flag only the documented exception", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("combobox", { name: /comment/i }).focus();
    await page.keyboard.type("@");

    const results = await new AxeBuilder({ page })
      .withTags(["cat.aria", "best-practice"])
      // Known findings are tracked separately below. The textarea role
      // conflicts with HTML-ARIA; the body portal sits outside landmarks.
      .disableRules(["aria-allowed-role", "region"])
      .analyze();

    if (results.violations.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        "axe ARIA/best-practice violations (excluding aria-allowed-role):",
        JSON.stringify(results.violations, null, 2),
      );
    }
    expect(results.violations).toEqual([]);
  });

  test("the `aria-allowed-role` exception is the ONLY best-practice violation", async ({
    page,
  }) => {
    // Regression guard: if anything else shows up in cat.aria/best-
    // practice, the contract changed underneath us — fail loudly with
    // the offending rule id so the diff is visible.
    await page.goto("/");
    await page.getByRole("combobox", { name: /comment/i }).focus();
    await page.keyboard.type("@");

    const results = await new AxeBuilder({ page })
      .withTags(["cat.aria", "best-practice"])
      .analyze();

    const violationIds = results.violations.map((v) => v.id).sort();
    expect(violationIds).toEqual(["aria-allowed-role", "region"]);
  });
});
