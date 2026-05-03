// /internals — index of internals deep-dives. Marketing-surface "under
// the hood" for the small audience that wants more than the home page
// gives them. Two pages today; the index keeps the nav stable as more
// land.

import Link from "next/link";

export const metadata = {
  title: "Internals · @mention",
  description:
    "Under-the-hood deep-dives: caret anchoring, the ARIA contract, and the technical bits behind @danielivanovz/mention.",
};

interface Entry {
  readonly href: string;
  readonly title: string;
  readonly teaser: string;
}

const ENTRIES: readonly Entry[] = [
  {
    href: "/internals/caret-anchoring",
    title: "The hidden mirror.",
    teaser:
      "How the lib anchors its popover at the textarea caret — exposing the parallel <div> it uses to compute caret pixel coordinates.",
  },
  {
    href: "/internals/aria-contract",
    title: "What a screen reader hears.",
    teaser:
      "Every ARIA attribute the combobox-as-substring contract touches, exposed live as you type. Why this lib doesn't mutate roles, doesn't own a second tab stop, doesn't shift focus.",
  },
];

export default function InternalsIndexPage() {
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
            How the lib actually works.
          </h1>
          <p className="mt-5 max-w-prose text-fg-muted text-pretty">
            Two deep-dives, both teaching the genuinely interesting bits the
            home page can't fit. The Anatomy section gives the headline; these
            go under the hood.
          </p>
        </div>
      </section>

      {/* ─── The list ───────────────────────────────────────────── */}
      <section className="border-b border-border-subtle/50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <ol className="grid max-w-3xl gap-y-10">
            {ENTRIES.map((entry, i) => (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  className="group block focus:outline-none"
                >
                  <div className="grid gap-x-10 gap-y-2 md:grid-cols-[3rem_1fr] md:items-baseline">
                    <span
                      className="font-mono text-meta text-fg-muted"
                      aria-hidden
                    >
                      0{i + 1}
                    </span>
                    <div>
                      <h2
                        className="font-display font-semibold tracking-tight text-pretty group-hover:underline group-focus-visible:underline"
                        style={{
                          fontSize: "var(--type-h3)",
                          lineHeight: 1.2,
                        }}
                      >
                        {entry.title}
                      </h2>
                      <p className="mt-2 max-w-prose text-fg-muted text-pretty">
                        {entry.teaser}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Footer crumb ───────────────────────────────────────── */}
      <section className="bg-bg">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="font-mono text-meta text-fg-muted">
            <a
              href="/"
              className="underline-offset-4 hover:text-fg hover:underline"
            >
              ← back to home
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
