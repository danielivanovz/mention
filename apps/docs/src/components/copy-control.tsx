"use client";

import { Check, Copy, Hourglass, X } from "lucide-react";
import { type Ref, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function CopyControl({
  ref,
  value,
  url,
  getText,
  label = "Copy",
  copiedLabel,
  iconOnly = false,
  className,
  failureMessage = "Copy failed. Select the text to copy it manually.",
}: {
  ref?: Ref<HTMLButtonElement>;
  value?: string;
  url?: string;
  getText?: () => string;
  label?: string;
  copiedLabel?: string;
  iconOnly?: boolean;
  className?: string;
  failureMessage?: string;
}) {
  const [status, setStatus] = useState<
    "idle" | "pending" | "copied" | "failed"
  >("idle");
  useEffect(() => {
    if (status !== "copied") return;
    const timer = setTimeout(() => setStatus("idle"), 2400);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy() {
    setStatus("pending");
    try {
      let text = getText ? getText() : value;
      if (url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Could not load the document");
        text = await response.text();
      }
      if (text === undefined) throw new Error("No text to copy");
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }
  const Icon =
    status === "copied"
      ? Check
      : status === "failed"
        ? X
        : status === "pending"
          ? Hourglass
          : Copy;
  return (
    <span className={cn("copy-control", className)}>
      <button
        ref={ref}
        type="button"
        onClick={copy}
        disabled={status === "pending"}
        aria-label={
          status === "pending"
            ? `${label}: Copying…`
            : status === "copied"
              ? `${label}: ${copiedLabel ?? "Copied"}`
              : label
        }
        aria-busy={status === "pending"}
        title={label}
      >
        <Icon size={16} aria-hidden="true" />
        {!iconOnly && (
          <span className="copy-label" aria-hidden="true">
            <span
              data-visible={
                status !== "pending" && !(status === "copied" && copiedLabel)
              }
            >
              {label}
            </span>
            <span data-visible={status === "pending"}>Copying…</span>
            {copiedLabel && (
              <span data-visible={status === "copied"}>{copiedLabel}</span>
            )}
          </span>
        )}
      </button>
      <span
        role="status"
        className={cn(
          "copy-feedback",
          status === "failed" ? "copy-failed" : "sr-only",
        )}
      >
        {status === "copied"
          ? "Copied to clipboard"
          : status === "failed"
            ? failureMessage
            : status === "pending"
              ? "Copying…"
              : ""}
      </span>
    </span>
  );
}
