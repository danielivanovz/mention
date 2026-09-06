export function createAgentPrompt(
  origin: string,
  pageTitle?: string,
  markdownPath?: string,
) {
  const url = (path: string) => new URL(path, origin).toString();
  const isSetup =
    !markdownPath ||
    markdownPath === "/llms.mdx/docs/content.md" ||
    markdownPath === "/llms.mdx/docs/agents/content.md";
  const references = [
    `Integration guide: ${url("/llms.mdx/docs/agents/content.md")}`,
    `Typed quickstart: ${url("/llms.mdx/docs/content.md")}`,
    `Documentation index: ${url("/llms.txt")}`,
  ];
  if (!isSetup && markdownPath)
    references.unshift(`Task reference (${pageTitle}): ${url(markdownPath)}`);

  return `${isSetup ? "Integrate @danielivanov/mention into this React application." : `Help me apply the Mention guide "${pageTitle}" to this project.`}

First inspect the project: its React version, package manager, existing input or rich editor, form state, data source, and design system. If the target input or intended behavior is ambiguous, ask me before choosing one.

Read these references before editing, then open only the additional recipes needed:
${references.join("\n")}

Mention requires React 19. Check compatibility and the installed package version; do not silently upgrade the app or assume APIs from another version.

Make the smallest appropriate integration. Preserve the app's styling and state ownership. For plain text, use the native textarea integration. For a rich editor, follow EditorAdapter<T> and keep its document, selection, mention nodes, and history in the editor. Do not flatten a rich document into textarea state.

Use typed items with stable keys and labels. Connect the existing data source; forward AbortSignal for async requests. Import @danielivanov/mention/styles.css only if using the default popup styles. Keep interactive state and render callbacks behind the client boundary when the framework requires it.

Run the project's type check and relevant tests. Verify trigger detection, arrow navigation, insertion, Escape, pointer selection, focus, and empty results. Where relevant, verify async cancellation and error states, or rich-editor undo and serialization. Report the changes, checks actually performed, and remaining limits.

If a reference is inaccessible, ask me for its Markdown rather than guessing the API.`;
}
