import { absoluteUrl, requestOrigin } from "@/lib/site";
import { getLLMText, source } from "@/lib/source";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: RouteContext<"/llms.mdx/docs/[[...slug]]">,
) {
  const { slug } = await params;
  const origin = requestOrigin(request);
  // Only the generated content.md leaf is a document, never a folder or alias.
  const page =
    slug?.at(-1) === "content.md"
      ? source.getPage(slug.slice(0, -1))
      : undefined;
  if (!page) {
    return new Response("Documentation page not found.\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(await getLLMText(page, origin), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Link: `<${absoluteUrl(page.url, origin)}>; rel="canonical"; type="text/html"`,
    },
  });
}
