// @vitest-environment happy-dom

import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { _testing as mouseMovingTesting } from "../hooks/mouse-moving-guard.ts";
import { Mention } from "./index.ts";

interface User {
  id: number;
  name: string;
}

const USERS: readonly User[] = [
  { id: 1, name: "Daniel" },
  { id: 2, name: "Daria" },
  { id: 3, name: "Marcus" },
];

function Demo({ onSelect }: { onSelect?: (u: User) => void } = {}) {
  return (
    <Mention.Root<User>
      trigger="@"
      items={USERS}
      getKey={(u) => u.id}
      getLabel={(u) => u.name}
      onSelect={onSelect ?? (() => {})}
    >
      <Mention.Input aria-label="message" />
      <Mention.Popover>
        <Mention.List>
          {(user: User) => (
            <Mention.Item value={user}>{user.name}</Mention.Item>
          )}
        </Mention.List>
        <Mention.Empty>No people found</Mention.Empty>
      </Mention.Popover>
    </Mention.Root>
  );
}

describe("Mention — combobox-as-substring contract", () => {
  // User need: the textarea must permanently advertise role=combobox so
  //   AT can announce the editable region as a combobox at all times,
  //   not just when the popover is open.
  // Anti-outcome: dynamic role mutation (the bug Spike 002 caught in
  //   Base UI) confuses NVDA into losing the combobox semantics on
  //   focus-out / focus-in cycles.
  it("the textarea has role=combobox at rest with aria-expanded=false", () => {
    render(<Demo />);

    const textarea = screen.getByRole("combobox", { name: "message" });
    expect(textarea).toHaveAttribute("aria-expanded", "false");
    expect(textarea).toHaveAttribute("aria-haspopup", "listbox");
    expect(textarea).toHaveAttribute("aria-autocomplete", "list");
  });

  // User need: typing @ at the start of input opens the menu so the user
  //   can pick a candidate.
  it("typing @ at the start of an empty textarea opens the listbox", async () => {
    const user = userEvent.setup();
    render(<Demo />);

    const textarea = screen.getByRole("combobox", { name: "message" });
    await user.click(textarea);
    await user.keyboard("@");

    expect(textarea).toHaveAttribute("aria-expanded", "true");
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeVisible();
    expect(within(listbox).getAllByRole("option")).toHaveLength(USERS.length);
  });

  // User need: mid-word @ (e.g., email patterns) must not summon the menu.
  it("typing @ in the middle of a word does not open the listbox", async () => {
    const user = userEvent.setup();
    render(<Demo />);

    const textarea = screen.getByRole("combobox", { name: "message" });
    await user.click(textarea);
    await user.keyboard("foo@");

    expect(textarea).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  // User need: as the user types after @, the visible options narrow to
  //   match — the filter-as-you-type feedback loop.
  it("typing characters after @ filters the listbox items by label", async () => {
    const user = userEvent.setup();
    render(<Demo />);

    const textarea = screen.getByRole("combobox", { name: "message" });
    await user.click(textarea);
    await user.keyboard("@dar");

    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Daria");
  });

  // User need: Escape dismisses the popover without disturbing the typed
  //   text. APG combobox dismiss contract.
  it("Escape closes the listbox and leaves textarea text intact", async () => {
    const user = userEvent.setup();
    render(<Demo />);

    const textarea = screen.getByRole("combobox", { name: "message" });
    await user.click(textarea);
    await user.keyboard("@dan");
    expect(screen.getByRole("listbox")).toBeVisible();

    await user.keyboard("{Escape}");

    expect(textarea).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(textarea).toHaveValue("@dan");
  });

  // User need: backspacing past the trigger char closes the popover —
  //   without this, the menu lingers over unrelated text.
  it("backspacing through the trigger character closes the listbox", async () => {
    const user = userEvent.setup();
    render(<Demo />);

    const textarea = screen.getByRole("combobox", { name: "message" });
    await user.click(textarea);
    await user.keyboard("@d");
    expect(screen.getByRole("listbox")).toBeVisible();

    await user.keyboard("{Backspace}");
    expect(screen.getByRole("listbox")).toBeVisible(); // still open with empty query

    await user.keyboard("{Backspace}");
    expect(textarea).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(textarea).toHaveValue("");
  });

  // User need: a user fixing a typo clicks back into an existing `@ali`
  //   substring and types — the popover must re-open with the resolved
  //   query so they get autocomplete in the same flow as a fresh `@`.
  // Anti-outcome: silent no-op that leaves users stranded, the failure
  //   that motivated Spike 005. Diff-based INPUT actions only see two
  //   characters of context; the dispatcher's backwards scan is what
  //   makes this work.
  it("placing the cursor inside an existing mention and typing re-opens the listbox", async () => {
    const user = userEvent.setup();
    render(<Demo />);

    const textarea = screen.getByRole("combobox", {
      name: "message",
    }) as HTMLTextAreaElement;
    await user.click(textarea);
    await user.keyboard("Hey @ali word");

    // Trailing whitespace closes the popover — same posture as the
    //   "backspacing through trigger" test above.
    expect(textarea).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    // Move the caret between '@' and 'a' (index 5 in "Hey @ali word").
    textarea.setSelectionRange(5, 5);

    // Type a character — popover must re-open with the resolved query
    //   (the substring between '@' and the new caret).
    await user.keyboard("d");

    expect(textarea).toHaveAttribute("aria-expanded", "true");
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeVisible();
    // Value is now "Hey @dali word"; caret at 6; resolved query="d"
    //   filters to users whose name starts with d → Daniel + Daria.
    const options = within(listbox).getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Daniel", "Daria"]);
  });

  // User need: filter that matches nothing should render the Empty slot
  //   so the user knows the search ran and produced no results.
  it("renders <Mention.Empty> when no items match the query", async () => {
    const user = userEvent.setup();
    render(<Demo />);

    const textarea = screen.getByRole("combobox", { name: "message" });
    await user.click(textarea);
    await user.keyboard("@zzz");

    const listbox = screen.getByRole("listbox");
    expect(within(listbox).queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("No people found")).toBeVisible();
  });

  // User need: a consumer shipping their own design system passes
  //   `unstyled` and gets only the structural ARIA attrs — no
  //   data-mention-* hooks for the default CSS to bind to.
  // Anti-outcome: the default theme bleeding into a Tailwind-only app
  //   would force consumers to write `:not()` selectors or specificity
  //   wars to undo it.
  it("Mention.Root unstyled drops data-mention-* attrs but keeps ARIA roles", async () => {
    const user = userEvent.setup();
    render(
      <Mention.Root<User>
        trigger="@"
        items={USERS}
        getKey={(u) => u.id}
        getLabel={(u) => u.name}
        onSelect={() => {}}
        unstyled
      >
        <Mention.Input aria-label="message" />
        <Mention.Popover>
          <Mention.List>
            {(u: User) => <Mention.Item value={u}>{u.name}</Mention.Item>}
          </Mention.List>
          <Mention.Empty>none</Mention.Empty>
        </Mention.Popover>
      </Mention.Root>,
    );

    const textarea = screen.getByRole("combobox", { name: "message" });
    await user.click(textarea);
    await user.keyboard("@");

    const listbox = screen.getByRole("listbox");
    expect(listbox).not.toHaveAttribute("data-mention-popover");
    expect(within(listbox).getAllByRole("option")[0]).not.toHaveAttribute(
      "data-mention-item",
    );
  });

  // User need: the popover must escape any `overflow: hidden` ancestor
  //   (modals, scroll containers, transformed cards) so the listbox isn't
  //   clipped. Floating UI's FloatingPortal handles this by rendering into
  //   document.body by default.
  // Anti-outcome: a popover trapped inside the textarea's wrapper would
  //   appear cut off the moment a consumer adds `overflow: hidden` to a
  //   parent — a permanent class of layout bug we close at the library.
  it("portals the popover outside the rendered tree by default", async () => {
    const user = userEvent.setup();
    const { container } = render(<Demo />);

    const textarea = screen.getByRole("combobox", { name: "message" });
    await user.click(textarea);
    await user.keyboard("@");

    const listbox = screen.getByRole("listbox");
    expect(container.contains(listbox)).toBe(false);
    expect(document.body.contains(listbox)).toBe(true);
  });

  // User need: TalkBack swipe order can break with portaled popovers — the
  //   library exposes `container={null}` as the documented escape hatch
  //   that keeps the popover in-tree without losing Floating UI positioning.
  it("container={null} renders the popover in-place (no portal)", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Mention.Root<User>
        trigger="@"
        items={USERS}
        getKey={(u) => u.id}
        getLabel={(u) => u.name}
        onSelect={() => {}}
      >
        <Mention.Input aria-label="message" />
        <Mention.Popover container={null}>
          <Mention.List>
            {(u: User) => <Mention.Item value={u}>{u.name}</Mention.Item>}
          </Mention.List>
        </Mention.Popover>
      </Mention.Root>,
    );

    const textarea = screen.getByRole("combobox", { name: "message" });
    await user.click(textarea);
    await user.keyboard("@");

    const listbox = screen.getByRole("listbox");
    expect(container.contains(listbox)).toBe(true);
  });

  // User need: design systems that own a "modal-portal" or "stacking-root"
  //   slot need to direct the popover there so z-index and focus-traps
  //   line up with the rest of their floating UI.
  it("portals into a custom container element when supplied", async () => {
    const user = userEvent.setup();
    const customRoot = document.createElement("div");
    customRoot.id = "custom-portal-root";
    document.body.appendChild(customRoot);

    const { container } = render(
      <Mention.Root<User>
        trigger="@"
        items={USERS}
        getKey={(u) => u.id}
        getLabel={(u) => u.name}
        onSelect={() => {}}
      >
        <Mention.Input aria-label="message" />
        <Mention.Popover container={customRoot}>
          <Mention.List>
            {(u: User) => <Mention.Item value={u}>{u.name}</Mention.Item>}
          </Mention.List>
        </Mention.Popover>
      </Mention.Root>,
    );

    const textarea = screen.getByRole("combobox", { name: "message" });
    await user.click(textarea);
    await user.keyboard("@");

    const listbox = screen.getByRole("listbox");
    expect(customRoot.contains(listbox)).toBe(true);
    expect(container.contains(listbox)).toBe(false);

    customRoot.remove();
  });

  // User need: AT users with multiple comboboxes on the page (e.g. an
  //   `@user` field next to a `#channel` field) need to know which list
  //   they're in. Forwarding aria-label to the listbox lets consumers
  //   distinguish them ("People to mention", "Channels", etc.).
  // Anti-outcome: a generic "listbox" announcement leaves AT users
  //   guessing — and APG combobox requires the listbox be labelled when
  //   not already labelled by the input.
  it("forwards aria-label from <Mention.Popover> onto the listbox", async () => {
    const user = userEvent.setup();
    render(
      <Mention.Root<User>
        trigger="@"
        items={USERS}
        getKey={(u) => u.id}
        getLabel={(u) => u.name}
        onSelect={() => {}}
      >
        <Mention.Input aria-label="message" />
        <Mention.Popover aria-label="People to mention">
          <Mention.List>
            {(u: User) => <Mention.Item value={u}>{u.name}</Mention.Item>}
          </Mention.List>
        </Mention.Popover>
      </Mention.Root>,
    );

    const textarea = screen.getByRole("combobox", { name: "message" });
    await user.click(textarea);
    await user.keyboard("@");

    expect(
      screen.getByRole("listbox", { name: "People to mention" }),
    ).toBeVisible();
  });

  // ─── IME composition (M6) ──────────────────────────────────────────
  //
  // CJK / IME users compose multi-byte characters via romaji → kana →
  // kanji conversion. During the composition window the textarea fires
  // `input` events whose `value` reflects provisional, half-converted
  // text — narrowing the popover on those would show garbage matches
  // and reset highlightedIndex repeatedly. The contract: suppress
  // dispatch between `compositionstart` and `compositionend`, then run
  // a single state-derived dispatch on commit so the popover catches
  // up to the final value (Spike 005 dispatch model is reused).
  describe("IME composition", () => {
    // User need: typing Japanese (or any IME-mediated text) into a query
    //   should not cause the popover items to flicker/narrow on every
    //   provisional character. Only the committed final text should
    //   filter the list.
    it("suppresses dispatch during composition; reflects committed value on compositionend", async () => {
      const user = userEvent.setup();
      render(<Demo />);

      const textarea = screen.getByRole("combobox", {
        name: "message",
      }) as HTMLTextAreaElement;
      await user.click(textarea);
      await user.keyboard("@");
      const listbox = screen.getByRole("listbox");
      expect(within(listbox).getAllByRole("option")).toHaveLength(3);

      // Begin IME composition. Provisional values fire while composing —
      //   in real life these would be half-converted romaji / kana, but
      //   any value mismatch suffices to test the suppression.
      fireEvent.compositionStart(textarea);
      fireEvent.change(textarea, { target: { value: "@dan" } });

      // Still 3 — dispatch was suppressed.
      expect(within(listbox).getAllByRole("option")).toHaveLength(3);

      // Commit. Now the popover catches up to the committed value.
      fireEvent.compositionEnd(textarea, {
        target: { value: "@dan" },
        data: "dan",
      });

      const optionsAfter = within(listbox).getAllByRole("option");
      expect(optionsAfter.map((o) => o.textContent)).toEqual(["Daniel"]);
    });

    // User need: an IME commit that ends with whitespace (or otherwise
    //   leaves no active mention) must close the popover, mirroring the
    //   non-IME contract.
    it("compositionend that leaves no active mention dismisses the popover", async () => {
      const user = userEvent.setup();
      render(<Demo />);

      const textarea = screen.getByRole("combobox", {
        name: "message",
      }) as HTMLTextAreaElement;
      await user.click(textarea);
      await user.keyboard("@");
      expect(textarea).toHaveAttribute("aria-expanded", "true");

      fireEvent.compositionStart(textarea);
      fireEvent.change(textarea, { target: { value: "@a" } });
      // Commit with a value that has whitespace right after the trigger
      //   — no active mention by the isolation rule.
      fireEvent.compositionEnd(textarea, {
        target: { value: "@ done" },
        data: " done",
      });

      expect(textarea).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    // User need: after an IME cycle ends, normal keystrokes must
    //   resume working — the suppression flag has to clear cleanly.
    // Anti-outcome: a stuck `isComposing` ref that silently swallows
    //   subsequent keystrokes — the kind of bug that only shows up in
    //   non-Latin keyboard testing weeks after release.
    it("change events after compositionend dispatch normally", async () => {
      const user = userEvent.setup();
      render(<Demo />);

      const textarea = screen.getByRole("combobox", {
        name: "message",
      }) as HTMLTextAreaElement;
      await user.click(textarea);

      fireEvent.compositionStart(textarea);
      fireEvent.change(textarea, { target: { value: "@d" } });
      fireEvent.compositionEnd(textarea, {
        target: { value: "@d" },
        data: "@d",
      });

      // A second change event outside a composition must not be
      //   suppressed — the popover should narrow to "@dar".
      fireEvent.change(textarea, { target: { value: "@dar" } });

      const listbox = screen.getByRole("listbox");
      const options = within(listbox).getAllByRole("option");
      expect(options.map((o) => o.textContent)).toEqual(["Daria"]);
    });
  });

  // ─── Pointer-driven highlight (Spike 004) ──────────────────────────
  //
  // The mouseMoving guard is module-scoped state shared across the
  // suite. Reset between tests so order doesn't leak — a test that
  // flipped the flag must not silently satisfy the next test's
  // "stationary cursor" precondition.
  describe("pointer hover moves the active item", () => {
    afterEach(() => {
      mouseMovingTesting.reset();
    });

    // User need: a mouse user opens the popover, glances at the list,
    //   moves the cursor to a row, presses Enter → that row commits.
    //   The visual highlight must follow the cursor so the user can
    //   tell which row Enter will pick.
    // Anti-outcome: keyboard-active and pointer-hover painting
    //   different rows simultaneously — the v0.0 trap that motivated
    //   this whole change.
    it("hovering an option moves aria-selected to it; Enter commits the hovered row", async () => {
      const user = userEvent.setup();
      const onSelect = (u: User) => {
        commits.push(u);
      };
      const commits: User[] = [];
      render(<Demo onSelect={onSelect} />);

      const textarea = screen.getByRole("combobox", { name: "message" });
      await user.click(textarea);
      await user.keyboard("@");

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");

      // Simulate the user *actually* moving the mouse before hovering —
      // happy-dom's user.hover() emits pointermove with zero deltas,
      // which our guard correctly ignores. Setting the flag directly
      // models a prior real movement.
      mouseMovingTesting.setMoving(true);
      await user.hover(options[2] as HTMLElement);

      expect(options[2]).toHaveAttribute("aria-selected", "true");
      expect(options[0]).toHaveAttribute("aria-selected", "false");

      await user.keyboard("{Enter}");
      expect(commits).toEqual([USERS[2]]);
    });

    // User need: when the popover spawns under a stationary cursor,
    //   the keyboard-set highlight (item 0) must hold until the user
    //   actually moves the mouse. Otherwise Enter would commit a
    //   surprise row the user didn't pick.
    // Anti-outcome: the lib synthesizing a "hover" race that races past
    //   the keyboard-set active before the user has done anything —
    //   the bug Ariakit's `isMouseMoving` guard was designed to prevent.
    it("opening the popover under a stationary cursor keeps aria-selected on item 0", async () => {
      const user = userEvent.setup();
      render(<Demo />);

      const textarea = screen.getByRole("combobox", { name: "message" });
      await user.click(textarea);
      await user.keyboard("@");

      const options = screen.getAllByRole("option");

      // No prior real mouse movement — guard is false. Even if the
      // cursor "happens" to be over option 2 (we simulate by hovering
      // without flipping the guard), aria-selected must stay on 0.
      await user.hover(options[2] as HTMLElement);

      expect(options[0]).toHaveAttribute("aria-selected", "true");
      expect(options[2]).toHaveAttribute("aria-selected", "false");
    });

    // User need: pointer doesn't replace keyboard. After hovering to
    //   move the highlight, ArrowDown should advance from the hovered
    //   index, not jump back to whatever the keyboard had cached.
    // Anti-outcome: a split state where hover and keyboard each track
    //   their own highlightedIndex would make ArrowDown unpredictable.
    it("after a pointer hover, ArrowDown advances from the new highlight", async () => {
      const user = userEvent.setup();
      render(<Demo />);

      const textarea = screen.getByRole("combobox", { name: "message" });
      await user.click(textarea);
      await user.keyboard("@");

      const options = screen.getAllByRole("option");
      mouseMovingTesting.setMoving(true);
      await user.hover(options[1] as HTMLElement);
      expect(options[1]).toHaveAttribute("aria-selected", "true");

      await user.keyboard("{ArrowDown}");
      expect(options[2]).toHaveAttribute("aria-selected", "true");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────
// Multi-trigger Root overload (C5 / v0.2 unlock)
// ─────────────────────────────────────────────────────────────────────

interface Channel {
  id: string;
  name: string;
}

const CHANNELS: readonly Channel[] = [
  { id: "general", name: "general" },
  { id: "random", name: "random" },
];

type MultiPayload = { "@": User } | { "#": Channel };

// Hoisted to module scope so the prop reference is stable across
// renders — the dispatcher's effects depend on channel identity, and
// rebuilding the literal each render forces unnecessary re-fires
// during userEvent keystroke flushes. Real consumers should `useMemo`
// the triggers object or hoist it similarly.
const MULTI_TRIGGERS = {
  "@": {
    items: USERS,
    getKey: (u: User) => u.id,
    getLabel: (u: User) => u.name,
  },
  "#": {
    items: CHANNELS,
    getKey: (c: Channel) => c.id,
    getLabel: (c: Channel) => c.name,
    getInsertText: (c: Channel) => `#${c.name}`,
  },
} as const;

function MultiDemo({
  onSelect,
}: {
  onSelect?: (payload: MultiPayload) => void;
} = {}) {
  return (
    <Mention.Root<{ "@": User; "#": Channel }>
      triggers={MULTI_TRIGGERS}
      onSelect={(payload) => {
        onSelect?.(payload);
      }}
    >
      <Mention.Input aria-label="message" />
      <Mention.Popover>
        {/* One typed Mention.List per channel — no runtime cast. */}
        <Mention.List<User> trigger="@">
          {(user) => <Mention.Item value={user}>{user.name}</Mention.Item>}
        </Mention.List>
        <Mention.List<Channel> trigger="#">
          {(channel) => (
            <Mention.Item value={channel}>{channel.name}</Mention.Item>
          )}
        </Mention.List>
        <Mention.Empty>Nothing found</Mention.Empty>
      </Mention.Popover>
    </Mention.Root>
  );
}

describe("Mention — multi-trigger Root overload", () => {
  afterEach(() => {
    mouseMovingTesting.reset();
  });

  // User need: one editor with both `@` for users and `#` for channels.
  //   The locked `MentionRootMultiProps` shape exposes a `triggers`
  //   record; whichever trigger fires drives the active channel's
  //   items + label + insertText.
  it("typing @ shows users; typing # shows channels in the same editor", async () => {
    const user = userEvent.setup();
    render(<MultiDemo />);

    const textarea = screen.getByRole("combobox", { name: "message" });
    await user.click(textarea);

    // Trigger the `@` channel.
    await user.keyboard("@");
    let options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([
      "Daniel",
      "Daria",
      "Marcus",
    ]);

    // Dismiss with Escape, then trigger the `#` channel.
    await user.keyboard("{Escape}");
    await user.keyboard(" #");
    options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["general", "random"]);
  });

  // User need: the discriminated-union onSelect payload should narrow
  //   correctly — `'@' in payload` for users, `'#' in payload` for
  //   channels. Internally this is just `{ [activeTrigger]: item }`.
  it("onSelect receives a payload keyed by the trigger char", async () => {
    const user = userEvent.setup();
    let captured: MultiPayload | null = null;
    render(
      <MultiDemo
        onSelect={(payload) => {
          captured = payload;
        }}
      />,
    );

    const textarea = screen.getByRole("combobox", { name: "message" });
    await user.click(textarea);
    await user.keyboard("#gen");
    await user.keyboard("{Enter}");

    expect(captured).not.toBeNull();
    expect(captured).toEqual({ "#": { id: "general", name: "general" } });
  });

  // User need: the `@` channel has no per-channel getInsertText, so
  //   commit falls back to the default `${trigger}${getLabel(item)}`
  //   form (plus a trailing space).
  it("falls back to default insert text when channel has no getInsertText", async () => {
    const user = userEvent.setup();
    render(<MultiDemo />);

    const textarea = screen.getByRole("combobox", {
      name: "message",
    }) as HTMLTextAreaElement;
    await user.click(textarea);

    await user.keyboard("@dan");
    await user.keyboard("{Enter}");
    expect(textarea.value).toBe("@Daniel ");
  });

  // User need: the `#` channel carries its own `getInsertText` that
  //   formats as `#name`. Verify the per-channel formatter is the one
  //   that fires on commit (not the bare default).
  it("uses the active channel's getInsertText when defined", async () => {
    const user = userEvent.setup();
    render(<MultiDemo />);

    const textarea = screen.getByRole("combobox", {
      name: "message",
    }) as HTMLTextAreaElement;
    await user.click(textarea);

    await user.keyboard("#gen");
    await user.keyboard("{Enter}");
    expect(textarea.value).toBe("#general ");
  });

  // User need: <Mention.List trigger="X"> filters rendering so each
  //   channel gets its own typed list. When @ is active, only the @-list
  //   renders its options; the #-list emits nothing. The library
  //   guarantees this — consumers can declare the render-prop's TItem
  //   freely without runtime narrowing.
  it("Mention.List trigger filter only renders for the active channel", async () => {
    const user = userEvent.setup();
    render(<MultiDemo />);

    const textarea = screen.getByRole("combobox", { name: "message" });
    await user.click(textarea);

    // Trigger `@` — only the user-typed list should render.
    await user.keyboard("@");
    let options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([
      "Daniel",
      "Daria",
      "Marcus",
    ]);

    // Switch to `#` — only the channel-typed list should render now.
    await user.keyboard("{Escape}");
    await user.keyboard(" #");
    options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["general", "random"]);
  });

  // User need: switching channels mid-typing must transition cleanly.
  //   Type `@d`, then dismiss (Escape), then type ` #r` — the listbox
  //   reflects the new channel's items, not stale @-channel state.
  it("switches channel state cleanly when the active trigger changes", async () => {
    const user = userEvent.setup();
    render(<MultiDemo />);

    const textarea = screen.getByRole("combobox", { name: "message" });
    await user.click(textarea);

    await user.keyboard("@d");
    let options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Daniel", "Daria"]);

    await user.keyboard("{Escape}");
    expect(textarea).toHaveAttribute("aria-expanded", "false");

    // Note: "general" and "random" both contain 'r', so we use 'ran'
    // for a unique-to-`random` filter via the default substring match.
    await user.keyboard(" #ran");
    options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["random"]);
  });
});
