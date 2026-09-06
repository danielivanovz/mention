import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { docsContentRoute, docsImageRoute, docsRoute } from "./shared";
import { absoluteUrl, siteUrl } from "./site";

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export function getPageImage(page: (typeof source)["$inferPage"]) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: `${docsImageRoute}/${segments.join("/")}`,
  };
}

export function getPageMarkdownUrl(page: (typeof source)["$inferPage"]) {
  const segments = [...page.slugs, "content.md"];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join("/")}`,
  };
}

export function getPageAlternates(page: (typeof source)["$inferPage"]) {
  if (!siteUrl) return undefined;
  return {
    canonical: absoluteUrl(page.url, siteUrl),
    types: {
      "text/markdown": absoluteUrl(getPageMarkdownUrl(page).url, siteUrl),
    },
  };
}

export async function getLLMText(
  page: (typeof source)["$inferPage"],
  origin: string,
) {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title}

${page.data.description ?? ""}

Canonical: ${absoluteUrl(page.url, origin)}

${processed}`;
}
