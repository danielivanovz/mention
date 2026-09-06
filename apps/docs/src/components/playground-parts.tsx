"use client";

import { Mention } from "@danielivanov/mention";
import { ArrowUpRight, Trash2 } from "lucide-react";
import Link from "next/link";

export interface Person {
  id: string;
  name: string;
  username: string;
  initials: string;
}
export interface Topic {
  id: string;
  name: string;
  description: string;
}
const people: Person[] = [
  {
    id: "alice",
    name: "Alice Chen",
    username: "alice",
    initials: "AC",
  },
  {
    id: "jordan",
    name: "Jordan Lee",
    username: "jordan",
    initials: "JL",
  },
  { id: "jose", name: "José García", username: "jose", initials: "JG" },
  {
    id: "sam",
    name: "Sam Rivera",
    username: "sam",
    initials: "SR",
  },
];
const channels: Topic[] = [
  { id: "design", name: "design", description: "Ideas taking shape" },
  { id: "engineering", name: "engineering", description: "Making it work" },
  { id: "general", name: "general", description: "A little of everything" },
];
const commands: Topic[] = [
  { id: "summarise", name: "summarise", description: "Find the main points" },
  { id: "remind", name: "remind", description: "Come back to this later" },
  { id: "poll", name: "poll", description: "Make a decision together" },
];
const fold = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export const triggers = {
  "@": {
    items: people,
    allowSpaces: true,
    filter: (person: Person, query: string) =>
      fold(`${person.name} ${person.username}`).includes(fold(query)),
    getKey: (p: Person) => p.id,
    getLabel: (p: Person) => p.name,
    getInsertText: (p: Person) => `@${p.username}`,
  },
  "#": {
    items: channels,
    getKey: (t: Topic) => t.id,
    getLabel: (t: Topic) => t.name,
  },
  "/": {
    items: commands,
    getKey: (t: Topic) => t.id,
    getLabel: (t: Topic) => t.name,
  },
};

export function PlaygroundSuggestions() {
  return (
    <Mention.Popover
      container={null}
      className="specimen-popover"
      aria-label="Suggestions"
    >
      <Mention.List<Person> trigger="@">
        {(person) => (
          <Mention.Item value={person} className="specimen-option">
            <span className="person-avatar" aria-hidden="true">
              {person.initials}
            </span>
            <span className="option-description">
              <strong>{person.name}</strong>
              <span>@{person.username}</span>
            </span>
          </Mention.Item>
        )}
      </Mention.List>
      {(["#", "/"] as const).map((trigger) => (
        <Mention.List<Topic> trigger={trigger} key={trigger}>
          {(topic) => (
            <Mention.Item value={topic} className="specimen-option">
              <span className="topic-symbol" aria-hidden="true">
                {trigger}
              </span>
              <span className="option-description">
                <strong>{topic.name}</strong>
                <span>{topic.description}</span>
              </span>
            </Mention.Item>
          )}
        </Mention.List>
      ))}
      <Mention.Empty>No matches. Try a shorter search.</Mention.Empty>
    </Mention.Popover>
  );
}

export function PlaygroundToolbar({
  insertTrigger,
  clear,
  empty,
  helpId,
}: {
  insertTrigger: (trigger: string) => void;
  clear: () => void;
  empty: boolean;
  helpId: string;
}) {
  return (
    <div className="specimen-toolbar">
      <fieldset aria-label="Insert a trigger" className="trigger-buttons">
        {[
          ["@", "People"],
          ["#", "Channels"],
          ["/", "Commands"],
        ].map(([trigger, label]) => (
          <button
            key={trigger}
            type="button"
            onClick={() => insertTrigger(trigger)}
          >
            <span aria-hidden="true">{trigger}</span>
            {label}
          </button>
        ))}
      </fieldset>
      <button
        className="clear-specimen"
        type="button"
        disabled={empty}
        onClick={clear}
      >
        <Trash2 size={19} aria-hidden="true" /> Clear
      </button>
      <p id={helpId}>Arrow keys to browse. Enter to select. Esc to close.</p>
    </div>
  );
}

export function PlaygroundCaption({ rich = false }: { rich?: boolean }) {
  return (
    <div className="specimen-caption">
      <p>
        {rich
          ? "Structured mentions. Powered by Lexical."
          : "Plain text. Native textarea."}
      </p>
      <Link href={rich ? "/docs/lexical" : "/docs#try-the-interaction"}>
        {rich ? "Lexical integration" : "Textarea integration"}
        <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
    </div>
  );
}
