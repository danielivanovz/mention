# mention

> Headless, a11y-first React mention (`@`-trigger autocomplete) primitive for `<textarea>` and contenteditable hosts.

This is the monorepo for [`@danielivanov/mention`](./packages/react). Documentation lives at [`apps/docs`](./apps/docs).

## Packages

| Package | Description |
|---|---|
| [`@danielivanov/mention`](./packages/react) | The library. WAI-ARIA combobox-as-substring, multi-trigger, atomic chips, ~14 kB gzip. |

## Quick start

```sh
npm install @danielivanov/mention
```

```tsx
import { Mention } from "@danielivanov/mention";
import "@danielivanov/mention/styles.css";

<Mention.Root items={users} getKey={u => u.id} getLabel={u => u.name} onSelect={...}>
  <Mention.Input aria-label="Message" />
  <Mention.Popover>
    <Mention.List>
      {(u) => <Mention.Item value={u}>{u.name}</Mention.Item>}
    </Mention.List>
  </Mention.Popover>
</Mention.Root>
```

See the [package README](./packages/react/README.md) for the full API.

## Development

```sh
bun install
bun run build       # build the library
bun run test        # vitest unit suite
bun run test:e2e    # Playwright e2e + axe
bun run docs:dev    # docs site at localhost:3000
```

## License

MIT — see [LICENSE](./LICENSE).
