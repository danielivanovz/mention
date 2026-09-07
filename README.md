# mention

Headless React mention suggestions for native textareas and editor integrations.

This is the monorepo for [`@danielivanov/mention`](./packages/react). Documentation lives at [`apps/docs`](./apps/docs).

## Packages

| Package | Description |
|---|---|
| [`@danielivanov/mention`](./packages/react) | Headless suggestions, multiple triggers, async search, and caret positioning. The editing host owns its document. |

## Quick start

```sh
npm install @danielivanov/mention@^0.2.0
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

## Releasing

The 0.2 documentation uses an API that is incompatible with 0.1. Publish the matching package before deploying the website, and merge the registry source before advertising its GitHub install command.

The release workflow uses npm trusted publishing. In the npm package's settings, configure GitHub Actions with owner `danielivanovz`, repository `mention`, and workflow `release.yml`. Leave the environment blank while the job has no GitHub environment. Enable **Allow npm publish** because Changesets publishes directly. The workflow already grants `id-token: write` and runs a supported Node/npm runtime. See [npm's trusted-publishing setup](https://docs.npmjs.com/trusted-publishers/).

After an approved release, verify the public version and registry from outside the workspace:

```sh
npm view @danielivanov/mention@0.2.0 version
npx shadcn@4.21.0 view danielivanovz/mention/ai-composer
```

Install the documented commands in a fresh React 19 consumer before deploying the corresponding docs. A local tarball check validates the build but does not prove npm publication or GitHub registry availability.

## License

MIT — see [LICENSE](./LICENSE).
