import { Controlled } from "./Controlled.tsx";
import { ProseMirrorDemo } from "../../examples/ProseMirror.tsx";
import { Mention } from "@danielivanov/mention";
import { imeUsers, type User, users } from "./users.ts";

interface Channel {
  id: string;
  name: string;
}

const channels: readonly Channel[] = [
  { id: "general", name: "general" },
  { id: "random", name: "random" },
  { id: "design", name: "design" },
];

// Hoisted to module scope so the prop reference is stable across
// renders — the multi-trigger Root keys per-channel state on
// Object.identity of the triggers record.
const MULTI_TRIGGERS = {
  "@": {
    items: users,
    getKey: (u: User) => u.id,
    getLabel: (u: User) => u.username,
    getInsertText: (u: User) => `@${u.username}`,
  },
  "#": {
    items: channels,
    getKey: (c: Channel) => c.id,
    getLabel: (c: Channel) => c.name,
    getInsertText: (c: Channel) => `#${c.name}`,
  },
} as const;

export function App() {
  // C1 — toggle the host element via `?host=editable` to exercise the
  // contenteditable adapter path. Default stays `textarea` so existing
  // contract + a11y specs run unchanged.
  // C2 — `?shape=node` additionally renders a chip-shaped channel via
  // <Mention.Chips>. Only meaningful in combination with host=editable.
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  // M8 — `?ime=1` swaps in a Latin+CJK dataset so manual IME smoke
  // (macOS Japanese / Windows Pinyin / Android Gboard) lands on
  // observably-different items per candidate-window selection.
  if (params.get("controlled") === "1") return <Controlled />;
  if (params.get("editor") === "1")
    return (
      <main>
        <h1>Editor integration</h1>
        <ProseMirrorDemo />
      </main>
    );
  const isIME = params.get("ime") === "1";
  const activeUsers = isIME ? imeUsers : users;

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "1rem" }}>
      <h1>@danielivanov/mention — e2e harness</h1>
      <p>
        Type <kbd>@</kbd> at the start of a word to trigger mention suggestions.
        Try <kbd>↑</kbd>/<kbd>↓</kbd>, <kbd>Enter</kbd>, <kbd>Esc</kbd>.
      </p>
      {/* The textarea is labelled via `aria-label` on Mention.Input below.
          The visible "Comment" line is the consumer-facing label; we
          deliberately don't wrap in <label> — that's the pattern the docs
          recommend, and it keeps the harness aligned with how real apps
          use the library. */}
      <p style={{ marginBottom: 4, fontWeight: 500 }}>Comment</p>
      <Mention.Root<User>
        items={activeUsers}
        getKey={(u) => u.id}
        getLabel={(u) => u.username}
        getInsertText={(u) => `@${u.username}`}
        onSelect={() => {
          /* no-op; tests assert on host value */
        }}
      >
        <Mention.Input
          aria-label="Comment"
          rows={5}
          style={{ width: "100%", padding: 8, fontFamily: "system-ui" }}
        />
        <Mention.Popover>
          <Mention.Loading>Searching…</Mention.Loading>
          <Mention.List>
            {(user: User) => (
              <Mention.Item value={user}>
                <span>@{user.username}</span>
                <span style={{ marginLeft: 8, opacity: 0.6 }}>{user.name}</span>
              </Mention.Item>
            )}
          </Mention.List>
          <Mention.Empty>No people found</Mention.Empty>
        </Mention.Popover>
      </Mention.Root>

      <p style={{ marginTop: 24, marginBottom: 4, fontWeight: 500 }}>
        Multi-trigger
      </p>
      <p style={{ marginTop: 0, opacity: 0.7, fontSize: 14 }}>
        Type <kbd>@</kbd> for users, <kbd>#</kbd> for channels.
      </p>
      <Mention.Root<{ "@": User; "#": Channel }>
        triggers={MULTI_TRIGGERS}
        onSelect={() => {
          /* no-op; tests assert on textarea value */
        }}
      >
        <Mention.Input
          aria-label="Multi"
          placeholder="Try @alice or #general"
          rows={3}
          style={{ width: "100%", padding: 8, fontFamily: "system-ui" }}
        />
        <Mention.Popover>
          {/* One typed list per channel — no runtime cast at the
              consumer site. The library guarantees ctx.items are
              channel-X items when activeTrigger === "X". */}
          <Mention.List<User> trigger="@">
            {(user) => (
              <Mention.Item value={user}>@{user.username}</Mention.Item>
            )}
          </Mention.List>
          <Mention.List<Channel> trigger="#">
            {(channel) => (
              <Mention.Item value={channel}>#{channel.name}</Mention.Item>
            )}
          </Mention.List>
          <Mention.Empty>Nothing found</Mention.Empty>
        </Mention.Popover>
      </Mention.Root>
    </main>
  );
}
