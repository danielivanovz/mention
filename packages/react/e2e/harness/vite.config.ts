import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Consumer fixtures import the built package, including its exports map.
const harnessDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: harnessDir,
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
  },
});
