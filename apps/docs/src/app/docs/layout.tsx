import { DocsShell } from "@/components/docs-shell";
import { source } from "@/lib/source";
export default function Layout({ children }: LayoutProps<"/docs">) {
  return <DocsShell tree={source.getPageTree()}>{children}</DocsShell>;
}
