"use client";

import { Mention } from "@danielivanov/mention";
import { useRef, useState } from "react";
import {
  LexicalMentionEditor,
  type LexicalMentionEditorHandle,
} from "./registry/default/ai-composer/mention-editor";

export {
  LexicalMentionEditor,
  type LexicalMentionEditorHandle,
} from "./registry/default/ai-composer/mention-editor";

type MentionValue = { id: string; name: string };

const people = [
  { id: "alice", name: "Alice Chen" },
  { id: "bob", name: "Bob Rivera" },
  { id: "jose", name: "José García" },
];

export function LexicalDemo() {
  const editor = useRef<LexicalMentionEditorHandle>(null);
  const [document, setDocument] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  return (
    <Mention.Root<MentionValue>
      items={people}
      allowSpaces
      filter={(person, query) => {
        const fold = (text: string) =>
          text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
        return fold(person.name).includes(fold(query));
      }}
      getKey={(person) => person.id}
      getLabel={(person) => person.name}
    >
      <p id="lexical-hint">
        Type @ to insert a person. Use your usual bold and undo shortcuts. Save
        a snapshot, edit, then restore it.
      </p>
      <LexicalMentionEditor<MentionValue>
        ref={editor}
        id="lexical-message"
        label="Lexical message"
        aria-describedby="lexical-hint"
        className="lexical-editor"
        onDocument={setDocument}
        style={{
          minHeight: 140,
          border: "1px solid currentColor",
          borderRadius: 6,
          padding: 12,
          whiteSpace: "pre-wrap",
        }}
      />
      <Mention.Popover container={null} aria-label="People">
        <Mention.List<MentionValue>>
          {(person) => (
            <Mention.Item value={person}>{person.name}</Mention.Item>
          )}
        </Mention.List>
        <Mention.Empty>No people found</Mention.Empty>
      </Mention.Popover>
      <div className="example-actions">
        <button
          type="button"
          onClick={() => {
            setSaved(editor.current?.getJSON() ?? null);
            setStatus("Snapshot saved in this example.");
          }}
        >
          Save snapshot
        </button>
        <button
          type="button"
          disabled={!saved}
          onClick={() => {
            if (saved) {
              editor.current?.restoreJSON(saved);
              setStatus("Snapshot restored.");
            }
          }}
        >
          Restore snapshot
        </button>
        <button
          type="button"
          onClick={() => {
            editor.current?.clear();
            setStatus("");
          }}
        >
          Clear editor
        </button>
      </div>
      <p role="status">{status}</p>
      <output data-testid="lexical-document" hidden>
        {document}
      </output>
    </Mention.Root>
  );
}
