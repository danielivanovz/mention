// /internals/aria-contract — deep dive on the ARIA combobox-as-substring
// contract. Audience: senior engineers + accessibility reviewers who need
// to defend the choice in a code review or AT audit.

import { AriaSnapshot } from "@/components/aria-snapshot";

export const metadata = {
  title: "Internals · ARIA contract · @mention",
  description:
    "Every ARIA attribute the combobox-as-substring contract touches, exposed live as you type.",
};

export default function AriaContractPage() {
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
            What a screen reader hears.
          </h1>
          <div className="mt-5 grid max-w-prose gap-4 text-fg-muted text-pretty">
            <p>
              Open most mention libraries in DevTools and you'll see the role
              mutate — <code className="font-mono">textarea</code> becomes{" "}
              <code className="font-mono">combobox</code> only when the popover
              opens, then back. This lib doesn't do that. The textarea keeps{" "}
              <code className="font-mono">role="combobox"</code> the entire
              time; what changes is{" "}
              <code className="font-mono">aria-expanded</code> and{" "}
              <code className="font-mono">aria-activedescendant</code>. The
              substring after <code className="font-mono">@</code> is the active
              query; the textarea is always the combobox.
            </p>
            <p>
              Below, every ARIA attribute the contract touches is exposed live
              as you type.
            </p>
          </div>
        </div>
      </section>

      {/* ─── The visualizer ─────────────────────────────────────── */}
      <section className="border-b border-border-subtle/50">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <AriaSnapshot />
        </div>
      </section>

      {/* ─── Three refusals ─────────────────────────────────────── */}
      <section className="border-b border-border-subtle/50 bg-bg-elevated/40">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="font-mono text-meta text-fg-muted">Three refusals</p>
          <h2
            className="mt-3 max-w-2xl font-display font-semibold tracking-tight text-pretty"
            style={{ fontSize: "var(--type-h2)", lineHeight: 1.2 }}
          >
            What the contract refuses to do.
          </h2>

          <dl className="mt-8 grid max-w-prose gap-y-8">
            <div>
              <dt className="font-display text-lg font-semibold tracking-tight text-fg">
                No role mutation.
              </dt>
              <dd className="mt-2 text-fg-muted text-pretty">
                Changing <code className="font-mono">role</code> at runtime
                triggers re-announcement in NVDA and JAWS. The user starts
                typing in a "text area" and suddenly hears "combobox" — the
                field they thought they were in just changed identity. The lib's
                textarea is a combobox from first paint to unmount.
              </dd>
            </div>

            <div>
              <dt className="font-display text-lg font-semibold tracking-tight text-fg">
                No second tab stop.
              </dt>
              <dd className="mt-2 text-fg-muted text-pretty">
                A popover with its own focus management means users can't
                <kbd className="mx-1 rounded border border-border-subtle bg-bg-elevated px-1 py-0.5 font-mono text-[11px]">
                  Tab
                </kbd>
                back to their text without losing the popover. Worse, if focus
                moves to the listbox, the textarea's caret position vanishes —
                fatal for chat composers where the user needs their cursor
                exactly where they left it.
              </dd>
            </div>

            <div>
              <dt className="font-display text-lg font-semibold tracking-tight text-fg">
                No focus shift.
              </dt>
              <dd className="mt-2 text-fg-muted text-pretty">
                Focus stays on the textarea the whole time; the listbox is a{" "}
                <em>virtual</em> focus target via{" "}
                <code className="font-mono">aria-activedescendant</code>. The
                user can keep typing after committing a selection, and arrow
                keys move the highlight without ever leaving the input. Standard{" "}
                <a
                  href="https://www.w3.org/WAI/ARIA/apg/patterns/combobox/"
                  className="underline-offset-4 hover:underline"
                >
                  APG combobox
                </a>{" "}
                behavior, applied to a substring rather than a full input value.
              </dd>
            </div>
          </dl>

          <p className="mt-10 max-w-prose text-fg-muted text-pretty">
            Base UI's Combobox primitive was evaluated and rejected on
            contract-mismatch grounds — the headline reason was role mutation
            at runtime.
          </p>
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
