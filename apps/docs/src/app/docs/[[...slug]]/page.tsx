import {
  DocsBody,
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { Code2, FileText } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentSetup } from "@/components/agent-setup";
import { CopyControl } from "@/components/copy-control";
import { DocsArticle } from "@/components/docs-shell";
import { getMDXComponents } from "@/components/mdx";
import { gitConfig } from "@/lib/shared";
import { siteUrl } from "@/lib/site";
import {
  getPageAlternates,
  getPageImage,
  getPageMarkdownUrl,
  source,
} from "@/lib/source";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;

  return (
    <DocsArticle role="main" toc={page.data.toc} full={page.data.full}>
      <DocsTitle className="docs-title">{page.data.title}</DocsTitle>
      <DocsDescription className="docs-description mb-0">
        {page.data.description}
      </DocsDescription>
      <div className="docs-actions">
        <AgentSetup pageTitle={page.data.title} markdownPath={markdownUrl} />
        <CopyControl
          url={markdownUrl}
          label="Copy Markdown"
          failureMessage="Copy failed. Open Markdown to select and copy the document."
        />
        <a href={markdownUrl}>
          <FileText size={14} aria-hidden="true" /> Markdown
        </a>
        {gitConfig.branch && (
          <a
            href={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${encodeURIComponent(gitConfig.branch)}/apps/docs/content/docs/${page.path}`}
          >
            <Code2 size={14} aria-hidden="true" /> Source
          </a>
        )}
      </div>
      <DocsBody className="docs-body">
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsArticle>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    alternates: getPageAlternates(page),
    description: page.data.description,
    openGraph: siteUrl ? { images: getPageImage(page).url } : undefined,
  };
}
