"use client";

import { Mention, type MentionImperativeHandle } from "@danielivanov/mention";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  type Person,
  PlaygroundCaption,
  PlaygroundSuggestions,
  PlaygroundToolbar,
  type Topic,
  triggers,
} from "./playground-parts";

const RichPlayground = dynamic(() => import("./rich-mention-demo"), {
  ssr: false,
  loading: () => (
    <div className="specimen-editor-loading" role="status">
      Loading editor…
    </div>
  ),
});

function TextareaPlayground({ active }: { active: boolean }) {
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

  useEffect(() => {
    if (!active) handleRef.current?.close();
  }, [active]);
  return (
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
        disabled={!active}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Bring @someone into the conversation."
        rows={3}
        spellCheck={false}
      />
      <PlaygroundToolbar
        insertTrigger={insertTrigger}
        empty={value.length === 0}
        helpId="playground-help"
        clear={() => {
          flushSync(() => setValue(""));
          inputRef.current?.focus();
          handleRef.current?.close();
        }}
      />
      <PlaygroundCaption />
      <PlaygroundSuggestions />
    </Mention.Root>
  );
}

export function MentionDemo() {
  const [mode, setMode] = useState("textarea");
  const [richLoaded, setRichLoaded] = useState(false);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  return (
    <section
      id="playground"
      className="specimen-band"
      aria-label="Live mention playground"
    >
      <div className="specimen">
        <div className="specimen-mode-row">
          <div
            className="specimen-modes"
            role="tablist"
            aria-label="Editor type"
          >
            {[
              ["textarea", "Textarea"],
              ["rich", "Rich editor"],
            ].map(([value, label], index) => (
              <button
                key={value}
                ref={(node) => {
                  tabs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`playground-tab-${value}`}
                aria-controls={`playground-panel-${value}`}
                aria-selected={mode === value}
                tabIndex={mode === value ? 0 : -1}
                onClick={() => {
                  setMode(value);
                  if (value === "rich") setRichLoaded(true);
                }}
                onKeyDown={(event) => {
                  let next: number;
                  if (event.key === "ArrowLeft" || event.key === "ArrowRight")
                    next = 1 - index;
                  else if (event.key === "Home") next = 0;
                  else if (event.key === "End") next = 1;
                  else return;
                  event.preventDefault();
                  tabs.current[next]?.focus();
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="specimen-draft-note">
            Each editor keeps its draft
          </span>
        </div>
        <div
          id="playground-panel-textarea"
          role="tabpanel"
          aria-labelledby="playground-tab-textarea"
          hidden={mode !== "textarea"}
        >
          <TextareaPlayground active={mode === "textarea"} />
        </div>
        <div
          id="playground-panel-rich"
          role="tabpanel"
          aria-labelledby="playground-tab-rich"
          hidden={mode !== "rich"}
        >
          {richLoaded && <RichPlayground active={mode === "rich"} />}
        </div>
      </div>
    </section>
  );
}
