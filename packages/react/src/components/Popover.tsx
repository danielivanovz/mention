import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
  type VirtualElement,
} from "@floating-ui/react-dom";
import { type CSSProperties, useEffect } from "react";
import { createPortal } from "react-dom";

import { createElementCaretAnchor } from "../anchor/virtual.ts";
import type { MentionPopoverProps } from "../types.ts";
import { useMentionInternal } from "./context.ts";

/**
 * `<Mention.Popover>` — the listbox host, anchored via Floating UI.
 *
 * Anchor: a `VirtualElement` from `createElementCaretAnchor(host)` whose
 * `getBoundingClientRect` lifts the live caret rect (read through the
 * adapter) into viewport space. Popover only cares that it has a virtual
 * anchor.
 *
 * Why `@floating-ui/react-dom` not `@floating-ui/react`:
 * `@floating-ui/react` bundles the interaction framework (useDismiss,
 * useFocus, useRole, FloatingFocusManager). We use none of it — our
 * reducer + keydown handlers own the entire combobox state machine, and
 * the combobox-as-substring contract keeps focus in the textarea, so
 * there is no FloatingFocusManager work to do. Dropping the interactions
 * package keeps the bundle under the 12 kB ceiling.
 *
 * Portal target: `props.container ?? document.body`. Pass
 * `container={null}` to render in-place (no portal). The escape hatch
 * exists because portaled popovers can break TalkBack swipe order on
 * Android — see `MentionPopoverProps.container` for the full rationale.
 *
 * Middleware: offset(4) → flip → shift({padding: 8}) → size (clamps
 * height to the smaller of `maxHeight` and viewport-available space).
 *
 * `autoUpdate` keeps positioning live during scroll/resize. Cleanup is
 * wired by `useFloating` automatically.
 */
export function Popover(props: MentionPopoverProps): React.ReactNode {
  const ctx = useMentionInternal();
  const maxHeight = props.maxHeight ?? 280;

  // Build the virtual anchor from the live textarea node. The
  // `ctx.open` early-return below gates this whole tree, so by the
  // time we reach here the textarea is mounted. The VirtualElement
  // re-reads selectionStart live in its getBoundingClientRect, so
  // creating it per-render is cheap.
  // Anchor goes through the adapter — `getCaretRect()` returns a
  // viewport-coords rect for whatever host type registered. Falls back
  // to host bounding rect on null (handled inside createElementCaretAnchor).
  const hostNode = ctx.hostRef.current;
  const adapter = ctx.adapterRef.current;
  const anchor: VirtualElement | null =
    hostNode !== null && adapter !== null
      ? createElementCaretAnchor(hostNode, () => adapter.getCaretRect())
      : null;

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
        apply({ availableHeight, elements }) {
          elements.floating.style.maxHeight = `${Math.min(
            maxHeight,
            availableHeight,
          )}px`;
        },
        padding: 8,
      }),
    ],
    elements: {
      ...(anchor !== null && { reference: anchor }),
    },
  });

  // Re-position on caret movement. Floating UI's `autoUpdate` only ticks
  // on scroll/resize — it can't see the caret hop one character right
  // when the user types. `ctx.query` changing (only emitted while open)
  // is our cleanest proxy for "the caret moved within an active mention".
  // The virtual anchor's `getBoundingClientRect` re-reads selectionStart
  // live, so calling `update()` is enough — no anchor swap needed.
  // ctx.query is the re-fire trigger (caret moved within an active mention).
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional re-fire trigger
  useEffect(() => {
    if (ctx.open) update();
  }, [ctx.open, ctx.query, update]);

  if (!ctx.open) return null;

  const popoverProps = ctx.getPopoverProps();
  const dataAttrs = ctx.unstyled ? {} : { "data-mention-popover": "" };
  const themeVars: CSSProperties | undefined = ctx.unstyled
    ? undefined
    : ({
        ["--mention-popover-max-height" as string]: `${maxHeight}px`,
      } as CSSProperties);

  // Forward aria-label / aria-labelledby from props so consumers can name
  // the listbox ("People to mention", "Channels", etc.) — required by the
  // APG combobox pattern when the listbox isn't already labelled by the
  // input, and a meaningful screen-reader UX upgrade otherwise.
  const ariaLabelProps = {
    ...(props["aria-label"] !== undefined && {
      "aria-label": props["aria-label"],
    }),
    ...(props["aria-labelledby"] !== undefined && {
      "aria-labelledby": props["aria-labelledby"],
    }),
  };

  const popoverEl = (
    <div
      ref={refs.setFloating}
      {...popoverProps}
      {...ariaLabelProps}
      {...dataAttrs}
      style={{ ...floatingStyles, ...themeVars }}
    >
      {props.children}
    </div>
  );

  // container={null} → in-place render (no portal). Escape hatch for AT
  // edge cases (TalkBack swipe order). Anchored positioning still applies.
  if (props.container === null) return popoverEl;

  // SSR: createPortal needs a DOM target. document is unavailable on the
  // server — bail to in-place render. Hydration takes over on mount.
  if (typeof document === "undefined") return popoverEl;

  return createPortal(popoverEl, props.container ?? document.body);
}
