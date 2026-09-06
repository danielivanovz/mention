"use client";

// Slack/Discord-shape chat composer. Channel + member mentions in the
// same list, distinguished only by glyph and `getInsertText` (channels
// keep the `#` sigil; members get `@`).

import { Mention } from "@danielivanov/mention";

interface ChatTarget {
  id: string;
  kind: "member" | "channel";
  label: string;
  presence?: "active" | "away";
}

const TARGETS: readonly ChatTarget[] = [
  { id: "t1", kind: "channel", label: "eng-mention" },
  { id: "t2", kind: "channel", label: "design-crit" },
  { id: "t3", kind: "member", label: "eve", presence: "active" },
  { id: "t4", kind: "member", label: "frank", presence: "away" },
  { id: "t5", kind: "member", label: "gina", presence: "active" },
];

export function UseCaseChatComposer() {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-elevated">
      <div className="flex items-center gap-2 border-b border-border-subtle px-5 py-3">
        <span className="font-mono text-fg-muted">#</span>
        <span className="text-sm font-medium text-fg">eng-mention</span>
        <span className="ml-auto text-meta text-fg-muted">3 typing…</span>
      </div>
      <div className="px-5 py-4">
        <Mention.Root<ChatTarget>
          items={TARGETS}
          getKey={(t) => t.id}
          getLabel={(t) => t.label}
          getInsertText={(t) =>
            t.kind === "channel" ? `#${t.label}` : `@${t.label}`
          }
          onSelect={() => {
            /* demo only */
          }}
        >
          <Mention.Input
            aria-label="Message"
            placeholder="Try @eve or @eng — mention a person or channel"
            rows={2}
            className="w-full resize-none rounded-md border border-border-subtle bg-bg p-2.5 font-mono text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent-brand"
          />
          <Mention.Popover>
            <Mention.List>
              {(t: ChatTarget) => (
                <Mention.Item value={t}>
                  <span className="inline-flex w-4 justify-center font-mono text-fg-muted">
                    {t.kind === "channel" ? "#" : "@"}
                  </span>
                  <span>{t.label}</span>
                  {t.presence ? (
                    <span
                      aria-hidden
                      className={`ml-auto h-1.5 w-1.5 rounded-full ${
                        t.presence === "active"
                          ? "bg-[color:var(--accent)]"
                          : "bg-fg-muted/40"
                      }`}
                    />
                  ) : null}
                </Mention.Item>
              )}
            </Mention.List>
            <Mention.Empty>Nothing to mention</Mention.Empty>
          </Mention.Popover>
        </Mention.Root>
      </div>
    </div>
  );
}
