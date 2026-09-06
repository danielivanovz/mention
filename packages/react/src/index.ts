"use client";

export type {
  EditorAdapter,
  EditorSnapshot,
  MentionEdit,
} from "./adapters/types.ts";
export { useMentionContext } from "./components/context.ts";
export { Mention } from "./components/index.ts";
export { useMention } from "./hooks/useMention.ts";
export { useMentionMulti } from "./hooks/useMentionMulti.ts";
export {
  type ActiveMention,
  findActiveMention,
} from "./state/find-active-mention.ts";
export type {
  MentionChannelConfig,
  MentionContext,
  MentionEmptyProps,
  MentionFetcher,
  MentionImperativeHandle,
  MentionInputProps,
  MentionItemProps,
  MentionItems,
  MentionKeyEvent,
  MentionListProps,
  MentionLoadingProps,
  MentionMultiContext,
  MentionPopoverProps,
  MentionRootMultiProps,
  MentionRootProps,
  MentionSelectMeta,
  MentionStatus,
  UseMention,
  UseMentionMulti,
  UseMentionMultiProps,
  UseMentionProps,
} from "./types.ts";
