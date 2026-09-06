import { createContext, useContext } from "react";
import type { CoreReturn } from "../hooks/useMentionCore.ts";

const ItemIndexCtx = createContext<number | null>(null);
export const ItemIndexProvider = ItemIndexCtx.Provider;
export function useItemIndex() {
  return useContext(ItemIndexCtx);
}

export interface InternalMentionContext extends CoreReturn {
  readonly unstyled: boolean;
}
const Ctx = createContext<InternalMentionContext | null>(null);
export const MentionProvider = Ctx.Provider;
export function useMentionInternal(): InternalMentionContext {
  const value = useContext(Ctx);
  if (!value)
    throw new Error(
      "Mention compound parts must be rendered inside <Mention.Root>.",
    );
  return value;
}

/** The caller supplies the item type associated with the enclosing Root. */
export function useMentionContext<
  T = unknown,
>(): import("../types.ts").MentionContext<T> {
  return useMentionInternal() as unknown as import("../types.ts").MentionContext<T>;
}
