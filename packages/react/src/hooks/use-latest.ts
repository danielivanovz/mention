import { type RefObject, useLayoutEffect, useRef } from "react";

/**
 * Stable ref to the latest `value`. Use to read the freshest value of
 * a non-stable prop or callback inside an effect or callback that
 * shouldn't re-fire on identity changes.
 *
 * `useLayoutEffect` (not `useEffect`) is intentional — it fires before
 * the browser paints AND before sibling effects in the same commit, so
 * any consumer effect that runs in the same tick reads the freshest
 * ref, not the previous tick's. With plain `useEffect`, callbacks that
 * fire synchronously after a state change would see stale data.
 *
 * Effect deps narrow to primitives; the closure inside reads from the
 * ref to get the latest value without subscribing to its identity.
 */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
