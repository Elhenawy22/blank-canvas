"use client";

import { Fragment, useEffect, useRef, type ReactNode, type RefObject } from "react";
import { ensureGsap, gsap, prefersReducedMotion, EASE, ScrollTrigger } from "@/lib/motion";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "p" | "span";

/**
 * Masked word reveal for display headings.
 *
 * Renders server-side as plain text (accessible + visible without JS),
 * then on the client wraps each word in an overflow mask and rises them
 * into place the first time the heading enters the viewport. With
 * reduced motion the text simply appears.
 *
 * Each `lines` entry keeps an authored line break everywhere: layout,
 * animation grouping, and screen readers share the same text.
 */

export default function RevealWords({
  as = "h2",
  lines,
  className,
  id,
  ariaLabel,
}: {
  as?: HeadingTag;
  lines: readonly string[];
  className?: string;
  id?: string;
  ariaLabel?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null) as RefObject<HTMLElement>;
  const Tag = as as "h2";

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    ensureGsap();

    const words = Array.from(el.querySelectorAll<HTMLElement>(".rw__word"));
    if (!words.length) return;

    const ctx = gsap.context(() => {
      gsap.set(words, { yPercent: 118 });
      ScrollTrigger.create({
        trigger: el,
        start: "top 86%",
        once: true,
        onEnter: () => {
          gsap.to(words, {
            yPercent: 0,
            duration: 1.05,
            ease: EASE.out,
            stagger: 0.028,
          });
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  const lineMarkup = (line: string, lineIndex: number) => (
    <span className="rw__line" key={lineIndex}>
      {line.split(" ").map((word, index) => (
        <Fragment key={`${lineIndex}-${index}`}>
          <span className="rw">
            <span className="rw__word">{word}</span>
          </span>
          {index < line.split(" ").length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );

  return (
    <Tag
      aria-label={ariaLabel}
      className={`rw-heading${className ? ` ${className}` : ""}`}
      id={id}
      ref={ref as RefObject<HTMLHeadingElement>}
    >
      {lines.map((line, index) => (
        <Fragment key={index}>
          {lineMarkup(line, index)}
          {index < lines.length - 1 ? <br /> : null}
        </Fragment>
      ))}
    </Tag>
  );
}
