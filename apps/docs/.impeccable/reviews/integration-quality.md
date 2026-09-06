# Integration documentation and interaction quality

Reviewed on 6 September 2026 against the local working tree based on `b69a367`. This follows the user-authorized integration improvements; no deployment occurred.

## Assessment and changes

The Integrations folder contained only Rich-text editors, adding a navigation step without a useful choice. The guide now sits directly under Build your integration. Its old HTML URL redirects to the current guide. ProseMirror remains the implemented editor example; the docs do not invent verified adapters for other editors.

Quickstart now contains an executable composer. Controlled forms demonstrates actual validation, ordinary FormData submission, a local receipt, reset, and focus recovery. The rich-editor guide exposes the complete ProseMirror source. Fumadocs includes the same files used by the running examples and browser fixtures in its code blocks and processed Markdown. This deletes duplicated snippets without introducing an example registry, generator, or additional package.

Textareas retain their implicit textbox role. Rich editors supply their own textbox and multiline semantics; Mention adds the suggestion relationships. Removed the combobox role and expanded attribute from the shared getter, updated the ProseMirror host, and replaced the old role exemption with explicit native-semantics assertions. The decision follows the HTML-ARIA textarea restriction and WAI-ARIA's textbox/controlled-listbox active-descendant relationship:

- https://www.w3.org/TR/html-aria/#el-textarea
- https://www.w3.org/TR/wai-aria-1.2/#textbox
- https://www.w3.org/TR/wai-aria-1.2/#aria-activedescendant

Interaction testing exposed two additional runtime defects. A dismissed snapshot survived edits away from and back to its query; dismissal now clears on a changed snapshot. Revealing a selected option used scrollIntoView, which could scroll the document before the popup was positioned. The core now adjusts only the listbox's scroll position, retaining focus and the page position. Both inline and body-portal regression fixtures failed before the scroll fix and pass afterward.

The controlled example also needed the cleared React value to reach the DOM before its imperative focus/close calls. flushSync makes that ordering explicit. A single-event replacement reproducing a paste of the previous query remained closed before this change; the final regression checks both that case and ordinary typing after reset.

## Finish review

The existing Ink Block / Type foundry proof system remains intact. The shared wordmark keeps identical coordinates between landing and documentation at desktop and mobile widths. The direct sidebar guide, working native controls, visible field errors, stable receipt area, bounded source viewers, and adjacent copy actions form a usable integration path.

Visual inspection found a collision between the site theme and separately imported package styles: selected suggestion text could share its dark background color. Corrected the accent foreground token and deleted the competing selection overrides. Default documentation popups now have a readable minimum width capped by the viewport. Rich-editor text retains normal reading size and contrast.

Complete source blocks use the base sheet background so highlighted comments retain contrast. Their titles name their keyboard-scrollable regions. The desktop table of contents is a named navigation landmark; mobile documentation controls use navigation semantics, preventing the nested header from becoming a duplicate banner. All three documentation examples render their popups within the article landmark. No new motion or UI primitives were introduced.

PRODUCT.md and DESIGN.md reflect the resulting product facts and interaction rules.

## Verification

- Package build and type check pass. All 77 unit tests and 93 browser tests pass; the browser matrix is Chromium, Firefox, and WebKit.
- The final docs production build and standalone docs type check pass.
- Package size is 12.18 kB minified and gzipped including dependencies, within the 14 kB limit.
- Scoped formatting, error-level lint checks, and git diff --check pass. Existing non-null-assertion lint warnings are not presented as a warning-free repository lint run.
- The final production preview passes 18 browser guide flows across three engines and two widths, plus six origin/export checks. These verify real insertion, form validation/submission/reset, rich-editor undo, unchanged page scroll, full source copying, Markdown copying, contextual agent links, mobile navigation, and shared header coordinates.
- The three complete source files match both their individual Markdown documents and the full export. Links use the requested origin on both loopback hostnames; the old rich-text URL redirects correctly. No fixed preview address exists in product source.
- Eleven unfiltered Chromium axe scans pass across desktop/mobile open suggestions, form validation, and dark mobile states. The form also fits 320px. Dark theme switching and reduced-motion mode were exercised.
- Desktop, mobile, and dark captures were inspected, including the corrected selected-option contrast and stable editor position.

Evidence: `/tmp/mention-integrations-check.cjs`, `/tmp/mention-integrations-results.json`, and `/tmp/mention-integrations-*.png`. Permanent regressions live in `packages/react/e2e/examples.spec.ts`, `packages/react/e2e/editing.spec.ts`, and the existing interaction/accessibility suites.

The larger library harness explicitly records axe's scrolling-region heuristic and the optional body-portal landmark finding; keyboard access beyond the list boundary is verified separately. These findings are not disabled or hidden. The new documentation states pass without exemptions.

Manual NVDA, JAWS, VoiceOver, TalkBack, physical-device keyboard behavior, and real operating-system IMEs remain unverified. Automated browser checks do not establish those results.

Verdict: **Approve** for the integration documentation and verified interaction fixes, with the manual assistive-technology boundary retained explicitly.
