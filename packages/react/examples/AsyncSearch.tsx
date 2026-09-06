"use client";

import {
  Mention,
  type MentionImperativeHandle,
  useMentionContext,
} from "@danielivanov/mention";
import { useCallback, useId, useRef, useState } from "react";
import "@danielivanov/mention/styles.css";

type Person = { id: string; name: string };
const people: Person[] = [
  { id: "alice", name: "Alice" },
  { id: "bob", name: "Bob" },
];

function SearchFeedback({
  id,
  failure,
  onRetry,
}: {
  id: string;
  failure: boolean;
  onRetry: () => void;
}) {
  const { status, items } = useMentionContext<Person>();
  const loading = status === "loading";
  return (
    <div>
      <p id={id} role="status" aria-atomic="true">
        {loading
          ? "Searching people…"
          : failure
            ? "Could not load people. Try again."
            : status === "success"
              ? items.length > 0
                ? `${items.length} ${items.length === 1 ? "person" : "people"} found. Use the arrow keys to choose.`
                : "No people found. Try another name."
              : ""}
      </p>
      {failure && !loading && (
        <button type="button" onClick={onRetry}>
          Retry search
        </button>
      )}
    </div>
  );
}

export function AsyncSearch() {
  const id = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mentionRef = useRef<MentionImperativeHandle<Person>>(null);
  const failNext = useRef(true);
  // Keep recovery available when moving focus from the editor to Retry.
  const [failedSearch, setFailedSearch] = useState<{
    text: string;
    caret: number;
  } | null>(null);

  const searchPeople = useCallback(
    async (query: string, signal: AbortSignal) => {
      setFailedSearch(null);
      const input = inputRef.current;
      const snapshot = input
        ? { text: input.value, caret: input.selectionStart }
        : null;
      try {
        // Local demo only: delay the response and fail the first completed request.
        // Replace this block with your search endpoint, forwarding its signal.
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, 400);
          signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(signal.reason);
            },
            { once: true },
          );
        });
        signal.throwIfAborted();
        if (failNext.current) {
          failNext.current = false;
          throw new Error("Simulated search failure");
        }
        return people.filter((person) =>
          person.name.toLowerCase().includes(query.toLowerCase()),
        );
      } catch (error) {
        if (!signal.aborted) setFailedSearch(snapshot);
        throw error;
      }
    },
    [],
  );

  return (
    <Mention.Root<Person>
      items={searchPeople}
      getKey={(person) => person.id}
      getLabel={(person) => person.name}
      handleRef={mentionRef}
    >
      <label htmlFor={id}>Message</label>
      <p id={`${id}-hint`}>
        Type @ to search Alice or Bob. The first search simulates a failure;
        retry to search again without editing your message.
      </p>
      <Mention.Input
        ref={inputRef}
        id={id}
        rows={4}
        aria-describedby={`${id}-hint ${id}-status`}
        onChange={() => setFailedSearch(null)}
        onSelect={(event) => {
          const input = event.currentTarget;
          setFailedSearch((previous) =>
            previous?.text === input.value &&
            previous.caret === input.selectionStart &&
            input.selectionStart === input.selectionEnd
              ? previous
              : null,
          );
        }}
      />
      <Mention.Popover container={null} aria-label="People">
        <Mention.List<Person>>
          {(person) => (
            <Mention.Item value={person}>{person.name}</Mention.Item>
          )}
        </Mention.List>
        <Mention.Loading aria-hidden="true">Searching people…</Mention.Loading>
        <Mention.Empty aria-hidden="true">
          No people found. Try another name.
        </Mention.Empty>
      </Mention.Popover>
      <SearchFeedback
        id={`${id}-status`}
        failure={failedSearch !== null}
        onRetry={() => {
          inputRef.current?.focus();
          mentionRef.current?.open();
        }}
      />
    </Mention.Root>
  );
}
