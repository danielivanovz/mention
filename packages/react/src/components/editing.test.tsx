// @vitest-environment happy-dom
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { StrictMode, useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTextareaAdapter } from "../adapters/textarea.ts";
import {
  Mention,
  type MentionImperativeHandle,
  useMention,
  useMentionMulti,
} from "../index.ts";

const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];
const config = {
  items: users,
  getKey: (u: (typeof users)[number]) => u.id,
  getLabel: (u: (typeof users)[number]) => u.name,
};
const input = () => screen.getByRole("textbox") as HTMLTextAreaElement;
function type(value: string, caret = value.length) {
  fireEvent.input(input(), {
    target: { value, selectionStart: caret, selectionEnd: caret },
  });
}
function Demo({
  controlled = false,
  onChange = vi.fn(),
  onInput = vi.fn(),
  prevent = false,
  readOnly = false,
} = {}) {
  const [value, setValue] = useState("");
  return (
    <Mention.Root {...config}>
      <Mention.Input
        aria-label="Message"
        name="message"
        readOnly={readOnly}
        {...(controlled ? { value } : {})}
        onChange={(e) => {
          onChange(e.target.value);
          setValue(e.target.value);
        }}
        onInput={onInput}
        onKeyDown={(e) => {
          if (prevent) e.preventDefault();
        }}
      />
      <Mention.Popover className="custom-popover">
        <Mention.List<(typeof users)[number]>>
          {(u) => (
            <Mention.Item value={u} className="custom-item">
              {u.name}
            </Mention.Item>
          )}
        </Mention.List>
      </Mention.Popover>
    </Mention.Root>
  );
}
afterEach(() => vi.useRealTimers());

describe("public editing behavior", () => {
  it("the standalone hook works by spreading its input props", () => {
    function HookInput() {
      const mention = useMention(config);
      return (
        <textarea {...mention.getInputProps({ "aria-label": "Message" })} />
      );
    }
    render(
      <StrictMode>
        <HookInput />
      </StrictMode>,
    );
    type("@");
    expect(input()).toHaveAttribute(
      "aria-controls",
      expect.stringMatching(/.+/),
    );
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(input().value).toBe("@Alice ");
  });
  it("composes controlled forms and both input event handlers exactly once", () => {
    const onChange = vi.fn(),
      onInput = vi.fn();
    render(<Demo controlled onChange={onChange} onInput={onInput} />);
    type("@");
    expect(input().value).toBe("@");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onInput).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(input().value).toBe("@Alice ");
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onInput).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith("@Alice ");
    expect(input().selectionStart).toBe(7);
  });
  it("respects a consumer preventing keyboard handling", () => {
    render(<Demo prevent />);
    type("@");
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(input().value).toBe("@");
  });
  it("passes classes and native attributes through compound components", () => {
    render(<Demo />);
    type("@");
    expect(input().name).toBe("message");
    expect(screen.getByRole("listbox")).toHaveClass("custom-popover");
    expect(screen.getAllByRole("option")[0]).toHaveClass("custom-item");
  });
  it("rejects Enter during composition, including native-only IME signals", () => {
    render(<Demo />);
    type("@");
    fireEvent.keyDown(input(), { key: "Enter", isComposing: true });
    expect(input().value).toBe("@");
    fireEvent.keyDown(input(), { key: "Enter", keyCode: 229 });
    expect(input().value).toBe("@");
    fireEvent.compositionStart(input());
    type("@a");
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(input().value).toBe("@a");
    fireEvent.compositionEnd(input());
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(input().value).toBe("@Alice ");
  });
  it("dismisses on blur and outside pointer interaction", () => {
    render(<Demo />);
    type("@");
    fireEvent.blur(input());
    expect(input()).not.toHaveAttribute("aria-controls");
    type("@a");
    fireEvent.pointerDown(document.body);
    expect(input()).not.toHaveAttribute("aria-controls");
  });
  it("keeps an unchanged query dismissed but reopens it after editing away and back", () => {
    render(<Demo />);
    type("@a");
    fireEvent.keyDown(input(), { key: "Escape" });
    fireEvent.select(input());
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    type("@");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    type("@a");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(input().value).toBe("@Alice ");
  });
  it("cannot rewrite unrelated text when the caret moves without an input event", () => {
    render(<Demo />);
    type("hello @a");
    input().setSelectionRange(0, 0);
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(input().value).toBe("hello @a");
    expect(input()).not.toHaveAttribute("aria-controls");
  });
  it("rescans selection-only changes and rejects expanded selections", () => {
    render(<Demo />);
    type("hello @a tail");
    input().setSelectionRange(8, 8);
    fireEvent.select(input());
    expect(input()).toHaveAttribute(
      "aria-controls",
      expect.stringMatching(/.+/),
    );
    input().setSelectionRange(6, 8);
    fireEvent.select(input());
    expect(input()).not.toHaveAttribute("aria-controls");
  });
  it("preserves the suffix without adding duplicate whitespace", () => {
    render(<Demo />);
    type("hello @a tail", 8);
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(input().value).toBe("hello @Alice tail");
  });
  it("does not offer edits for read-only inputs", () => {
    render(<Demo readOnly />);
    type("@");
    expect(input()).not.toHaveAttribute("aria-controls");
  });
  it("imperative opening rescans the caret and forwards the host ref", () => {
    function Handles() {
      const handle =
        useRef<MentionImperativeHandle<(typeof users)[number]>>(null);
      const node = useRef<HTMLTextAreaElement>(null);
      return (
        <Mention.Root {...config} handleRef={handle}>
          <Mention.Input ref={node} />
          <button
            type="button"
            onClick={() => {
              expect(handle.current?.host).toBe(node.current);
              node.current!.value = "@";
              node.current!.setSelectionRange(1, 1);
              handle.current!.open();
            }}
          >
            Open
          </button>
        </Mention.Root>
      );
    }
    render(
      <StrictMode>
        <Handles />
      </StrictMode>,
    );
    fireEvent.click(screen.getByText("Open"));
    expect(input()).toHaveAttribute(
      "aria-controls",
      expect.stringMatching(/.+/),
    );
  });
});

describe("request ownership", () => {
  function attach(result: {
    current: ReturnType<typeof useMention<(typeof users)[number]>>;
  }) {
    const textarea = document.createElement("textarea");
    act(() => result.current.setEditor(createTextareaAdapter(textarea)));
    return (text: string) =>
      act(() => {
        textarea.value = text;
        textarea.setSelectionRange(text.length, text.length);
        result.current.refresh();
      });
  }
  it("debounces requests and aborts obsolete ones, ignoring late responses", async () => {
    vi.useFakeTimers();
    const pending: Array<{
      query: string;
      signal: AbortSignal;
      resolve: (v: typeof users) => void;
    }> = [];
    const fetcher = vi.fn(
      (query: string, signal: AbortSignal) =>
        new Promise<typeof users>((resolve) =>
          pending.push({ query, signal, resolve }),
        ),
    );
    const { result } = renderHook(() =>
      useMention({ ...config, items: fetcher, debounceMs: 150 }),
    );
    const update = attach(result);
    update("@");
    update("@a");
    expect(fetcher).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(150));
    expect(pending[0]?.query).toBe("a");
    update("@b");
    expect(pending[0]?.signal.aborted).toBe(true);
    expect(result.current.items).toEqual([]);
    await act(() => vi.advanceTimersByTimeAsync(150));
    await act(() => pending[1]!.resolve([users[1]!]));
    expect(result.current.items).toEqual([users[1]]);
    await act(() => pending[0]!.resolve([users[0]!]));
    expect(result.current.items).toEqual([users[1]]);
  });
  it("never commits a previous channel's item while loading or after failure", async () => {
    let reject!: (error: Error) => void;
    const channels = {
      "@": config,
      "#": {
        items: () =>
          new Promise<Array<{ slug: string }>>((_resolve, fail) => {
            reject = fail;
          }),
        getKey: (c: { slug: string }) => c.slug,
        getLabel: (c: { slug: string }) => c.slug,
      },
    };
    const selected = vi.fn();
    const { result } = renderHook(() =>
      useMentionMulti({
        triggers: channels,
        debounceMs: 0,
        onSelect: selected,
      }),
    );
    const textarea = document.createElement("textarea");
    act(() => result.current.setEditor(createTextareaAdapter(textarea)));
    const update = (text: string) =>
      act(() => {
        textarea.value = text;
        textarea.setSelectionRange(text.length, text.length);
        result.current.refresh();
      });
    update("@");
    const old = result.current.items[0]!;
    update("#");
    expect(result.current.activeTrigger).toBe("#");
    expect(result.current.status).toBe("loading");
    expect(result.current.items).toEqual([]);
    await act(() => reject(new Error("offline")));
    expect(result.current.status).toBe("error");
    expect(result.current.items).toEqual([]);
    act(() => expect(result.current.commit(old)).toBe(false));
    expect(selected).not.toHaveBeenCalled();
    expect(textarea.value).toBe("#");
  });
  it("refilters unchanged data when getLabel semantics change", () => {
    const { result, rerender } = renderHook(
      ({ reverse }) =>
        useMention({
          ...config,
          getLabel: (u) =>
            reverse ? u.name.split("").reverse().join("") : u.name,
        }),
      { initialProps: { reverse: false } },
    );
    const update = attach(result);
    update("@ali");
    expect(result.current.items).toEqual([users[0]]);
    rerender({ reverse: true });
    expect(result.current.items).toEqual([]);
  });
  it("cancels pending work on unmount", () => {
    const fetcher = vi.fn(
      (_q: string, _signal: AbortSignal) => new Promise<typeof users>(() => {}),
    );
    const { result, unmount } = renderHook(() =>
      useMention({ ...config, items: fetcher, debounceMs: 0 }),
    );
    attach(result)("@");
    const signal = fetcher.mock.calls[0]![1];
    unmount();
    expect(signal.aborted).toBe(true);
  });
  it("surfaces a synchronously thrown fetcher as an error", async () => {
    const fetcher = () => {
      throw new Error("broken fetcher");
    };
    const { result } = renderHook(() =>
      useMention({ ...config, items: fetcher, debounceMs: 0 }),
    );
    attach(result)("@");
    await act(async () => {});
    expect(result.current.status).toBe("error");
  });
});

it("preserves the session when a controlled consumer supplies a new callback ref", () => {
  function CallbackInput() {
    const [value, setValue] = useState("");
    return (
      <Mention.Root {...config}>
        <Mention.Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          ref={() => {}}
        />
      </Mention.Root>
    );
  }
  render(<CallbackInput />);
  type("@a");
  expect(input()).toHaveAttribute("aria-controls", expect.stringMatching(/.+/));
  fireEvent.keyDown(input(), { key: "Enter" });
  expect(input().value).toBe("@Alice ");
});
it("leaves modified editing keys to the host", () => {
  render(<Demo />);
  type("@a");
  for (const modifier of ["shiftKey", "ctrlKey", "metaKey", "altKey"]) {
    fireEvent.keyDown(input(), { key: "Enter", [modifier]: true });
    expect(input().value).toBe("@a");
  }
});
