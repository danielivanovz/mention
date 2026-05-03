# IME real-AT smoke (M8)

Live-stack validation of the IME engineering that landed in M6
(`packages/react/src/hooks/useMentionCore.ts:202, 327, 352–380`). M6 is
pinned by 3 RTL tests + 1 chromium e2e test driving synthetic
`CompositionEvent`s — this rig confirms that what passes against synthetic
events also survives a real IME stack with candidate windows, dictionary
lookups, and gesture autocomplete.

This is a **manual sweep**, gated for major releases per `TESTING.md`.
Reserve `manual-at/full-matrix/` for M1's broader NVDA / JAWS / VoiceOver
/ TalkBack matrix; the IME rig folds into it cleanly when M1 lands
(rename → `manual-at/full-matrix/ime/`).

## What's tested

Three invariants asserted per cell:

1. **Composition-start does not commit.** Beginning IME composition over
   an active `@…` query must not fire `OPEN_AT` mid-composition. Gated
   by `isComposingRef` at `useMentionCore.ts:327`.
2. **Candidate selection updates the live region without dismissing the
   popover.** Popover stays open during the IME's candidate window;
   `aria-activedescendant` stays valid.
3. **Space-commit during composition does not race past the trigger.**
   IME's space-as-confirm must not slip a literal space into the
   textarea value before `compositionEnd` fires (Chrome 88+ ordering
   quirk, handled by the `compositionEnd` re-scan at
   `useMentionCore.ts:356–380`).

## Cells

| Cell | Doc | Hardware |
|------|-----|----------|
| macOS Japanese (Hiragana → Kanji) | [`macos-japanese.md`](./macos-japanese.md) | dev box + VoiceOver |
| Windows Pinyin (Microsoft Pinyin) | [`windows-pinyin.md`](./windows-pinyin.md) | Windows VM / box + NVDA |
| Android Gboard (Pinyin or Japanese) | [`android-gboard.md`](./android-gboard.md) | Android device + TalkBack |

## How to run the harness

```sh
cd packages/react && bun run e2e:dev
# then open one of:
#   http://localhost:5175/?ime=1
#   http://localhost:5175/?host=editable&ime=1
```

`?ime=1` swaps the harness dataset for a Latin+CJK list (`imeUsers` in
`e2e/harness/users.ts`) so candidate-window selection lands on
observably-different items per IME. Cross-product with the existing
`?host=editable` and `?shape=node` params works as expected.

## Recording results

- Per-cell: populate the row in [`results.md`](./results.md) — tester,
  OS / IME / browser / AT versions, pass/fail per invariant, screenshot
  path, notes.
- Screenshots commit under
  `screenshots/{macos-japanese,windows-pinyin,android-gboard}/` —
  capture spots are listed in each cell doc.

## Failure escalation

A failed invariant is a regression in the M6 contract. Open a new row
under "Cross-cutting / hygiene" in `ROADMAP.md` describing the
reproduction + the failing invariant, and file the remediation as a
separate slice. M8 stays `in-progress` until all three cells pass.
