import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import { createTextareaAdapter } from "../adapters/textarea.ts";
import { useEditorAdapter } from "../adapters/use-editor-adapter.ts";
import type { MentionInputProps } from "../types.ts";
import { useMentionInternal } from "./context.ts";

/**
 * `<Mention.Input>` — the textarea projection. Spreads `getInputProps()`
 * from context, which carries the full ARIA combobox-as-substring contract.
 *
 * Registers the **textarea adapter** with the core so `useMentionCore`
 * reads value / caret / commits through the editor-agnostic seam.
 *
 * Consumer-supplied refs are forwarded to the underlying textarea so apps
 * can focus / measure it directly.
 */
export const Input = forwardRef<HTMLTextAreaElement, MentionInputProps>(
  function Input(props, forwardedRef) {
    const ctx = useMentionInternal();
    const inputProps = ctx.getInputProps() as Record<string, unknown> & {
      ref: React.MutableRefObject<HTMLTextAreaElement | null>;
    };

    const localRef = useRef<HTMLTextAreaElement | null>(null);
    const [host, setHost] = useState<HTMLTextAreaElement | null>(null);

    useEditorAdapter(host, ctx.adapterRef, createTextareaAdapter);

    useImperativeHandle<HTMLTextAreaElement | null, HTMLTextAreaElement | null>(
      forwardedRef,
      () => localRef.current,
      [],
    );

    const composedRef = (node: HTMLTextAreaElement | null) => {
      localRef.current = node;
      inputProps.ref.current = node;
      setHost(node);
    };

    const { ref: _omit, ...rest } = inputProps;
    return <textarea {...props} {...rest} ref={composedRef} />;
  },
);
