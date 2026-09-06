"use client";

import { useDocsSearch } from "fumadocs-core/search/client";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogListItem,
  SearchDialogOverlay,
  useSearchList,
} from "fumadocs-ui/components/dialog/search";
import type { SharedProps } from "fumadocs-ui/contexts/search";
import { RootProvider } from "fumadocs-ui/provider/next";
import Link from "next/link";
import { type ComponentProps, type ReactNode, useRef } from "react";

const suggestedPages = [
  {
    id: "quickstart",
    type: "page" as const,
    content: "Quickstart",
    url: "/docs",
  },
  {
    id: "agents",
    type: "page" as const,
    content: "Coding-agent guide",
    url: "/docs/agents",
  },
  {
    id: "api",
    type: "page" as const,
    content: "API reference",
    url: "/docs/api-reference",
  },
];

function SearchResult(props: ComponentProps<typeof SearchDialogListItem>) {
  const { active, setActive } = useSearchList();
  return (
    <SearchDialogListItem
      {...props}
      aria-selected={undefined}
      aria-current={active === props.item.id ? "true" : undefined}
      onFocus={() => setActive(props.item.id)}
    />
  );
}

function DocumentationSearch(props: SharedProps) {
  const { search, setSearch, query } = useDocsSearch({ type: "fetch" });
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <SearchDialog
      {...props}
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
    >
      <SearchDialogOverlay className="site-search-overlay" />
      <SearchDialogContent
        className="site-search-dialog"
        onOpenAutoFocus={() => {
          returnFocus.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = returnFocus.current;
          (target?.isConnected && target !== document.body
            ? target
            : document.getElementById("site-search")
          )?.focus({ preventScroll: true });
        }}
      >
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput aria-label="Search documentation" />
          <SearchDialogClose aria-label="Close search" />
        </SearchDialogHeader>
        {query.error ? (
          <p className="search-feedback" role="status">
            Search is unavailable. Try another term, or{" "}
            <Link href="/docs" onClick={() => props.onOpenChange(false)}>
              browse the documentation
            </Link>
            .
          </p>
        ) : (
          <SearchDialogList
            className="site-search-results"
            Item={(props) => <SearchResult {...props} />}
            items={query.data === "empty" ? suggestedPages : query.data}
          />
        )}
      </SearchDialogContent>
    </SearchDialog>
  );
}

export function SiteProvider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      theme={{ defaultTheme: "light" }}
      search={{ SearchDialog: DocumentationSearch }}
      i18n={{
        translations: {
          searchNoResult: "No results. Try a shorter or different term.",
        },
      }}
    >
      {children}
    </RootProvider>
  );
}
