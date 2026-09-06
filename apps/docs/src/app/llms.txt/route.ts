import { absoluteUrl, requestOrigin } from "@/lib/site";
import { getPageMarkdownUrl, source } from "@/lib/source";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const origin = requestOrigin(request);
  const pages = source.getPages();
  const entrySlugs = ["agents", "", "api-reference"];
  const entries = entrySlugs.flatMap((slug) => {
    const page = source.getPage(slug ? [slug] : []);
    return page ? [page] : [];
  });
  const link = (page: (typeof source)["$inferPage"]) =>
    `- [${page.data.title}](${absoluteUrl(getPageMarkdownUrl(page).url, origin)}): ${page.data.description ?? ""}`;

  const content = `# Mention

> Headless React mention suggestions for native textareas and editor integrations. Requires React 19. Install @danielivanov/mention from npm; styling is optional.

Mention owns trigger detection, suggestion search, keyboard selection, and caret positioning. Textareas store plain text. Rich editors own their documents, mention nodes, transactions, clipboard behavior, and history.

## Start here

Read the coding-agent guide, follow the typed quickstart, then consult the API reference or a focused recipe. All documentation links below return Markdown from the same sources as the browser pages.

${entries.map(link).join("\n")}

## Guides and recipes

${pages
  .filter((page) => !entries.includes(page))
  .map(link)
  .join("\n")}

## Optional

- [Complete documentation](${absoluteUrl("/llms-full.txt", origin)}): All guides in one plain-text response.
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Link: `<${absoluteUrl("/llms.txt", origin)}>; rel="canonical"`,
    },
  });
}
