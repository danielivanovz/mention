"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

interface CopyButtonProps {
  value: string;
  label?: string;
}

export function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => setCopied(true));
      }}
      aria-label={label ?? `Copy ${value}`}
      className="group inline-flex items-center gap-3 rounded-md border border-border-subtle bg-bg-elevated px-4 py-2.5 font-mono text-sm text-fg [transition:border-color_150ms_ease,transform_120ms_cubic-bezier(0.32,0.72,0,1)] hover:border-fg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-brand active:scale-[0.97] motion-reduce:active:scale-100"
    >
      <span className="text-fg-muted select-none">$</span>
      <span>{value}</span>
      <span
        aria-hidden
        className="relative ml-2 inline-flex h-4 w-4 items-center justify-center"
      >
        <Check
          className={`absolute size-4 text-[color:var(--accent)] transition-opacity duration-150 ${copied ? "opacity-100" : "opacity-0"}`}
        />
        <Copy
          className={`absolute size-4 text-fg-muted/60 transition-opacity duration-150 group-hover:text-fg-muted ${copied ? "opacity-0" : "opacity-100"}`}
        />
      </span>
      <span aria-live="polite" className="sr-only">
        {copied ? `Copied ${value}` : ""}
      </span>
    </button>
  );
}
