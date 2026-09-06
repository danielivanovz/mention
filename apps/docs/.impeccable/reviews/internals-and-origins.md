# Internals and site origins

The Internals now explain the current library through four articles in the existing documentation shell: Editor ownership, Request lifecycle, Caret positioning, and Focus and ARIA. They share search, the sidebar and table of contents, Markdown exports, and the contextual agent setup action. No new visual system or interaction primitive was added.

## Assessment and decisions

The separate marketing pages omitted the central editor-ownership boundary. The ARIA article described unverified screen-reader announcements, made unsupported comparisons with other libraries, and presented a persistent textarea combobox role as settled. The caret article described a persistent mirror and zero-width marker, whereas the implementation creates a temporary body mirror containing a suffix span for each measurement.

Deleted the three standalone pages and both demonstration components. The teaching mirror was a second geometry implementation and did not measure the library's actual popup; the DOM snapshot could not establish spoken output. Existing working examples remain the place to inspect real behavior. Three redirects preserve the currently linked Internals destinations without retaining their old layouts.

The new material was checked against the adapter types and textarea implementation, the core session/commit logic, query lifecycle, trigger detector, popover, caret measurement, ProseMirror example, and their relevant tests. The editor and request explanations fill actual gaps. Additional pages for framework-specific adapters or hypothetical architecture would exceed the evidence currently available.

The current HTML-ARIA textarea entry was checked at https://www.w3.org/TR/html-aria/#el-textarea and the focus mechanism against https://www.w3.org/WAI/ARIA/apg/patterns/combobox/. The role conflict and outstanding manual assistive-technology/OS IME checks remain explicit. Documentation corrections do not change the runtime contract.

## URL behavior

Product source contains no fixed loopback address. Static canonical and Open Graph metadata use explicit site configuration or the applicable Vercel deployment host. An unconfigured build omits absolute metadata. Markdown and agent index responses generate links per request, preserving the public host/protocol rather than Next's normalized loopback URL. Browser prompts continue to use the current browser origin.

The HTML articles remain statically generated. Only text exports render per request; this avoids tying their links to the address used when building.

## Finish review

The existing typography, colors, spacing, focus treatment and article controls carry through all four pages. The source-file map became a list after a mobile check found that a table required horizontal scrolling. A redundant syntax-highlighted comment was removed after the desktop scan found insufficient contrast. Browse docs now has an accessible name matching its visible text. No new motion was introduced.

Observed desktop and mobile captures match the existing docs world, including the shared wordmark position, sidebar hierarchy, mobile navigation, article actions and dark theme.

## Verification

- Production build and standalone docs type check pass. Stale development-generated route types were removed after the old pages were deleted; no application workaround was needed.
- Scoped formatting and `git diff --check` pass.
- 40 targeted core editing/request and trigger-detection tests pass.
- One unconfigured production build was served on two ports and accessed through both loopback hostnames. All 16 Markdown documents, the full export, direct aliases and strict 404 behavior passed; canonical headers and body links follow the requested origin.
- Forwarded HTTPS host handling and metadata configuration cases (unconfigured, preview, production, explicit override) pass. All three legacy redirects pass.
- Chromium, Firefox and WebKit pass all four article flows at 390px and 1440px: titles, current-page prompts, copied Markdown, layout bounds, mobile navigation and search. The index also fits 320px. No page exceptions were observed.
- Chromium axe scans report no WCAG 2 A/AA or 2.1 AA findings on the four new articles at mobile and desktop widths. A dark mobile scan and a targeted Browse docs visible-label/name check pass.

Evidence: `/tmp/mention-internals-check.cjs`, `/tmp/mention-internals-results.json`, and `/tmp/mention-internals-*.png`. Verification targets the current local working tree. No deployment occurred; physical mobile devices and manual assistive technology were not tested.

Verdict: **Approve** for the documentation restructure and origin handling. The unresolved library accessibility role decision remains separate, prominently documented work.
