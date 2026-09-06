import { UseCaseCommentThread } from "./use-case-comment-thread";
import { UseCaseAiPrompt } from "./use-case-ai-prompt";
import { UseCaseChatComposer } from "./use-case-chat-composer";
export function UseCasesGrid() {
  return (
    <div className="mt-12 grid gap-6 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
      <UseCaseCommentThread />
      <UseCaseAiPrompt />
      <UseCaseChatComposer />
    </div>
  );
}
