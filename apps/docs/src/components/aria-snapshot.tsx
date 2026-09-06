"use client";

// ARIA-snapshot visualizer. Pane ① runs the real <Mention> component.
// Pane ② reads ARIA attributes off the DOM via getAttribute() after every
// user action and displays them as a pseudo-DOM tree — what an AT reviewer
// would see in DevTools, exposed inline.
//
// Reads are deferred via requestAnimationFrame so we capture the
// post-render DOM: aria-activedescendant is set by the lib's reducer
// during the render that follows each input event.

import { Mention } from "@danielivanov/mention";
import { useCallback, useEffect, useId, useRef, useState } from "react";

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

interface OptionAttrs {
  readonly id: string;
  readonly role: string;
  readonly ariaSelected: string;
  readonly label: string;
}

interface Snapshot {
  readonly role: string;
  readonly ariaExpanded: string;
  readonly ariaControls: string;
  readonly ariaActivedescendant: string;
  readonly listboxId: string | null;
  readonly listboxRole: string | null;
  readonly options: readonly OptionAttrs[];
}

const EMPTY: Snapshot = {
  role: "",
  ariaExpanded: "",
  ariaControls: "",
  ariaActivedescendant: "",
  listboxId: null,
  listboxRole: null,
  options: [],
};

const INITIAL = "Type @a to see the listbox open.";

export function AriaSnapshot() {
  const id = useId();
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [snap, setSnap] = useState<Snapshot>(EMPTY);

  const readSnapshot = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    requestAnimationFrame(() => {
      const role = ta.getAttribute("role") ?? "";
      const ariaExpanded = ta.getAttribute("aria-expanded") ?? "";
      const ariaControls = ta.getAttribute("aria-controls") ?? "";
      const ariaActivedescendant =
        ta.getAttribute("aria-activedescendant") ?? "";

      const listbox = ariaControls
        ? document.getElementById(ariaControls)
        : null;
      const listboxRole = listbox?.getAttribute("role") ?? null;
      const optionEls = listbox
        ? Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]'))
        : [];
      const options: OptionAttrs[] = optionEls.map((el) => ({
        id: el.id,
        role: el.getAttribute("role") ?? "",
        ariaSelected: el.getAttribute("aria-selected") ?? "",
        label: el.textContent?.trim() ?? "",
      }));

      setSnap({
        role,
        ariaExpanded,
        ariaControls,
        ariaActivedescendant,
        listboxId: listbox?.id ?? null,
        listboxRole,
        options,
      });
    });
  }, []);

  // Initial snapshot once the textarea mounts.
  useEffect(() => {
    readSnapshot();
  }, [readSnapshot]);

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
              onInput={readSnapshot}
              onSelect={readSnapshot}
              onClick={readSnapshot}
              onKeyUp={readSnapshot}
              style={{
                boxSizing: "border-box",
                width: "100%",
                height: "9.5rem",
                padding: "0.75rem",
                border: "1px solid var(--border-subtle)",
                borderRadius: "0.375rem",
                font: "13px/1.55 var(--font-mono), ui-monospace, monospace",
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
            and arrow through — watch the snapshot retarget per keystroke
          </p>
        </div>

        {/* ─── Pane ② — the ARIA snapshot ─── */}
        <div>
          <p className="font-mono text-meta text-fg-muted">
            <span className="text-fg">②</span> ARIA snapshot{" "}
            <span className="opacity-60">
              — read live from the DOM via{" "}
              <code className="text-fg/70">getAttribute()</code>
            </span>
          </p>
          <pre
            className="mt-1 overflow-x-auto rounded border border-border-subtle bg-bg-elevated p-3 font-mono text-[12px] leading-[1.7] text-fg"
            aria-live="polite"
          >
            <SnapshotTree snap={snap} />
          </pre>
        </div>
      </div>
    </div>
  );
}

function SnapshotTree({ snap }: { snap: Snapshot }) {
  const expanded = snap.ariaExpanded === "true";
  return (
    <code>
      <Tag name="textarea" />
      <Attr name="role" value={snap.role} active />
      <Attr name="aria-controls" value={snap.ariaControls} muted />
      <Attr name="aria-expanded" value={snap.ariaExpanded} active={expanded} />
      <Attr
        name="aria-activedescendant"
        value={snap.ariaActivedescendant}
        active={!!snap.ariaActivedescendant}
      />
      <CloseSelf />

      {snap.listboxId ? (
        <>
          <Tag name="div" />
          <Attr name="id" value={snap.listboxId} muted />
          <Attr name="role" value={snap.listboxRole ?? ""} active />
          <CloseOpen />
          {snap.options.map((opt) => (
            <Option key={opt.id} opt={opt} />
          ))}
          <ClosingTag name="div" />
        </>
      ) : (
        <Comment text="<!-- listbox not mounted (popover closed) -->" />
      )}
    </code>
  );
}

function Option({ opt }: { opt: OptionAttrs }) {
  const selected = opt.ariaSelected === "true";
  return (
    <>
      <span className="text-fg-muted">{"  "}</span>
      <span className="text-fg-muted">&lt;</span>
      <span className="text-fg">div</span>
      <span style={{ marginLeft: "0.4rem" }} className="text-fg-muted">
        id=
      </span>
      <span style={{ color: "var(--fg-muted)" }}>"{opt.id}"</span>
      <span style={{ marginLeft: "0.4rem" }} className="text-fg-muted">
        role=
      </span>
      <span style={{ color: "var(--accent)" }}>"{opt.role}"</span>
      <span style={{ marginLeft: "0.4rem" }} className="text-fg-muted">
        aria-selected=
      </span>
      <span
        style={{
          color: selected ? "var(--accent)" : "var(--fg-muted)",
          fontWeight: selected ? 600 : 400,
        }}
      >
        "{opt.ariaSelected}"
      </span>
      <span className="text-fg-muted">&gt;</span>
      <span style={{ color: selected ? "var(--fg)" : "var(--fg-muted)" }}>
        {opt.label}
      </span>
      <span className="text-fg-muted">&lt;/div&gt;</span>
      {"\n"}
    </>
  );
}

function Tag({ name }: { name: string }) {
  return (
    <>
      <span className="text-fg-muted">&lt;</span>
      <span className="text-fg">{name}</span>
      {"\n"}
    </>
  );
}

function Attr({
  name,
  value,
  active,
  muted,
}: {
  name: string;
  value: string;
  active?: boolean;
  muted?: boolean;
}) {
  const valueColor = active
    ? "var(--accent)"
    : muted
      ? "var(--fg-muted)"
      : "var(--fg)";
  return (
    <>
      <span className="text-fg-muted">{"  "}</span>
      <span className="text-fg-muted">{name}=</span>
      <span style={{ color: valueColor, fontWeight: active ? 600 : 400 }}>
        "{value}"
      </span>
      {"\n"}
    </>
  );
}

function CloseSelf() {
  return (
    <>
      <span className="text-fg-muted">{"/>"}</span>
      {"\n"}
    </>
  );
}

function CloseOpen() {
  return (
    <>
      <span className="text-fg-muted">{">"}</span>
      {"\n"}
    </>
  );
}

function ClosingTag({ name }: { name: string }) {
  return (
    <>
      <span className="text-fg-muted">&lt;/{name}&gt;</span>
      {"\n"}
    </>
  );
}

function Comment({ text }: { text: string }) {
  return (
    <>
      <span className="text-fg-muted opacity-70">{text}</span>
      {"\n"}
    </>
  );
}
