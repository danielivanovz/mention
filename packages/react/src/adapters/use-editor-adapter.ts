import { type RefObject, useEffect } from "react";
import type { EditorAdapter } from "./types.ts";

/**
 * Registration hook used by the wrapping component (`<Mention.Input>`,
 * `<Mention.Editable>`, or a custom host-editor bridge) to publish a
 * live `EditorAdapter` to the core. Keeps adapter creation lazy — only
 * runs when the host element actually mounts.
 *
 * The factory is called once per host-element identity. Mount / unmount
 * cycles re-create the adapter; same-node re-renders do not.
 */
export function useEditorAdapter<E extends HTMLElement>(
  host: E | null,
  adapterRef: RefObject<EditorAdapter | null>,
  factory: (element: E) => EditorAdapter,
): void {
  useEffect(() => {
    if (host === null) {
      adapterRef.current = null;
      return;
    }
    adapterRef.current = factory(host);
    return () => {
      adapterRef.current = null;
    };
    // `factory` is treated as stable per host identity — callers must
    // declare it at module scope or wrap in `useCallback`.
    // biome-ignore lint/correctness/useExhaustiveDependencies: factory is stable per host
  }, [host, adapterRef]);
}
