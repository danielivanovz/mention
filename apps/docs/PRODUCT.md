# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Record Authority

This record covers the Mention website in `apps/docs`: the landing page, documentation, and agent onboarding. It also records the library facts those surfaces must represent accurately.

The user requested a complete greenfield UI/UX/AX redesign and explicitly delegated completion of Impeccable's playbook to a subagent before continuing. The decisions marked **Delegated decision** below are that representative's answers, inferred from the user's stated ambition and verified repository evidence. They are not additional statements directly confirmed by the user.

## Users

- **User-confirmed audience:** React developers. The user wants Mention to become the de facto best mention library for React.
- **Delegated decision:** The primary visitor is a developer evaluating or integrating mention suggestions into a composer, form, or rich editor. They need to understand the behavior, choose the correct integration, and reach a working implementation with little interpretation.
- **Delegated decision:** Coding agents are a second reader of the same product knowledge, acting for those developers. They need discoverable, focused documentation, truthful typed contracts, executable examples, and clear verification steps.

## Product Purpose

Mention adds suggestions at the caret while users write. It supports native textareas and editor integrations. The user's ambition is broad leadership in React mentions; the product is not permanently limited to textareas.

**Delegated decision:** Website success means a developer or coding agent can choose an editing host, integrate the current API, and verify selection and insertion behavior without reconstructing the library from scattered examples. A compelling live demonstration should help the human reader judge the interaction before investing in implementation.

## Positioning

The implemented boundary is simple: Mention owns trigger detection, suggestion queries, navigation, and positioning; the editing host owns its document and edits. A native textarea uses the built-in integration. Rich editors connect through `EditorAdapter<T>` and retain their own transactions, mention nodes, formatting, clipboard handling, serialization, and history.

This is a factual architectural distinction, not evidence of market superiority, exclusivity, or universal editor compatibility. The user's goal of becoming the best is an ambition, not a present-tense claim to publish.

## Operating Context

- The library package is `@danielivanov/mention`, requires React 19, and is licensed MIT according to `../../packages/react/package.json`.
- This website is an existing Next.js and Fumadocs application in a Bun workspace. The redesign does not require choosing a new application framework.
- The published entry point provides components, hooks, types, and optional CSS. The repository contains the library source and executable integration examples.
- Developers may use plain React or a framework with server/client component boundaries. Examples that use state or render callbacks must make the applicable client boundary clear.
- Repository Source actions are shown only with a configured `VERCEL_GIT_COMMIT_SHA` or `NEXT_PUBLIC_GIT_REF`, so a source link names the matching revision. Local, unpushed work still exposes its maintained Markdown directly. Static metadata uses `NEXT_PUBLIC_SITE_URL` or the applicable Vercel deployment URL; without either, absolute metadata is omitted. Text exports use the incoming request origin, while setup prompts use the browser origin. There is no fixed development address in product links.
- The existing MDX documentation is the content source for both human pages and text exports. It includes a quickstart, API reference, recipes with an executable form, a direct Rich-text editors guide, troubleshooting, accessibility limitations, and Internals covering editor ownership, request lifecycle, caret positioning, and focus/ARIA. These explanations are checked against the current source; they do not carry forward prototype accessibility or compatibility claims.
- **Delegated decision:** Evaluation, installation, integration, and verification are one connected workflow. Agent onboarding should lead into the same maintained docs and examples, with progressive access to relevant detail.

## Capabilities and Constraints

- Multiple triggers can share one host, with separate typed item channels.
- Queries can opt into horizontal spaces per channel for full-name search. Arrays accept a pure synchronous `filter`; the default remains case-insensitive label substring matching. The landing and Lexical examples opt into accent folding for their sample names.
- Static and asynchronous items are supported. Async fetchers receive a query and `AbortSignal`; the implementation prevents obsolete results from being selected. A failed search hides the suggestion list and can be retried through the existing explicit open action. The executable async example demonstrates application-owned status text and a Retry search action without changing the query.
- Keyboard navigation, caret positioning, composition-aware event handling, controlled textarea props, custom option rendering, and optional styles are implemented.
- `Mention.Root`, `Mention.Input`, `Mention.Popover`, `Mention.List`, `Mention.Item`, and the associated hooks are the current API. Do not reintroduce deleted editable/chip APIs in examples or copy.
- The quickstart composer, controlled form, asynchronous search, ProseMirror, and Lexical demos import the actual example components. Fumadocs includes those same source files in HTML code blocks and processed Markdown; no separate snippets or export generator are maintained.
- The executable ProseMirror and Lexical examples demonstrate editor-owned mention nodes, formatting, transactions, clipboard data, and history. They do not establish verified adapters for Tiptap, Slate, or other editors. Lexical stays an example dependency and adds no library runtime dependency.
- The landing playground switches between a native textarea and the maintained Lexical host. Each mode retains its own draft and history while mounted; switching does not convert documents. Lexical loads on demand. Each mode links to its integration guide.
- Native textarea undo grouping remains browser-defined. Rich-editor history belongs to the editor.
- The user states the product is not used yet. No announcements, compatibility theater, or fabricated migration obligations are needed for this redesign.
- **Delegated decision:** This work may replace the website's visual identity, information architecture, copy structure, navigation, and agent-facing documentation delivery. Preserve actual product behavior and factual content. The subsequent user-authorized integration pass separately addresses the textarea role conflict and verifies form behavior, including repeated queries after dismissal and reset. That pass also fixes document scrolling caused by revealing a suggestion: only the listbox now scrolls.
- Deployment requires explicit user authorization. The user has authorized merging and deploying the five improvements from the microinteraction review; this does not grant standing authorization for later deployments.
- **Open decision:** Additional editor adapters should follow independently verified implementations. No date or compatibility commitment is established.
- Agent setup is a small preview-and-copy action on the landing page and documentation. Its prompt guides the user's coding agent through the existing docs; it does not configure an agent, provide credentials, or claim a hosted integration.
- **Open decision:** A downloadable agent skill may be considered if observed integration failures justify it. A chatbot, hosted MCP service, or separate agent platform is not an established product requirement.

## Brand Commitments

The established product name is Mention and the package identifier is `@danielivanov/mention`. The user has authorized a replacement visual world; the incumbent styling is not a binding commitment.

**Delegated decision:** Use precise, direct language. Show concrete behavior and usable integration instructions. Keep the ambition in the quality of the work rather than unsupported claims, fictional customers, or AI-era slogans.

## Evidence on Hand

- `../../packages/react/README.md` and `../../packages/react/package.json`: package identity, supported React version, license, API shape, architecture, and declared size budget.
- `../../packages/react/src/`: current implementation and typed contracts.
- `../../packages/react/examples/ProseMirror.tsx` and `../../packages/react/examples/Lexical.tsx`: executable rich-editor integrations.
- `../../packages/react/e2e/`: browser checks for interaction contracts, editing, editor integration, and automated accessibility findings.
- `content/docs/`: maintained product explanations and recipes.
- `content/docs/accessibility.mdx`: textbox/listbox semantics, recorded automated findings, and manual verification limits.
- Existing live demos: real interaction evidence that can be redesigned without substituting a decorative simulation.
- Agent-experience research was collected in `/tmp/mention-agent-experience-research.md` on 6 September 2026. Its findings inform delivery and discovery; it is a working research note, not an additional product authority.
- There is no verified customer, adoption, testimonial, award, comparative benchmark, or complete assistive-technology validation evidence available for this design. Do not fabricate it.

## Product Principles

1. Pursue the user's broad React mention ambition with the smallest architecture that supports real behavior.
2. Prefer deleting unnecessary parts over simplifying them, simplifying over optimizing, and optimizing over automating.
3. Keep ownership clear: Mention manages suggestions; the editing host manages the document and its transactions.
4. **Delegated decision:** Give humans and coding agents the same authoritative product truth through formats suited to their tasks.
5. **Delegated decision:** Judge the website by a working, verifiable integration and an understandable interaction, not by claims or the amount of infrastructure added.

## Accessibility & Inclusion

The current library keeps focus in the editing host during suggestion navigation and provides listbox/option relationships, selection attributes, and keyboard behavior. Native textareas retain their implicit textbox role. Rich editors supply their own textbox role and multiline state; Mention adds suggestion relationships without assigning the host role or expanded state. Long scrolling lists retain a documented axe heuristic finding, with keyboard scrolling verified separately.

Automated browser checks do not establish compatibility with NVDA, JAWS, VoiceOver, TalkBack, or real OS IMEs. The current revision still needs those manual checks. Preserve these limits in documentation and do not turn them into blanket accessibility claims.

**Delegated decision:** The redesigned website itself must preserve semantic navigation, named controls, visible focus, keyboard access, responsive reading and operation, usable contrast, and reduced-motion behavior. Human accessibility and agent experience are related practical concerns, not interchangeable certifications.
