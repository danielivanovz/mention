# mention

Headless React mention suggestions for native textareas and editor integrations.

This is the monorepo for [`@danielivanov/mention`](./packages/react). Documentation lives at [`apps/docs`](./apps/docs).

## Packages

| Package | Description |
|---|---|
| [`@danielivanov/mention`](./packages/react) | Headless suggestions, multiple triggers, async search, and caret positioning. The editing host owns its document. |

## Quick start

```sh
npm install @danielivanov/mention
```

Start with the executable [composer example](./packages/react/examples/Composer.tsx), or see the [controlled form](./packages/react/examples/MessageForm.tsx) and [ProseMirror integration](./packages/react/examples/ProseMirror.tsx). The documentation uses these same components and source files.

The [AI composer](./packages/react/examples/registry/default/ai-composer/ai-composer.tsx) combines Mention with shadcn/ui, AI SDK 7, and Lexical-owned document references. Its [registry item](./registry.json) copies the application code and installs Mention as an npm dependency. See the [integration guide](https://reactmention.com/docs/ai-composer) for installation, authenticated reference resolution, and the scripted demo. Public installation requires Mention 0.2.0 to be published.

See the [package README](./packages/react/README.md) for API usage and verification limits.

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
