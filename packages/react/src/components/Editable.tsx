import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import { createContentEditableAdapter } from "../adapters/contenteditable.ts";
import { useEditorAdapter } from "../adapters/use-editor-adapter.ts";
import type { MentionEditableProps } from "../types.ts";
import { useMentionInternal } from "./context.ts";

/**
 * `<Mention.Editable>` — twin of `<Mention.Input>` for plain-text
 * `<div contenteditable>` hosts. Spreads the same `getInputProps()`
 * (the bag returns both `onChange` and `onInput`; this component
 * consumes `onInput`).
 *
 * Supports both substring insertions (the default) and atomic chips —
 * the contenteditable adapter implements `applyChipInsert`, and
 * `<Mention.Chips>` (rendered alongside this component) portals each
 * chip's React content into its placeholder.
 *
 * **Why a separate component, not a `host` prop on Input.** Twin
 * components keep each prop type aligned to the rendered element
 * exactly — no conditional union typings on `<textarea>` vs `<div>`
 * attributes — and let host-specific defaults (here `contentEditable`,
 * `suppressContentEditableWarning`) live with the component that needs
 * them.
 */
export const Editable = forwardRef<HTMLDivElement, MentionEditableProps>(
  function Editable(props, forwardedRef) {
    const ctx = useMentionInternal();
    const inputProps = ctx.getInputProps() as Record<string, unknown> & {
      ref: React.MutableRefObject<HTMLElement | null>;
      onInput: React.FormEventHandler<HTMLElement>;
    };

    const localRef = useRef<HTMLDivElement | null>(null);
    const [host, setHost] = useState<HTMLDivElement | null>(null);

    useEditorAdapter(host, ctx.adapterRef, createContentEditableAdapter);

    useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
      forwardedRef,
      () => localRef.current,
      [],
    );

    const composedRef = (node: HTMLDivElement | null) => {
      localRef.current = node;
      inputProps.ref.current = node;
      setHost(node);
    };

    const {
      ref: _omit,
      onChange: _omitOnChange,
      onInput,
      ...rest
    } = inputProps;

    return (
      <div
        {...props}
        {...rest}
        contentEditable
        suppressContentEditableWarning
        ref={composedRef}
        onInput={onInput}
      />
    );
  },
);
