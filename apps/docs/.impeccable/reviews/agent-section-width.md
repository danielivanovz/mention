# Agent section width, 7 September 2026

Verified the local production build with the layout correction applied to `8dfa994`.

The navy agent band retains its full-width background. A centered 100rem inner container now shares the preceding reference section's side insets, equal columns, and column gap. Copy stays in the left column and the guide action aligns with the content's right edge. Below 760px, the action stacks below the copy and aligns left.

- At 2560px, the reference and agent copy both start at 520.5px and occupy 696px. The guide action and reference links share the 2024.5px right edge.
- At 1440px, both copy columns start at 34.195px and occupy 628.430px.
- At 390px, the copy and stacked action start at 20px. Both themes remain legible, and none of the checked widths has horizontal page overflow.
- Keyboard Tab reaches the guide action with a visible 2px focus outline. Enter opens the coding-agent guide.
- The production website build, scoped Biome checks, and `git diff --check` passed.

## Footer follow-up

Verified the local production build with the footer correction applied to `7a0ff2e`. The footer now shares the centered 100rem content width and stacks its logo above its wrapping links at 760px and below.

- At 2560px, the logo shares the agent copy's 520.5px left edge, and the footer links share the guide action's 2024.5px right edge.
- At 390px, the logo and stacked links align at 20px. At 320px, the links wrap onto a second row without horizontal page overflow.
- Inspected desktop light and mobile dark appearances. Keyboard Tab reaches the logo and all four links in order, each with a visible 2px focus outline.
- The production website build, scoped Biome check, and `git diff --check` passed.

This is local verification; neither layout correction has been deployed. The existing untracked `apps/docs/vercel.json` was left untouched.
