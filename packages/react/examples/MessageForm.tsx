"use client";

import { Mention, type MentionImperativeHandle } from "@danielivanov/mention";
import { type FormEvent, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import "@danielivanov/mention/styles.css";

type Person = { id: string; name: string };
const people: Person[] = [
  { id: "alice", name: "Alice" },
  { id: "bob", name: "Bob" },
];

export function MessageForm() {
  const id = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mentionRef = useRef<MentionImperativeHandle<Person>>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim()) {
      setError("Enter a message before submitting.");
      setSubmitted(null);
      inputRef.current?.focus();
      return;
    }
    setError(null);
    const data = new FormData(event.currentTarget);
    setSubmitted(String(data.get("message")));
  }

  function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    flushSync(() => {
      setValue("");
      setError(null);
      setSubmitted(null);
    });
    inputRef.current?.focus();
    mentionRef.current?.close();
  }

  return (
    <form
      aria-label="Message form"
      noValidate
      onSubmit={submit}
      onReset={reset}
    >
      <Mention.Root<Person>
        items={people}
        getKey={(person) => person.id}
        getLabel={(person) => person.name}
        handleRef={mentionRef}
      >
        <label htmlFor={id}>Message</label>
        <p id={`${id}-hint`}>
          Type @ to mention Alice or Bob. A message is required.
        </p>
        <Mention.Input
          ref={inputRef}
          id={id}
          name="message"
          required
          rows={4}
          value={value}
          onChange={(event) => {
            const next = event.currentTarget.value;
            setValue(next);
            setSubmitted(null);
            if (next.trim()) setError(null);
          }}
          aria-invalid={error !== null}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        />
        {error && (
          <p id={`${id}-error`} role="alert">
            {error}
          </p>
        )}
        <Mention.Popover container={null} aria-label="People">
          <Mention.List<Person>>
            {(person) => (
              <Mention.Item value={person}>{person.name}</Mention.Item>
            )}
          </Mention.List>
          <Mention.Empty>No people found. Try another name.</Mention.Empty>
        </Mention.Popover>
      </Mention.Root>
      <div>
        <button type="submit">Submit message</button>
        <button type="reset">Reset</button>
      </div>
      <p role="status" aria-atomic="true">
        {submitted !== null
          ? `Submitted locally: ${submitted}`
          : "This demo keeps submissions on this page."}
      </p>
    </form>
  );
}
