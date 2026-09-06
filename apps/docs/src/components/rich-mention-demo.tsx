"use client";

import { Mention } from "@danielivanov/mention";
import { useRef, useState } from "react";
import {
  LexicalMentionEditor,
  type LexicalMentionEditorHandle,
} from "../../../../packages/react/examples/Lexical";
import {
  type Person,
  PlaygroundCaption,
  PlaygroundSuggestions,
  PlaygroundToolbar,
  type Topic,
  triggers,
} from "./playground-parts";

export default function RichPlayground({ active }: { active: boolean }) {
  const editor = useRef<LexicalMentionEditorHandle>(null);
  const [empty, setEmpty] = useState(true);
  return (
    <Mention.Root<{ "@": Person; "#": Topic; "/": Topic }> triggers={triggers}>
      <div className="specimen-heading">
        <span id="playground-rich-label" className="specimen-label">
          Try it. Type @, #, or /
        </span>
        <span>Sample data</span>
      </div>
      <LexicalMentionEditor<Person | Topic>
        ref={editor}
        active={active}
        id="playground-rich-input"
        label="Rich message"
        aria-labelledby="playground-rich-label"
        className="specimen-editor lexical-editor"
        placeholder="Bring @someone into the conversation."
        aria-describedby="playground-rich-help"
        onEmptyChange={setEmpty}
      />
      <PlaygroundToolbar
        insertTrigger={(trigger) => editor.current?.insertTrigger(trigger)}
        clear={() => editor.current?.clear()}
        empty={empty}
        helpId="playground-rich-help"
      />
      <PlaygroundCaption rich />
      <PlaygroundSuggestions />
    </Mention.Root>
  );
}
