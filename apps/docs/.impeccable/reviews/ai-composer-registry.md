# AI composer and GitHub registry

Verified locally on 7 September 2026 in the uncommitted working tree of `feature/ai-composer-registry`, based on `dcaf472b2b447bed5b7bf78f5be3f993433c5e5d`. This record describes that working tree and its local production build, not the unchanged base commit or a deployed release. No deployment or npm publication was performed for this extension. The preexisting untracked `apps/docs/vercel.json` was left untouched.

## Scope and design authority

The approved extension adds a Mention + shadcn/ui + AI SDK 7 composer, a helpers-backed scripted demonstration, a GitHub registry item, a third landing playground mode, and an executable integration guide. The composer and editor host in `packages/react/examples/registry/default/ai-composer` are shared by installation, website examples, copied documentation source, and browser fixtures. Helpers and sample data stay in the website demonstration wrapper.

The incumbent [DESIGN.md](../../DESIGN.md), [PRODUCT.md](../../PRODUCT.md), [landing surface brief](../surfaces/src-app-home-page-tsx.md), and approved [Ink Block composition](../mocks/ink-block.png) with its [approval sidecar](../mocks/ink-block.json) establish Type foundry proof, seed `51aacbab`. The extension preserves the shared ink header, pink specimen, flat sheet surfaces, Archivo reading type, existing theme pairs, and modest control corners. Its focused [surface brief](../surfaces/src-components-ai-composer-demo-tsx.md) records the new interaction. The documenter added only a narrow Editor Modes update to DESIGN.md; preexisting sidecar drift was not repaired or promoted into new rules.

## Behavior and ownership

Mention owns suggestions and their keyboard selection. The shared Lexical host owns editing, mention nodes, clipboard representation, and history. One current snapshot supplies both submitted text and distinct document IDs; accumulated insertion callbacks are not used as a reference inventory. A failed or stopped response retains the draft. Retrying an earlier message preserves a newer edited draft, while a completed response clears only its submitted draft.

The website streams explicitly scripted sample responses with no model or network request. Its submitted-context inspector and one-shot failure control make the integration observable. The installable composer defaults to the consumer application's `/api/chat`; its copied server helper validates message parts and resolves IDs through an application-owned authenticated lookup before producing model context. The starter handles text and user document references; additional tool or metadata parts require matching application schemas.

## Verification

The implementation and browser verification passes supplied the following results. The documenter inspected the affected source, approved composition, final desktop/mobile captures, and both supplied website result files; it did not rerun those suites.

- All 98 unit/property tests passed, including seven server reference-resolver tests.
- The focused Chromium, Firefox, and WebKit suites passed 40 browser checks: 18 AI composer checks and 22 Lexical checks. Two existing native clipboard cases were skipped. After the final whitespace change, all 18 AI composer checks passed again.
- Production website build, type checks, and scoped Biome checks passed. After both finish-review fixes, the final docs build, registry validation, and scoped Biome check of 25 files passed again. The built core measured 12.43 kB gzip, below its 14 kB budget. AI SDK, shadcn/ui, and Lexical remain consumer/example dependencies.
- All six website flows passed across Chromium, Firefox, and WebKit at 1440 and 390 CSS pixels. They exercised manual tab focus/activation, lazy loading, independent drafts, current document IDs, sending, source copying, and the linked Markdown export. No page overflow or application errors were recorded.
- Chromium axe checks found zero violations at both widths for the light suggestion popup, dark sent state, and documentation example. These findings do not establish screen-reader or real OS IME compatibility; those manual checks were not performed.
- A second fresh React 19 / Tailwind 4 shadcn consumer, without existing generated UI files or their dependencies, installed all 11 files through the CLI. Strict TypeScript checking and a Vite production build passed. The default HTTP transport posted `data-mentions`; a streamed response completed and cleared the submitted draft. Executing the copied server helper confirmed that authoritative names and contents replace client-supplied labels.

Website evidence: `/tmp/mention-ai-review-final/results.json` and captures in `/tmp/mention-ai-review-final/` cover empty, suggestion, sent, dark, and documentation states. The final fix confirmation is recorded in `/tmp/mention-ai-review-verdict/results.json` and `{docs,landing}-{1440,390}.png` in that directory. These temporary artifacts describe a local session, not a permanent browser-testing framework.

## Installation and release limits

The clean consumer used a packed local `@danielivanov/mention` 0.2.0 tarball override because npm supplied 0.1.0 at verification time. All other dependencies came through normal installation, and neither helpers nor sample data was installed. This proves the copied consumer integration against the local package; public installation still requires publishing Mention 0.2.0 and merging the registry source. No shadcn directory namespace approval or submission is claimed.

## Finish review

The finish reviewer accepted the retained visual world and requested one batch of two scoped fixes. The heading now uses a shared wrapping layout in both article and landing contexts; the guide caption uses the established Lucide icon. Final captures and measured bounds confirm the fixes at both widths.

| Finding | Disposition | Evidence |
| --- | --- | --- |
| Demo heading and sample note concatenate in the documentation context | Resolved | `AIComposerDemo.tsx` uses the shared `ai-demo-heading` class. Its flex layout wraps with an explicit gap. Final result bounds separate the two labels horizontally at 1440px and vertically at 390px; both captures remain within the page width. |
| Landing guide caption uses a literal arrow glyph | Resolved | `mention-demo.tsx` renders Lucide `ArrowUpRight`. The icon is visible in both final landing captures, and the supplied confirmation records `iconVisible: true` at each width. |

The approved composition, colors, reading density, and control language remain intact. No unresolved finding from this finish batch remains. One-off layout values, dependency defaults, sample data, and demo-only controls were not promoted into global design tokens.

Disposition: **SHIP** for the locally verified extension. Publication and deployment remain separate actions with the limits above.
