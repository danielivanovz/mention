"use client";

import { type EditorAdapter, useMentionContext } from "@danielivanov/mention";
import { HistoryExtension } from "@lexical/history";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { RichTextExtension } from "@lexical/rich-text";
import {
  $create,
  $createParagraphNode,
  $createRangeSelectionFromDom,
  $createTextNode,
  $getDocument,
  $getRoot,
  $getSelection,
  $getState,
  $isElementNode,
  $isLineBreakNode,
  $isRangeSelection,
  $isTextNode,
  $setState,
  createState,
  defineExtension,
  type EditorConfig,
  HISTORY_PUSH_TAG,
  type LexicalEditor,
  type LexicalNode,
  TextNode,
} from "lexical";
import {
  type CSSProperties,
  type KeyboardEvent,
  type Ref,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";

type MentionValue = { id: string; name: string };
const idState = createState("mentionId", {
  parse: (value) => (typeof value === "string" ? value : ""),
});
const labelState = createState("mentionLabel", {
  parse: (value) => (typeof value === "string" ? value : ""),
});

const triggerState = createState("mentionTrigger", {
  parse: (value) => (typeof value === "string" ? value : "@"),
});

/** Token mode makes the entire mention one deletion while retaining Lexical's text formatting. */
export class MentionNode extends TextNode {
  override $config() {
    return this.config("mention", {
      extends: TextNode,
      stateConfigs: [
        { stateConfig: idState, flat: true },
        { stateConfig: labelState, flat: true },
        { stateConfig: triggerState, flat: true },
      ],
      importDOM: {
        span: (element) =>
          element.hasAttribute("data-mention-id")
            ? {
                priority: 1,
                conversion: (element) => ({
                  node: $createMentionNode(
                    element.getAttribute("data-mention-id") ?? "",
                    element.getAttribute("data-mention-label") ?? "",
                    element.textContent ?? "",
                    element.getAttribute("data-mention-trigger") ?? "@",
                  )
                    .setFormat(
                      Number(element.getAttribute("data-mention-format")) || 0,
                    )
                    .setStyle(element.getAttribute("style") ?? ""),
                }),
              }
            : null,
      },
    });
  }
  override createDOM(config: EditorConfig) {
    const element = super.createDOM(config);
    element.classList.add("mention-token");
    element.dataset.mentionId = $getState(this, idState);
    element.dataset.mentionLabel = $getState(this, labelState);
    element.dataset.mentionTrigger = $getState(this, triggerState);
    return element;
  }
  override exportDOM(editor: LexicalEditor) {
    const { element } = super.exportDOM(editor);
    // TextNode can render strong/em/code. A canonical span keeps HTML-only paste
    // independent of its current formatting tag; JSON clipboard data is optional.
    const wrapper = $getDocument().createElement("span");
    wrapper.dataset.mentionId = $getState(this, idState);
    wrapper.dataset.mentionLabel = $getState(this, labelState);
    wrapper.dataset.mentionTrigger = $getState(this, triggerState);
    wrapper.dataset.mentionFormat = String(this.getFormat());
    wrapper.style.cssText = this.getStyle();
    if (element) wrapper.append(element);
    return { element: wrapper };
  }
  override canInsertTextBefore() {
    return false;
  }
  override canInsertTextAfter() {
    return false;
  }
}

function $createMentionNode(
  id: string,
  label: string,
  text: string,
  trigger: string,
) {
  const node = $create(MentionNode).setTextContent(text).setMode("token");
  $setState(node, idState, id);
  $setState(node, labelState, label);
  $setState(node, triggerState, trigger);
  return node;
}

const extension = defineExtension({
  name: "mention/lexical-example",
  namespace: "mention/lexical-example",
  nodes: [MentionNode],
  dependencies: [RichTextExtension, HistoryExtension],
  $initialEditorState: () => {
    $getRoot().append($createParagraphNode());
  },
});

/** Map one block to UTF-16 offsets without scanning inside existing mention tokens. */
function $readRegion() {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null;
  const anchor = selection.anchor;
  let block: LexicalNode | null = anchor.getNode();
  while (block && (!$isElementNode(block) || block.isInline()))
    block = block.getParent();
  if (!$isElementNode(block) || block.getType() === "root") return null;
  let text = "";
  let caret: number | null = null;
  const segments: { node: TextNode; from: number; to: number }[] = [];
  function visit(node: LexicalNode) {
    const from = text.length;
    if ($isElementNode(node)) {
      const children = node.getChildren();
      children.forEach((child, index) => {
        if (anchor.key === node.getKey() && anchor.offset === index)
          caret = text.length;
        visit(child);
      });
      if (anchor.key === node.getKey() && anchor.offset === children.length)
        caret = text.length;
    } else if ($isTextNode(node) && node.isSimpleText()) {
      text += node.getTextContent();
      segments.push({ node, from, to: text.length });
      if (anchor.key === node.getKey()) caret = from + anchor.offset;
    } else {
      text += $isLineBreakNode(node) ? "\n" : "\ufffc";
      // A token's internal offsets are not editable positions.
      if (anchor.key === node.getKey() && anchor.offset === 0) caret = from;
      else if (
        anchor.key === node.getKey() &&
        anchor.offset === node.getTextContentSize()
      )
        caret = text.length;
    }
  }
  visit(block);
  return caret === null
    ? null
    : { text, caret, key: block.getKey(), segments, selection };
}

export interface LexicalMentionEditorHandle {
  focus(): void;
  clear(): void;
  insertTrigger(trigger: string): void;
  getJSON(): string;
  restoreJSON(json: string): void;
  getSnapshot(): { text: string; references: { id: string; name: string }[] };
}

type EditorProps = {
  id?: string;
  label: string;
  className?: string;
  style?: CSSProperties;
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
  placeholder?: string;
  active?: boolean;
  ref?: Ref<LexicalMentionEditorHandle>;
  onEmptyChange?: (empty: boolean) => void;
  onDocument?: (json: string) => void;
  onSubmit?: () => void;
  "data-slot"?: string;
};

function Editor<T extends MentionValue>({
  ref,
  active = true,
  onDocument,
  onEmptyChange,
  onSubmit,
  placeholder,
  label,
  ...props
}: EditorProps) {
  const [editor] = useLexicalComposerContext();
  const mention = useMentionContext<T>();
  const latest = useRef({ mention, active, onDocument, onEmptyChange });
  const composing = useRef(false);
  useLayoutEffect(() => {
    latest.current = { mention, active, onDocument, onEmptyChange };
  });

  useLayoutEffect(() => {
    editor.setEditable(active);
    if (!active) mention.setOpen(false);
  }, [active, editor, mention.setOpen]);

  useLayoutEffect(() => {
    const removeRoot = editor.registerRootListener((element) => {
      if (!element) {
        latest.current.mention.setEditor(null);
        return;
      }
      const adapter: EditorAdapter<T> = {
        element,
        read() {
          if (
            !latest.current.active ||
            composing.current ||
            editor.isComposing() ||
            element.ownerDocument.activeElement !== element
          )
            return null;
          return editor.getEditorState().read(
            () => {
              // Selectionchange can trail a native caret move. Never commit against the old model selection.
              const domSelection = $createRangeSelectionFromDom(
                element.ownerDocument.getSelection(),
                editor,
              );
              const selection = $getSelection();
              if (
                !$isRangeSelection(selection) ||
                !domSelection?.anchor.is(selection.anchor) ||
                !domSelection.focus.is(selection.focus)
              )
                return null;
              const region = $readRegion();
              return (
                region && {
                  text: region.text,
                  caret: region.caret,
                  key: region.key,
                }
              );
            },
            { editor },
          );
        },
        getCaretRect() {
          const selection = element.ownerDocument.getSelection();
          if (
            !selection?.rangeCount ||
            !selection.isCollapsed ||
            !element.contains(selection.anchorNode)
          )
            return null;
          return selection.getRangeAt(0).getBoundingClientRect();
        },
        replace(edit, item, meta) {
          let applied = false;
          editor.update(
            () => {
              const region = $readRegion();
              if (
                !region ||
                !latest.current.active ||
                composing.current ||
                editor.isComposing()
              )
                return;
              const start = region.segments.find(
                ({ from, to }) => edit.from >= from && edit.from < to,
              );
              const end = region.segments.find(
                ({ from, to }) => edit.to > from && edit.to <= to,
              );
              if (!start || !end) return;
              const format = region.selection.format;
              region.selection.setTextNodeRange(
                start.node,
                edit.from - start.from,
                end.node,
                edit.to - end.from,
              );
              const separator = edit.text.endsWith(" ") ? " " : "";
              const text = separator ? edit.text.slice(0, -1) : edit.text;
              const node = $createMentionNode(
                item.id,
                item.name,
                text,
                meta.trigger,
              ).setFormat(format);
              region.selection.insertNodes(
                separator
                  ? [node, $createTextNode(separator).setFormat(format)]
                  : [node],
              );
              applied = true;
            },
            { discrete: true, tag: HISTORY_PUSH_TAG },
          );
          return applied;
        },
      };
      latest.current.mention.setEditor(adapter);
    });
    const removeUpdate = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        latest.current.onEmptyChange?.($getRoot().getTextContentSize() === 0);
      });
      latest.current.onDocument?.(JSON.stringify(editorState.toJSON()));
      latest.current.mention.refresh();
    });
    return () => {
      removeUpdate();
      removeRoot();
      latest.current.mention.setEditor(null);
    };
  }, [editor]);

  useImperativeHandle(
    ref,
    () => ({
      focus() {
        if (latest.current.active) editor.focus();
      },
      clear() {
        editor.update(
          () => {
            $getRoot().clear().append($createParagraphNode()).selectEnd();
          },
          { discrete: true, tag: HISTORY_PUSH_TAG },
        );
        if (latest.current.active) editor.focus();
        latest.current.mention.setOpen(false);
      },
      insertTrigger(trigger) {
        if (!latest.current.active) return;
        editor.focus(() => {
          editor.update(
            () => {
              let selection = $getSelection();
              if (!$isRangeSelection(selection)) {
                $getRoot().selectEnd();
                selection = $getSelection();
              }
              if (!$isRangeSelection(selection)) return;
              const region = $readRegion();
              const prefix =
                region &&
                region.caret > 0 &&
                !/\s/.test(region.text[region.caret - 1] ?? "")
                  ? " "
                  : "";
              selection.insertText(prefix + trigger);
            },
            { discrete: true, tag: HISTORY_PUSH_TAG },
          );
          latest.current.mention.setOpen(true);
        });
      },
      getJSON() {
        return JSON.stringify(editor.getEditorState().toJSON());
      },
      getSnapshot() {
        return editor.getEditorState().read(() => {
          const references = new Map<string, { id: string; name: string }>();
          function visit(node: LexicalNode) {
            if (node instanceof MentionNode) {
              const id = $getState(node, idState);
              references.set(id, { id, name: $getState(node, labelState) });
            } else if ($isElementNode(node)) {
              node.getChildren().forEach(visit);
            }
          }
          visit($getRoot());
          return {
            text: $getRoot().getTextContent(),
            references: [...references.values()],
          };
        });
      },
      restoreJSON(json) {
        editor.setEditorState(editor.parseEditorState(json), {
          tag: HISTORY_PUSH_TAG,
        });
        latest.current.mention.setOpen(false);
      },
    }),
    [editor],
  );

  const relationships = mention.getEditorProps();
  return (
    <ContentEditable
      {...props}
      aria-autocomplete={relationships["aria-autocomplete"]}
      aria-haspopup={relationships["aria-haspopup"]}
      aria-controls={relationships["aria-controls"]}
      aria-activedescendant={relationships["aria-activedescendant"]}
      aria-label={label}
      role="textbox"
      aria-multiline="true"
      data-placeholder={placeholder}
      onFocus={() => mention.refresh()}
      onKeyDownCapture={(event) => {
        if (mention.handleKeyDown(event)) {
          event.stopPropagation();
          return;
        }
        if (
          onSubmit &&
          isSubmitKey(event) &&
          !composing.current &&
          !editor.isComposing()
        ) {
          event.preventDefault();
          event.stopPropagation();
          onSubmit();
        }
      }}
      onCompositionStart={() => {
        composing.current = true;
        mention.refresh();
      }}
      onCompositionEnd={() => {
        queueMicrotask(() => {
          composing.current = false;
          latest.current.mention.refresh();
        });
      }}
    />
  );
}

function isSubmitKey(event: KeyboardEvent) {
  return (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.nativeEvent.isComposing &&
    !event.defaultPrevented
  );
}

/** Example-level host integration, not an additional Mention package API. */
export function LexicalMentionEditor<T extends MentionValue>(
  props: EditorProps,
) {
  return (
    <LexicalExtensionComposer extension={extension} contentEditable={null}>
      <Editor<T> {...props} />
    </LexicalExtensionComposer>
  );
}
