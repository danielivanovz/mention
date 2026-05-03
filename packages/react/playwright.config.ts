import { defineConfig, devices } from "@playwright/test";

// PR CI runs chromium only — three-browser sweeps triple wall time and
// rarely catch lib-level regressions that chromium misses. The full
// matrix runs locally and in nightly CI when CROSS_BROWSER=1.
const isCrossBrowser = process.env.CROSS_BROWSER === "1";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/harness/**"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5175",
    trace: "on-first-retry",
  },
  projects: isCrossBrowser
    ? [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
      ]
    : [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bun run e2e:dev",
    url: "http://localhost:5175",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
});
