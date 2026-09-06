import { absoluteUrl, requestOrigin } from "@/lib/site";
import { getLLMText, source } from "@/lib/source";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = requestOrigin(request);
  const scan = source.getPages().map((page) => getLLMText(page, origin));
  const scanned = await Promise.all(scan);

  return new Response(scanned.join("\n\n---\n\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Link: `<${absoluteUrl("/llms-full.txt", origin)}>; rel="canonical"`,
    },
  });
}
