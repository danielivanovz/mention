import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// Real layout is needed to verify caret positioning.
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
