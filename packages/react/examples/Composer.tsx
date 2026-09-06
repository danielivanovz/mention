"use client";

import { Mention } from "@danielivanov/mention";
import { useId, useState } from "react";
import "@danielivanov/mention/styles.css";

type Person = { id: string; name: string };

const people: Person[] = [
  { id: "alice", name: "Alice" },
  { id: "bob", name: "Bob" },
  { id: "carol", name: "Carol" },
];

export function Composer() {
  const id = useId();
  const [message, setMessage] = useState("");

  return (
    <Mention.Root<Person>
      items={people}
      getKey={(person) => person.id}
      getLabel={(person) => person.name}
    >
      <label htmlFor={id}>Message</label>
      <p id={`${id}-hint`}>
        Type @ to find a person. Use the arrow keys to choose, Enter to insert,
        and Escape to dismiss.
      </p>
      <Mention.Input
        id={id}
        name="message"
        value={message}
        onChange={(event) => setMessage(event.currentTarget.value)}
        aria-describedby={`${id}-hint`}
        placeholder="Write a message…"
        rows={4}
      />
      <Mention.Popover container={null} aria-label="People">
        <Mention.List<Person>>
          {(person) => (
            <Mention.Item value={person}>{person.name}</Mention.Item>
          )}
        </Mention.List>
        <Mention.Empty>No people found. Try another name.</Mention.Empty>
      </Mention.Popover>
    </Mention.Root>
  );
}
