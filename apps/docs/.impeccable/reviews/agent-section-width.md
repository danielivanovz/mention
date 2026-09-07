# Agent section width, 7 September 2026

Verified the local production build with the layout correction applied to `8dfa994`.

The navy agent band retains its full-width background. A centered 100rem inner container now shares the preceding reference section's side insets, equal columns, and column gap. Copy stays in the left column and the guide action aligns with the content's right edge. Below 760px, the action stacks below the copy and aligns left.

- At 2560px, the reference and agent copy both start at 520.5px and occupy 696px. The guide action and reference links share the 2024.5px right edge.
- At 1440px, both copy columns start at 34.195px and occupy 628.430px.
- At 390px, the copy and stacked action start at 20px. Both themes remain legible, and none of the checked widths has horizontal page overflow.
- Keyboard Tab reaches the guide action with a visible 2px focus outline. Enter opens the coding-agent guide.
- The production website build, scoped Biome checks, and `git diff --check` passed.

This is local verification; the correction has not been deployed. The existing untracked `apps/docs/vercel.json` was left untouched.
