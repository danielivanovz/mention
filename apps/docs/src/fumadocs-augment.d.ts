import type { StructuredData } from "fumadocs-core/mdx-plugins/remark-structure";
import type { TOCItemType } from "fumadocs-core/server";
import type { Root } from "mdast";
import type { MDXContent } from "mdx/types";

declare module "fumadocs-core/source" {
  interface PageData {
    title: string;
    full?: boolean;
    body: MDXContent;
    toc: TOCItemType[];
    structuredData: StructuredData;
    _exports: Record<string, unknown>;
    info: { path: string; fullPath: string };
    getText: (type: "raw" | "processed") => Promise<string>;
    getMDAST: () => Promise<Root>;
  }
}
