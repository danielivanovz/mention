"use client";

// Caret-anchoring visualizer.
// Pane ① runs the real <Mention> component from @danielivanov/mention. Pane ② is
// a teaching mirror — same value, same selectionStart, same dimensions —
// that exposes the caret-position trick the lib uses internally to anchor
// the popover. The mirror is normally invisible; exposing it is the whole
// point of this surface.
//
// onInput / onSelect / onClick are not claimed by getInputProps(), so we
// can subscribe to them without breaking the lib's ARIA contract.

import { Mention } from "@danielivanov/mention";
import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";

interface User {
  readonly id: string;
  readonly username: string;
  readonly name: string;
}

const USERS: readonly User[] = [
  { id: "u1", username: "alice", name: "Alice Anderson" },
  { id: "u2", username: "alex", name: "Alex Aoki" },
  { id: "u3", username: "ali", name: "Ali Akhtar" },
  { id: "u4", username: "bob", name: "Bob Brennan" },
  { id: "u5", username: "carol", name: "Carol Chen" },
];

// The mirror MUST share these properties with the textarea for
// span.offsetTop / offsetLeft to equal the real caret position.
// Source: textarea-caret-position v3.1.0 PROPERTIES list.
const SHARED_STYLE: React.CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  height: "9.5rem",
  padding: "0.75rem",
  border: "1px solid var(--border-subtle)",
  borderRadius: "0.375rem",
  font: "13px/1.55 var(--font-mono), ui-monospace, monospace",
  letterSpacing: "normal",
  wordSpacing: "normal",
  textTransform: "none",
  textIndent: "0",
  textShadow: "none",
  textAlign: "start",
  whiteSpace: "pre-wrap",
  wordWrap: "break-word",
  overflow: "hidden",
};

const INITIAL = "Mention @ali in the thread.\nLine two — caret is here";
const INITIAL_CARET = INITIAL.indexOf("here") + "here".length;

export function CaretAnchoring() {
  const id = useId();
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  const [value, setValue] = useState(INITIAL);
  const [caret, setCaret] = useState(INITIAL_CARET);
  const [coords, setCoords] = useState({ top: 0, left: 0, height: 0 });
  const [pulse, setPulse] = useState(0);

  // Sync with the textarea on every input / selection change. onChange is
  // owned by the lib, so we read state through onInput + onSelect (which
  // the lib leaves to consumers).
  const syncFromTextarea = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    setValue(ta.value);
    setCaret(ta.selectionStart ?? 0);
  }, []);

  // Read the caret coordinates after every render that changes value or
  // caret position. useLayoutEffect to read offsets pre-paint. value/caret
  // are triggers, not reads — they reposition the span via the JSX below,
  // and we re-read its offsets after layout. Removing them defeats the effect.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-fire trigger
  useLayoutEffect(() => {
    const span = spanRef.current;
    if (!span) return;
    setCoords({
      top: span.offsetTop,
      left: span.offsetLeft,
      height: span.offsetHeight,
    });
    setPulse((p) => p + 1);
  }, [value, caret]);

  const before = value.substring(0, caret);
  // textarea-caret-position appends a non-empty char after the span when
  // the caret is at end-of-line so the line keeps its height; we mirror
  // that contract here too.
  const after = value.substring(caret) || ".";

  return (
    <div className="not-prose">
      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        {/* ─── Pane ① — the real Mention component ─── */}
        <div>
          <label
            htmlFor={`${id}-ta`}
            className="block font-mono text-meta text-fg-muted"
          >
            <span className="text-fg">①</span> {"<Mention> from "}
            <code className="text-fg">@danielivanov/mention</code>
          </label>
          <Mention.Root<User>
            items={USERS}
            getKey={(u) => u.id}
            getLabel={(u) => u.username}
            getInsertText={(u) => `@${u.username}`}
            onSelect={() => {
              /* demo: no side effect */
            }}
          >
            <Mention.Input
              ref={taRef}
              id={`${id}-ta`}
              defaultValue={INITIAL}
              spellCheck={false}
              onInput={syncFromTextarea}
              onSelect={syncFromTextarea}
              onClick={syncFromTextarea}
              onKeyUp={syncFromTextarea}
              style={{
                ...SHARED_STYLE,
                background: "var(--bg-elevated)",
                color: "var(--fg)",
                outline: "none",
                resize: "none",
              }}
            />
            <Mention.Popover>
              <Mention.Loading>Searching…</Mention.Loading>
              <Mention.List>
                {(u: User) => (
                  <Mention.Item value={u}>
                    <span>@{u.username}</span>
                    <span className="ml-2 opacity-60">{u.name}</span>
                  </Mention.Item>
                )}
              </Mention.List>
              <Mention.Empty>No people found</Mention.Empty>
            </Mention.Popover>
          </Mention.Root>
          <p className="mt-2 font-mono text-meta text-fg-muted">
            type{" "}
            <kbd className="rounded border border-border-subtle bg-bg-elevated px-1 py-0.5">
              @a
            </kbd>{" "}
            — the popover anchors to the mirror's caret span
          </p>
        </div>

        {/* ─── Pane ② — the teaching mirror ─── */}
        <div>
          <p className="font-mono text-meta text-fg-muted">
            <span className="text-fg">②</span> the mirror div{" "}
            <span className="opacity-60">— normally hidden</span>
          </p>
          <div className="relative">
            <div
              aria-hidden
              style={{
                ...SHARED_STYLE,
                background:
                  "color-mix(in oklch, var(--bg-elevated) 70%, transparent)",
                color: "var(--fg-muted)",
                borderStyle: "dashed",
              }}
            >
              {before}
              <span
                ref={spanRef}
                key={pulse}
                style={{
                  display: "inline-block",
                  width: "1px",
                  height: "1.55em",
                  verticalAlign: "text-bottom",
                  background: "var(--accent)",
                  outline: "1px solid var(--accent)",
                  animation:
                    "caret-anchoring-pulse 220ms cubic-bezier(0.32, 0.72, 0, 1)",
                }}
              />
              {after}
            </div>
            <span
              aria-hidden
              className="pointer-events-none absolute right-2 top-2 font-mono text-[10px] text-fg-muted/60"
            >
              .mirror
            </span>
          </div>
          <p className="mt-2 font-mono text-meta text-fg-muted">
            same font, padding, border, line-height
          </p>
        </div>
      </div>

      {/* ─── Coordinate readout ─── */}
      <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-border-subtle/50 pt-5 font-mono text-meta">
        <span className="text-fg-muted">caret =</span>
        <Coord label="top" value={coords.top} />
        <Coord label="left" value={coords.left} />
        <Coord label="height" value={coords.height} />
        <span className="text-fg-muted opacity-60">
          ← <code>span.offsetTop / offsetLeft / offsetHeight</code>
        </span>
      </div>

      <style>{`
        @keyframes caret-anchoring-pulse {
          0%   { transform: scaleY(0.6); opacity: 0.55; }
          60%  { transform: scaleY(1.08); opacity: 1; }
          100% { transform: scaleY(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-caret-anchoring-cursor] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function Coord({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-fg-muted">{label}</span>
      <span className="text-fg" style={{ fontVariantNumeric: "tabular-nums" }}>
        {Math.round(value)}
        <span className="text-fg-muted">px</span>
      </span>
    </span>
  );
}
