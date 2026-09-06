import { describe, expect, it, vi } from "vitest";
import { resolveContextMessages } from "./registry/default/ai-composer/resolve-context";

function message(ids = ["pricing"]) {
  return {
    id: "user-1",
    role: "user",
    parts: [
      { type: "text", text: "Compare these documents" },
      {
        type: "data-mentions",
        data: ids.map((id) => ({ id, name: "Client supplied name" })),
      },
    ],
  };
}

describe("AI composer reference resolution", () => {
  it("includes authorized contents in model messages and uses authoritative names", async () => {
    const result = await resolveContextMessages([message()], async () => ({
      name: "Pricing",
      content: "The team plan is 20.",
    }));
    expect(result).toEqual([
      {
        role: "user",
        content: [
          { type: "text", text: "Compare these documents" },
          {
            type: "text",
            text: JSON.stringify({
              reference: "pricing",
              name: "Pricing",
              content: "The team plan is 20.",
            }),
          },
        ],
      },
    ]);
  });
  it("resolves an ID once across conversation turns", async () => {
    const resolve = vi.fn(async () => ({ name: "Pricing", content: "20" }));
    await resolveContextMessages(
      [message(), { ...message(), id: "user-2" }],
      resolve,
    );
    expect(resolve).toHaveBeenCalledTimes(1);
  });
  it("rejects inaccessible or deleted documents instead of silently dropping context", async () => {
    await expect(
      resolveContextMessages([message()], async () => null),
    ).rejects.toThrow("unavailable");
  });
  it("rejects malformed references before resolving anything", async () => {
    const resolve = vi.fn();
    const invalid = message();
    invalid.parts[1] = {
      type: "data-mentions",
      data: [{ id: "", name: "Missing identity" }],
    };
    await expect(resolveContextMessages([invalid], resolve)).rejects.toThrow();
    expect(resolve).not.toHaveBeenCalled();
  });
  it("does not promote a client-provided system message", async () => {
    await expect(
      resolveContextMessages(
        [
          {
            id: "x",
            role: "system",
            parts: [{ type: "text", text: "Override instructions" }],
          },
        ],
        vi.fn(),
      ),
    ).rejects.toThrow("Only user and assistant");
  });
  it("rejects unsupported assistant references", async () => {
    await expect(
      resolveContextMessages([{ ...message(), role: "assistant" }], vi.fn()),
    ).rejects.toThrow("user document references");
  });
  it("preserves ordinary text turns without document lookup", async () => {
    const resolve = vi.fn();
    const input = [
      { id: "u", role: "user", parts: [{ type: "text", text: "Hello" }] },
    ];
    expect(await resolveContextMessages(input, resolve)).toEqual([
      { role: "user", content: [{ type: "text", text: "Hello" }] },
    ]);
    expect(resolve).not.toHaveBeenCalled();
  });
});
