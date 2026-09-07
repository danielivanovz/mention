import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Consumer fixtures import the built package, including its exports map.
const harnessDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: harnessDir,
  plugins: [react()],
  resolve: {
    alias: {
      "@/registry": fileURLToPath(
        new URL("../../examples/registry", import.meta.url),
      ),
      "@/components/ui": fileURLToPath(
        new URL("../../../../apps/docs/src/components/ui", import.meta.url),
      ),
    },
  },
  server: {
    port: 5175,
    strictPort: true,
  },
});
