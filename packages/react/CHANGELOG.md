# @danielivanov/mention

## 0.1.0

### Minor Changes

- 3f31649: Initial release of `@danielivanov/mention` — a headless, a11y-first React mention (`@`-trigger autocomplete) primitive for `<textarea>` and contenteditable hosts.

  **API**

  - Compound parts: `<Mention.Root>` + `<Mention.Input>` / `<Mention.Editable>` / `<Mention.Popover>` / `<Mention.List>` / `<Mention.Item>` / `<Mention.Empty>` / `<Mention.Loading>` / `<Mention.Chips>`.
  - Typed hook escape hatches: `useMention<TItem>()` (single-trigger) and `useMentionMulti<TItemMap>()` (multi-trigger).
  - Imperative handle on `<Mention.Root>` exposes `open()`, `close()`, `commit()`, and a live `host` getter.

  **Editor support**

  - `<textarea>` via vendored mirror-div caret math (`textarea-caret-position` v3.1.0, MIT, attribution preserved).
  - `<div contenteditable>` via the native Range API, including atomic chip insertion (`shape: "node"`) with two-step backspace selection.
  - Pluggable `EditorAdapter` seam for bridging rich-text editor frameworks.

  **Accessibility**

  - WAI-ARIA combobox-as-substring contract: persistent `role="combobox"` on the host, `aria-expanded` / `aria-controls` / `aria-activedescendant` toggled while open, DOM focus never leaving the editor.
  - Unicode word-boundary detection covering CJK, Thai, Khmer, Lao, and Myanmar scripts.
  - IME composition guard so half-converted text never narrows the popover.
  - RTL-aware caret positioning.

  **Positioning**

  - Caret-anchored Floating UI virtual element (`@floating-ui/react-dom`), with `offset` / `flip` / `shift` / `size` middleware and live re-positioning on caret movement.
  - Portal target overridable via `<Mention.Popover container>`; `null` opts out of portaling.

  **Theming**

  - Default stylesheet at `@danielivanov/mention/styles.css` driven by `data-mention-*` selectors and library-private tokens that fall back to shadcn-style CSS variables (`var(--popover, …)` etc.).
  - `forced-colors`-aware, `prefers-reduced-motion`-aware, light/dark via `prefers-color-scheme`.
  - `unstyled` prop on `<Mention.Root>` for consumers driving every selector themselves.

  **Distribution**

  - npm package (dual ESM + CJS, `dist/index.{mjs,js,d.mts,d.ts}`).
  - shadcn-cli registry shipped alongside (`@danielivanov/mention/registry.json`).
  - Single runtime dependency: `@floating-ui/react-dom`. React 19+ peer.
  - Bundle: 13.93 kB gzipped, hard-capped via `size-limit` in CI.
