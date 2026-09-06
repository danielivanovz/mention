// biome-ignore-all lint/suspicious/noArrayIndexKey: AI SDK appends parts at stable positions; streamed text has no part ID.
"use client";

import { useChat } from "@ai-sdk/react";
import { Mention } from "@danielivanov/mention";
import { type ChatTransport, DefaultChatTransport } from "ai";
import { ArrowUpIcon, AtSignIcon, SquareIcon } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import {
  Message,
  MessageContent,
  MessageHeader,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import type {
  ContextDocument,
  ContextMessage,
} from "@/registry/default/ai-composer/context-message";
import {
  LexicalMentionEditor,
  type LexicalMentionEditorHandle,
} from "@/registry/default/ai-composer/mention-editor";
import "@danielivanov/mention/styles.css";

const defaultTransport = new DefaultChatTransport<ContextMessage>({
  api: "/api/chat",
});

export function AiComposer({
  documents,
  transport = defaultTransport,
  active = true,
}: {
  documents: ContextDocument[];
  transport?: ChatTransport<ContextMessage>;
  active?: boolean;
}) {
  const id = useId();
  const editor = useRef<LexicalMentionEditorHandle>(null);
  const sending = useRef(false);
  const completed = useRef(false);
  const submittedDraft = useRef("");
  const [empty, setEmpty] = useState(true);
  const [sendingDraft, setSendingDraft] = useState(false);
  const { messages, status, error, sendMessage, regenerate, stop } =
    useChat<ContextMessage>({
      transport,
      onFinish: ({ isAbort, isError }) => {
        completed.current = !isAbort && !isError;
      },
    });
  const busy = sendingDraft || status === "submitted" || status === "streaming";

  async function submit(retry = false) {
    if (!active || sending.current || busy || !editor.current) return;
    const draft = editor.current.getSnapshot();
    if (!retry && !draft.text.trim()) return;
    sending.current = true;
    setSendingDraft(true);
    completed.current = false;
    try {
      if (retry) {
        await regenerate();
      } else {
        submittedDraft.current = editor.current.getJSON();
        await sendMessage({
          parts: [
            { type: "text", text: draft.text },
            ...(draft.references.length
              ? [{ type: "data-mentions" as const, data: draft.references }]
              : []),
          ],
        });
      }
      // AI SDK reports transport failures through onError, not a rejected send promise.
      // Keep a failed/stopped draft. Retrying an old message must not clear a newer draft.
      if (
        completed.current &&
        editor.current?.getJSON() === submittedDraft.current
      ) {
        editor.current.clear();
      }
    } finally {
      sending.current = false;
      setSendingDraft(false);
    }
  }

  return (
    <div className="ai-composer flex min-w-0 flex-col gap-4">
      {messages.length > 0 && (
        <div className="h-64 min-w-0">
          <MessageScrollerProvider autoScroll>
            <MessageScroller>
              <MessageScrollerViewport aria-label="Conversation" tabIndex={0}>
                <MessageScrollerContent className="gap-5 p-1">
                  {messages.map((message) => (
                    <MessageScrollerItem
                      key={message.id}
                      messageId={message.id}
                      scrollAnchor={message.role === "user"}
                    >
                      <Message
                        align={message.role === "user" ? "end" : "start"}
                      >
                        <MessageContent>
                          <MessageHeader>
                            {message.role === "user" ? "You" : "Assistant"}
                          </MessageHeader>
                          <Bubble
                            variant={
                              message.role === "user" ? "secondary" : "ghost"
                            }
                          >
                            <BubbleContent>
                              {message.parts.map((part, index) =>
                                part.type === "text" ? (
                                  <p
                                    key={index}
                                    className="whitespace-pre-wrap"
                                  >
                                    {part.text}
                                  </p>
                                ) : part.type === "data-mentions" ? (
                                  <ul
                                    key={index}
                                    aria-label="Referenced documents"
                                    className="mt-2 flex flex-wrap gap-2"
                                  >
                                    {part.data.map((reference) => (
                                      <li
                                        key={reference.id}
                                        data-reference-id={reference.id}
                                        className="rounded-sm border border-border px-2 py-1 text-xs"
                                      >
                                        {reference.name}
                                      </li>
                                    ))}
                                  </ul>
                                ) : null,
                              )}
                            </BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        </div>
      )}

      <Mention.Root<ContextDocument>
        items={documents}
        allowSpaces
        getKey={(item) => item.id}
        getLabel={(item) => item.name}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          className="flex flex-col gap-2"
        >
          <label htmlFor={id} className="text-sm font-medium">
            Message with context
          </label>
          <InputGroup>
            <LexicalMentionEditor<ContextDocument>
              ref={editor}
              id={id}
              label="Message with context"
              active={active && !busy}
              data-slot="input-group-control"
              aria-describedby={`${id}-hint`}
              className="min-h-28 w-full min-w-0 whitespace-pre-wrap break-words p-3 text-base outline-none [&_.mention-token]:rounded-sm [&_.mention-token]:bg-muted [&_.mention-token]:text-foreground"
              onDocument={() =>
                setEmpty(!editor.current?.getSnapshot().text.trim())
              }
              onSubmit={() => void submit()}
            />
            <InputGroupAddon align="block-end">
              <InputGroupButton
                disabled={!active || busy}
                size="sm"
                onClick={() => editor.current?.insertTrigger("@")}
              >
                <AtSignIcon data-icon="inline-start" /> Reference
              </InputGroupButton>
              {busy ? (
                <InputGroupButton
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="ml-auto"
                  aria-label="Stop response"
                  onClick={() => void stop()}
                >
                  <SquareIcon />
                </InputGroupButton>
              ) : (
                <InputGroupButton
                  type="submit"
                  size="icon-sm"
                  variant="default"
                  className="ml-auto"
                  aria-label="Send message"
                  disabled={!active || empty}
                >
                  <ArrowUpIcon />
                </InputGroupButton>
              )}
            </InputGroupAddon>
          </InputGroup>
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">
            Type @ to reference a document. Enter selects, then sends.
            Shift+Enter adds a line.
          </p>
          <p role="status" className="sr-only">
            {busy ? "Receiving response…" : ""}
          </p>
          {error && (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3 text-sm"
            >
              <p>The response failed. Your draft is still here.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!active || busy}
                onClick={() => void submit(true)}
              >
                Retry response
              </Button>
            </div>
          )}
        </form>
        <Mention.Popover container={null} aria-label="Documents">
          <Mention.List<ContextDocument>>
            {(document) => (
              <Mention.Item value={document}>
                <span className="flex min-w-0 flex-col gap-1">
                  <span>{document.name}</span>
                  {document.description && (
                    <span className="text-xs">{document.description}</span>
                  )}
                </span>
              </Mention.Item>
            )}
          </Mention.List>
          <Mention.Empty>No documents found. Try another name.</Mention.Empty>
        </Mention.Popover>
      </Mention.Root>
    </div>
  );
}
