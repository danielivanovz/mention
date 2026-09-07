# Refactor corrections, 7 September 2026

Verified in the local working tree based on `918fde6`. These results describe the modified source and its local production build, not a published package or deployment.

## Changes

- Installation commands now require `@danielivanov/mention@^0.2.0`, matching the documented API. The README records the npm trusted-publisher configuration and public release checks.
- The AI composer resolver accepts ordinary assistant step boundaries emitted by AI SDK. Unsupported content and user-supplied system messages remain rejected.
- The suggestion popup follows editor snapshots, including caret moves between identical queries.
- ProseMirror insertion preserves the editor's active marks on both the mention and separator.

## Verification

- Each code regression failed before its fix and passed afterward: a real SDK stream followed by a second conversation turn; identical-query caret movement at 1440 and 390 CSS pixels; bold insertion, undo, redo, and continued typing in ProseMirror.
- All 99 unit tests and 191 Chromium/Firefox/WebKit checks passed. Seven existing browser cases were skipped. All 21 browser caret checks passed.
- Library, example, and docs types passed. The production website build passed. The package measured 12.44 kB gzip against its 14 kB budget.
- Registry validation passed with shadcn 4.21.0. The Bun launcher had an existing missing-module cache error; running the same CLI version through npm succeeded.
- A fresh React 19 consumer installed the local 0.2.0 tarball and compiled the unchanged quickstart and current editor API. It used the normal ambient CSS declaration for bundler imports, and the tarball contained the exported stylesheet. This verifies the local artifact, not npm availability.
- Four production-site Chromium checks passed: installation command copying at desktop/mobile widths, plus byte-for-byte copying and Markdown export of the complete ProseMirror and server resolver sources. Temporary checks were removed after execution.
- The mobile installation command wraps within its control in both themes. Desktop/mobile pages had no horizontal overflow. Focus and page scrolling remain covered by the browser suites. No new design rules were introduced.
- Scoped Biome checks and `git diff --check` passed. Existing non-null-assertion warnings in the edited example/test files remain. Real OS IME and assistive-technology checks were not performed.

## Public release blocker

npm still serves 0.1.0. Release run `34062174427` failed with `ENEEDAUTH` despite Node 24.20.0, npm 11.19.0, and GitHub OIDC permission. Initial inspection was blocked by invalid local authentication and rate-limited website sign-in. After the user signed in, the package settings confirmed that no trusted publisher was configured. With the user's approval and two-factor verification, the GitHub Actions connection for `danielivanovz/mention`, workflow `release.yml`, blank environment, and **Allow npm publish** was saved. npm confirmed success and listed the connection with both direct and staged publishing permissions. Actual workflow authentication still requires a release run to verify. No runtime upgrade or guessed workflow change was made.

Publishing 0.2.0, making the registry source available on GitHub, verifying the public installation, and deploying the corresponding documentation remain outstanding. No publication or deployment was performed. The preexisting untracked `apps/docs/vercel.json` was left untouched.
