"use client";

// `@danielivanov/mention` uses client React APIs (useState, useReducer, useEffect,
// useId). Next 16 / RSC defaults components to server-rendered, so this
// wrapper file carries the `"use client"` directive and is what MDX
// imports — keeping the lib RSC-agnostic (no "use client" directive
// shipped in the published package).
//
// Multi-trigger demo: three independent channels (@ people, # channels,
// / commands) sharing one textarea + one popover. The library handles
// channel switching as the dispatcher's backwards scan resolves a
// different trigger char; consumers just declare the channels.

import { Mention } from "@danielivanov/mention";

interface Person {
  id: string;
  username: string;
  name: string;
}
interface Channel {
  id: string;
  name: string;
  topic: string;
}
interface Command {
  id: string;
  name: string;
  description: string;
}

const PEOPLE: readonly Person[] = [
  { id: "u1", username: "alice", name: "Alice Anderson" },
  { id: "u2", username: "bob", name: "Bob Brennan" },
  { id: "u3", username: "carol", name: "Carol Chen" },
  { id: "u4", username: "dave", name: "Dave Davies" },
  { id: "u5", username: "eve", name: "Eve Edwards" },
  { id: "u6", username: "frank", name: "Frank Fischer" },
];
const CHANNELS: readonly Channel[] = [
  { id: "c1", name: "general", topic: "Anything goes" },
  { id: "c2", name: "design", topic: "Design crit + critique" },
  { id: "c3", name: "engineering", topic: "Code, infra, incidents" },
  { id: "c4", name: "random", topic: "Off-topic" },
];
const COMMANDS: readonly Command[] = [
  { id: "summarise", name: "summarise", description: "Summarise the thread" },
  { id: "translate", name: "translate", description: "Translate to English" },
  { id: "remind", name: "remind", description: "Set a reminder" },
  { id: "poll", name: "poll", description: "Start a quick poll" },
];

// Hoisted to module scope so the prop reference is stable across
// renders — the multi-trigger Root keys per-channel state on
// Object.identity of the triggers record.
const TRIGGERS = {
  "@": {
    items: PEOPLE,
    getKey: (p: Person) => p.id,
    getLabel: (p: Person) => p.username,
    getInsertText: (p: Person) => `@${p.username}`,
  },
  "#": {
    items: CHANNELS,
    getKey: (c: Channel) => c.id,
    getLabel: (c: Channel) => c.name,
    getInsertText: (c: Channel) => `#${c.name}`,
  },
  "/": {
    items: COMMANDS,
    getKey: (c: Command) => c.id,
    getLabel: (c: Command) => c.name,
    getInsertText: (c: Command) => `/${c.name}`,
  },
} as const;

export function MentionDemo() {
  return (
    <div className="my-6 rounded-lg border border-border-subtle bg-bg-elevated p-4">
      <label
        htmlFor="mention-demo-input"
        className="mb-2 block font-mono text-meta text-fg-muted"
      >
        Composer
      </label>
      <Mention.Root<{ "@": Person; "#": Channel; "/": Command }>
        triggers={TRIGGERS}
        onSelect={() => {
          /* demo: no side effect */
        }}
      >
        <Mention.Input
          id="mention-demo-input"
          placeholder="Try @alice, #design, or /summarise"
          rows={4}
          className="w-full resize-none rounded-md border border-border-subtle bg-bg p-2.5 font-mono text-sm text-fg outline-none transition-colors focus-visible:border-fg-muted/50 focus-visible:ring-2 focus-visible:ring-accent-brand/30"
        />
        <Mention.Popover>
          <Mention.Loading>Searching…</Mention.Loading>
          {/* One typed list per channel — no runtime cast at the
              consumer site. `<Mention.List<T> trigger="X">` only
              renders while channel X is active, and the render-prop is
              fully typed for X's item shape. */}
          <Mention.List<Person> trigger="@">
            {(p) => (
              <Mention.Item value={p}>
                <span>@{p.username}</span>
                <span className="ml-3 text-fg-muted">{p.name}</span>
              </Mention.Item>
            )}
          </Mention.List>
          <Mention.List<Channel> trigger="#">
            {(c) => (
              <Mention.Item value={c}>
                <span>#{c.name}</span>
                <span className="ml-3 text-fg-muted">{c.topic}</span>
              </Mention.Item>
            )}
          </Mention.List>
          <Mention.List<Command> trigger="/">
            {(c) => (
              <Mention.Item value={c}>
                <span>/{c.name}</span>
                <span className="ml-3 text-fg-muted">{c.description}</span>
              </Mention.Item>
            )}
          </Mention.List>
          <Mention.Empty>Nothing found</Mention.Empty>
        </Mention.Popover>
      </Mention.Root>
    </div>
  );
}
