import { defineConfig } from "vitest/config";

// Default env is `node` so the reducer/text suites stay sub-100 ms.
// Component tests opt-in to happy-dom with a top-of-file pragma:
//
//   // @vitest-environment happy-dom
//
// Per TESTING.md §"The feedback loop":
//   - `bun run test:unit:watch` is the primary watch loop (sub-second).
//   - `bun run test:smoke` is the pre-commit gate (~1.5 s).
//   - `bun run test` is the full local suite (currently == test:unit
//      until I8 ports the Playwright e2e from the spike's proto/).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "examples/*.test.ts"],
    // *.browser.test.ts(x) runs under @vitest/browser via
    // vitest.browser.config.ts — skip in the default (happy-dom/node)
    // run so the caret browser tests aren't executed in an env that
    // can't satisfy their pixel assertions.
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "src/**/*.browser.test.ts",
      "src/**/*.browser.test.tsx",
    ],
    setupFiles: ["./vitest.setup.ts"],
    globals: false,
    clearMocks: true,
  },
});
