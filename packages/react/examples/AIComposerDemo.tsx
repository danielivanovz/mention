// biome-ignore-all lint/a11y/noNoninteractiveTabindex: The bounded request preview must be keyboard-scrollable.
"use client";

import { createChat } from "@shadcn/helpers/ai-sdk";
import { useMemo, useRef, useState } from "react";
import { AiComposer } from "@/registry/default/ai-composer/ai-composer";
import type {
  ContextDocument,
  ContextMessage,
} from "@/registry/default/ai-composer/context-message";

export const sampleDocuments: ContextDocument[] = [
  {
    id: "doc-pricing",
    name: "pricing.md",
    description: "Plans and pricing assumptions",
  },
  {
    id: "doc-research",
    name: "customer research.md",
    description: "Interview notes and open questions",
  },
  {
    id: "doc-roadmap",
    name: "roadmap.md",
    description: "What we are building next",
  },
];

/** The scripted transport belongs to this demo; it is excluded from the registry item. */
export function AIComposerDemo({ active = true }: { active?: boolean }) {
  const [request, setRequest] = useState<ContextMessage | null>(null);
  const [failNext, setFailNext] = useState(false);
  const failure = useRef(false);
  const transport = useMemo(() => {
    const scripted = createChat<ContextMessage>().transport({
      delayMs: 45,
      fallback: ({ writer, messages }) => {
        const message = [...messages]
          .reverse()
          .find((item) => item.role === "user");
        const refs =
          message?.parts.flatMap((part) =>
            part.type === "data-mentions" ? part.data : [],
          ) ?? [];
        writer
          .sleep(200)
          .text(
            refs.length
              ? `Received ${refs.map((ref) => ref.name).join(" and ")} as ${refs.length === 1 ? "a document reference" : "document references"}. This sample response confirms the selection; a connected application would resolve their contents before asking the model.`
              : "Received your message without document references. Try typing @ to choose a document, then send again. This is a scripted sample response.",
          );
      },
    });
    return {
      ...scripted,
      async sendMessages(options: Parameters<typeof scripted.sendMessages>[0]) {
        setRequest(
          [...options.messages]
            .reverse()
            .find((message) => message.role === "user") ?? null,
        );
        if (failure.current) {
          failure.current = false;
          setFailNext(false);
          throw new Error("Example connection failure");
        }
        return scripted.sendMessages(options);
      },
    };
  }, []);
  return (
    <div className="ai-composer-demo flex min-w-0 flex-col gap-4">
      <div className="ai-demo-heading">
        <span>Choose what the assistant receives</span>
        <span>Sample responses</span>
      </div>
      <AiComposer
        documents={sampleDocuments}
        transport={transport}
        active={active}
      />
      <div className="ai-demo-controls">
        <label>
          <input
            type="checkbox"
            checked={failNext}
            onChange={(event) => {
              failure.current = event.target.checked;
              setFailNext(event.target.checked);
            }}
          />{" "}
          Fail the next response
        </label>
        <span>No model or network request</span>
      </div>
      {request && (
        <details className="ai-request">
          <summary>View submitted context</summary>
          <pre data-testid="submitted-context" tabIndex={0}>
            {JSON.stringify(request.parts, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
