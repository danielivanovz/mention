"use client";

// One-shot IntersectionObserver hook for scroll-reveal entrances.
//
// Defaults to `inView=true` so SSR and JS-disabled paths render the
// visible state — a `Reveal` block is never invisible without JS.
//
// Shared-registry design: all callers register elements with a single
// module-level IntersectionObserver. The home page mounts ~8 of these
// in a row; pooling onto one IO avoids per-instance observer overhead
// and keeps the threshold/rootMargin in lockstep across consumers.

import { useEffect, useRef, useState } from "react";

type Callback = (inView: boolean) => void;

let sharedObserver: IntersectionObserver | undefined;
const callbacks = new Map<Element, Callback>();

function getObserver() {
  if (sharedObserver) return sharedObserver;
  if (typeof IntersectionObserver === "undefined") return undefined;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const cb = callbacks.get(entry.target);
        if (!cb) continue;
        if (entry.isIntersecting) {
          cb(true);
          callbacks.delete(entry.target);
          sharedObserver?.unobserve(entry.target);
        } else {
          cb(false);
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -100px 0px" },
  );
  return sharedObserver;
}

export function useInView<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = getObserver();
    if (!observer) return;

    callbacks.set(el, setInView);
    observer.observe(el);

    return () => {
      callbacks.delete(el);
      observer.unobserve(el);
    };
  }, []);

  return [ref, inView] as const;
}
