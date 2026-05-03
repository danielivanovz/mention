# mention

`@mention/react` — headless, a11y-first React mention (`@`-trigger autocomplete) primitive for `<textarea>`. DX bar: `vaul` / `sonner`.

Wedge: no headless, framework-agnostic, a11y-first mention primitive in React (react-mentions stale; react-aria/Ariakit/Downshift don't do mid-text triggers; TipTap/Lexical/Slate force a full editor).

Working roadmap: `ROADMAP.md` + `ROADMAP.csv` at repo root. ADRs in `docs/adr/`.

## Layout

- Bun workspace, lockfile at repo root
- `packages/react/` — the library
- `apps/docs/` — Next.js docs site (Fumadocs)
- `.misc/spike/` — gitignored spikes (`/spike` skill convention)

## Commands

Run from repo root:

```sh
bun run build          # bunchee + cp styles
bun run test           # vitest run
bun run test:e2e       # playwright (chromium harness on :5175)
bun run type-check     # tsc --noEmit
bun run size           # size-limit, enforces 14 kB cap
bun run docs:dev       # next dev (Turbopack, :3000)
```

E2E harness: `cd packages/react && bun run e2e:dev` (Vite, :5175). Cross-browser gated behind `CROSS_BROWSER=1`.

## Architecture (load-bearing)

- **Architecture**: own ARIA layer + Floating UI + vendored caret math. Rejected Ariakit and Base UI Combobox (dynamic role mutation breaks the contract).
- **Runtime dep**: `@floating-ui/react-dom` only. Reducer + keydown handlers own all interaction; combobox-as-substring keeps focus in `<textarea>` so `FloatingFocusManager` is unused.
- **Bundle ceiling**: 14 kB gzip, CI-enforced via `size-limit`. v0.3 needs a cap-policy reset — no more case-by-case raises.
- **Trigger detection** (`packages/react/src/state/find-active-mention.ts`): single source of truth. Pure `(value, caret, trigger) → ActiveMention | null`. Reducer is a pure transition machine reflecting the dispatcher's result.
- **Word boundary**: whitespace OR Unicode script-property regex (Han/Hiragana/Katakana/Hangul/Thai/Khmer/Lao/Myanmar). **Not** `Intl.Segmenter` — empirically can't disambiguate `用户@example` from `こんにちは@田中`.
- **Caret-anchored positioning**: `createTextareaAnchor(textarea)` returns a Floating UI `VirtualElement` lifting caret coords (mirror-div technique) into viewport space. `<Mention.Popover>` calls `refs.update()` on `ctx.query` change — `autoUpdate` alone only ticks on scroll/resize.
- **Channels**: trigger char + config bundle (`items`, `getKey`, `getLabel`, optional `getInsertText`). Internal state machine is channel-keyed from day one (single-trigger = N=1); multi-trigger public surface is v0.2.
- **Core hook**: `useMentionCore` — every public surface (`useMention`, `useMentionMulti`, `<Mention.Root>`) delegates to it. Type-erased on `TItem` internally; wrappers preserve `TItem` at the public edge.

## Conventions

- **No `"use client"`** in published lib. RSC consumers wrap; canonical pattern in `apps/docs/src/components/mention-demo.tsx`.
- **Theming gotcha**: lib's private `--mention-*` tokens are scoped to `[data-mention-popover]`, not `:root`. Override at that selector. shadcn bridge tokens (`--popover`, `--accent`, …) DO cascade from `:root` — that's the normal theming surface.
- **React 19 keys**: `getItemProps` deliberately omits `key` (strict-mode warns on key-via-spread). `<Mention.List>` applies key one level up via `<Fragment key={getKey(item)}>`. Escape-hatch consumers must pass `key={getKey(item)}` explicitly.
- **Per-slice commits**: one slice = one commit. Roadmap row IDs may appear in commit subjects (e.g. `feat(react): vendor textarea caret math (I2)`) but never in code, docs, or comments.
- **Roadmap discipline**: `ROADMAP.md` and `ROADMAP.csv` in lockstep. Update on every status transition.
- **Linter**: Biome (not eslint/prettier). Wired in `apps/docs/`. Use Biome for any new workspace member.
- **Releases**: Changesets (wired close to publish).

## Testing

See `TESTING.md`. Three loops:

- vitest unit (happy-dom) — fast, structural
- Playwright e2e (chromium) + axe — contract, ~3s wall time
- manual AT matrix (NVDA/JAWS/VoiceOver/TalkBack) + manual IME smoke (`packages/react/manual-at/ime/`, `?ime=1`) — gated for major releases

**axe documented exceptions** (best-practice only; WCAG 2.1 AA passes unconditionally):
- `aria-allowed-role` — HTML-ARIA forbids `<textarea role="combobox">` but ARIA 1.2 permits it. Pattern shipped by Ariakit/GitHub/Slack/Linear.
- `region` — portaled listboxes are universally outside landmarks.

## Distribution

Dual: npm package + parallel shadcn-cli registry (blocked on AT pass). Default CSS uses shadcn-compatible variables so the registry path drops in cleanly.
