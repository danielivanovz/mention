import path from "node:path";
import { fileURLToPath } from "node:url";

import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

const here = path.dirname(fileURLToPath(import.meta.url));
// Repo root = two levels up: apps/docs → apps → repo. Pinning Turbopack's
// root prevents Next from picking up a stray ~/package-lock.json or any
// outer lockfile and inferring the wrong workspace boundary.
const repoRoot = path.resolve(here, "../..");

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/docs/integrations/rich-text",
        destination: "/docs/rich-text",
        permanent: true,
      },
      { source: "/internals", destination: "/docs/internals", permanent: true },
      {
        source: "/internals/caret-anchoring",
        destination: "/docs/internals/caret-anchoring",
        permanent: true,
      },
      {
        source: "/internals/aria-contract",
        destination: "/docs/internals/interaction",
        permanent: true,
      },
    ];
  },
  turbopack: {
    root: repoRoot,
  },
  // `transpilePackages` tells Next to run the workspace lib through its
  // own SWC pipeline rather than treating it as an opaque pre-built dep.
  // The lib still resolves through its `exports` map to `dist/`, so a
  // manual `bun run build` (or `bunchee --watch` in a second terminal)
  // is still required to pick up source changes during docs dev.
  // Trade-off chosen on 2026-04-29: keep the workspace contract honest
  // (docs imports the same bundle npm consumers do) at the cost of a
  // less-instant inner loop.
  transpilePackages: ["@danielivanov/mention"],
};

export default withMDX(config);
