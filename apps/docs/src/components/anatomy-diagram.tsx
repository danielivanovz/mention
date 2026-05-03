"use client";

// Kinetic SVG diagram of the ARIA combobox-as-substring contract.
// Mounts on the terminal frame so a glance reads the contract in its full
// state. Replay rewinds and plays the sequence: typing produces the
// substring, ArrowDown moves the highlight, the aria-activedescendant
// pointer retargets per keystroke, focus never leaves the textarea.
//
// User-initiated motion only — no autoplay-on-view. Reduced-motion always
// shows the terminal frame; Replay is a no-op.

import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";

interface Frame {
  readonly typed: string;
  readonly active: 0 | 1 | 2;
  readonly hold: number;
}

const SCRIPT: readonly Frame[] = [
  { typed: "comment so far ", active: 0, hold: 500 },
  { typed: "comment so far @", active: 0, hold: 450 },
  { typed: "comment so far @al", active: 0, hold: 850 },
  { typed: "comment so far @al", active: 1, hold: 750 },
  { typed: "comment so far @al", active: 2, hold: 0 },
];

const OPTIONS = [
  { id: "opt-0", label: "@alice" },
  { id: "opt-1", label: "@alex" },
  { id: "opt-2", label: "@ali" },
] as const;

function subscribePrefersReducedMotion(cb: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}
function getPrefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotion,
    () => false,
  );
}

export function AnatomyDiagram() {
  // Mount on terminal frame: a glance reads the contract in its steady state.
  const [step, setStep] = useState(SCRIPT.length - 1);
  const [running, setRunning] = useState(false);
  const reduced = usePrefersReducedMotion();
  const titleId = useId();
  const descId = useId();

  const start = useCallback(() => {
    if (reduced) return;
    setStep(0);
    setRunning(true);
  }, [reduced]);

  // Scripted timeline driver. Each Frame holds for `hold`ms then advances.
  useEffect(() => {
    if (!running) return;
    if (step >= SCRIPT.length - 1) {
      setRunning(false);
      return;
    }
    const id = window.setTimeout(
      () => setStep((s) => s + 1),
      SCRIPT[step].hold,
    );
    return () => window.clearTimeout(id);
  }, [step, running]);

  const frame = SCRIPT[step] ?? SCRIPT[SCRIPT.length - 1];
  const activeOption = OPTIONS[frame.active];

  return (
    <figure className="not-prose mt-12 max-w-3xl">
      <svg
        viewBox="0 0 640 320"
        className="w-full"
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
      >
        <title id={titleId}>
          ARIA combobox-as-substring contract — animated playback
        </title>
        <desc id={descId}>
          The textarea retains role=combobox while aria-activedescendant points
          at the currently highlighted option in the popover listbox.
        </desc>

        {/* textarea */}
        <rect
          x="24"
          y="56"
          width="240"
          height="72"
          rx="6"
          fill="var(--bg-elevated)"
          stroke="var(--border-subtle)"
          strokeWidth="1.5"
        />
        <text
          x="40"
          y="84"
          fill="var(--fg)"
          fontFamily="var(--font-mono)"
          fontSize="13"
        >
          {frame.typed}
          <tspan fill="var(--accent)">▏</tspan>
        </text>
        <text
          x="40"
          y="108"
          fill="var(--fg-muted)"
          fontFamily="var(--font-mono)"
          fontSize="11"
        >
          role="combobox"
        </text>

        {/* aria-controls */}
        <path
          d="M 264 92 C 320 92, 320 182, 376 182"
          stroke="var(--accent)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="4 4"
          opacity="0.65"
        />
        <text
          x="296"
          y="138"
          fill="var(--fg-muted)"
          fontFamily="var(--font-mono)"
          fontSize="11"
        >
          aria-controls
        </text>

        {/* popover/listbox */}
        <rect
          x="376"
          y="148"
          width="232"
          height="140"
          rx="6"
          fill="var(--bg-elevated)"
          stroke="var(--border-subtle)"
          strokeWidth="1.5"
        />
        <text
          x="392"
          y="170"
          fill="var(--fg-muted)"
          fontFamily="var(--font-mono)"
          fontSize="11"
        >
          role="listbox"
        </text>

        {/* active highlight — slides between option slots via translateY */}
        <rect
          x="392"
          width="200"
          height="28"
          rx="4"
          y="180"
          fill="color-mix(in oklch, var(--accent) 18%, transparent)"
          stroke="var(--accent)"
          strokeWidth="1.2"
          style={{
            transform: `translateY(${frame.active * 36}px)`,
            transition: reduced
              ? "none"
              : "transform 240ms cubic-bezier(0.32, 0.72, 0, 1)",
            transformBox: "fill-box",
          }}
        />

        {/* options (text labels static; highlight slides over them) */}
        {OPTIONS.map((o, i) => (
          <text
            key={o.id}
            x="404"
            y={198 + i * 36}
            fill={i === frame.active ? "var(--fg)" : "var(--fg-muted)"}
            fontFamily="var(--font-mono)"
            fontSize="12"
            style={{ transition: reduced ? "none" : "fill 200ms ease-out" }}
          >
            {o.label} · id={o.id}
          </text>
        ))}

        {/* aria-activedescendant arrow — solid line, retargets the active option */}
        <path
          d={`M 144 128 C 144 188, 320 ${194 + frame.active * 36}, 392 ${194 + frame.active * 36}`}
          stroke="var(--accent)"
          strokeWidth="1.5"
          fill="none"
          style={{
            transition: reduced
              ? "none"
              : "d 240ms cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        />
        {/* Live ID — the slide on the right is the visual cue; the text just retargets. */}
        <text
          x="32"
          y="162"
          fill="var(--fg-muted)"
          fontFamily="var(--font-mono)"
          fontSize="11"
        >
          aria-activedescendant=
          <tspan fill="var(--accent)">"{activeOption.id}"</tspan>
        </text>
      </svg>

      <figcaption className="mt-6 max-w-prose text-meta text-fg-muted">
        No role mutation. No second tab stop. No focus shift. The textarea keeps{" "}
        <code className="font-mono">role="combobox"</code> the entire time;
        screen readers announce option changes through{" "}
        <code className="font-mono">aria-activedescendant</code> as it
        retargets.
      </figcaption>

      <div className="mt-5 flex items-center gap-3 font-mono text-meta text-fg-muted">
        <button
          type="button"
          onClick={start}
          disabled={running || reduced}
          className="inline-flex items-center gap-1.5 rounded border border-border-subtle px-2.5 py-1 text-fg transition-colors hover:border-fg-muted/50 disabled:opacity-40"
          aria-label={
            reduced
              ? "Replay disabled while reduced motion is enabled"
              : "Replay the contract sequence"
          }
        >
          <span aria-hidden>↻</span>
          <span>{running ? "Playing…" : "Replay"}</span>
        </button>
        <span>
          step {step + 1}/{SCRIPT.length}
        </span>
      </div>
    </figure>
  );
}
