import { useImperativeHandle } from "react";
import { multiCoreProps, singleCoreProps } from "../hooks/to-core-props.ts";
import { useMentionCore } from "../hooks/useMentionCore.ts";
import type { MentionRootMultiProps, MentionRootProps } from "../types.ts";
import { MentionProvider } from "./context.ts";

export function Root<T>(props: MentionRootProps<T>): React.ReactNode;
export function Root<M extends Record<string, unknown>>(
  props: MentionRootMultiProps<M>,
): React.ReactNode;
export function Root(
  props:
    | MentionRootProps<unknown>
    | MentionRootMultiProps<Record<string, unknown>>,
) {
  const ctx = useMentionCore(
    "triggers" in props ? multiCoreProps(props) : singleCoreProps(props),
  );
  useImperativeHandle(
    props.handleRef,
    () => ({
      open: () => ctx.setOpen(true),
      close: () => ctx.setOpen(false),
      commit: ctx.commit,
      host: ctx.editor?.element ?? null,
    }),
    [ctx.setOpen, ctx.commit, ctx.editor],
  );
  return (
    <MentionProvider value={{ ...ctx, unstyled: props.unstyled ?? false }}>
      {props.children}
    </MentionProvider>
  );
}
