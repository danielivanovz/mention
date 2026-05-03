# IME smoke results (M8)

Populated during the sweep. Each cell asserts the three invariants from
[`README.md`](./README.md) — composition-start does not commit,
candidate selection keeps the popover mounted, space-commit does not
race past the trigger.

Status legend: ✅ pass · ❌ fail (open ROADMAP "Cross-cutting / hygiene"
row) · ⏳ pending (sweep not yet run on this cell).

## macOS Japanese

| Date | Tester | macOS | IME | Browser | AT (VoiceOver) | Inv. 1 | Inv. 2 | Inv. 3 | Screenshots | Notes |
|------|--------|-------|-----|---------|---------------|--------|--------|--------|-------------|-------|
| ⏳    |        |       |     |         |               |        |        |        | `screenshots/macos-japanese/` |       |

## Windows Pinyin

| Date | Tester | Windows | IME | Browser | AT (NVDA) | Inv. 1 | Inv. 2 | Inv. 3 | Screenshots | Notes |
|------|--------|---------|-----|---------|-----------|--------|--------|--------|-------------|-------|
| ⏳    |        |         |     |         |           |        |        |        | `screenshots/windows-pinyin/` |       |

## Android Gboard

| Date | Tester | Android | Gboard | Chrome | AT (TalkBack) | Inv. 1 | Inv. 2 | Inv. 3 | Screenshots | Notes |
|------|--------|---------|--------|--------|---------------|--------|--------|--------|-------------|-------|
| ⏳    |        |         |        |        |               |        |        |        | `screenshots/android-gboard/` |       |

## Sweep summary

(Populated when all three cells land. Cite IME / AT / browser versions
+ any failure modes observed; this snippet feeds the M8 ROADMAP row's
closure note.)
