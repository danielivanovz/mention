import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Tiny harness app for the Playwright e2e suite. Imports `Mention` from
// ../../src directly — no package build required, the source IS the test
// surface. Lives at port 5175 to avoid colliding with the spike proto on
// 5174 if both are open at once during development.
//
// Vite's `root` defaults to `process.cwd()` (= packages/react/), not to
// this config file's directory — so we set it explicitly to point at the
// harness folder where index.html lives.
const harnessDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: harnessDir,
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
  },
});
