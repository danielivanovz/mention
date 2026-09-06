import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createTextareaAdapter } from "../adapters/textarea.ts";
import type { EditorAdapter, EditorSnapshot } from "../adapters/types.ts";
import { findActiveMention } from "../state/find-active-mention.ts";
import type {
  MentionChannelConfig,
  MentionContext,
  MentionInputProps,
  MentionKeyEvent,
  MentionSelectMeta,
} from "../types.ts";
import { trackMouseMovement } from "./mouse-moving-guard.ts";
import { useChannelQuery } from "./use-channel-query.ts";
import { useLatest } from "./use-latest.ts";

export interface CoreProps {
  channels: Readonly<Record<string, MentionChannelConfig<unknown>>>;
  onCommit: (item: unknown, meta: MentionSelectMeta) => void;
  debounceMs: number;
}
export interface CoreReturn<T = unknown> extends MentionContext<T> {
  readonly getKey: (item: T) => string | number;
}
interface Session {
  snapshot: EditorSnapshot;
  trigger: string;
  query: string;
}
function sameSnapshot(a: EditorSnapshot | null, b: EditorSnapshot | null) {
  return (
    a !== null &&
    b !== null &&
    a.text === b.text &&
    a.caret === b.caret &&
    a.key === b.key
  );
}

export function useMentionCore<T = unknown>(props: CoreProps): CoreReturn<T> {
  for (const trigger of Object.keys(props.channels)) {
    if (trigger.length !== 1 || /\s/.test(trigger))
      throw new Error(
        "Mention triggers must be one non-whitespace UTF-16 character.",
      );
  }
  const [editor, updateEditor] = useState<EditorAdapter<unknown> | null>(null);
  const editorRef = useRef<EditorAdapter<unknown> | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [highlight, setHighlight] = useState<{
    session: Session;
    index: number;
  } | null>(null);
  const dismissed = useRef<EditorSnapshot | null>(null);
  const composing = useRef(false);
  const canceledPress = useRef<EventTarget | null>(null);
  const mouseMoving = useRef<() => boolean>(() => false);
  const id = useId();
  const listboxId = `mention-listbox-${id}`;
  const optionId = (index: number) => `mention-option-${id}-${index}`;
  const channel = session ? props.channels[session.trigger] : undefined;
  const { items, status } = useChannelQuery({
    channel,
    query: session?.query ?? "",
    requestKey: session,
    debounceMs: props.debounceMs,
  });
  const open = session !== null && channel !== undefined && status !== "error";
  const highlightedIndex =
    !open || items.length === 0
      ? -1
      : highlight?.session === session
        ? Math.min(highlight.index, items.length - 1)
        : 0;
  // Only callbacks crossing into editor lifecycles need a latest-value reference.
  const live = useLatest({ props, session, items, status, highlightedIndex });

  const setEditor = useCallback((next: EditorAdapter<T> | null) => {
    editorRef.current = next as EditorAdapter<unknown> | null;
    updateEditor(next as EditorAdapter<unknown> | null);
    dismissed.current = null;
    setSession(null);
  }, []);
  const textareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      setEditor(node ? createTextareaAdapter(node) : null);
    },
    [setEditor],
  );

  const close = useCallback(() => {
    dismissed.current = editorRef.current?.read() ?? null;
    setSession(null);
  }, []);
  const refresh = useCallback(() => {
    if (composing.current) return;
    const snapshot = editorRef.current?.read() ?? null;
    if (!sameSnapshot(snapshot, dismissed.current)) dismissed.current = null;
    const active = snapshot
      ? findActiveMention(
          snapshot.text,
          snapshot.caret,
          Object.keys(live.current.props.channels),
        )
      : null;
    if (!snapshot || !active || sameSnapshot(snapshot, dismissed.current)) {
      setSession(null);
      return;
    }
    setSession((previous) =>
      previous &&
      sameSnapshot(previous.snapshot, snapshot) &&
      previous.trigger === active.trigger &&
      previous.query === active.query
        ? previous
        : { snapshot, ...active },
    );
  }, [live]);
  const setOpen = useCallback(
    (next: boolean) => {
      if (!next) {
        close();
        return;
      }
      dismissed.current = null;
      // Explicitly reopening a failed search retries it; ordinary refreshes do not.
      if (live.current.status === "error") setSession(null);
      refresh();
    },
    [close, refresh, live],
  );

  const commit = useCallback(
    (item: T): boolean => {
      const current = live.current;
      const host = editorRef.current;
      const active = current.session;
      const snapshot = host?.read() ?? null;
      if (
        composing.current ||
        !host ||
        !active ||
        current.status !== "success" ||
        !current.items.includes(item) ||
        !sameSnapshot(snapshot, active.snapshot)
      ) {
        close();
        return false;
      }
      const config = current.props.channels[active.trigger];
      if (!config) {
        close();
        return false;
      }
      const meta = {
        trigger: active.trigger,
        query: active.query,
        triggerOffset:
          active.snapshot.caret - active.query.length - active.trigger.length,
      };
      const insertion =
        config.getInsertText?.(item, meta) ??
        `${active.trigger}${config.getLabel(item)}`;
      const suffix = active.snapshot.text.slice(active.snapshot.caret);
      const text =
        insertion + (/\s$/.test(insertion) || /^\s/.test(suffix) ? "" : " ");
      const applied = host.replace(
        { from: meta.triggerOffset, to: active.snapshot.caret, text },
        item,
        meta,
      );
      close();
      if (applied === false) return false;
      current.props.onCommit(item, meta);
      return true;
    },
    [live, close],
  );

  const handleKeyDown = useCallback(
    (event: MentionKeyEvent): boolean => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.isComposing ||
        event.keyCode === 229 ||
        composing.current
      )
        return false;
      const current = live.current;
      if (!current.session) return false;
      if (
        !sameSnapshot(
          editorRef.current?.read() ?? null,
          current.session.snapshot,
        )
      ) {
        close();
        return false;
      }
      if (event.key === "Escape") {
        close();
        event.preventDefault();
        return true;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (!current.items.length) return false;
        const delta = event.key === "ArrowDown" ? 1 : -1;
        setHighlight({
          session: current.session,
          index:
            (current.highlightedIndex + delta + current.items.length) %
            current.items.length,
        });
        event.preventDefault();
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        const item = current.items[current.highlightedIndex];
        if (item !== undefined && commit(item as T)) {
          event.preventDefault();
          return true;
        }
      }
      return false;
    },
    [live, close, commit],
  );

  useEffect(() => {
    if (!editor) return;
    const doc = editor.element.ownerDocument;
    const mouse = trackMouseMovement(doc);
    mouseMoving.current = mouse.isMoving;
    const blur = () => {
      if (!editor.element.contains(doc.activeElement)) close();
    };
    const outside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        !editor.element.contains(target) &&
        !doc.getElementById(listboxId)?.contains(target)
      )
        close();
    };
    editor.element.addEventListener("focusout", blur);
    doc.addEventListener("pointerdown", outside, true);
    return () => {
      mouse.destroy();
      editor.element.removeEventListener("focusout", blur);
      doc.removeEventListener("pointerdown", outside, true);
    };
  }, [editor, close, listboxId]);

  const activeOptionId =
    highlightedIndex < 0 ? undefined : optionId(highlightedIndex);
  // biome-ignore lint/correctness/useExhaustiveDependencies: new results may remount the option at the same index.
  useEffect(() => {
    if (!activeOptionId) return;
    const doc = editor?.element.ownerDocument;
    const list = doc?.getElementById(listboxId);
    const option = doc?.getElementById(activeOptionId);
    if (!list || !option) return;
    const bounds = list.getBoundingClientRect();
    const item = option.getBoundingClientRect();
    const scaleY = bounds.height / list.offsetHeight || 1;
    const top = bounds.top + list.clientTop * scaleY;
    const bottom = top + list.clientHeight * scaleY;
    // Scroll only the list; scrollIntoView can move the page before positioning.
    if (item.top < top) list.scrollTop -= (top - item.top) / scaleY;
    else if (item.bottom > bottom)
      list.scrollTop += (item.bottom - bottom) / scaleY;
  }, [editor, activeOptionId, listboxId, session, status]);

  const getEditorProps = (): React.HTMLAttributes<HTMLElement> => ({
    "aria-haspopup": "listbox",
    "aria-autocomplete": "list",
    "aria-controls": open ? listboxId : undefined,
    "aria-activedescendant":
      highlightedIndex >= 0 ? optionId(highlightedIndex) : undefined,
  });
  function getInputProps(
    input: Omit<MentionInputProps, "ref"> = {},
  ): MentionInputProps {
    return {
      ...input,
      ...getEditorProps(),
      ref: textareaRef,
      onChange(event) {
        input.onChange?.(event);
        refresh();
      },
      onSelect(event) {
        input.onSelect?.(event);
        refresh();
      },
      onFocus(event) {
        input.onFocus?.(event);
        refresh();
      },
      onBlur(event) {
        input.onBlur?.(event);
        close();
      },
      onKeyDown(event) {
        input.onKeyDown?.(event);
        if (!event.defaultPrevented && !event.nativeEvent.isComposing)
          handleKeyDown(event);
      },
      onCompositionStart(event) {
        composing.current = true;
        input.onCompositionStart?.(event);
      },
      onCompositionEnd(event) {
        composing.current = false;
        input.onCompositionEnd?.(event);
        refresh();
      },
    };
  }
  return {
    query: session?.query ?? "",
    open,
    highlightedIndex,
    items: items as readonly T[],
    status,
    activeTrigger: open ? session.trigger : null,
    editor: editor as EditorAdapter<T> | null,
    setEditor,
    refresh,
    handleKeyDown,
    getInputProps,
    getEditorProps,
    setOpen,
    commit,
    getKey: (item) => channel?.getKey(item) ?? "",
    getPopoverProps: () => ({
      id: listboxId,
      role: "listbox",
      "aria-busy": status === "loading",
    }),
    getItemProps: (item, index, itemProps = {}) => ({
      ...itemProps,
      id: optionId(index),
      role: "option",
      "aria-selected": index === highlightedIndex,
      onPointerDown(event) {
        itemProps.onPointerDown?.(event);
        canceledPress.current = event.defaultPrevented
          ? event.currentTarget
          : null;
      },
      onMouseDown(event) {
        itemProps.onMouseDown?.(event);
        if (event.defaultPrevented) canceledPress.current = event.currentTarget;
        // Retain editor focus; a completed click, not the press, selects.
        if (!event.defaultPrevented && event.button === 0)
          event.preventDefault();
      },
      onClick(event) {
        itemProps.onClick?.(event);
        // A non-pointer activation has no press to veto.
        const canceled =
          event.detail > 0 && canceledPress.current === event.currentTarget;
        canceledPress.current = null;
        if (!event.defaultPrevented && !canceled && event.button === 0)
          commit(item);
      },
      onPointerMove(event) {
        itemProps.onPointerMove?.(event);
        if (
          !event.defaultPrevented &&
          event.pointerType === "mouse" &&
          mouseMoving.current() &&
          session
        )
          setHighlight({ session, index });
      },
    }),
  };
}
