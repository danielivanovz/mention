# macOS Japanese (Hiragana → Kanji)

The dev-box cell. Validates the Romaji → Hiragana → Kanji conversion
flow against the IME safety contract from
`packages/react/src/hooks/useMentionCore.ts:202, 327, 352–380`.

## Setup

1. **Input source.** System Settings → Keyboard → Text Input → Edit
   (Input Sources) → `+` → Japanese → enable **Japanese - Romaji**
   (kotoeri). Keep the input-menu icon visible in the menu bar.
2. **Switch.** `⌃Space` (or the menu-bar flag) toggles Japanese on; the
   menu badge reads あ for hiragana mode.
3. **VoiceOver pairing.** `⌘F5` to start. Confirm VoiceOver speaks the
   textarea's `aria-label` ("Comment") on focus and announces the
   listbox role on `@`.
4. **Harness.** `cd packages/react && bun run e2e:dev`, open
   `http://localhost:5175/?ime=1`. Verify the popover lists `田中花子`,
   `鈴木一郎`, `山田太郎`, etc. when typing `@`.

## Reproduction

For each invariant: focus the textarea, type plain `@` first to confirm
the popover opens against the IME-friendly dataset, then `Esc` to
dismiss before starting the IME flow.

### Invariant 1 — composition-start does not commit

1. Type `@` (popover opens, query empty).
2. Switch to Japanese (あ); type `t`, `a`, `n`, `a`, `k`, `a` —
   underlined hiragana `たなか` appears inline as the composition
   buffer; **the popover query must not advance per keystroke**
   (`isComposingRef` gate at `useMentionCore.ts:327`).
3. Press `Space` to convert: candidate window shows 田中 / 棚 / etc.
4. Pick 田中 (Return).

**Pass:** popover stays open with the empty query throughout the
underlined-composition phase; only the post-`compositionEnd` re-scan at
`useMentionCore.ts:356–380` advances the query to `田中`.

### Invariant 2 — candidate selection updates live region, popover stays open

1. Continue from invariant 1's reproduction at the candidate-window
   step.
2. Use `Space` / arrow keys to cycle through candidates (田中, 棚, …).
3. Watch the listbox: **must remain mounted**;
   `aria-activedescendant` must reference a valid option ID.
4. VoiceOver should still announce the active option as you arrow
   through the user listbox (test by `⌃⌥→` while popover is open).

**Pass:** popover never unmounts during candidate browsing; AT cursor
can still reach the option list.

### Invariant 3 — space-commit does not race past the trigger

1. Type `@` (popover open).
2. Switch to Japanese; type `h`, `a`, `n`, `a` (はな appears underlined).
3. Hit `Space` to confirm 花 from the candidate window.
4. **Must not** see a literal `" "` slip into the textarea value
   before `compositionEnd` — i.e. the value must read `@花…`, never
   `@ 花` or `@hana 花`.

**Pass:** post-commit textarea value contains the converted glyph
adjacent to `@` with no intervening space.

## Screenshot capture spots

Save under `screenshots/macos-japanese/`:

- `01-popover-during-composition.png` — popover open, underlined
  hiragana visible inline (mid-invariant 1).
- `02-candidate-window-overlap.png` — IME candidate window overlapping
  the listbox; both visible.
- `03-post-commit-dom.png` — DevTools snapshot after Return; textarea
  value + listbox state.

## Result row

Populate in [`results.md`](./results.md):

- Tester
- macOS version (e.g. 14.4 Sonoma)
- IME version (System Settings → Keyboard shows Japanese build)
- Browser + version (Chrome / Safari / Firefox)
- VoiceOver version (carries OS version)
- Pass/fail per invariant 1/2/3
- Screenshot dir reference
- Notes (any non-fatal oddities observed)
