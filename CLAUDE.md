# mention

`@danielivanov/mention` is a React mention library. Aim for excellent editing behavior and integration with both native textareas and rich editors, using the smallest implementation that proves those behaviors.

## Layout

- `packages/react/src`: published library
- `packages/react/examples/ProseMirror.tsx`: executable editor integration, also used by docs
- `packages/react/e2e`: browser interaction and accessibility checks
- `apps/docs`: Next.js/Fumadocs documentation
- `.misc/spike`: ignored historical investigations, not the current API contract

## Ownership

Mention owns trigger detection, suggestion requests, highlighting, keyboard selection, and popover positioning. The editor owns the document, selection representation, insertion transactions, mention nodes, clipboard behavior, and history.

`EditorAdapter.read()` provides one editable text region and a collapsed caret. `replace()` receives a range relative to that region. Never flatten a rich document or mutate its DOM from the core. The built-in textarea adapter registers through `getInputProps()`; external editors register through `setEditor()` and call `refresh()` after transactions and selection changes.

Results belong to a request session. Never expose old results under a new trigger or allow insertion after the document/selection changed. Sync filtering is derived during render.

## Verification

From the repo root:
- `bun run build`: build the publishable library
- `bun run type-check`: library, examples, and docs types
- `bun run test`: fast tests
- `bun run test:e2e`: browser contracts against the built package
- `bun run size`: 14 kB gzip budget
- `bun run docs:build`: production docs build

From `packages/react`, `bun run test:browser` checks textarea caret geometry. `CROSS_BROWSER=1 bun run test:e2e` adds Firefox and WebKit. Manual assistive-technology and OS IME checks remain separate; automated tests do not establish screen-reader usability.

## Conventions

React 19. The package is a client boundary. Floating UI is the only runtime dependency. Keep normal React event handlers, refs, and styling props usable. Supply list item types explicitly because React context cannot infer them from Root. npm is the distribution path; CSS is opt-in and accepts shadcn variables.

Ask before deployment unless the user explicitly authorized it.
