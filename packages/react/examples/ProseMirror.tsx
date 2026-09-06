"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Schema } from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { closeHistory, history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap, toggleMark } from "prosemirror-commands";
import {
  Mention,
  useMentionContext,
  type EditorAdapter,
} from "@danielivanov/mention";

type Person = { id: string; name: string };
const people: Person[] = [
  { id: "alice", name: "Alice" },
  { id: "bob", name: "Bob" },
];
const schema = new Schema({
  nodes: {
    doc: { content: "paragraph+" },
    paragraph: {
      content: "inline*",
      group: "block",
      toDOM: () => ["p", 0],
      parseDOM: [{ tag: "p" }],
    },
    text: { group: "inline" },
    mention: {
      group: "inline",
      inline: true,
      atom: true,
      attrs: { id: {}, label: {} },
      toDOM: (node) => [
        "span",
        {
          "data-mention-id": node.attrs.id,
          "data-mention-label": node.attrs.label,
          contenteditable: "false",
          style:
            "background:#e0e7ff;color:#312e81;border-radius:4px;padding:0 3px",
        },
        `@${node.attrs.label}`,
      ],
      parseDOM: [
        {
          tag: "span[data-mention-id]",
          getAttrs: (el) => ({
            id: el.dataset.mentionId,
            label: el.dataset.mentionLabel,
          }),
        },
      ],
      leafText: (node) => `@${node.attrs.label}`,
    },
  },
  marks: {
    strong: {
      toDOM: () => ["strong", 0],
      parseDOM: [{ tag: "strong" }, { tag: "b" }],
    },
  },
});

function Editor({ onDocument }: { onDocument: (doc: string) => void }) {
  const mention = useMentionContext<Person>();
  const latest = useRef(mention);
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  useLayoutEffect(() => {
    latest.current = mention;
  });

  useLayoutEffect(() => {
    const view = new EditorView(host.current!, {
      state: EditorState.create({
        schema,
        plugins: [
          history(),
          keymap({
            "Mod-z": undo,
            "Mod-Shift-z": redo,
            "Mod-y": redo,
            "Mod-b": toggleMark(schema.marks.strong!),
          }),
          keymap(baseKeymap),
        ],
      }),
      attributes: {
        role: "combobox",
        "aria-label": "Rich message",
        "aria-multiline": "true",
        style:
          "min-height:100px;border:1px solid #999;padding:8px;white-space:pre-wrap",
      },
      handleKeyDown: (_view, event) => latest.current.handleKeyDown(event),
      handleDOMEvents: {
        compositionend: () => {
          queueMicrotask(() => latest.current.refresh());
          return false;
        },
      },
      dispatchTransaction(transaction) {
        view.updateState(view.state.apply(transaction));
        onDocument(JSON.stringify(view.state.doc.toJSON()));
        latest.current.refresh();
      },
    });
    viewRef.current = view;
    const adapter: EditorAdapter<Person> = {
      element: view.dom,
      read() {
        const { empty, $from } = view.state.selection;
        if (
          !empty ||
          !$from.parent.isTextblock ||
          view.composing ||
          !view.hasFocus()
        )
          return null;
        // One placeholder per atom preserves ProseMirror's position units.
        // Only the current paragraph is scanned, so mentions cannot cross blocks.
        return {
          text: $from.parent.textBetween(
            0,
            $from.parent.content.size,
            "",
            "\ufffc",
          ),
          caret: $from.parentOffset,
          key: $from.start(),
        };
      },
      getCaretRect() {
        const { left, top, bottom } = view.coordsAtPos(
          view.state.selection.from,
        );
        return new DOMRect(left, top, 0, bottom - top);
      },
      replace(edit, person) {
        const { $from } = view.state.selection;
        const from = $from.start() + edit.from;
        const to = $from.start() + edit.to;
        const node = schema.nodes.mention!.create({
          id: person.id,
          label: person.name,
        });
        const transaction = closeHistory(view.state.tr).replaceWith(from, to, [
          node,
          schema.text(" "),
        ]);
        transaction.setSelection(
          TextSelection.create(transaction.doc, from + 2),
        );
        view.dispatch(transaction.scrollIntoView());
        // Subsequent typing gets its own undo group.
        view.dispatch(closeHistory(view.state.tr));
        view.focus();
      },
    };
    latest.current.setEditor(adapter);
    return () => {
      latest.current.setEditor(null);
      viewRef.current = null;
      view.destroy();
    };
  }, [onDocument]);

  useLayoutEffect(() => {
    const attributes: Record<string, string> = {
      role: "combobox",
      "aria-label": "Rich message",
      "aria-multiline": "true",
      style:
        "min-height:100px;border:1px solid #999;padding:8px;white-space:pre-wrap",
    };
    for (const [key, value] of Object.entries(mention.getEditorProps())) {
      if (value !== undefined) attributes[key] = String(value);
    }
    viewRef.current?.setProps({ attributes });
  });
  return <div ref={host} />;
}

export function ProseMirrorDemo() {
  const [document, setDocument] = useState("");
  return (
    <Mention.Root<Person>
      items={people}
      getKey={(p) => p.id}
      getLabel={(p) => p.name}
    >
      <Editor onDocument={setDocument} />
      <Mention.Popover aria-label="People">
        <Mention.List<Person>>
          {(person) => (
            <Mention.Item value={person}>{person.name}</Mention.Item>
          )}
        </Mention.List>
        <Mention.Empty>No people found</Mention.Empty>
      </Mention.Popover>
      <output data-testid="editor-document" style={{ display: "none" }}>
        {document}
      </output>
    </Mention.Root>
  );
}
