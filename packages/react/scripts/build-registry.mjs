#!/usr/bin/env node
// Build-time generator: emits `dist/registry.json` matching the shadcn-cli
// registry-item.json schema. Runs after bunchee in the package's `build`
// script. See `.misc/spike/003-shadcn-registry-shape.md` for the schema
// decisions this encodes.
//
// Inputs (read at generate time):
//   - `package.json`         → `name`, `version`, `dependencies` (lib deps
//                               that consumers also need)
//   - `src/registry/mention.tsx` → wrapper component, embedded as content
//   - `src/styles.css`       → CSS theme, embedded as content
//
// Output:
//   - `dist/registry.json`   → published with the package; consumers point
//                               shadcn-cli at it via `npx shadcn add
//                               file://.../dist/registry.json` or a URL
//                               that serves it.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const distDir = resolve(pkgRoot, "dist");

const pkg = JSON.parse(readFileSync(resolve(pkgRoot, "package.json"), "utf8"));

const wrapperSource = readFileSync(
  resolve(pkgRoot, "src/registry/mention.tsx"),
  "utf8",
);

const cssSource = readFileSync(resolve(pkgRoot, "src/styles.css"), "utf8");

// Pin the lib dep to the current version. shadcn-cli will install
// `@danielivanov/mention@<version>` alongside the registry item, so the wrapper's
// `import { Mention } from "@danielivanov/mention"` resolves correctly. We also
// declare `@floating-ui/react-dom` explicitly even though it's already a
// transitive dep — being explicit avoids hoisting surprises across pm's.
const dependencies = [
  `${pkg.name}@^${pkg.version}`,
  ...Object.entries(pkg.dependencies ?? {}).map(
    ([name, version]) => `${name}@${version}`,
  ),
];

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "mention",
  title: "Mention",
  description:
    "Headless, a11y-first @-trigger autocomplete primitive for textareas.",
  type: "registry:ui",
  author: pkg.author ?? "",
  dependencies,
  registryDependencies: [],
  files: [
    {
      path: "ui/mention.tsx",
      content: wrapperSource,
      type: "registry:ui",
      target: "components/ui/mention.tsx",
    },
    {
      path: "ui/mention.css",
      content: cssSource,
      type: "registry:ui",
      target: "components/ui/mention.css",
    },
  ],
  categories: ["form", "input"],
};

mkdirSync(distDir, { recursive: true });
const outPath = resolve(distDir, "registry.json");
writeFileSync(outPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");

console.log(
  `[build-registry] wrote ${outPath} (${registry.files.length} files, ${dependencies.length} npm deps)`,
);
