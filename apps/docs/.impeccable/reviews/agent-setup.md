# Agent setup

A focused extension of the existing interface. Agent setup opens from the landing action and every documentation page. It previews a selectable prompt, copies it with visible success feedback, and keeps a path to the integration guide. Recipe prompts include that page's direct Markdown reference. URLs use the site currently being viewed.

The prompt asks the coding agent to inspect the application, check React compatibility and the installed package, preserve editor and form ownership, use the relevant docs, and report actual verification. This is a prompt handoff, not an agent installer or a hosted service.

## References

[Cloudflare's agent setup](https://developers.cloudflare.com/agent-setup/) provides a central setup entry and prompt action. [Neon's integration prompts](https://neon.com/docs/changelog/2025-10-31) provide prompts tied to individual guides. Mention combines central discovery with the current guide's context, using its existing Markdown delivery.

## Design review

| Area | Decision |
| --- | --- |
| Typography | Existing Archivo reading and control roles; prompt is readable prose rather than code syntax. |
| Surfaces | Opaque sheet popover aligned to its trigger; 12px panel and 6px inset geometry. Bounded viewport and a scrolling body keep copying available on short screens. |
| Motion | Immediate opening; no new motion. |
| Icons | Existing Lucide family, named 44px controls and correct copied/error icons. |
| Performance | Existing Fumadocs/Radix popover and shared copy control; no new dependency, service, document fetch or keyboard system. |

Considered and rejected: a new MCP service or agent installer (unneeded for handing off maintained docs); separate agent-specific setup tabs (the prompt works across coding tools); copying without any way to review or select the prompt (poor recovery when clipboard access fails).

## Verification

Validation is recorded in `/tmp/mention-agent-setup-results.json`. The checks cover prompt contents and reachable Markdown, exact clipboard output, denial and manual selection, close/Escape focus return, guide navigation, light/dark accessibility scans, and 320/390/768/1440px bounds. The final build generates 45 pages with TypeScript checking; formatting is scoped to changed files. Manual assistive-technology narration and physical mobile devices remain unverified. No deployment occurred.

Verdict: **Approve** for this feature. Chromium, Firefox and WebKit checks pass; the mobile/desktop/dark accessibility scans report no violations. The copied state also passes the visible-label/accessibility-name check. Copy remains visible without scrolling at 320×568. Production build, scoped formatting and diff checks pass.
