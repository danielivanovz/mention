# @danielivanov/mention

Headless React mention suggestions for native textareas and editor integrations. Multiple triggers, async search, keyboard navigation, caret positioning, and optional styles. Requires React 19.

```sh
bun add @danielivanov/mention
```

```tsx
import { Mention } from "@danielivanov/mention";
import "@danielivanov/mention/styles.css";

type Person = { id: string; name: string };
const people: Person[] = [{ id: "alice", name: "Alice" }];

export function Composer() {
  return (
    <Mention.Root items={people} getKey={p => p.id} getLabel={p => p.name}>
      <Mention.Input aria-label="Message" name="message" />
      <Mention.Popover aria-label="People">
        <Mention.Loading>Searching…</Mention.Loading>
        <Mention.List<Person>>
          {person => <Mention.Item value={person}>{person.name}</Mention.Item>}
        </Mention.List>
        <Mention.Empty>No people found</Mention.Empty>
      </Mention.Popover>
    </Mention.Root>
  );
}
```

Use standard `value`, `onChange`, `onBlur`, `onKeyDown`, and `ref` props on `Mention.Input`. Consumer key handlers run first and can prevent Mention's handling. `onSelect` on Root is an optional notification after a successful insertion. The standalone `useMention()` hook registers a textarea when its `getInputProps()` are spread.

For multiple triggers, supply `triggers={{ "@": peopleConfig, "#": channelConfig }}` to Root or use `useMentionMulti()`. Each channel has `items`, `getKey`, `getLabel`, and optional `getInsertText`. Async fetchers receive `(query, signal)`; requests debounce for 150 ms by default. Obsolete results cannot be selected.

Rich editors register an `EditorAdapter<T>` with `setEditor()`. The adapter reads one text region, measures the caret, and replaces a range using the editor's own transaction. The editor owns chips, formatting, clipboard data, and undo. See the executable [ProseMirror example](./examples/ProseMirror.tsx), which is exercised by browser tests. Other editor integrations need their own adapters and verification.

Textareas retain their native textbox semantics. Rich editors supply their own textbox role and multiline state; Mention adds listbox and active-option relationships. Automated checks do not prove assistive-technology compatibility. See the [accessibility documentation](../../apps/docs/content/docs/accessibility.mdx) for the testing boundary.

Run `bun run build`, `bun run test`, and `bun run test:e2e` from the repository root. The size budget is 14 kB gzipped, including Floating UI. The editor example is outside the published runtime.
