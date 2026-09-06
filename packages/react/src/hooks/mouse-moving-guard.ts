/** Ignore pointer events caused by layout moving beneath a stationary cursor. */
export function trackMouseMovement(document: Document) {
  let moving = false;
  let x = 0;
  let y = 0;
  const move = (event: PointerEvent) => {
    if (
      event.movementX ||
      event.movementY ||
      event.screenX !== x ||
      event.screenY !== y
    )
      moving = true;
    x = event.screenX;
    y = event.screenY;
  };
  const reset = () => {
    moving = false;
  };
  document.addEventListener("pointermove", move, true);
  for (const event of ["pointerdown", "keydown", "scroll"])
    document.addEventListener(event, reset, true);
  return {
    isMoving: () => moving,
    destroy() {
      document.removeEventListener("pointermove", move, true);
      for (const event of ["pointerdown", "keydown", "scroll"])
        document.removeEventListener(event, reset, true);
    },
  };
}
