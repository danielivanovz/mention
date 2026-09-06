"use client";

import { Mention, type MentionImperativeHandle } from "@danielivanov/mention";
import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";

interface Person {
  id: string;
  name: string;
  username: string;
  initials: string;
}
interface Topic {
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
const triggers = {
  "@": {
    items: people,
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

export function MentionDemo() {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const handleRef = useRef<MentionImperativeHandle<Person | Topic>>(null);

  function insertTrigger(trigger: string) {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const prefix = start > 0 && !/\s/u.test(value[start - 1]) ? " " : "";
    const insertion = prefix + trigger;
    flushSync(() =>
      setValue(value.slice(0, start) + insertion + value.slice(end)),
    );
    input.focus();
    input.setSelectionRange(start + insertion.length, start + insertion.length);
    handleRef.current?.open();
  }

  return (
    <section
      id="playground"
      className="specimen-band"
      aria-label="Live mention playground"
    >
      <div className="specimen">
        <Mention.Root<{ "@": Person; "#": Topic; "/": Topic }>
          triggers={triggers}
          handleRef={handleRef}
        >
          <div className="specimen-heading">
            <label htmlFor="playground-input">Try it. Type @, #, or /</label>
            <span>Sample data</span>
          </div>
          <Mention.Input
            ref={inputRef}
            id="playground-input"
            aria-describedby="playground-help"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Bring @someone into the conversation."
            rows={3}
            spellCheck={false}
          />
          <div className="specimen-toolbar">
            <fieldset aria-label="Insert a trigger" className="trigger-buttons">
              <button type="button" onClick={() => insertTrigger("@")}>
                <span aria-hidden="true">@</span> People
              </button>
              <button type="button" onClick={() => insertTrigger("#")}>
                <span aria-hidden="true">#</span> Channels
              </button>
              <button type="button" onClick={() => insertTrigger("/")}>
                <span aria-hidden="true">/</span> Commands
              </button>
            </fieldset>
            <button
              className="clear-specimen"
              type="button"
              disabled={value.length === 0}
              onClick={() => {
                flushSync(() => setValue(""));
                inputRef.current?.focus();
                handleRef.current?.close();
              }}
            >
              <Trash2 size={19} aria-hidden="true" /> Clear
            </button>
            <p id="playground-help">
              Arrow keys to browse. Enter to select. Esc to close.
            </p>
          </div>
          <Mention.Popover
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
        </Mention.Root>
      </div>
    </section>
  );
}
