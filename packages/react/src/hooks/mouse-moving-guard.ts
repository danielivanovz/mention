/*
 * `mouseMoving` global guard — drives whether `<Mention.Item>`'s
 * `onPointerMove` is allowed to dispatch `HIGHLIGHT_AT`.
 *
 * The pattern is borrowed from Ariakit's CompositeHover. Without it,
 * opening the popover under a stationary cursor synthesizes
 * a `pointermove` on whichever option the cursor sits over — which would
 * immediately race the keyboard-set highlight (item 0) over to a random
 * item before the user has done anything.
 *
 * The guard is module-scoped state, mutated by document-level capture-
 * phase listeners. `mousemove` flips the flag *only* when the event
 * carries a non-zero `movementX/Y` — synthetic moves emitted on layout
 * shift report zero deltas and don't qualify. `mousedown`, `keydown`,
 * and `scroll` reset the flag because each of those signals "the user
 * is no longer in a pointer-driven flow".
 *
 * Listeners install once at first call. They live for the lifetime of
 * the page; the cost is four document listeners on capture phase, each
 * with a constant-time guard. Cleanup would only matter if the lib
 * could be unmounted globally — and `useMention` consumers may mount/
 * unmount many times per page lifetime, so per-mount install/teardown
 * would churn listeners pointlessly.
 */

let mouseMoving = false;
let installed = false;
let previousScreenX = 0;
let previousScreenY = 0;

export function isMouseMoving(): boolean {
  return mouseMoving;
}

// Did the cursor actually move? `movementX/Y` is the canonical signal in
// modern browsers, but some synthesized event paths (Playwright via CDP,
// older Chromium revisions, certain devtools-fired events) leave it at
// zero. Fall back to a manual screenX/Y delta — Ariakit's same trick
// (`__chunks/W2TDKEPX.js:hasMouseMovement`). Whatever route, the goal
// is the same: distinguish "the user actually moved" from "the layout
// changed under a stationary cursor".
function hasMovement(event: MouseEvent): boolean {
  const dx =
    event.movementX !== 0 ? event.movementX : event.screenX - previousScreenX;
  const dy =
    event.movementY !== 0 ? event.movementY : event.screenY - previousScreenY;
  previousScreenX = event.screenX;
  previousScreenY = event.screenY;
  return dx !== 0 || dy !== 0;
}

export function ensureMouseMovingGuard(): void {
  if (installed) return;
  if (typeof document === "undefined") return;
  installed = true;

  // Listen on `pointermove` (not `mousemove`) in capture phase. Per
  // UI Events, pointermove fires *before* the compatibility mousemove —
  // and React's onPointerMove on the item bubbles up after the capture
  // phase completes. Listening to mousemove here would let React's
  // handler run first, with `mouseMoving` still false, and the dispatch
  // would bail out. PointerEvent extends MouseEvent, so movementX/Y +
  // screenX/Y are available the same way.
  document.addEventListener(
    "pointermove",
    (event) => {
      if (hasMovement(event)) mouseMoving = true;
    },
    true,
  );
  for (const reset of ["pointerdown", "keydown", "scroll"] as const) {
    document.addEventListener(
      reset,
      () => {
        mouseMoving = false;
      },
      true,
    );
  }
}

/**
 * Test-only helpers. Public consumers must not import these — they
 * are exposed solely so unit tests can drive the guard without firing
 * actual `MouseEvent` instances at the document.
 *
 * Path-named with a leading underscore to keep them out of generated
 * docs and to signal intent.
 */
export const _testing = {
  reset(): void {
    mouseMoving = false;
    previousScreenX = 0;
    previousScreenY = 0;
  },
  setMoving(value: boolean): void {
    mouseMoving = value;
  },
};
