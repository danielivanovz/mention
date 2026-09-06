import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
  type VirtualElement,
} from "@floating-ui/react-dom";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { MentionPopoverProps } from "../types.ts";
import { useMentionInternal } from "./context.ts";

export function Popover({
  container,
  maxHeight = 280,
  style,
  children,
  ...props
}: MentionPopoverProps) {
  const ctx = useMentionInternal();
  const editor = ctx.editor;
  const { refs, floatingStyles, update } = useFloating<VirtualElement>({
    open: ctx.open,
    placement: "bottom-start",
    strategy: "absolute",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip(),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, elements }) {
          elements.floating.style.maxHeight = `${Math.max(0, Math.min(maxHeight, availableHeight))}px`;
        },
      }),
    ],
  });
  useEffect(() => {
    refs.setReference(
      editor
        ? {
            contextElement: editor.element,
            getBoundingClientRect: () =>
              editor.getCaretRect() ?? editor.element.getBoundingClientRect(),
          }
        : null,
    );
  }, [editor, refs.setReference]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: typing moves the caret without resizing the host.
  useEffect(() => {
    if (ctx.open) void update();
  }, [ctx.open, ctx.query, update]);
  if (!ctx.open || !editor) return null;
  const popover = (
    <div
      {...props}
      {...ctx.getPopoverProps()}
      {...(ctx.unstyled ? {} : { "data-mention-popover": "" })}
      ref={refs.setFloating}
      style={{ ...style, ...floatingStyles }}
    >
      {children}
    </div>
  );
  return container === null
    ? popover
    : createPortal(popover, container ?? editor.element.ownerDocument.body);
}
