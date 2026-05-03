import { Fragment, type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

import type { MentionChip, MentionChipsProps } from "../types.ts";
import { useMentionInternal } from "./context.ts";

/**
 * `<Mention.Chips>` — portal orchestrator for `shape: "node"` channels.
 *
 * For each registered chip, mounts the channel's `getInsertNode(item)`
 * React content into the chip's placeholder DOM element via
 * `createPortal`. The placeholder lives inside the contenteditable
 * host (inserted at commit time by `applyChipInsert`); the portal lets
 * consumer-supplied React content (avatars, hover popovers,
 * click-to-edit) stay interactive even though the placeholder is
 * `contenteditable="false"`.
 *
 * **Opt-in.** Substring-only consumers don't render `<Mention.Chips>`
 * and pay no cost. Renders nothing visible itself — just portals.
 *
 * **Render-prop.** The optional `children` lets consumers wrap each
 * chip's content (e.g., add a hover card without touching the
 * channel's `getInsertNode`).
 */
export function Chips(props: MentionChipsProps): ReactNode {
  const ctx = useMentionInternal();
  const selected = ctx.chipSelected;

  // Sync `data-mention-selected` onto the matching placeholder.
  // The placeholder lives outside React's tree (inserted via DOM
  // mutation by applyChipInsert), so we mutate it from this effect.
  // biome-ignore lint/correctness/useExhaustiveDependencies: chips array identity drives re-sync
  useEffect(() => {
    for (const chip of ctx.chips) {
      if (chip.id === selected) {
        chip.placeholder.setAttribute("data-mention-selected", "");
      } else {
        chip.placeholder.removeAttribute("data-mention-selected");
      }
    }
  }, [selected, ctx.chips]);

  // Aria-live announcement when a chip enters selection. Single live
  // region per Mention.Chips instance — screen readers announce the
  // chip's aria-label + the "press Backspace again to delete" hint.
  const selectedChip = ctx.chips.find((c) => c.id === selected) ?? null;
  const announcement =
    selectedChip !== null
      ? `${selectedChip.placeholder.getAttribute("aria-label") ?? selectedChip.insertText}, selected, press Backspace again to delete`
      : "";

  return (
    <>
      <span aria-live="polite" aria-atomic="true" data-mention-live="">
        {announcement}
      </span>
      {ctx.chips.map((chip: MentionChip) => (
        <Fragment key={chip.id}>
          {createPortal(
            props.children !== undefined ? props.children(chip) : chip.node,
            chip.placeholder,
          )}
        </Fragment>
      ))}
    </>
  );
}
