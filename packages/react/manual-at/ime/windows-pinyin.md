# Windows Pinyin (Microsoft Pinyin)

The multi-character composition cell. Validates arrow-driven candidate
selection in a non-Latin script against the IME safety contract from
`packages/react/src/hooks/useMentionCore.ts:202, 327, 352–380`.

## Setup

1. **Input source.** Settings → Time & Language → Language & region →
   Add a language → 中文(简体, 中国) → Install. Open the language pack
   and confirm **Microsoft Pinyin** keyboard is listed.
2. **Switch.** `Win+Space` or the language flyout. Default is English
   alpha (中); press `Shift` to flip to Chinese (中) — verify by typing
   `n` and seeing the Pinyin candidate strip.
3. **NVDA pairing.** Launch NVDA. Confirm it speaks the textarea's
   `aria-label` ("Comment") on focus and reports listbox role +
   option count on `@`.
4. **Harness.** `cd packages/react && bun run e2e:dev`, open
   `http://localhost:5175/?ime=1` in Chrome / Edge / Firefox. Verify
   `王伟`, `李娜` are in the popover.

## Reproduction

For each invariant: focus the textarea, type plain `@` first to confirm
the popover opens, then `Esc` before starting Pinyin composition.

### Invariant 1 — composition-start does not commit

1. Type `@` (popover opens, query empty).
2. Flip to Chinese (中); type `w`, `a`, `n`, `g` — Pinyin shows the
   composition `wang` underlined and a horizontal candidate strip
   (王 / 网 / 往 / …).
3. **Popover query must remain empty** during the underlined
   composition phase (`isComposingRef` gate at
   `useMentionCore.ts:327`).
4. Press `1` (or click) to commit 王.

**Pass:** popover stays open with empty query during the underlined
phase; only the `compositionEnd` re-scan at
`useMentionCore.ts:356–380` advances the query to `王`.

### Invariant 2 — candidate selection updates live region, popover stays open

1. Repeat to the underlined-composition phase from invariant 1.
2. Use `←` / `→` (or page keys) to scroll the candidate strip.
3. Watch the listbox: **must remain mounted**;
   `aria-activedescendant` must point at a valid option.
4. NVDA should still let you Tab/arrow into the option list once
   committed.

**Pass:** listbox never unmounts during candidate cycling; AT
attributes remain coherent.

### Invariant 3 — space-commit does not race past the trigger

1. Type `@` (popover open).
2. Flip to Chinese; type `l`, `i` (`li` underlined; candidates 李 / 里
   / 力 / …).
3. Press `Space` to commit the default candidate (李).
4. **Must not** see a literal `" "` between `@` and `李` — value must
   read `@李…`, never `@ 李` or `@li 李`.

**Pass:** post-commit textarea value has the glyph adjacent to `@` —
the `compositionEnd` re-scan absorbed the IME's space-as-confirm.

## Screenshot capture spots

Save under `screenshots/windows-pinyin/`:

- `01-popover-during-composition.png` — popover open, `wang` underlined,
  Pinyin candidate strip visible.
- `02-candidate-window-overlap.png` — candidate strip overlapping the
  listbox; both visible.
- `03-post-commit-dom.png` — DevTools snapshot after `Space`; textarea
  value + listbox state.

## Result row

Populate in [`results.md`](./results.md):

- Tester
- Windows version (e.g. 11 23H2)
- Microsoft Pinyin version (Settings → Language → Microsoft Pinyin →
  Options shows build)
- Browser + version (Chrome / Edge / Firefox)
- NVDA version
- Pass/fail per invariant 1/2/3
- Screenshot dir reference
- Notes
