#!/usr/bin/env node
// Build wrapper. Runs bunchee, copies the stylesheet, generates the
// shadcn registry. Filters the bunchee warning that fires for non-JS
// `exports` keys (`./styles.css`, `./registry.json`) — bunchee only
// inspects TS/JS sources, so those entries always trip its check.

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");

const SUPPRESS_PATTERNS = [
  /missing source files/,
  /^⨯ \.\/styles\.css/,
  /^⨯ \.\/registry\.json/,
  /^! The following exports are defined in package.json but missing/,
];

function filterLine(line) {
  return SUPPRESS_PATTERNS.some((p) => p.test(line));
}

function run(cmd, args, opts = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(cmd, args, { cwd: pkgRoot, ...opts });
    let stderrBuffer = "";

    child.stdout?.on("data", (chunk) => process.stdout.write(chunk));
    child.stderr?.on("data", (chunk) => {
      stderrBuffer += chunk.toString();
      let nl;
      while ((nl = stderrBuffer.indexOf("\n")) !== -1) {
        const line = stderrBuffer.slice(0, nl);
        stderrBuffer = stderrBuffer.slice(nl + 1);
        if (!filterLine(line)) process.stderr.write(`${line}\n`);
      }
    });
    child.on("close", (code) => {
      if (stderrBuffer && !filterLine(stderrBuffer))
        process.stderr.write(stderrBuffer);
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${cmd} exited with code ${code}`));
    });
    child.on("error", rejectRun);
  });
}

try {
  await run("bunchee", []);
  const { copyFileSync } = await import("node:fs");
  copyFileSync(resolve(pkgRoot, "src/styles.css"), resolve(pkgRoot, "dist/styles.css"));
  await run("node", ["scripts/build-registry.mjs"]);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
