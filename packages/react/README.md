# @danielivanov/mention

> Headless, a11y-first React mention primitive for `<textarea>` and contenteditable. ~14 kB gzip. shadcn-friendly.

A small, focused take on the `@`-mention pattern — built around the WAI-ARIA combobox-as-substring contract. Bring your own design system, or use the default theme.

## Install

```sh
npm install @danielivanov/mention
```

Peers: `react` ≥ 19, `react-dom` ≥ 19. One runtime dep: `@floating-ui/react-dom`.

## Usage

```tsx
import { Mention } from "@danielivanov/mention";
import "@danielivanov/mention/styles.css"; // or omit + pass `unstyled` to <Mention.Root>

const users = [
  { id: 1, name: "Daniel" },
  { id: 2, name: "Daria" },
  { id: 3, name: "Marcus" },
];

export function MessageInput() {
  return (
    <Mention.Root
      items={users}
      getKey={(u) => u.id}
      getLabel={(u) => u.name}
      onSelect={(u) => console.log("picked", u)}
    >
      <Mention.Input aria-label="Message" />
      <Mention.Popover>
        <Mention.List>
          {(u) => <Mention.Item value={u}>{u.name}</Mention.Item>}
        </Mention.List>
        <Mention.Empty>No people found</Mention.Empty>
      </Mention.Popover>
    </Mention.Root>
  );
}
```

## Why

- **A11y by default.** Permanent `role="combobox"` on the host, full APG contract: `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete="list"`. Unicode word-boundary detection (CJK, Thai, Khmer, Lao, Myanmar) and an IME composition guard.
- **Two host types.** `<textarea>` (via `<Mention.Input>`) or `<div contenteditable>` (via `<Mention.Editable>`) — same compound API, same hook. The contenteditable host also supports atomic chip insertion with two-step backspace selection.
- **Multi-trigger.** Mix `@` for users and `#` for channels in the same editor with `useMentionMulti<TItemMap>()` or `<Mention.Root triggers={…}>` — typed per channel.
- **Caret-anchored popover.** Floating UI virtual element + caret-position math — the popover follows the trigger as the user types, not the host's bounding box.
- **shadcn-friendly.** Default CSS uses shadcn's CSS variables (`--popover`, `--accent`, …). Drop in, or pass `unstyled` and bring your own.
- **Small.** Under a 14 kB gzip ceiling, enforced in CI.

## Async items

Pass a function instead of an array. The library wires `AbortSignal` — drop it on `fetch` and get free cancellation when the query changes.

```tsx
<Mention.Root
  items={async (query, signal) => {
    const r = await fetch(`/api/users?q=${query}`, { signal });
    return r.json();
  }}
  getKey={(u) => u.id}
  getLabel={(u) => u.name}
  onSelect={(u) => insertMention(u)}
>
  <Mention.Input aria-label="Message" />
  <Mention.Popover>
    <Mention.Loading>Searching…</Mention.Loading>
    <Mention.List>
      {(u) => <Mention.Item value={u}>{u.name}</Mention.Item>}
    </Mention.List>
    <Mention.Empty>No people found</Mention.Empty>
  </Mention.Popover>
</Mention.Root>
```

## Custom insertion text

By default the trigger + label is inserted (`"@Daniel"`). Pass `getInsertText` to control what lands in the host — markdown links, `@[label](id)` syntax, anything:

```tsx
<Mention.Root
  items={users}
  getKey={(u) => u.id}
  getLabel={(u) => u.name}
  getInsertText={(u) => `[@${u.name}](/users/${u.id})`}
  onSelect={...}
>
  ...
</Mention.Root>
```

## Atomic chips (contenteditable)

Pair `<Mention.Editable>` with `shape: "node"` and `getInsertNode` to render committed mentions as atomic, non-editable React nodes. `<Mention.Chips>` portals each chip's content into its placeholder.

```tsx
<Mention.Root
  items={users}
  getKey={(u) => u.id}
  getLabel={(u) => u.name}
  shape="node"
  getInsertNode={(u) => <Chip>{u.name}</Chip>}
  onSelect={(u) => insertMention(u)}
>
  <Mention.Editable aria-label="Message" />
  <Mention.Chips />
  <Mention.Popover>
    <Mention.List>
      {(u) => <Mention.Item value={u}>{u.name}</Mention.Item>}
    </Mention.List>
  </Mention.Popover>
</Mention.Root>
```

## Escape hatch

Compound components don't fit your tree? The same machinery is exposed as a hook — pass the returned `getInputProps()` / `getPopoverProps()` / `getItemProps()` to your own DOM:

```tsx
import { useMention } from "@danielivanov/mention";

const m = useMention({ items, getKey, getLabel, onSelect });

<textarea {...m.getInputProps()} />
{m.open && (
  <ul {...m.getPopoverProps()}>
    {m.items.map((item, i) => (
      <li key={getKey(item)} {...m.getItemProps(item, i)}>
        {getLabel(item)}
      </li>
    ))}
  </ul>
)}
```

Pass `key` directly — `getItemProps` deliberately omits it so spreading the bag doesn't trip React 19's "key spread" warning.

For multi-trigger, use `useMentionMulti<TItemMap>()` — same return shape, channel-keyed config and a discriminated `onSelect` payload.

## License

MIT. Caret-position math vendored from [`textarea-caret-position`](https://github.com/component/textarea-caret-position) (also MIT — attribution in `src/text/caret.ts`).
