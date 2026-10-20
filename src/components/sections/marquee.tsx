"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import type { Dictionary } from "@/i18n/dictionaries";
import { ensureGsap, gsap, prefersReducedMotion } from "@/lib/motion";

/**
 * Keyword marquee — one continuous, seamless loop. The word track is
 * rendered twice (second copy aria-hidden) and the wrapper translates
 * -50% of its own width forever, giving an uninterrupted ribbon.
 */
export default function MarqueeStrip({
  dictionary,
  locale,
}: {
  dictionary: Dictionary;
  locale: string;
}) {
  const marquee = dictionary.marquee;
  const viewportRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const viewport = viewportRef.current;
      if (!viewport || prefersReducedMotion()) return;

      ensureGsap();

      // The duplicated track loops seamlessly in either writing direction.
      // Arabic scrolls its content toward the right (mirroring the LTR
      // leftward flow) instead of jumping the wrong way.
      gsap.to(viewport.querySelector(".marquee__track"), {
        xPercent: locale === "ar" ? 50 : -50,
        duration: 30,
        ease: "none",
        repeat: -1,
      });
    },
    { scope: viewportRef, dependencies: [locale] },
  );

  return (
    <section aria-label={marquee.aria} className="marquee">
      <div className="marquee__viewport" ref={viewportRef}>
        <div className="marquee__track">
          {[0, 1].map((copy) => (
            <ul
              aria-hidden={copy === 1}
              className="marquee__list"
              key={copy}
            >
              {marquee.words.map((word) => (
                <li key={word}>{word}</li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
