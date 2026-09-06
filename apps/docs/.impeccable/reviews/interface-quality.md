# Mention interface quality review

Mode: full. Scope: landing, documentation, search, copy actions, and the journey between them. Applied `ui-skills` and `make-interfaces-feel-better` within the approved Impeccable direction. Existing stack: Next 16.2.4, React 19.2.5, Fumadocs 16.8.5, custom semantic CSS with Tailwind utilities, and Lucide. No new dependencies or library-runtime changes.

## Coverage

| Category | Inspected | Decision |
| --- | --- | --- |
| Typography | Desktop/mobile wordmark geometry, reading measures, body wrapping, code and labels | Shared wordmark geometry; pretty paragraph wrapping. Keep the established Archivo/Archivo Black/JetBrains Mono roles, sizes, tracking and balanced headings. |
| Surfaces | Landing, docs, sidebar, section navigation, copy success/failure, search initial/empty/error, light/dark, keyboard focus | One persistent header, one mobile docs bar, consistent usable controls, truthful local feedback. |
| Animations | Inherited search/sidebar entrances at 10% playback; disclosure, result-height transitions; reduced-motion computed styles | Shorten existing entrances, delete full-screen blur and height transitions, retain instant frequent interactions, explicitly disable authored animation under reduced motion. |
| Icons | Lucide sizing, accessible names, copy state, sidebar/search controls | Keep one icon family. Copy success is shown only after completion. Compact icons retain 44px targets. |
| Performance | Changed components, effects, layout stability during copy, live browser requests and CSS animation keyframes | No new dependencies, images, animation library, global handlers or widget primitives. Remove duplicated navigation, unused configuration and hidden markup. No broad performance score claimed. |

## Implemented findings

### One continuous navigation experience

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| HIGH | `src/components/site-header.tsx`, root/home/docs layouts | Landing logo at x34.55/y13.59; separate docs logo at x15/y16 with different size and surroundings at 1440px | One persistent root header. Its logo box is identical on both routes: x34.55/y9.5, 119.95×44px at 1440px in Chromium. Search, Docs state, theme and navigation share positions. | Fixes the structural cause of the mismatch. |
| MEDIUM | `src/components/docs-shell.tsx`, `src/app/global.css` | Duplicate branding, search and theme controls in the sidebar; optional desktop collapse UI | Sidebar contains documentation navigation. Deleted the second logo, repeated utilities, desktop collapse mode, unused layout options and landing-only header. | Removes competing chrome and moving navigation. |
| MEDIUM | `docs-shell.tsx`, global/landing CSS | Fumadocs mobile header and separate section bar; independent sticky offsets | Browse docs and section navigation share one 48px bar below the common header. Header height drives sticky positions and anchor offsets. Added viewport/safe-area bounds. | More reading space, predictable navigation, visible anchor destinations. |

### Honest, usable actions

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| HIGH | `copy-control.tsx`, `code-block.tsx`, `copy-button.tsx`, docs page | Code copy could report success on denial; Markdown copy could copy an HTTP error body; three implementations | One small shared control awaits clipboard completion, checks HTTP status, reports failures locally and preserves a manual-copy path. Fumadocs still renders code. | Users and coding agents receive the intended content, with accurate feedback. |
| MEDIUM | Copy controls and global CSS | 24px code buttons; smaller docs utilities; landing success message moved the action band | 44px code/article/search/brand controls, compact icons, 40px desktop and 44px mobile sidebar rows. Copy success changes its icon and live status without moving content. Removed hidden shell prompt and redundant wrapper. | Consistent usability without making reading controls oversized. |
| MEDIUM | `site-provider.tsx` | Search dismissal returned focus to body; no initial destinations; terse empty state | Existing Radix close-focus hook restores the initiator, including keyboard-shortcut origin. Search offers three valid destinations, empty guidance and a usable failure link. | Users keep their place and have a next action. |
| MEDIUM | Search result integration | Inherited result buttons used invalid `aria-selected`; keyboard focus did not update the selected result | Keep native result buttons, remove unsupported selection semantics, mark the current result and synchronize focus through the existing Fumadocs list context. | Preserves the primitive's keyboard handling and gives focused-button Enter the expected destination. |
| MEDIUM | `mention-demo.tsx` | Alice Chen was visible, but `@chen` returned no matches | Search the visible full name and insert the corresponding `@username` using existing Mention configuration. | Visible content and behavior agree. |

### Finish and restraint

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| LOW | Global typography, search surfaces | Ordinary paragraph wrapping; search input had an awkward isolated outline | Pretty wrapping, existing title hierarchy, and a visible focus boundary across the search field's header. | Improves reading and focus clarity without replacing the visual identity. |
| MEDIUM | Search/sidebar/TOC CSS | Inherited blur, 300ms entrances, result/TOC height animation; general reduced-motion rule lost to authored specificity | Flat dimmed overlays; existing opacity/transform entrances at 150/180ms; instant result and TOC changes; explicit zero-duration reduced-motion overrides. | Less visual friction and correct motion preference behavior. |
| LOW | `DESIGN.md`, design sidecar, surface brief, README | Documentation described separate navigation and older control geometry | Records the shared header, mobile bar, copy behavior, motion, targets and current source locations. | Future changes have one accurate reference. |

## Considered but rejected

| Candidate | Reason rejected |
| --- | --- |
| Nudge the docs logo with CSS margins | Retains two independent headers and leaves the surrounding navigation inconsistent. |
| Replace the approved palette, hero typography or specimen composition | The identified problem was structural consistency and incomplete interaction details. The established identity remains coherent. |
| Add press scaling, animated icons, decorative shadows or a motion library | No user request for new animation; these add machinery without resolving the observed issues. |
| Confirm the sample playground's Clear action with a modal | Disproportionate friction for clearing explicitly labeled sample text. |
| Rebuild search, drawer or keyboard navigation primitives | Existing Fumadocs/Radix extension points support the required corrections. |

## Verification

- Local production build at `http://127.0.0.1:3490`; 45 generated pages, successful TypeScript/build and scoped Biome checks. No deployment, commit or new PR in this pass.
- Node Playwright with Chromium, Firefox and WebKit: native and rich-editor mention insertion, pointer/keyboard behavior, empty/Escape/Clear, copy success/denial, theme switching, mobile navigation/search, metadata and viewport bounds.
- Separate regression checks in all three engines: persistent header DOM across navigation and exact home/docs logo equality at 320, 390, 768, 1024, 1440 and 1920px; no page overflow; 44px copy targets; visible mobile anchor destinations; search close/shortcut focus; surname matching; unchanged copy-success layout; Markdown HTTP 503 and clipboard denial; search failure recovery.
- Initial WebKit geometry loops interrupted in-flight framework prefetches through immediate hard navigation. Request logging identified cancelled prefetches. The geometry harness now waits for those requests to settle before the next hard navigation; all three engines pass without page exceptions. No application workaround or error filtering was added.
- Chromium WCAG A/AA scans: landing/docs light; mobile landing and agent guide dark; docs dark at 1024/1440px; search dialog. Final results recorded in `/tmp/mention-polish-browser-results.json` and `/tmp/mention-polish-finish.json`.
- Search and sidebar entrances inspected at 10% playback: only opacity/transform keyframes; no resting page animation added. Reduced-motion search/sidebar durations verified as `0s` in all three engines.
- Final search checks exercise arrow selection, focused-result Enter, query results and navigation in all three engines.
- Independent read-only reviewer confirmed header equality, responsive navigation, copy handling, focus restoration and surname matching. The reviewer caught an incorrect suggested API URL during implementation; it was corrected and verified live.
- Representative captures: `/tmp/mention-polish-final-docs.png`, `/tmp/mention-polish-final-agent-mobile.png`, `/tmp/mention-polish-docs-dark.png`, `/tmp/mention-polish-search-finished.png`, `/tmp/mention-polish-sidebar-finished.png`. Baselines: `/tmp/mention-polish-before-home.png`, `/tmp/mention-polish-before-docs.png`.

Not verified: physical mobile hardware/software keyboard, manual VoiceOver/NVDA narration, production hosting, field performance, or every assistive-technology combination. Automated accessibility scans do not establish those outcomes. The underlying mention library's broader accessibility contract remains a separate concern.

## Verdict

**Approve** for the requested local interface consistency and polish scope. All reported findings are resolved, scoped code checks and the production build pass, the final automated accessibility scans have no violations, and the interaction checks pass in Chromium, Firefox and WebKit. Manual assistive-technology and physical-device verification remain explicitly unverified.
