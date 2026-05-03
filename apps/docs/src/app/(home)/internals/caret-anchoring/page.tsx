// /internals/caret-anchoring — deep dive on the mirror-div technique that
// anchors the popover at the textarea caret. One memorable visual moment;
// minimal page chrome around it. Linked from the home-page Anatomy section
// for readers who want to see how the popover knows where to live.

import { CaretAnchoring } from "@/components/caret-anchoring";

export const metadata = {
  title: "Internals · Caret anchoring · @mention",
  description:
    "How @danielivanovz/mention anchors its popover at the textarea caret: the hidden mirror div, exposed.",
};

export default function CaretAnchoringPage() {
  return (
    <div className="text-fg">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <section className="border-b border-border-subtle/50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="font-mono text-meta text-fg-muted">Internals</p>
          <h1
            className="mt-3 max-w-3xl font-display font-semibold tracking-tight text-balance"
            style={{ fontSize: "var(--type-h1)", lineHeight: 1.05 }}
          >
            The hidden mirror.
          </h1>
          <p className="mt-5 max-w-prose text-fg-muted text-pretty">
            To anchor the popover at the caret, the lib runs a hidden{" "}
            <code className="font-mono">{"<div>"}</code> next to the textarea —
            same font, padding, border, line-height — and reads its layout to
            find the caret's pixel coordinates. Below, the mirror is exposed so
            you can see what it sees.
          </p>
        </div>
      </section>

      {/* ─── The visualizer ─────────────────────────────────────── */}
      <section className="border-b border-border-subtle/50">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <CaretAnchoring />
        </div>
      </section>

      {/* ─── Why a mirror at all ────────────────────────────────── */}
      <section className="border-b border-border-subtle/50 bg-bg-elevated/40">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="font-mono text-meta text-fg-muted">Why a mirror</p>
          <h2
            className="mt-3 max-w-2xl font-display font-semibold tracking-tight text-pretty"
            style={{ fontSize: "var(--type-h2)", lineHeight: 1.2 }}
          >
            Browsers don't expose textarea caret coordinates directly.
          </h2>
          <div className="mt-5 grid max-w-prose gap-4 text-fg-muted text-pretty">
            <p>
              There's no{" "}
              <code className="font-mono">textarea.getCaretRect()</code> API.{" "}
              <code className="font-mono">Range</code> objects only work on{" "}
              <code className="font-mono">contenteditable</code>. The mirror is
              the general way to compute caret pixels for a textarea — you build
              a parallel layout that the browser <em>can</em> measure, then read
              offsets off a zero-width span at the caret position.
            </p>
            <p>
              The technique predates React: it ships in{" "}
              <a
                href="https://github.com/component/textarea-caret-position"
                className="underline-offset-4 hover:underline"
              >
                textarea-caret-position
              </a>{" "}
              (MIT, 2015) and has been battle-tested across nine years of
              browser quirks — the Firefox{" "}
              <code className="font-mono">overflowY</code> workaround, the
              end-of-line non-empty-character contract, the property list a
              mirror must replicate. The lib ports the math to TypeScript and
              narrows it to <code className="font-mono">{"<textarea>"}</code>{" "}
              only; <code className="font-mono">contenteditable</code> support
              lands in v0.2 via the Range API instead.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Footer crumb ───────────────────────────────────────── */}
      <section className="bg-bg">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="font-mono text-meta text-fg-muted">
            <a
              href="/internals"
              className="underline-offset-4 hover:text-fg hover:underline"
            >
              ← all internals
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
