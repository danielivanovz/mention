# Natural search and Lexical integration

Verified locally on 6 September 2026 on `feature/natural-search-and-lexical`, based on `3465084`. Library/example changes through `9d63259`, landing UI at `5ccc878`, and the accompanying documentation changes were exercised against a production build served locally. No deployment or npm publication is part of this verification.

## Scope

- Add per-channel `allowSpaces` and synchronous `filter(item, query)` while retaining existing defaults. Horizontal Unicode space separators are opt-in; tabs, line breaks, and editor atoms end queries. Continuing after a multiword selection or dismissal does not reopen the old trigger.
- Add an executable Lexical integration, used by its documentation, browser fixture, and landing rich-editor mode. The editor owns token IDs, labels, triggers, formatting, JSON, clipboard data, deletion, and history.
- Let the landing playground switch between a textarea and rich editor. Each remains mounted with its own draft and history after first use. Tabs activate on click, Enter, or Space; arrows/Home/End move tab focus. Each mode links to its maintained integration. Lexical code loads on demand, including when the documentation is prefetched.

The existing visual direction and shared header are preserved. Inline mention tokens use the established blue ground. Popovers render within the page landmark; typing and selection remain immediate.

## Verification

- 91 unit/property tests passed, including new default-preservation, synchronous matcher, full-name, query boundary, dismissal, and fetcher behavior cases.
- The combined Chromium/Firefox/WebKit browser suite passed 164 tests; seven explicitly unsupported native clipboard/touch/pen cases were skipped. After the final HTML clipboard correction, all 22 runnable Lexical cases passed again; its two native clipboard skips remain explicit.
- Native Chromium clipboard coverage checks actual copy, cut, and paste. It also copies a bold/italic mention, retains only its HTML clipboard representation, and verifies identity and formatting after paste. HTML import, block mapping, UTF-16, history, selection guards, and synthetic composition lifecycle run in all three engines.
- Library/examples types, docs types through the production build, and scoped Biome checks passed. The library is 12.46 kB gzipped including dependencies, below its 14 kB budget. Lexical adds no library runtime dependency.
- A temporary website runner passed six desktop/mobile flows: Chromium, Firefox, and WebKit at 1440 and 390 CSS pixels. It verified matching `@Alice Ch` and `@jose gar`, selected token identity, trigger controls, keyboard mode activation/focus, independent drafts, clear/undo, docs snapshot restoration, and integration links. No page overflow or application errors occurred.
- Unfiltered axe checks passed for landing suggestions in light/dark at both widths and for the Lexical documentation example at both widths. These checks do not remove the known heuristic findings in the library's intentionally long scrolling fixture.
- Each website flow verified that no initial script response contained the Lexical example module, then loaded and used that module through the rich-editor mode.
- Full code copying and the page's linked Markdown export both matched the maintained `examples/Lexical.tsx` file. The export endpoint returned HTTP 200. No parallel hand-maintained source snippet was introduced.

Temporary runner and evidence: `/tmp/mention-search-lexical-check.cjs`, `/tmp/mention-search-lexical/results.json`, and desktop/mobile screenshots in that directory. These record a local verification session; they are not a new permanent website testing framework.

## Review boundaries

An independent review of the core search changes found no concrete regression. An independent review of the Lexical example found formatted token identity could be lost on an HTML-only clipboard path; canonical span export and a real clipboard regression resolve it.

The Impeccable detector ran once against the changed UI targets. It reported 77 advisory token findings, mostly incumbent whole-file CSS and the preexisting stale design sidecar. The new relative token radius was replaced with the established 4px radius. The added selector and caption reuse existing interface colors and type sizes; unrelated incumbent styling was not redesigned.

Real OS IME candidate windows, physical touch/pen devices, and manual screen-reader operation remain unverified. Native textarea undo grouping remains browser-defined. The npm package and deployed website are separate from this locally verified branch.

## Finish review

A fresh Impeccable finish reviewer accepted the retained visual world and requested three scoped fixes: associate the rich editor with its visible label, replace the caption glyph with the established Lucide icon, and record the editor-mode pattern in DESIGN.md. All three were applied. The final website pass located the rich textbox through its visible label and recaptured desktop/mobile light/dark states after rebuilding. The shipped documenter added a narrow Editor Modes section without replacing the design system or reconciling the incumbent stale sidecar.

## verdict

| Requested fix | Score | Evidence |
| --- | --- | --- |
| Associate the rich editor with its visible label | Resolved | Fresh desktop/mobile captures retain “Try it. Type @, #, or /” above the field. At revision 5ccc878, rich-mention-demo.tsx:24 identifies that text and line 34 references it through aria-labelledby; the shared host accepts and forwards the attribute. Supplied results record all six browser/width flows without errors. |
| Replace the caption glyph with the existing icon system | Resolved | Fresh desktop/mobile light and mobile dark captures show the compact arrow aligned with the guide link. playground-parts.tsx:166 renders Lucide ArrowUpRight at 14px with aria-hidden. |
| Record the editor-mode decisions in DESIGN.md | Resolved | DESIGN.md:219 adds the narrow Editor Modes section covering manual activation, independent retained drafts/history, first-use Lexical loading, per-mode guides, responsive wrapping, and existing token colors/corners. These treatments agree with the recaptures. |

## remaining

Clear. No regressions introduced by the fix batch are visible in the reviewed recaptures.

disposition: ship
