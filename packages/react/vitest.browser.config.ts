import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// Browser-mode vitest config — used only for `caret.browser.test.ts`.
// happy-dom doesn't compute layout (it has no rendering engine), so the
// caret mutation score is artificially low: pixel-math mutants like
// `borderTopWidth + → -` are unobservable when every layout read returns
// 0. Running the same caret tests in a real Playwright/chromium frame
// gives layout reads real values, which kills those mutants.
//
// Scoped narrowly:
//   - `include` matches only `*.browser.test.ts(x)` so the rest of the
//     suite stays in the fast happy-dom config (`vitest.config.ts`).
//   - `provider: "playwright"` reuses the Playwright browsers already
//     installed for our e2e tests — no second binary to manage.
//   - `headless: true` matches CI; locally toggle via `--ui` if needed.
//
// Stryker drives this via `stryker.browser.config.json`.
export default defineConfig({
  test: {
    include: ["src/**/*.browser.test.ts", "src/**/*.browser.test.tsx"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
    globals: false,
    clearMocks: true,
  },
});
