"use client";

// Lazy-loads the three use-case scenes below the fold. Each scene is a
// hefty client component (its own MentionDemo + render-prop tree); the
// home page mounts them inside `<Reveal>` blocks, so the IO entrance
// already gates visibility — deferring hydration via `next/dynamic`
// just drops the initial JS payload to match.

import dynamic from "next/dynamic";
import { Reveal } from "@/components/reveal";

const PLACEHOLDER = <div className="h-[440px]" aria-hidden />;

const UseCaseCommentThread = dynamic(
  () =>
    import("@/components/use-case-comment-thread").then(
      (m) => m.UseCaseCommentThread,
    ),
  { ssr: false, loading: () => PLACEHOLDER },
);
const UseCaseAiPrompt = dynamic(
  () =>
    import("@/components/use-case-ai-prompt").then((m) => m.UseCaseAiPrompt),
  { ssr: false, loading: () => PLACEHOLDER },
);
const UseCaseChatComposer = dynamic(
  () =>
    import("@/components/use-case-chat-composer").then(
      (m) => m.UseCaseChatComposer,
    ),
  { ssr: false, loading: () => PLACEHOLDER },
);

export function UseCasesGrid() {
  return (
    <div className="mt-12 grid gap-6 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
      <Reveal>
        <UseCaseCommentThread />
      </Reveal>
      <Reveal delay={80}>
        <UseCaseAiPrompt />
      </Reveal>
      <Reveal delay={160}>
        <UseCaseChatComposer />
      </Reveal>
    </div>
  );
}
