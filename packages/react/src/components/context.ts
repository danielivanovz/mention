import { createContext, type RefObject, useContext } from "react";

import type { EditorAdapter } from "../adapters/types.ts";
import type { MentionChip, MentionContext } from "../types.ts";

// ─── ItemIndex context ─────────────────────────────────────────────
//
// `<Mention.List>` injects the per-item index into this context so
// `<Mention.Item>` can read it directly instead of doing an O(N)
// `indexOf` scan against `ctx.items`. Total work drops from O(N²) to
// O(N) on the dominant path (every Item inside a List). When Item is
// rendered outside a List (escape-hatch consumers driving custom
// layouts), the context returns null and Item falls back to indexOf.

const ItemIndexCtx = createContext<number | null>(null);

export const ItemIndexProvider = ItemIndexCtx.Provider;

export function useItemIndex(): number | null {
  return useContext(ItemIndexCtx);
}

// Internal context — `<Mention.Root>` populates it; the compound parts
// (`<Mention.Input>`, `<Mention.Popover>`, `<Mention.Item>`, …) read it
// via `useMentionInternal()`. Public consumers reach the same shape via
// the `useMention<T>()` hook, which mirrors this exact contract.
//
// We deliberately use `unknown` for the item type at the context boundary:
// the compound parts don't need to know `T` to wire ARIA + dispatch.
// Type-safe `T` is preserved at the public API surface (Root + hook).
//
// Carries fields beyond the public `MentionContext` shape:
// - `listboxId` / `optionId` — stable ARIA ids, owned by the hook.
// - `unstyled` — when true, compound parts skip their `data-mention-*`
//   attributes so the default CSS (which targets those selectors) cannot
//   apply. Lets a consumer drive every selector themselves with Tailwind.
export interface InternalMentionContext extends MentionContext<unknown> {
  readonly listboxId: string;
  readonly optionId: (index: number) => string;
  readonly unstyled: boolean;
  // Live ref to the host element (textarea or contenteditable) — needed
  // by `<Mention.Popover>` to build the Floating UI virtual anchor.
  readonly hostRef: RefObject<HTMLElement | null>;
  // Adapter ref — registered by the wrapping component (`<Mention.Input>`
  // or `<Mention.Editable>`) so the popover can read caret rect through
  // the editor-agnostic seam.
  readonly adapterRef: RefObject<EditorAdapter | null>;
  // Re-exposed so `<Mention.List>` can apply React keys via a Fragment
  // wrapper. Removing the previous `key` field from `getItemProps` (which
  // React 19 warns about when spread) means key application moves up
  // one level — into the mapping site that already knows the item.
  readonly getKey: (item: unknown) => string | number;
  // Active trigger character — null when popover is closed. Lets
  // `<Mention.List trigger="/">` filter rendering to only the matching
  // channel, so multi-trigger consumers can compose multiple typed lists
  // without casts.
  readonly activeTrigger: string | null;
}

const Ctx = createContext<InternalMentionContext | null>(null);

export const MentionProvider = Ctx.Provider;

export function useMentionInternal(): InternalMentionContext {
  const value = useContext(Ctx);
  if (value === null) {
    throw new Error(
      "Mention compound parts (Input, Popover, List, Item, Empty, Loading) " +
        "must be rendered inside <Mention.Root>.",
    );
  }
  return value;
}
