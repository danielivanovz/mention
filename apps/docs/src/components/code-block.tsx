"use client";

import {
  CodeBlock,
  type CodeBlockProps,
} from "fumadocs-ui/components/codeblock";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { CopyControl } from "./copy-control";

export function DocsCodeBlock(props: CodeBlockProps) {
  const ref = useRef<HTMLElement>(null);
  function getText() {
    const pre = ref.current?.querySelector("pre");
    if (!pre) throw new Error("Code is unavailable");
    const clone = pre.cloneNode(true) as HTMLElement;
    for (const node of clone.querySelectorAll(".nd-copy-ignore"))
      node.replaceWith("\n");
    return clone.textContent ?? "";
  }
  return (
    <CodeBlock
      {...props}
      ref={ref}
      className={cn("docs-code-block", props.className)}
      viewportProps={{ "aria-label": props.title, ...props.viewportProps }}
      allowCopy={false}
      Actions={() => (
        <CopyControl
          getText={getText}
          label="Copy code"
          iconOnly
          className="code-copy"
        />
      )}
    />
  );
}
