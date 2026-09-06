import { convertToModelMessages, validateUIMessages } from "ai";
import { z } from "zod";
import type { ContextMessage } from "@/registry/default/ai-composer/context-message";

const references = z
  .array(
    z.object({
      id: z.string().min(1).max(200),
      name: z.string().min(1).max(200),
    }),
  )
  .max(20);

/** Call on the server. The resolver must enforce the signed-in user's access. */
export async function resolveContextMessages(
  input: unknown,
  resolve: (id: string) => Promise<{ name: string; content: string } | null>,
) {
  const messages = await validateUIMessages<ContextMessage>({
    messages: input,
    dataSchemas: { mentions: references },
  });
  const ids = new Set<string>();
  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") {
      throw new Error("Only user and assistant messages are accepted.");
    }
    for (const part of message.parts) {
      if (part.type === "data-mentions" && message.role === "user") {
        for (const reference of part.data) ids.add(reference.id);
      } else if (part.type !== "text") {
        throw new Error(
          "This example accepts text and user document references.",
        );
      }
    }
  }
  const documents = new Map<string, { name: string; content: string }>();
  await Promise.all(
    [...ids].map(async (id) => {
      const document = await resolve(id);
      if (!document) throw new Error("A referenced document is unavailable.");
      documents.set(id, document);
    }),
  );
  return convertToModelMessages<ContextMessage>(messages, {
    convertDataPart(part) {
      // UI data parts are otherwise discarded by AI SDK. Use server-owned names/content.
      return {
        type: "text",
        text: part.data
          .map(({ id }) => {
            const document = documents.get(id);
            if (!document)
              throw new Error("A referenced document is unavailable.");
            return JSON.stringify({
              reference: id,
              name: document.name,
              content: document.content,
            });
          })
          .join("\n"),
      };
    },
  });
}
