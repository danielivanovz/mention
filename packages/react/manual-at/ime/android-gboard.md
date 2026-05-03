# Android Gboard

The mobile + gesture cell. Validates gesture typing and
autocomplete-into-trigger against the IME safety contract from
`packages/react/src/hooks/useMentionCore.ts:202, 327, 352–380`. Gesture
autocomplete adds a fourth watch-item (autocomplete that *lands* the
trigger character via swipe must still open the popover) — folded
under invariant 1's failure mode rather than tracked as a separate
invariant.

## Setup

1. **Input source.** Install Gboard from Play Store. Settings → System →
   Languages & input → On-screen keyboard → Gboard → Languages. Add
   either **Pinyin** (中文(简体)) or **Japanese** (日本語) alongside
   English.
2. **Switch.** Long-press the space bar or tap the globe key to cycle
   languages. Verify the candidate strip switches to Pinyin / Japanese.
3. **TalkBack pairing.** Settings → Accessibility → TalkBack → On.
   Confirm TalkBack speaks the textarea's `aria-label` ("Comment") on
   focus and reports the popover (listbox role + option count) on `@`.
4. **Harness reach.** Run `bun run e2e:dev` on the dev box, find your
   LAN IP (`ipconfig getifaddr en0`), open
   `http://<lan-ip>:5175/?ime=1` on the Android device's Chrome.
   `?host=editable&ime=1` for the contenteditable surface.

## Reproduction

For each invariant: focus the textarea, tap `@` (popover opens), then
dismiss before starting the IME flow.

### Invariant 1 — composition-start does not commit (incl. gesture autocomplete)

1. Tap `@` (popover opens).
2. Switch to Pinyin; type `w`, `a`, `n`, `g` — Gboard composition
   shows `wang` underlined with the candidate strip above the
   keyboard.
3. **Popover query must not advance** per keystroke during composition
   (`isComposingRef` gate at `useMentionCore.ts:327`).
4. **Gesture sub-case:** start a fresh line; gesture-swipe a word that
   *ends* in `@…` (e.g. swipe-type `hi@al` if the language pack
   supports it; otherwise type literally). The autocomplete that
   commits should fire `compositionEnd`, opening the popover at the
   correct trigger. **Must not** silently swallow the `@` or open the
   popover mid-gesture.

**Pass:** underlined composition does not advance the popover query;
gesture-completed `@…` lands cleanly with the popover open at the
final query.

### Invariant 2 — candidate selection updates live region, popover stays open

1. From the underlined-composition phase: scroll the candidate strip
   by horizontal swipe; tap candidates to preview.
2. Listbox must **remain mounted**; `aria-activedescendant` valid
   throughout.
3. With TalkBack on, swipe-right past the textarea — focus should
   reach the option list once a candidate is committed (or, while
   composing, options remain present in the AT tree).

**Pass:** listbox stays mounted across candidate-strip scrolling and
selection.

### Invariant 3 — space-commit does not race past the trigger

1. Tap `@` (popover open).
2. Switch to Pinyin; type `l`, `i` (`li` underlined; candidates).
3. Tap the spacebar (or first candidate) to commit.
4. **Must not** see a literal `" "` between `@` and `李` in the
   committed value — `compositionEnd` re-scan must absorb the IME's
   space-as-confirm (`useMentionCore.ts:356–380`).

**Pass:** post-commit value has the glyph adjacent to `@`; no
intervening space.

## Screenshot capture spots

Save under `screenshots/android-gboard/` (use the device's
Power+VolumeDown):

- `01-popover-during-composition.png` — popover open, `wang` underlined,
  Gboard candidate strip visible above the keyboard.
- `02-candidate-window-overlap.png` — candidate strip and listbox
  visible together (rotate to landscape if vertical space is tight).
- `03-post-commit-dom.png` — Chrome remote-devtools DOM snapshot after
  the commit (USB-debug into the dev box; chrome://inspect).
- `04-gesture-autocomplete.png` — captures the gesture sub-case
  landing — popover open at the autocompleted `@…` query.

## Result row

Populate in [`results.md`](./results.md):

- Tester
- Android version + build (Settings → About phone)
- Gboard version (Settings → Apps → Gboard → version)
- Chrome version
- TalkBack version
- Pass/fail per invariant 1/2/3
- Screenshot dir reference
- Notes — call out anything specific to the device's OEM keyboard
  layer (Samsung / Pixel) if it shows through.
