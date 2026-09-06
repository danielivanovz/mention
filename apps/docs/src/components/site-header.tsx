"use client";

import { FullSearchTrigger } from "fumadocs-ui/layouts/shared/slots/search-trigger";
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const inDocs = usePathname().startsWith("/docs");
  return (
    <header className="site-header">
      <a href={inDocs ? "#nd-page" : "#main-content"} className="skip-link">
        Skip to content
      </a>
      <div className="site-nav">
        <Link href="/" className="site-brand" aria-label="Mention home">
          mention
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/#playground" className="site-playground">
            Playground
          </Link>
          <Link href="/docs" aria-current={inDocs ? "true" : undefined}>
            Docs
          </Link>
          <a
            className="site-github"
            href="https://github.com/danielivanovz/mention"
          >
            GitHub
          </a>
          <FullSearchTrigger
            id="site-search"
            aria-label="Search documentation"
            className="site-search"
          />
          <ThemeSwitch mode="light-dark" className="site-theme" />
        </nav>
      </div>
    </header>
  );
}
