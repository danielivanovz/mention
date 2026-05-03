import Link from "next/link";
import type { CSSProperties } from "react";
import { AnatomyDiagram } from "@/components/anatomy-diagram";
import { CopyButton } from "@/components/copy-button";
import { HeroShaderClient } from "@/components/hero-shader-client";
import { MentionDemo } from "@/components/mention-demo";
import { Reveal } from "@/components/reveal";
import { UseCasesGrid } from "@/components/use-cases-grid";

// Tiny helper to set the cascade index used by `.hero-stagger > *`'s
// `animation-delay: calc(var(--i, 0) * 60ms)` rule. Inline custom
// properties keep the page a server component (no client wrapper just
// to set a number).
const order = (i: number): CSSProperties =>
  ({ ["--i" as string]: i }) as CSSProperties;

export default function HomePage() {
  return (
    <div className="text-fg">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        {/* Static fallback — visible if the shader fails or JS is off. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "conic-gradient(from 220deg at 70% 30%, var(--bg) 0%, var(--bg-elevated) 30%, var(--bg) 70%)",
          }}
        />
        <div className="absolute inset-0 -z-10 opacity-60">
          <HeroShaderClient />
        </div>

        <div className="hero-stagger mx-auto max-w-6xl px-6 pt-24 pb-32 sm:pt-32 sm:pb-40">
          <p className="font-mono text-meta text-fg-muted" style={order(0)}>
            v0.1 · MIT
          </p>
          <h1
            className="mt-4 max-w-3xl font-display font-semibold tracking-tight"
            style={{
              fontSize: "var(--type-display)",
              lineHeight: 1.02,
              ...order(1),
            }}
          >
            A textarea-native mention &amp; trigger primitive for React.
          </h1>
          <p
            className="mt-6 max-w-prose text-lg text-fg-muted"
            style={order(2)}
          >
            Headless, accessible, ~14 kB. <code className="font-mono text-sm">@</code>{" "}
            mentions, <code className="font-mono text-sm">#</code> channels,{" "}
            <code className="font-mono text-sm">/</code> commands —{" "}
            <em>any trigger you want</em>, in one editor, with the WAI-ARIA
            combobox contract done right and no rich-text framework.
          </p>

          <div
            className="mt-10 flex flex-wrap items-center gap-4"
            style={order(3)}
          >
            <CopyButton value="bun add @danielivanovz/mention" />
            <Link
              href="/docs"
              className="text-sm text-fg-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
            >
              Read the docs →
            </Link>
          </div>

          <div className="mt-16 max-w-2xl" style={order(4)}>
            <MentionDemo />
            <p className="mt-3 font-mono text-meta text-fg-muted">
              Try{" "}
              <kbd className="rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5 text-[11px]">
                @alice
              </kbd>
              ,{" "}
              <kbd className="rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5 text-[11px]">
                #design
              </kbd>
              , or{" "}
              <kbd className="rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5 text-[11px]">
                /summarise
              </kbd>{" "}
              — arrow keys, ↵ to insert, esc to dismiss.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Use cases ────────────────────────────────────────── */}
      <section className="border-t border-border-subtle/60 bg-bg">
        <div className="mx-auto max-w-6xl px-6 pt-28 pb-20">
          <div className="max-w-2xl">
            <p className="font-mono text-meta text-fg-muted">
              Same primitive, three contexts
            </p>
            <h2
              className="mt-3 font-display font-semibold tracking-tight"
              style={{ fontSize: "var(--type-h1)", lineHeight: 1.1 }}
            >
              Same primitive, three contexts. The chrome changes; the contract
              doesn't.
            </h2>
          </div>

          <UseCasesGrid />
        </div>
      </section>

      {/* ─── Why ──────────────────────────────────────────────── */}
      <section className="border-t border-border-subtle/60 bg-bg-elevated">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-32">
          <p className="font-mono text-meta text-fg-muted">Why this lib</p>

          <div className="mt-16 space-y-14 max-w-3xl">
            <Reveal>
              <Claim
                n="01"
                title="Accessible by construction."
                body="Combobox-as-substring done by the WAI-ARIA APG: textarea keeps focus, aria-activedescendant moves between virtual options, screen readers narrate changes without focus theft."
              />
            </Reveal>
            <Reveal delay={40}>
              <Claim
                n="02"
                title="Multi-trigger by design."
                body="One editor, any combination of triggers. Pass a triggers map keyed by the characters you choose — @ mentions, # channels, / commands, : emoji — each with its own item shape, render, and insert format. Channel switching, per-channel typing, and discriminated payloads all handled by the library; you write three render-props instead of three components."
              />
            </Reveal>
            <Reveal delay={80}>
              <Claim
                n="03"
                title="Textarea-native."
                body="Plain <textarea>. No contenteditable, no custom selection model, no rich-text framework. Forms submit it, password managers fill it, mobile keyboards behave."
              />
            </Reveal>
            <Reveal delay={120}>
              <Claim
                n="04"
                title="Caret-anchored popover."
                body="Mirror-div math measures the active line + column, then anchors via Floating UI's virtual element. The popover follows the caret pixel-perfectly across wraps and resizes."
              />
            </Reveal>
            <Reveal delay={160}>
              <Claim
                n="05"
                title="i18n + IME safe."
                body="CJK / Thai / Khmer / Lao / Myanmar word boundaries handled at the dispatcher; bidi-aware caret math for RTL; composition guards so Japanese, Pinyin, and Gboard never race past the trigger. The plumbing most mention libraries skip."
              />
            </Reveal>
            <Reveal delay={200}>
              <Claim
                n="06"
                title="shadcn-friendly."
                body="Theme tokens resolve through --popover, --accent, --border. Drop it in any shadcn project and it inherits. Or use the unstyled prop and drive every selector yourself."
              />
            </Reveal>
            <Reveal delay={240}>
              <Claim
                n="07"
                title="Small."
                body="~14 kB minified+gzipped, ceiling-enforced in CI. No editor framework, no DOM library, no Tailwind dependency, no portal hacks. The runtime is the reducer + a popover."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Anatomy ──────────────────────────────────────────── */}
      <section className="border-t border-border-subtle/60 bg-bg">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-28">
          <p className="font-mono text-meta text-fg-muted">Anatomy</p>
          <h2
            className="mt-3 max-w-2xl font-display font-semibold tracking-tight"
            style={{ fontSize: "var(--type-h1)", lineHeight: 1.1 }}
          >
            The bit that's interesting: the combobox-as-substring contract.
          </h2>
          <p className="mt-4 max-w-prose text-fg-muted">
            The textarea never gives up focus. The popover is a virtual listbox
            that the textarea points at — both via{" "}
            <code className="font-mono text-sm">aria-controls</code> and,
            per-keystroke, via{" "}
            <code className="font-mono text-sm">aria-activedescendant</code>.
            That contract is what lets the primitive ship without owning a
            single tab stop or selection model.
          </p>
          <AnatomyDiagram />
        </div>
      </section>

      {/* ─── Install + footer ─────────────────────────────────── */}
      <section className="border-t border-border-subtle/60 bg-bg-elevated">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="font-mono text-meta text-fg-muted">Install</p>
              <h2
                className="mt-3 font-display font-semibold tracking-tight"
                style={{ fontSize: "var(--type-h1)", lineHeight: 1.1 }}
              >
                Add it.
              </h2>
              <div className="mt-6">
                <CopyButton value="bun add @danielivanovz/mention" />
              </div>
              <p className="mt-4 font-mono text-meta text-fg-muted">
                Peers: react ≥ 18 · react-dom ≥ 18.
              </p>
            </div>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center self-start rounded-md border border-border-subtle bg-bg px-5 py-2.5 font-mono text-sm transition-colors hover:border-fg-muted/50"
            >
              Read the docs →
            </Link>
          </div>
        </div>

        <footer className="border-t border-border-subtle/60">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-meta text-fg-muted sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono">@danielivanovz/mention · v0.1 · MIT</p>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a
                href="https://www.npmjs.com/package/@danielivanovz/mention"
                className="transition-colors hover:text-fg"
                target="_blank"
                rel="noopener noreferrer"
              >
                npm
              </a>
              <a
                href="https://github.com/danielivanovz/mention"
                className="transition-colors hover:text-fg"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <Link href="/docs" className="transition-colors hover:text-fg">
                Docs
              </Link>
              <span>MIT · 2026</span>
            </nav>
          </div>
        </footer>
      </section>
    </div>
  );
}

interface ClaimProps {
  n: string;
  title: string;
  body: string;
}

function Claim({ n, title, body }: ClaimProps) {
  return (
    <div>
      <p className="font-mono text-meta text-fg-muted">{n}</p>
      <h3
        className="mt-2 font-display font-semibold tracking-tight"
        style={{ fontSize: "var(--type-h2)", lineHeight: 1.2 }}
      >
        {title}
      </h3>
      <p className="mt-3 max-w-prose text-fg-muted">{body}</p>
    </div>
  );
}
