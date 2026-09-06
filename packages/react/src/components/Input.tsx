import {
  type RefCallback,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import type { MentionInputProps } from "../types.ts";
import { useMentionInternal } from "./context.ts";

export function Input({ ref, ...props }: MentionInputProps) {
  const input = useMentionInternal().getInputProps(props);
  const local = useRef<HTMLTextAreaElement | null>(null);
  const inputRef = input.ref as RefCallback<HTMLTextAreaElement>;
  const register = useCallback(
    (node: HTMLTextAreaElement | null) => {
      local.current = node;
      return inputRef(node);
    },
    [inputRef],
  );
  // Consumer callback identity changes must not re-register the editor.
  // biome-ignore lint/style/noNonNullAssertion: the host ref is attached before this layout effect.
  useImperativeHandle(ref, () => local.current!, []);
  return <textarea {...input} ref={register} />;
}
