"use client";

import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { DocsPage, type DocsPageProps } from "fumadocs-ui/layouts/docs/page";
import {
  TOC,
  TOCPopover,
  type TOCPopoverProps,
  TOCProvider,
} from "fumadocs-ui/layouts/docs/page/slots/toc";
import { SidebarTrigger } from "fumadocs-ui/layouts/docs/slots/sidebar";
import { Menu } from "lucide-react";
import type { ComponentProps, CSSProperties } from "react";

function NoSidebarBrand() {
  return null;
}

function DocsContents(props: TOCPopoverProps) {
  return (
    <nav className="docs-mobile-bar" aria-label="Documentation controls">
      <SidebarTrigger className="docs-menu-trigger" aria-label="Browse docs">
        <Menu size={18} aria-hidden="true" /> Browse docs
      </SidebarTrigger>
      <TOCPopover {...props} trigger={{ "aria-label": "On this page" }} />
    </nav>
  );
}

export function DocsArticle(props: DocsPageProps) {
  return (
    <DocsPage
      {...props}
      tableOfContent={{
        ...props.tableOfContent,
        container: {
          ...props.tableOfContent?.container,
          role: "navigation",
          "aria-label": "On this page",
        },
      }}
      slots={{
        toc: { provider: TOCProvider, main: TOC, popover: DocsContents },
      }}
    />
  );
}

export function DocsShell({
  children,
  tree,
}: Pick<ComponentProps<typeof DocsLayout>, "children" | "tree">) {
  return (
    <DocsLayout
      tree={tree}
      nav={{ enabled: false }}
      slots={{ navTitle: NoSidebarBrand }}
      sidebar={{
        collapsible: false,
        banner: <p className="docs-nav-title">Documentation</p>,
      }}
      searchToggle={{ enabled: false }}
      themeSwitch={{ enabled: false }}
      containerProps={{
        className: "mention-docs",
        style: {
          "--fd-docs-row-1": "var(--site-header-height)",
          minHeight: "calc(100dvh - var(--site-header-height))",
        } as CSSProperties,
      }}
    >
      {children}
    </DocsLayout>
  );
}
