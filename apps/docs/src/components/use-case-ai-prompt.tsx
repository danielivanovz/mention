"use client";

// AI prompt input — @-mentions stand in for "drop in a file, tool, or
// piece of context". `getInsertText` returns the resource path with a
// leading `@` so the LLM-prompt convention reads naturally.

import { Mention } from "@danielivanovz/mention";

interface Resource {
  id: string;
  kind: "file" | "tool" | "doc";
  label: string;
  hint: string;
}

const RESOURCES: readonly Resource[] = [
  { id: "r1", kind: "file", label: "src/auth/session.ts", hint: "file" },
  { id: "r2", kind: "file", label: "src/auth/middleware.ts", hint: "file" },
  { id: "r3", kind: "tool", label: "run-tests", hint: "tool" },
  { id: "r4", kind: "tool", label: "web-search", hint: "tool" },
  { id: "r5", kind: "doc", label: "OAuth migration plan", hint: "doc" },
];

const KIND_GLYPH: Record<Resource["kind"], string> = {
  file: "⌘",
  tool: "⚙",
  doc: "✎",
};

export function UseCaseAiPrompt() {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-elevated">
      <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
        <p className="text-meta font-medium text-fg-muted">Ask anything</p>
        <p className="font-mono text-meta text-fg-muted">claude-opus-4-7</p>
      </div>
      <div className="px-5 py-4">
        <Mention.Root<Resource>
          items={RESOURCES}
          getKey={(r) => r.id}
          getLabel={(r) => r.label}
          getInsertText={(r) => `@${r.label}`}
          onSelect={() => {
            /* demo only */
          }}
        >
          <Mention.Input
            aria-label="Prompt"
            placeholder="Try @session — drop in files, tools, or context"
            rows={4}
            className="w-full resize-none rounded-md border border-border-subtle bg-bg p-2.5 font-mono text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent-brand"
          />
          <Mention.Popover>
            <Mention.Loading>Searching…</Mention.Loading>
            <Mention.List>
              {(r: Resource) => (
                <Mention.Item value={r}>
                  <span className="inline-flex w-4 justify-center font-mono text-fg-muted">
                    {KIND_GLYPH[r.kind]}
                  </span>
                  <span className="font-mono">{r.label}</span>
                  <span className="ml-auto text-meta opacity-60">{r.hint}</span>
                </Mention.Item>
              )}
            </Mention.List>
            <Mention.Empty>No matches in workspace</Mention.Empty>
          </Mention.Popover>
        </Mention.Root>
        <div className="mt-3 flex items-center justify-between text-meta text-fg-muted">
          <span>
            <kbd className="rounded border border-border-subtle bg-bg px-1.5 py-0.5 font-mono text-[11px]">
              @
            </kbd>{" "}
            for context ·{" "}
            <kbd className="rounded border border-border-subtle bg-bg px-1.5 py-0.5 font-mono text-[11px]">
              ↵
            </kbd>{" "}
            to send
          </span>
        </div>
      </div>
    </div>
  );
}
