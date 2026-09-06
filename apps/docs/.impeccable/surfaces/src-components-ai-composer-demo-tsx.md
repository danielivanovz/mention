---
version: 1
slug: "src-components-ai-composer-demo-tsx"
primary_target: "src/components/ai-composer-demo.tsx"
related_targets: ["src/components/mention-demo.tsx", "src/app/global.css", "content/docs/ai-composer.mdx", "../../packages/react/examples/AIComposerDemo.tsx", "../../packages/react/examples/registry/default/ai-composer/ai-composer.tsx", "../../packages/react/examples/registry/default/ai-composer/mention-editor.tsx", "../../registry.json"]
---

# AI composer extension

Mode: Operate for the embedded writing interaction; Read for the integration article. The parent landing surface remains Persuade. This is a local extension of the approved [Type foundry proof surface](src-app-home-page-tsx.md), its [Ink Block composition](../mocks/ink-block.png), and [approval record](../mocks/ink-block.json), seed `51aacbab`. The existing [design system](../../DESIGN.md), shared header, and broad pink specimen remain authoritative.

The developer selects document references, sends a draft, and inspects the actual submitted message parts before installing the same source into a React 19 application. The third landing tab preserves the existing manual activation pattern, first-use loading, and independent drafts. Its guide link uses the incumbent underlined caption and Lucide arrow. The documentation embeds the same example within its ordinary reading layout.

The composer uses the sheet ground, subtle identifying borders, control corners, and Archivo reading type already established by the website. shadcn/ui semantic colors resolve to the existing site variables in both themes. The input group carries the visible focus outline; messages stay within a bounded conversation viewport. User bubbles use a quiet raised sheet, document-reference tokens use the muted/foreground pair, and the request inspector reserves mono for actual outgoing data. The instructional heading and sample-response note use an explicit wrapping gap rather than relying on a landing-only layout selector. Failure controls and status text remain outside the suggestion listbox.

States covered: empty draft, document suggestions, selected references, streamed response, submitted context, failure with retained draft and retry, stopped response, independent mode drafts, and narrow-screen wrapping. Enter selects a highlighted result before sending; Shift+Enter adds a line. Focus stays in the writing host while Mention navigates suggestions. The current Lexical snapshot supplies both text and document IDs, including deletion, paste, and undo changes.

The website labels its responses as samples and uses `@shadcn/helpers/ai-sdk` for a scripted local transport. Sample documents, failure injection, and the request inspector belong to `AIComposerDemo.tsx`; they are excluded from the installable item. The GitHub registry, website, browser fixture, and copied article source share the installable composer and Lexical host. The consumer supplies its authenticated model route and document resolver. No live model endpoint, public namespace approval, or universal rich-editor support is implied.

The [verification record](../reviews/ai-composer-registry.md) records the checked working tree, finish-review fixes, browser evidence, and publication limits. Existing sidecar drift is outside this extension; no new global tokens or unrelated design changes were introduced.
