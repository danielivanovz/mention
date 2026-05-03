// Minimal top bar for `/`. The Fumadocs HomeLayout chrome is dropped on
// this route because its nav width + borders fight the vaul-rhythm. We
// reuse Fumadocs's own ThemeSwitch — same toggle behaviour as /docs,
// no extra next-themes dependency in this workspace.

import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import Link from "next/link";

export function HomeNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle/60 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-display text-base font-semibold tracking-tight"
        >
          @mention
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/docs"
            className="rounded-md px-3 py-1.5 text-fg-muted transition-colors hover:text-fg"
          >
            Docs
          </Link>
          <Link
            href="/internals"
            className="rounded-md px-3 py-1.5 text-fg-muted transition-colors hover:text-fg"
          >
            Internals
          </Link>
          <a
            href="https://github.com/danielivanovz/mention"
            className="rounded-md px-3 py-1.5 text-fg-muted transition-colors hover:text-fg"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <ThemeSwitch className="ml-1 border-border-subtle" />
        </nav>
      </div>
    </header>
  );
}
