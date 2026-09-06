# Mention website

The landing page and docs share a Next.js/Fumadocs application. Library examples import the workspace package through its published entry point; build the library from the repository root before starting the site.

From this directory:

```sh
bun run dev
bun run types:check
bun run build
```

Open the address printed by the development server. Use Next's `--port` option when another local service already uses the default port.

## Site addresses

All navigation and browser copy actions use relative paths or the current browser origin. The Markdown routes, `/llms.txt`, and `/llms-full.txt` generate absolute links from each request, so one build can serve a different local port or preview address without stale agent links. These text responses are rendered per request; documentation HTML remains statically generated.

Static canonical and Open Graph metadata need an origin at build time:

- Set `NEXT_PUBLIC_SITE_URL` to an absolute website URL to override automatic discovery.
- Vercel previews use `VERCEL_URL` by default. Production uses `VERCEL_PROJECT_PRODUCTION_URL`, falling back to `VERCEL_URL`.
- Without either setting, absolute canonical and Open Graph image metadata are omitted. There is no fallback development hostname in site code.

Set `NEXT_PUBLIC_GIT_REF` or provide `VERCEL_GIT_COMMIT_SHA` to show source links to the matching revision. Unpushed work does not link to an assumed remote branch.

## Content

`content/docs` is the shared source for browser articles, search, Markdown, and coding-agent prompts. Internals live in `content/docs/internals`, alongside integration and verification guides. The former `/internals` URLs redirect to their docs equivalents.

The AI composer guide includes the registry's actual four source files. The playground and guide load the same demo wrapper on demand; `@shadcn/helpers` stays in that wrapper. shadcn components under `src/components/ui` were retrieved from the official registry with CLI 4.21.0. The website maps their semantic colors to the existing Mention palette. Do not copy site styles or the scripted transport into the installable item.

- `src/components/site-header.tsx`: shared navigation.
- `src/lib/source.ts`: article loading and Markdown export.
- `src/lib/site.ts`: deployment metadata origin and URL construction.
- `src/lib/agent-prompt.ts`: the setup prompt, using the current browser origin.
- `src/proxy.ts`: explicit `.mdx` aliases for the Markdown routes.
