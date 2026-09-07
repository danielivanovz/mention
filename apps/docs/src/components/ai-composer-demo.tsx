"use client";

import dynamic from "next/dynamic";

const LazyAIComposerDemo = dynamic(
  () =>
    import("../../../../packages/react/examples/AIComposerDemo").then(
      (module) => module.AIComposerDemo,
    ),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="specimen-editor-loading">
        Loading composer…
      </p>
    ),
  },
);

export function AIComposerDemo({ active = true }: { active?: boolean }) {
  return <LazyAIComposerDemo active={active} />;
}
