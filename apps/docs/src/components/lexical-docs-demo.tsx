"use client";

import dynamic from "next/dynamic";

const LazyLexicalDemo = dynamic(
  () =>
    import("../../../../packages/react/examples/Lexical").then(
      (module) => module.LexicalDemo,
    ),
  { loading: () => <p role="status">Loading editor…</p> },
);

export function LexicalDemo() {
  return <LazyLexicalDemo />;
}
