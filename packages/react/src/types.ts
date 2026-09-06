import type {
  HTMLAttributes,
  ReactNode,
  Ref,
  RefObject,
  TextareaHTMLAttributes,
} from "react";
import type { EditorAdapter } from "./adapters/types.ts";

export type MentionFetcher<T> = (
  query: string,
  signal: AbortSignal,
) => Promise<readonly T[]>;
export type MentionItems<T> = readonly T[] | MentionFetcher<T>;
export type MentionStatus = "idle" | "loading" | "error" | "success";

export interface MentionSelectMeta {
  readonly trigger: string;
  readonly query: string;
  /** UTF-16 offset in the text returned by the editor's read method. */
  readonly triggerOffset: number;
}

export interface MentionChannelConfig<T> {
  items: MentionItems<T>;
  getKey: (item: T) => string | number;
  getLabel: (item: T) => string;
  /** Defaults to the trigger followed by the label. */
  getInsertText?: (item: T, meta: MentionSelectMeta) => string;
}

export interface UseMentionProps<T> extends MentionChannelConfig<T> {
  /** One non-whitespace UTF-16 character. Defaults to @. */
  trigger?: string;
  onSelect?: (item: T, meta: MentionSelectMeta) => void;
  /** Async requests only. Defaults to 150 ms; 0 starts immediately. */
  debounceMs?: number;
}

export interface UseMentionMultiProps<M extends Record<string, unknown>> {
  triggers: { [K in keyof M]: MentionChannelConfig<M[K]> };
  onSelect?: (
    payload: { [K in keyof M]: { [P in K]: M[K] } }[keyof M],
    meta: MentionSelectMeta,
  ) => void;
  debounceMs?: number;
}

interface RootOptions<T> {
  children: ReactNode;
  unstyled?: boolean;
  handleRef?: RefObject<MentionImperativeHandle<T> | null>;
}
export type MentionRootProps<T> = UseMentionProps<T> & RootOptions<T>;
export type MentionRootMultiProps<M extends Record<string, unknown>> =
  UseMentionMultiProps<M> & RootOptions<M[keyof M]>;

/** Minimal keyboard event shared by native editor callbacks and React. */
export interface MentionKeyEvent {
  key: string;
  keyCode?: number;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  isComposing?: boolean;
  defaultPrevented: boolean;
  preventDefault(): void;
}

export interface MentionContext<T> {
  readonly query: string;
  readonly open: boolean;
  readonly highlightedIndex: number;
  readonly items: readonly T[];
  readonly status: MentionStatus;
  readonly activeTrigger: string | null;
  readonly editor: EditorAdapter<T> | null;
  /** Registers an editor that owns document updates and history. Pass null on cleanup. */
  setEditor: (editor: EditorAdapter<T> | null) => void;
  /** Call after an editor transaction or selection change. */
  refresh: () => void;
  /** Returns true when handled. Call before the editor's key bindings. */
  handleKeyDown: (event: MentionKeyEvent) => boolean;
  /** Registers the textarea adapter and composes native React props. */
  getInputProps: (props?: Omit<MentionInputProps, "ref">) => MentionInputProps;
  /** ARIA attributes for editor hosts with their own event system. */
  getEditorProps: () => HTMLAttributes<HTMLElement>;
  getPopoverProps: () => HTMLAttributes<HTMLDivElement>;
  getItemProps: (
    item: T,
    index: number,
    props?: HTMLAttributes<HTMLDivElement>,
  ) => HTMLAttributes<HTMLDivElement>;
  /** Opening rescans the selection and requires an active trigger. */
  setOpen: (open: boolean) => void;
  /** Commits only a current result at the unchanged selection. */
  commit: (item: T) => boolean;
}

export type MentionMultiContext<M extends Record<string, unknown>> =
  MentionContext<M[keyof M]>;
export type UseMention<T> = MentionContext<T>;
export type UseMentionMulti<M extends Record<string, unknown>> =
  MentionMultiContext<M>;

export interface MentionImperativeHandle<T> {
  open(): void;
  close(): void;
  commit(item: T): boolean;
  readonly host: HTMLElement | null;
}

export type MentionInputProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>;
};
export interface MentionPopoverProps extends HTMLAttributes<HTMLDivElement> {
  /** Defaults to the host's document.body. null renders in place. */
  container?: HTMLElement | null;
  maxHeight?: number;
}
/** T must match the selected channel; React context cannot infer it from Root. */
export interface MentionListProps<T = unknown> {
  trigger?: string;
  children: (item: T, index: number) => ReactNode;
}
export interface MentionItemProps<T> extends HTMLAttributes<HTMLDivElement> {
  value: T;
}
export type MentionEmptyProps = HTMLAttributes<HTMLDivElement>;
export type MentionLoadingProps = HTMLAttributes<HTMLDivElement>;
