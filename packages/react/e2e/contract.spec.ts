import { expect, test } from "@playwright/test";

// These tests encode the keyboard + ARIA contract the library is built
// against. Sources:
//   - .misc/spike/research/a11y-contract.md  §1, §2
//   - .misc/spike/proto/e2e/contract.spec.ts (the spike's port-from-Ariakit)
//
// The harness uses `getInsertText: u => "@" + u.username` so commits land
// as `@alice ` (trigger + username + trailing space) — letting us assert
// on textarea value with a tight regex.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: /comment/i }).focus();
});

test("typing @ at the start opens the listbox; DOM focus stays on the textarea", async ({
  page,
}) => {
  // Use case: a screen-reader user types '@' to summon mention
  // suggestions and expects the AT to announce that a list is now
  // available, while still letting them keep typing into the editor.
  // The contract that makes this possible is `aria-activedescendant`:
  // the listbox lives in the a11y tree, but DOM focus never leaves the
  // textarea — keystrokes continue to flow into the editor and IME
  // composition keeps working on mobile and CJK keyboards.
  //
  // Anti-outcome this test prevents: a future "fix" that moves DOM
  // focus into the listbox to drive arrow-key nav. That breaks every
  // soft-keyboard, every IME, and silently fails the spec.
  const textarea = page.getByRole("combobox", { name: /comment/i });
  await expect(textarea).toBeFocused();

  await page.keyboard.type("@");

  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();

  // DOM focus is *still* on the textarea — never on the listbox.
  await expect(textarea).toBeFocused();

  await expect(textarea).toHaveAttribute("aria-expanded", "true");

  const listboxId = await listbox.getAttribute("id");
  if (!listboxId) throw new Error("listbox is missing an id attribute");
  await expect(textarea).toHaveAttribute("aria-controls", listboxId);

  // aria-activedescendant references one of the options. The reducer
  // auto-highlights index 0 on open via ITEMS_CHANGED.
  await expect
    .poll(async () => textarea.getAttribute("aria-activedescendant"))
    .toMatch(/.+/);
  const activeId = await textarea.getAttribute("aria-activedescendant");
  expect(await page.locator(`#${activeId}`).getAttribute("role")).toBe(
    "option",
  );
});

test("ArrowDown/Up moves the visual highlight without shifting DOM focus", async ({
  page,
}) => {
  const textarea = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("@");

  await expect
    .poll(async () => textarea.getAttribute("aria-activedescendant"))
    .toMatch(/.+/);
  const initialActive = await textarea.getAttribute("aria-activedescendant");

  await page.keyboard.press("ArrowDown");
  await expect
    .poll(async () => textarea.getAttribute("aria-activedescendant"))
    .not.toBe(initialActive);
  await expect(textarea).toBeFocused();

  await page.keyboard.press("ArrowUp");
  await expect
    .poll(async () => textarea.getAttribute("aria-activedescendant"))
    .toBe(initialActive);
  await expect(textarea).toBeFocused();
});

test("Enter commits the highlighted option and closes the menu", async ({
  page,
}) => {
  const textarea = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("@");

  await expect
    .poll(async () => textarea.getAttribute("aria-activedescendant"))
    .toMatch(/.+/);
  await page.keyboard.press("Enter");

  // Default insertion shape: trigger + label + trailing space.
  // The harness uses `getLabel = u => u.username` and
  // `getInsertText = u => "@" + u.username`, so commits land as `@xxx `.
  await expect(textarea).toHaveValue(/^@\w+\s$/);
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(textarea).toHaveAttribute("aria-expanded", "false");
});

test("Escape closes the menu but preserves the typed @text", async ({
  page,
}) => {
  // Use case: a user typed '@al' intending to mention someone, then
  // changed their mind. Pressing Escape dismisses the popover but
  // leaves their typed text in place — they may want to keep '@al' as
  // literal text, or correct it to a different mention.
  //
  // Anti-outcome: a regression to APG's standalone-combobox Escape
  // semantics, which clear the textbox. Doing that in a mention-in-
  // editor context would wipe the user's entire comment whenever they
  // dismiss a stray suggestion.
  const textarea = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("@al");
  await expect(page.getByRole("listbox")).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(textarea).toHaveValue("@al");
});

test("mid-word @ does not trigger (foo@bar email pattern)", async ({
  page,
}) => {
  // Use case: a user pastes or types an email like "support@example.com".
  // The '@' here is part of an email, not a mention summon. Auto-popping
  // a mention list is hostile UX — the most common complaint logged
  // against react-mentions in its issue tracker.
  //
  // Anti-outcome: relaxing the "isolation" rule in the reducer to also
  // fire mid-word — superficially simpler but wrecks UX for any text
  // containing an email address.
  const textarea = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("hello foo@bar");

  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(textarea).toHaveAttribute("aria-expanded", "false");
});

test("isolated @ after whitespace does trigger", async ({ page }) => {
  const textarea = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("hello @al");

  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(textarea).toHaveAttribute("aria-expanded", "true");
});

// Use case: a user fixing a typo clicks back into an existing `@ali`
// substring and types — the popover must re-open with the resolved
// query so they get autocomplete in the same flow as a fresh `@`.
// Anti-outcome: silent no-op that leaves users stranded — the failure
// reported on 2026-04-30 that motivated Spike 005. Single-character
// INPUT actions can only see two characters of context; the
// dispatcher's backwards scan from the caret is what makes this work.
test("cursor placed inside an existing mention re-opens the menu on the next keystroke", async ({
  page,
}) => {
  const textarea = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("Hey @ali word");
  // Trailing whitespace closes the popover.
  await expect(textarea).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("listbox")).toBeHidden();

  // Move the caret between '@' and 'a' (index 5 of "Hey @ali word"). We
  // set selectionStart/End directly because the harness textarea is the
  // focused element and selection APIs are the most deterministic way to
  // place the caret precisely without triggering navigation events.
  await textarea.evaluate((el) =>
    (el as HTMLTextAreaElement).setSelectionRange(5, 5),
  );

  await page.keyboard.type("d");

  await expect(textarea).toHaveAttribute("aria-expanded", "true");
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  // Resolved query="d" → narrows to usernames starting with d.
  const options = page.getByRole("option");
  expect(await options.count()).toBeGreaterThan(0);
  await expect(textarea).toBeFocused();
});

test("typing letters filters the listbox without changing DOM focus", async ({
  page,
}) => {
  const textarea = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("@a");

  await expect(textarea).toBeFocused();
  const options = page.getByRole("option");
  expect(await options.count()).toBeGreaterThan(0);

  await page.keyboard.type("li");
  await expect(textarea).toBeFocused();
  await expect(page.getByRole("listbox")).toBeVisible();

  // "@ali" narrows to just `alice` — substring match on username.
  await expect(page.getByRole("option")).toHaveCount(1);
});

// User need (M6): IME-mediated typing (Japanese, Chinese, Korean) fires
// `input` events with provisional text *during* composition, then a
// `compositionend` with the committed text. Suppress dispatch through
// the composition window and run a single state-derived dispatch on
// commit so the popover narrows once with real text — not flickering on
// every half-converted romaji.
test("dispatch is suppressed during IME composition; runs on compositionend", async ({
  page,
}) => {
  const textarea = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("@");
  await expect(page.getByRole("listbox")).toBeVisible();
  // Sanity baseline — without typing, all options visible.
  const initialOptionCount = await page.getByRole("option").count();
  expect(initialOptionCount).toBeGreaterThan(1);

  // Drive composition events directly on the focused textarea. Browsers
  //   forward composition* through Playwright's CDP channel without a
  //   real IME backend, so we dispatch synthetic events that match
  //   what a real IME would produce.
  await textarea.evaluate((el) => {
    const t = el as HTMLTextAreaElement;
    // CompositionEvent's `bubbles` default is `false`; React 19's
    //   document-delegated listeners only see bubbling events. The real
    //   browser IME fires bubbling events too — this matches that.
    t.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    // Provisional value during composition — would normally narrow to
    //   alice. Must NOT narrow until composition ends.
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    setter?.call(t, "@ali");
    t.dispatchEvent(new Event("input", { bubbles: true }));
  });
  // Should still match the baseline — provisional input was suppressed.
  await expect(page.getByRole("option")).toHaveCount(initialOptionCount);

  await textarea.evaluate((el) => {
    const t = el as HTMLTextAreaElement;
    t.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: "ali" }),
    );
  });

  // After commit, the dispatch path runs and narrows to "@ali" → alice.
  await expect(page.getByRole("option")).toHaveCount(1);
  await expect(textarea).toBeFocused();
});

test("Backspace through @ closes the menu", async ({ page }) => {
  const textarea = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("@a");
  await expect(page.getByRole("listbox")).toBeVisible();

  await page.keyboard.press("Backspace"); // deletes 'a'
  await page.keyboard.press("Backspace"); // deletes '@'

  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(textarea).toHaveValue("");
});

test("the textarea announces itself as a combobox to assistive technology", async ({
  page,
}) => {
  // Use case: a screen-reader user navigates to the comment field. The
  // AT needs to know — before any '@' is typed — that this input has
  // suggestion behavior, so it can hint "type at-sign for mentions" or
  // similar. Contract: role=combobox + aria-autocomplete=list +
  // aria-haspopup=listbox on the textarea itself.
  //
  // Anti-outcome: a refactor that only sets these attributes when the
  // popover is open. That makes the field's suggestion capability
  // invisible to AT until the user has already discovered it by typing
  // — which they may never do. (This is the bug spike 002 caught in
  // Base UI Combobox's dynamic-role mutation; the rejection rationale
  // is captured in `docs/adr/0001-…md`.)
  const textarea = page.getByRole("combobox", { name: /comment/i });

  const haspopup = await textarea.getAttribute("aria-haspopup");
  expect(["listbox", null]).toContain(haspopup);

  const autocomplete = await textarea.getAttribute("aria-autocomplete");
  expect(["list", "both"]).toContain(autocomplete);

  // Idle state: aria-expanded is "false", not absent. Important for
  // some AT engines that read absence as "indeterminate".
  await expect(textarea).toHaveAttribute("aria-expanded", "false");
});

test("ARIA snapshot — captures the runtime contract", async ({ page }) => {
  // A diagnostic that doubles as a regression guard: if any of the four
  // attributes named below ever drift, the test fails loudly with a
  // diff instead of silently breaking AT behavior.
  await page.keyboard.type("@");

  const textarea = page.getByRole("combobox", { name: /comment/i });
  // Wait for activedescendant to populate (one render boundary after
  // ITEMS_CHANGED auto-highlights).
  await expect
    .poll(async () => textarea.getAttribute("aria-activedescendant"))
    .toMatch(/.+/);

  const snapshot = await page.evaluate(() => {
    const ta = document.querySelector(
      'textarea[role="combobox"]',
    ) as HTMLTextAreaElement | null;
    const listbox = document.querySelector('[role="listbox"]');
    const firstOption = document.querySelector('[role="option"]');
    const attrs = (el: Element | null) =>
      el
        ? Object.fromEntries(
            Array.from(el.attributes).map((a) => [a.name, a.value]),
          )
        : null;
    return {
      textarea: attrs(ta),
      listbox: attrs(listbox),
      firstOption: attrs(firstOption),
    };
  });

  expect(snapshot.textarea?.role).toBe("combobox");
  expect(snapshot.textarea?.["aria-expanded"]).toBe("true");
  expect(snapshot.textarea?.["aria-haspopup"]).toBe("listbox");
  expect(snapshot.textarea?.["aria-autocomplete"]).toBe("list");
  expect(snapshot.listbox?.role).toBe("listbox");
  expect(snapshot.firstOption?.role).toBe("option");
  expect(snapshot.firstOption?.["aria-selected"]).toBe("true");
});

test("pointer hover moves aria-activedescendant without shifting DOM focus", async ({
  page,
}) => {
  // User need: a mouse user opens the popover and runs the cursor down
  //   the list; the visual highlight must follow so they can pick a row
  //   with one click. Spike 004 §Recommendation, post-fix to the v0.0
  //   double-highlight trap.
  // Anti-outcome: mouse hover and keyboard arrow each tracking their
  //   own active item — Enter would commit something different from
  //   what the user is hovering.
  //
  // Real `page.mouse.move()` produces non-zero `movementX/Y` events,
  // satisfying the `isMouseMoving` guard naturally. No extra setup.
  const textarea = page.getByRole("combobox", { name: /comment/i });
  await page.keyboard.type("@");

  await expect
    .poll(async () => textarea.getAttribute("aria-activedescendant"))
    .toMatch(/.+/);
  const initialActive = await textarea.getAttribute("aria-activedescendant");

  // Hover the third option. Playwright's hover() emits real pointer
  // events with screen deltas — the guard flips on naturally.
  const options = page.getByRole("option");
  await options.nth(2).hover();

  await expect
    .poll(async () => textarea.getAttribute("aria-activedescendant"))
    .not.toBe(initialActive);

  // Focus stays on the textarea — pointer hover never steals it.
  await expect(textarea).toBeFocused();

  // The third option carries aria-selected; the first does not.
  await expect(options.nth(2)).toHaveAttribute("aria-selected", "true");
  await expect(options.nth(0)).toHaveAttribute("aria-selected", "false");

  // Enter commits the hovered row (not the original first option).
  await page.keyboard.press("Enter");
  await expect(textarea).toHaveValue(/^@\w+\s$/);
});

// ─────────────────────────────────────────────────────────────────────
// Multi-trigger Root overload (C5 / v0.2 unlock)
// ─────────────────────────────────────────────────────────────────────

test("multi-trigger: typing @ vs # routes to different channels in one editor", async ({
  page,
}) => {
  // User need: a single composer can host both `@` for users and `#`
  //   for channels (Slack-style). Whichever trigger fires defines the
  //   active channel; the listbox content + commit format follow.
  // Anti-outcome: per-channel state leaking between triggers — if a
  //   user typed @al, dismissed, then typed #ge and Enter, the wrong
  //   item could land. The dispatcher resets channel state on each
  //   OPEN_AT.
  const multi = page.getByRole("combobox", { name: /multi/i });
  await multi.focus();

  // `@` channel — the harness wires user records, rendered as `@username`.
  await page.keyboard.type("@al");
  await expect(page.getByRole("listbox")).toBeVisible();
  const usersList = page.getByRole("listbox");
  await expect(usersList.getByRole("option").first()).toContainText("@");
  await expect(usersList.getByRole("option").first()).not.toContainText("#");

  // Dismiss with Escape, type a `#` — the popover should now show channels.
  await page.keyboard.press("Escape");
  await page.keyboard.type(" #");
  await expect(page.getByRole("listbox")).toBeVisible();
  // Channel options are rendered as `#${name}` — assert all three.
  const channelsList = page.getByRole("listbox");
  await expect(
    channelsList.getByRole("option", {
      name: /^#(general|random|design)$/,
    }),
  ).toHaveCount(3);
});

test("multi-trigger: per-channel getInsertText fires on commit", async ({
  page,
}) => {
  // User need: each channel can format its insertion differently —
  //   `@user` for users, `#chan` for channels. Verify the active
  //   channel's `getInsertText` is the one that lands in the textarea.
  const multi = page.getByRole("combobox", { name: /multi/i });
  await multi.focus();

  await page.keyboard.type("#gen");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Enter");

  // The `#` channel's getInsertText returns `#${name}`; commit appends
  // a trailing space → "#general ".
  await expect(multi).toHaveValue("#general ");
});
