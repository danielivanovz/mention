import { defineConfig } from "@playwright/test";

// Set CROSS_BROWSER=1 for the full engine matrix.
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
        { name: "chromium", use: { browserName: "chromium" } },
        { name: "firefox", use: { browserName: "firefox" } },
        { name: "webkit", use: { browserName: "webkit" } },
      ]
    : [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: "bun run e2e:dev",
    url: "http://localhost:5175",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
});
