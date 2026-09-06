# Mention

Shared repository guidance. `CLAUDE.md` is a relative symlink to this file; maintain the instructions here.

`@danielivanov/mention` is a headless React mention library for native textareas and rich editors. Pursue excellent editing and integration behavior with the smallest implementation that proves it. Prefer deletion over simplification, simplification over optimization, and optimization over automation.

## Working agreements

- Carry authorized work through implementation and appropriate verification. Resolve routine, reversible choices from context; ask when a missing answer materially changes scope or consequences.
- Incorporate follow-up corrections without dropping the original objective. Keep updates concise and report observed results and remaining limits.
- Apply relevant skills within the user's requested scope. If a skill causes a pause or an approval request, identify its exact file and instruction, and explain why existing authorization does not cover the action.
- Delegate only concrete, independent subtasks when useful; keep overlapping edits serial. Small changes do not need an agent team.
- Ask before deployment unless the user has explicitly authorized that deployment. Complete local preparation and verification before requesting approval.

## Source of truth

- [Library source](packages/react/src) and its tests define the current API. [Package scripts](package.json) and [CI](.github/workflows/ci.yml) define the available checks.
- [Executable examples](packages/react/examples) supply the composer, controlled form, and ProseMirror integration used by docs and browser fixtures. ProseMirror is the implemented rich-editor example; other adapters need their own evidence.
- [Documentation content](apps/docs/content/docs) supplies HTML articles, search, and Markdown exports. Include actual example files with Fumadocs `<include>`; keep copied code and agent exports aligned with the running examples.
- For website work, read [PRODUCT.md](apps/docs/PRODUCT.md) and [DESIGN.md](apps/docs/DESIGN.md). Extend the established design and shared header. Update those records when product or design decisions change; record substantive UI verification in `apps/docs/.impeccable/reviews`.
- `.misc/spike` contains ignored historical investigations, not current API requirements. Verification reports describe the revision tested, not permanent guarantees.

## Library boundaries

Mention owns trigger detection, suggestion requests, highlighting, keyboard selection, and popover positioning. The editing host owns its document, selection representation, insertion transactions, mention nodes, clipboard behavior, and history. Do not flatten a rich document or mutate its DOM from the core.

`EditorAdapter.read()` supplies one editable text region and a collapsed caret. Snapshot and replacement offsets use UTF-16 within that region; use a region key when identical text can occur in different places. The textarea adapter registers through `getInputProps()`. External editors register through `setEditor()` and call `refresh()` after document and selection changes.

Results belong to their request session. Reject obsolete results and insertion into a changed document or selection. Derive synchronous filtering during render. A dismissal applies to the unchanged snapshot, and clears when the snapshot changes.

Preserve native textarea semantics and ordinary React handlers, refs, and form props. Rich editors supply their textbox role and multiline state; Mention supplies suggestion relationships. Keep focus in the editor and scroll the suggestion list without moving the page. Preserve composition and modified-key handling. `onSelect` reports insertion; it is not an inventory of mentions remaining in the document.

The package requires React 19 and exposes a client boundary. Floating UI is its only runtime dependency. CSS is opt-in and accepts shadcn variables. Supply `Mention.List<T>` types explicitly: React context cannot infer them from Root. Framework examples with state, event handlers, or render callbacks need their own client boundary.

## Verification

Match checks to the changed behavior. Add regressions for reproduced defects, preferably in existing suites. Once relevant checks pass, repeat or broaden them only for a new change, failure, or unresolved concern.

Run these commands from the repository root as needed:

| Command | Purpose |
| --- | --- |
| `bun install --frozen-lockfile` | Install existing workspace dependencies |
| `bun run build` | Build the publishable package |
| `bun run type-check` | Build the package and check library, examples, and docs types |
| `bun run test` | Unit and property tests |
| `bun run test:e2e` | Build the package and check Chromium interaction contracts |
| `CROSS_BROWSER=1 bun run test:e2e` | Add Firefox and WebKit for editing, focus, ARIA, and scrolling changes |
| `bun run size` | Check the built package against the 14 kB gzip budget |
| `bun run docs:build` | Build the package and production website |

For caret measurement changes, run `bun run test:browser` from `packages/react`; real browser layout is required. Run package-specific test filters and scoped Biome checks from the relevant workspace directory. Avoid repository-wide formatter writes.

Docs and consumer browser fixtures import `packages/react/dist` through the published exports. Build the package before checking library changes there; the root scripts above already do so where indicated. Stop a production preview serving `apps/docs/.next` before rebuilding that directory, then restart it.

For UI changes, exercise the actual affected states at desktop and mobile widths, including keyboard behavior, theme contrast, focus, and page scroll. Verify full code copying and Markdown exports when changing examples. Instruction-only changes need file, link, command, and diff checks rather than the library test suite.

Automated accessibility checks do not establish screen-reader or real OS IME compatibility. Keep findings and unperformed manual checks explicit; consult the [accessibility guide](apps/docs/content/docs/accessibility.mdx).

## Website addresses

Use relative navigation links and the current browser/request origin for prompts and text exports. Static metadata uses configured deployment origins and omits absolute metadata when unconfigured. Keep this policy in [site.ts](apps/docs/src/lib/site.ts); see the [website README](apps/docs/README.md) for environment variables. Never embed a development hostname or port in product links.
