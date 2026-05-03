"use client";

// Comment thread context — GitHub issue / Linear comment shape. The
// embedded <Mention> uses `@username` insert text, the most common
// pattern for this surface. The chrome around it (avatar, timestamp,
// faux prior comment) sells "this is a real product context".

import { Mention } from "@danielivanovz/mention";

interface User {
  id: string;
  username: string;
  name: string;
}

const TEAMMATES: readonly User[] = [
  { id: "u1", username: "alice", name: "Alice Anderson" },
  { id: "u2", username: "bob", name: "Bob Brennan" },
  { id: "u3", username: "carol", name: "Carol Chen" },
  { id: "u4", username: "dave", name: "Dave Davies" },
];

export function UseCaseCommentThread() {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-elevated">
      <div className="border-b border-border-subtle px-5 py-3">
        <div className="flex items-center gap-2 text-meta text-fg-muted">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent)]/20 text-[10px] font-semibold text-[color:var(--accent)]">
            CC
          </span>
          <span className="font-medium text-fg">carol</span>
          <span>opened this issue · 2 hours ago</span>
        </div>
        <p className="mt-2 text-sm text-fg/90">
          The popover is rendering behind the dialog overlay on the comment
          modal. Probably a z-index / stacking context thing.
        </p>
      </div>
      <div className="px-5 py-4">
        <p className="mb-2 text-meta font-medium text-fg-muted">Reply</p>
        <Mention.Root<User>
          items={TEAMMATES}
          getKey={(u) => u.id}
          getLabel={(u) => u.username}
          getInsertText={(u) => `@${u.username}`}
          onSelect={() => {
            /* demo only */
          }}
        >
          <Mention.Input
            aria-label="Reply"
            placeholder="Try @alice — assign or ping a teammate"
            rows={3}
            className="w-full resize-none rounded-md border border-border-subtle bg-bg p-2.5 font-mono text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent-brand"
          />
          <Mention.Popover>
            <Mention.Loading>Searching…</Mention.Loading>
            <Mention.List>
              {(u: User) => (
                <Mention.Item value={u}>
                  <span>@{u.username}</span>
                  <span className="ml-2 opacity-60">{u.name}</span>
                </Mention.Item>
              )}
            </Mention.List>
            <Mention.Empty>No teammates match</Mention.Empty>
          </Mention.Popover>
        </Mention.Root>
      </div>
    </div>
  );
}
