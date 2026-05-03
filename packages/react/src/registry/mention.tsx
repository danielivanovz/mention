"use client";

// shadcn-cli registry wrapper for @danielivanov/mention.
//
// When a consumer runs `npx shadcn add mention` against our registry, this
// file lands in their `components/ui/mention.tsx` next to a `mention.css`
// copy of the library's default theme.
//
// **Why a re-export and not a styled wrapper?** The library's compound
// parts (`<Mention.Item>`, `<Mention.Empty>`, `<Mention.Loading>`) accept
// `{ value, children }` only — no `className` passthrough by design,
// because their entire job is to project ARIA + a single `data-mention-*`
// attribute onto a `<div>`. Styling comes from the imported CSS targeting
// those attributes, not from per-component classNames.
//
// Consumers can:
//   1. Keep `mention.css` and tweak its `[data-mention-*]` selectors to
//      taste — same workflow as overriding shadcn's own component styles.
//   2. Pass `unstyled` to `<Mention.Root>` to drop the data-attrs and
//      style with Tailwind / their own CSS via the rendered div
//      structure.
//   3. Drop into `useMention()` for the full headless escape hatch.

import "./mention.css";

export type {
  MentionChannelConfig,
  MentionContext,
  MentionEmptyProps,
  MentionFetcher,
  MentionImperativeHandle,
  MentionInputProps,
  MentionItemProps,
  MentionItems,
  MentionListProps,
  MentionLoadingProps,
  MentionPopoverProps,
  MentionRootMultiProps,
  MentionRootProps,
  MentionSelectMeta,
  MentionStatus,
  UseMention,
  UseMentionProps,
} from "@danielivanov/mention";
export { Mention, useMention } from "@danielivanov/mention";
