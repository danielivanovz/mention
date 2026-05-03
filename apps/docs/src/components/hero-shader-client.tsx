"use client";

// Client boundary that wraps the WebGL shader. Next 16 requires
// `dynamic({ ssr: false })` to live inside a Client Component, but the
// home page itself is server-rendered — we keep that boundary tight by
// putting the dynamic import here and letting the page import this
// thin wrapper instead.

import dynamic from "next/dynamic";

const HeroShader = dynamic(
  () => import("@/components/hero-shader").then((m) => m.HeroShader),
  { ssr: false },
);

export function HeroShaderClient() {
  return <HeroShader />;
}
