"use client";

// Scroll-reveal wrapper. Renders children inside a `<div data-reveal>` that
// CSS pins to the hidden state by default; flips to `data-reveal="in"`
// once the element crosses the viewport threshold. The transition runs
// once, then the IO disconnects (see `useInView`).
//
// `delay` is forwarded as an inline `--reveal-delay` custom property so
// callers can stagger siblings without a parent context.

import type { CSSProperties, ReactNode } from "react";
import { useInView } from "@/lib/use-in-view";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}

export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: RevealProps) {
  const [ref, inView] = useInView<HTMLElement>();
  const style: CSSProperties =
    delay > 0 ? { ["--reveal-delay" as string]: `${delay}ms` } : {};

  return (
    <Tag
      ref={ref as never}
      data-reveal={inView ? "in" : "out"}
      className={className}
      style={style}
    >
      {children}
    </Tag>
  );
}
