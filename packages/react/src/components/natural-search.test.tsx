// @vitest-environment happy-dom
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createTextareaAdapter } from "../adapters/textarea.ts";
import { Mention, useMention, useMentionMulti } from "../index.ts";

const people = [
  { id: 1, name: "Alice Chen" },
  { id: 2, name: "José García" },
];
const normalize = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const config = {
  items: people,
  getKey: (person: (typeof people)[number]) => person.id,
  getLabel: (person: (typeof people)[number]) => person.name,
  allowSpaces: true,
  filter: (person: (typeof people)[number], query: string) =>
    normalize(person.name).includes(normalize(query)),
};
function fixture() {
  render(
    <Mention.Root {...config}>
      <Mention.Input aria-label="Message" />
      <Mention.Popover>
        <Mention.List<(typeof people)[number]>>
          {(person) => (
            <Mention.Item value={person}>{person.name}</Mention.Item>
          )}
        </Mention.List>
      </Mention.Popover>
    </Mention.Root>,
  );
  const input = screen.getByRole("textbox") as HTMLTextAreaElement;
  const type = (text: string, caret = text.length) =>
    fireEvent.input(input, {
      target: { value: text, selectionStart: caret, selectionEnd: caret },
    });
  return { input, type };
}
describe("natural name searching", () => {
  it("matches names with spaces and consumer-defined accent folding synchronously", () => {
    const { input, type } = fixture();
    type("Hello @jose gar");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option")).toHaveTextContent("José García");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input.value).toBe("Hello @José García ");
    expect(input.selectionStart).toBe(input.value.length);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
  it("keeps a committed multiword query dismissed while continuing a sentence, then opens a new trigger", () => {
    const { input, type } = fixture();
    type("@Alice C");
    fireEvent.keyDown(input, { key: "Enter" });
    type("@Alice Chen is here");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    type("@Alice Chen is here @jos");
    expect(screen.getByRole("option")).toHaveTextContent("José García");
  });
  it("keeps Escape dismissed on forward typing but lets an earlier edit reopen the query", () => {
    const { input, type } = fixture();
    type("@Alice C");
    fireEvent.keyDown(input, { key: "Escape" });
    type("@Alice Chen");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    type("@Alice ");
    expect(screen.getByRole("option")).toHaveTextContent("Alice Chen");
    fireEvent.keyDown(input, { key: "Escape" });
    type("");
    type("@Alice ");
    expect(screen.getByRole("option")).toHaveTextContent("Alice Chen");
  });
  it("preserves default matching and applies space policy to the closest trigger only", () => {
    const { result } = renderHook(() =>
      useMentionMulti({
        triggers: {
          "@": config,
          "#": {
            items: people,
            getKey: config.getKey,
            getLabel: config.getLabel,
          },
        },
      }),
    );
    const input = document.createElement("textarea");
    act(() => result.current.setEditor(createTextareaAdapter(input)));
    const type = (text: string) =>
      act(() => {
        input.value = text;
        result.current.refresh();
      });
    type("#jose");
    expect(result.current.items).toEqual([]);
    type("#josé");
    expect(result.current.items).toEqual([people[1]]);
    type("#Alice C");
    expect(result.current.open).toBe(false);
    type("@Alice #José G");
    expect(result.current.open).toBe(false);
    type("#José @Alice C");
    expect(result.current.items).toEqual([people[0]]);
  });
  it("updates a custom filter without restarting a synchronous session", () => {
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useMention({
          ...config,
          filter: enabled ? config.filter : () => false,
        }),
      { initialProps: { enabled: false } },
    );
    const input = document.createElement("textarea");
    input.value = "@jose";
    act(() => {
      result.current.setEditor(createTextareaAdapter(input));
      result.current.refresh();
    });
    expect(result.current.items).toEqual([]);
    rerender({ enabled: true });
    expect(result.current.items).toEqual([people[1]]);
    expect(result.current.status).toBe("success");
  });
  it("passes the full query to a fetcher without applying the array filter", async () => {
    const filter = vi.fn(() => false);
    const fetcher = vi.fn(async () => people);
    const { result } = renderHook(() =>
      useMention({ ...config, items: fetcher, filter, debounceMs: 0 }),
    );
    const input = document.createElement("textarea");
    input.value = "@Alice C";
    await act(async () => {
      result.current.setEditor(createTextareaAdapter(input));
      result.current.refresh();
    });
    expect(fetcher).toHaveBeenCalledWith("Alice C", expect.any(AbortSignal));
    expect(result.current.items).toEqual(people);
    expect(filter).not.toHaveBeenCalled();
    act(() => result.current.setOpen(false));
    act(() => {
      input.value = "@Alice Chen";
      result.current.refresh();
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    await act(async () => result.current.setOpen(true));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
