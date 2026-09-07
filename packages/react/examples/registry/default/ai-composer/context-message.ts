import type { UIMessage } from "ai";

export type MentionReference = { id: string; name: string };
export type ContextDocument = MentionReference & { description?: string };
export type ContextMessage = UIMessage<never, { mentions: MentionReference[] }>;
