"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Tab<T extends string> = { label: string; value: T };

type DevPanelProps<T extends string> = {
  title?: string;
  tabs: readonly Tab<T>[];
  active: T;
  onChange: (value: T) => void;
  children?: ReactNode;
};

/**
 * Floating dev-only panel. Backtick toggles visibility; ignored when focus
 * is on input/textarea/contenteditable (don't eat the user's typing).
 *
 * Production-stripped: returns null in non-dev builds so the entire panel
 * tree-shakes out via the NODE_ENV constant fold.
 */
export function DevPanel<T extends string>({
  title,
  tabs,
  active,
  onChange,
  children,
}: DevPanelProps<T>) {
  const [open, setOpen] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "`") return;
      const target = event.target as HTMLElement | null;
      if (!target) {
        toggle();
        return;
      }
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div
      ref={panelRef}
      className="fixed right-4 bottom-4 z-50 font-mono text-[11px]"
      data-dev-panel
    >
      {open ? (
        <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/80 p-3 text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <span className="text-white/60 uppercase tracking-wider text-[10px]">
              {title ?? "Dev"}
            </span>
            <button
              type="button"
              onClick={toggle}
              className="text-white/40 hover:text-white/80"
              aria-label="Hide dev panel (toggle: backtick)"
            >
              ×
            </button>
          </div>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => onChange(tab.value)}
                className={`rounded px-2 py-1 transition ${
                  active === tab.value
                    ? "bg-white text-black"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {children ? <div className="pt-1">{children}</div> : null}
          <div className="text-white/30 text-[10px] pt-1 border-t border-white/10">
            press <kbd className="text-white/50">`</kbd> to toggle
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={toggle}
          className="rounded-md border border-white/20 bg-black/60 px-2 py-1 text-white/60 backdrop-blur-md hover:text-white"
        >
          {title ?? "Dev"} `
        </button>
      )}
    </div>
  );
}
