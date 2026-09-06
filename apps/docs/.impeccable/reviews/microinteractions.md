# Microinteraction review

Initially reviewed on 6 September 2026 against `b6040896365889345105a52f3b2082933d4bb663` and the deployed site at https://reactmention.com. The user subsequently authorized all five grouped improvements, atomic commits, merge, and deployment. The baseline assessment below is preserved as evidence; implementation verification follows it.

## Baseline assessment

Baseline design scores: **landing page 7/10; component 7/10**. These are qualitative review judgments. The primary writing interaction has a sound foundation; cancellation, repetition, and asynchronous recovery need attention before a 10/10 assessment is justified.

| Lens | Landing page | Component |
| --- | --- | --- |
| Triggers | Visible writing field, insertion controls, installation and setup actions | Typing, keyboard selection, pointer selection and dismissal are direct |
| Rules | Clear does not fully reset a previously open query | Suggestion insertion completes before the pointer is released |
| Feedback | Copy success is clear; press and pending feedback can improve | Selection is clear; asynchronous outcomes need a more complete accessible presentation |
| Loops and modes | Repeating a query after Clear can fail | Failed searches require a changed query instead of direct retry |
| Signature moment | The live writing field is the strongest demonstration | Caret anchoring and uninterrupted typing supply the identity |
| Reduction | Keep commands simple and preserve visible keyboard hints | Keep document/history ownership in the editor and presentation optional |

## Confirmed through live interaction

### 1. Clear leaves an obsolete dismissal behind

Reproduction: enter `@al`, let suggestions open, click Clear, then paste `@al` from the browser clipboard. The input contains `@al`, focus remains in the input, but the listbox count is zero. Deleting and retyping the last character restores suggestions.

The landing handler calls `setValue("")`, closes the session, and focuses the input before the controlled value has necessarily reached the DOM. Its order differs from the already-corrected controlled-form example.

Source: `src/components/mention-demo.tsx:128`; comparison: `../../packages/react/examples/MessageForm.tsx`.

Recommended change: complete the controlled clear before focus and session dismissal, using the same ordering as the form example. Give Clear an appropriate empty state. Add a regression for the actual repeated-query paste, and verify ordinary typing and trigger-button insertion after clearing.

### 2. A suggestion cannot be cancelled by dragging away

Reproduction: open Alice Chen with `@al`, press on that option, drag outside the option, and release in the writing area. The result is `@alice ` even though the pointer was released away from the suggestion.

`getItemProps()` commits on `onMouseDown`. This is a library behavior, shared by the landing page and consumers.

Source: `../../packages/react/src/hooks/useMentionCore.ts:346`.

Recommended change: retain editor focus during the initial press, then commit on a completed click/release. Dragging away should cancel without changing the document. Keep Enter and Tab immediate. Verify actual mouse, touch and pen behavior, scrolling the suggestion list, cancelled gestures, and consumer handlers before declaring this complete. W3C recommends up-event activation for predictable cancellation: [Pointer Cancellation](https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html).

### 3. Displayed identity and inserted text differ without a preview

The landing row shows `Alice Chen`; selection inserts `@alice`. Jordan Lee likewise becomes `@jordan`. This is intentional customization, but the transformation is undisclosed in the row.

Source: `src/components/mention-demo.tsx:144` and its trigger configuration.

Recommended change: show the username as useful secondary text beside the name. Keep insertion instant. Highlighting the matching text is optional; it should not introduce a second selection indicator.

### 4. Agent setup initially focuses its close button

The panel opens correctly, and closing it returns focus to Agent setup. Its initial focus is Close agent setup because that is its first focusable control.

Source: `src/components/agent-setup.tsx:41`.

Recommended refinement: for this short preview-and-copy task, consider initial focus on Copy prompt. Keep the prompt readable/selectable and Escape available. This is a task-flow preference, not a broken focus trap or an accessibility failure.

## Findings from source inspection

### 5. Async recovery needs a complete user-facing cycle

The implementation correctly aborts obsolete requests, discards late results, and prevents stale selection. Every new asynchronous query returns `loading` and an empty item collection immediately, including during debounce. A failed request has no items. In the documented recipe, the error message sits outside the listbox while List, Loading and Empty all render nothing inside it; the open popover can therefore become an empty shell.

The recipe explicitly tells users to edit their query to try again. A transient failure should not require changing what the user wants to find.

Sources: `../../packages/react/src/hooks/use-channel-query.ts:29`, `../../packages/react/src/components/Popover.tsx`, and `content/docs/recipes/async-items.mdx:47`.

Recommended change: demonstrate loading, success, no results, failure and same-query retry in an executable integration. Keep error/retry UI outside listbox option semantics and avoid rendering an empty suggestion shell. Prove the smallest explicit retry operation through that example before expanding the public API. No automatic retry loop or caching system is justified by this finding.

For waiting feedback, first exercise realistic response timings. A short presentation delay can prevent a loading message flashing for fast responses; it must not delay the request or make stale options selectable. Use compact stable layout where possible. No network-failure or latency simulation was performed on production during this review.

### 6. Outcome announcements are left to consumers

Loading and Empty are plain divs. The listbox supplies `aria-busy`, but the example does not provide a persistent polite status region for pending, empty, or result-count outcomes. The error example uses an alert. The current code therefore provides styling/state slots without demonstrating the complete nonvisual feedback cycle.

Sources: `../../packages/react/src/components/Loading.tsx`, `../../packages/react/src/components/Empty.tsx`, and `content/docs/recipes/async-items.mdx:71`.

Recommended change: add an accessible status recipe driven by existing context, with application-owned text and a persistent region outside the listbox. Announce settled query outcomes; let active-descendant semantics handle option navigation to avoid duplicate announcements. Verify with real assistive technology. This source finding is not a claim that a particular screen reader was tested or failed. See [Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

### 7. Visible pending and pressed states can be clearer

CopyControl has genuine pending, copied and failed states. Success replaces the icon, provides an announcement, and expires after 2400 ms; a failure offers manual copying. Live installation copying confirmed success feedback. During pending, however, the visible label/icon remain unchanged; only disabled behavior, a wait cursor, ARIA and hidden text change. This matters particularly for the shared Markdown-fetching copy control.

The authored landing button styles have hover and focus treatments but no dedicated press treatment. The controls can therefore feel less responsive to touch or keyboard activation than their completed results warrant.

Sources: `src/components/copy-control.tsx:35`, `src/app/global.css:355`, and `src/app/(home)/landing.css:113`.

Recommended change: use a stable-width visible pending state when work is appreciable, and a small immediate background/border press change on controls. Keep successful copy feedback local. Existing theme colors and CSS can cover this without a motion dependency. This review did not force a clipboard failure or a prolonged clipboard wait.

## What already works

- Visible insertion controls provide an alternative to discovering trigger characters by typing.
- Keyboard navigation and insertion leave focus in the writing host; option highlighting has one source of truth.
- Suggestion visibility and active styling change immediately, without an animation delaying a keypress.
- The core limits scroll adjustment to the suggestion list. The prior merged regression coverage remains relevant; no full test-suite rerun was needed for this assessment.
- Copy success is honest and localized. Setup closes with correct focus return.
- Cancellation/session isolation, composition guards, and editor-owned insertion/history remain the right boundaries based on the reviewed source.

## Recommended sequence and the 10/10 bar

1. Correct the live Clear repetition defect and pointer cancellation, with behavioral regressions.
2. Complete same-query retry, empty/error presentation, and accessible status feedback in an executable async integration.
3. Clarify name-to-username insertion, pending/pressed feedback, and the setup panel's initial focus.
4. Consider a brief opacity-only entrance in optional styling only after the behavior is reliable. Keep navigation and insertion instant, allow interruption, and respect reduced motion. Do not add exit-presence machinery solely to animate dismissal. See [Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).

A 10/10 review would require predictable repeat, cancel, retry and interruption behavior; meaningful feedback across input methods; stable caret/page position; and verification of the remaining real-device and assistive-technology cases. No confetti, sounds, floating-label ornament, row staggering, animated typing, onboarding counters, hidden mode switches or new animation framework is needed. The signature moment should be the user's uninterrupted sentence.

## Scope and limits

Inspected the live desktop page, suggestion filtering/selection, actual clipboard paste after Clear, press-drag-release cancellation, installation-copy success, and setup opening/closing/focus. Reviewed library request state, slots, keyboard/pointer handling, optional CSS, and the async recipe. This turn did not test physical touch/pen devices, screen readers, OS IMEs, reduced-motion emulation, artificial network failure, or clipboard failure. Product implementation files were not changed by this review.

## Implementation and verification

All five grouped improvements are implemented. Combined executable changes were checked at `76e7d0f`; the subsequent documentation commit updates this record, Product, Design, AGENTS, and the explanation of failed-session ARIA behavior. Review date: 6 September 2026.

1. **Completed pointer selection.** A primary press preserves editor focus; a completed click inserts. Dragging to another option or outside cancels. Consumer pointer-down, mouse-down, and click vetoes compose with the library, and a veto cannot carry into a later press. Keyboard insertion remains immediate.
2. **Repeat after Clear.** The landing value reset completes before restoring focus and dismissing the session. Clear is disabled for empty text. Pasting the identical query now opens suggestions again.
3. **Async recovery and feedback.** Explicit `open()` / `setOpen(true)` retries an unchanged failed query using a new request session. Ordinary refreshes do not retry, and reopening a pending/successful session does not duplicate its request. Failures hide the popup and its input relationships. A shared executable example presents loading, results, empty responses, failure and Retry search with one persistent status region outside the listbox. Retained failure follows the failed text/caret and clears when that selection changes.
4. **Inserted identity.** The landing people rows display the full name and the corresponding username that will be inserted.
5. **Control feedback.** Copy shows a static hourglass and visible pending label, with width reserved across idle/pending/copied states. Completion and failure remain local. Landing and shared controls have immediate background press feedback. Agent setup focuses Copy prompt on opening and returns focus on dismissal.

No new public method, runtime dependency, automatic retry, cache, animation framework, or exit-presence mechanism was added. Independent review found the obsolete Retry action after a caret change; the final implementation and new regressions resolve it.

### Checks performed

- Package and documentation type checks, production website build, and all **83 library unit tests** passed.
- The combined browser matrix passed **133 tests** across Chromium, Firefox and WebKit. Five cases are explicitly skipped because their engines do not support the required touch/pen injection. Chromium/WebKit touch taps and Chromium touch scrolling/pen release were exercised through browser emulation, not physical devices.
- Package size is **12.26 kB gzip including dependencies**, within the 14 kB budget.
- Scoped Biome checks completed without errors. The existing test style, including the added request-ownership regression, produces non-null-assertion warnings; no unsafe fixes were applied.
- A temporary website runner using the installed Playwright tooling passed **10 flows**: landing behavior in all three engines at 1440px and 390px; light/dark mobile press and setup behavior with reduced motion; and built async docs at desktop/mobile widths. It held and rejected clipboard promises to verify visible pending, stable geometry, honest completion, manual-copy guidance and retry. These website checks are a recorded verification session, not a new permanent test framework.
- **12 unfiltered website axe scans** passed across landing, copy failure, mobile light/dark setup, and async failure/success/empty states. The existing large library fixture still records its documented landmark and scrollable-region heuristic findings explicitly.
- The async page's full source copy, Copy Markdown and full Markdown export matched `examples/AsyncSearch.tsx`; its setup prompt included the current article and served origin. Both desktop and mobile layouts had no page overflow or application console errors in these flows.
- In the in-app browser, a real clipboard paste of `@al` after Clear reopened Alice Chen with the visible `@alice` preview. Actual prompt copying, initial Copy prompt focus and Escape focus return also passed. Desktop suggestions and light/dark mobile setup were visually inspected.

### Updated assessment

Current qualitative scores: **landing page 9/10; component 9/10**. The identified implementation defects and feedback gaps are resolved. The remaining bar for 10/10 is representative manual screen-reader output, physical touch/pen usability and real OS IME verification; automated ARIA/gesture checks cannot establish those results. No additional decorative motion is justified by this review.

This record describes local verification before merge. Production rollout status belongs to the pull request and deployment checks for the final merged revision.
