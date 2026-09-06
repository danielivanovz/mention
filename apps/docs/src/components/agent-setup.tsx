"use client";

import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "fumadocs-ui/components/ui/popover";
import { ArrowUpRight, Terminal, X } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { createAgentPrompt } from "@/lib/agent-prompt";
import { cn } from "@/lib/cn";
import { CopyControl } from "./copy-control";

export function AgentSetup({
  pageTitle,
  markdownPath,
  className,
}: {
  pageTitle?: string;
  markdownPath?: string;
  className?: string;
}) {
  const id = useId();
  const [prompt, setPrompt] = useState("");
  return (
    <Popover
      onOpenChange={(open) => {
        if (open)
          setPrompt(
            createAgentPrompt(window.location.origin, pageTitle, markdownPath),
          );
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" className={cn("agent-setup-trigger", className)}>
          <Terminal size={16} aria-hidden="true" /> Agent setup
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="agent-setup"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
      >
        <div className="agent-setup-heading">
          <h2 id={`${id}-title`}>Build with your agent.</h2>
          <PopoverClose aria-label="Close agent setup">
            <X size={18} aria-hidden="true" />
          </PopoverClose>
        </div>
        <div className="agent-setup-body">
          <p id={`${id}-description`}>
            Paste into your coding agent to get started with your app.
          </p>
          <label htmlFor={`${id}-prompt`}>
            {pageTitle ? `Prompt for ${pageTitle}` : "Integration prompt"}
          </label>
          <textarea
            id={`${id}-prompt`}
            readOnly
            value={prompt}
            spellCheck={false}
          />
        </div>
        <div className="agent-setup-actions">
          <CopyControl
            value={prompt}
            label="Copy prompt"
            copiedLabel="Copied"
            failureMessage="Copy failed. Select the prompt above and copy it manually."
          />
          <PopoverClose asChild>
            <Link href="/docs/agents">
              Read guide <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}
