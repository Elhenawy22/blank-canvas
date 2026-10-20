"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { autoReveal } from "@/lib/motion";

type Tag = "section" | "div" | "nav" | "article";

/**
 * Client mount for the shared data-attribute reveal system.
 * Renders an ordinary element (so server-composed markup stays semantic)
 * and activates `[data-reveal]` / `[data-reveal-group]` entrances inside
 * it once mounted. Children keep rendering as plain markup.
 */
export default function RevealArea({
  as = "div",
  className,
  id,
  ariaLabel,
  children,
}: {
  as?: Tag;
  className?: string;
  id?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as "div";

  useEffect(() => {
    const cleanup = autoReveal(ref.current);
    return cleanup;
  }, []);

  return (
    <Tag
      aria-label={ariaLabel}
      className={className}
      id={id}
      ref={ref as unknown as React.RefObject<HTMLDivElement>}
    >
      {children}
    </Tag>
  );
}
