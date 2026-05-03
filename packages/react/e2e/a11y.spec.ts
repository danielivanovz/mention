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
      // KNOWN EXCEPTIONS — both are best-practice rules (not WCAG) that
      // conflict with patterns shipped by every production React UI lib.
      //
      // 1. `aria-allowed-role` — see Spike 001 finding "HTML-ARIA
      //    conformance" and ADR-0001. The HTML-ARIA conformance table
      //    forbids `role="combobox"` on `<textarea>`, but ARIA 1.2
      //    permits it (combobox is role-applicable to any editable
      //    surface). Ariakit, GitHub, Slack, and Linear ship this. The
      //    combobox-as-substring contract requires DOM focus to stay on
      //    the textarea — an external focus-stealing combobox would
      //    break IME and soft-keyboards. Spike's manual AT matrix
      //    (`AT-TEST-PLAN.md`, walked 2026-04-29) confirms NVDA / JAWS
      //    / VoiceOver / TalkBack handle the pattern correctly.
      //
      // 2. `region` — wants every node inside a landmark, but the
      //    listbox is portaled to `document.body` (I5) so it can escape
      //    `overflow: hidden` ancestors. Every popover library that
      //    portals (Radix, Ariakit, MUI, Headless UI) trips this rule.
      //    AT navigation to options goes through `aria-controls` +
      //    `aria-activedescendant`, not landmark jumps — users reach
      //    the options via arrow-keys-on-textarea, not via region nav.
      //    Consumers who want strict landmark coverage can pass
      //    `<Mention.Popover container={mainEl}>` to keep the listbox
      //    inside their landmark.
      //
      // The WCAG 2.1 AA sweep (the other tests in this file) passes
      // unconditionally — these exceptions affect only best-practice.
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
