"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowIcon } from "@/components/icons";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/config";
import { ensureGsap, gsap, prefersReducedMotion, EASE } from "@/lib/motion";

/**
 * About / milestones — a dark statement board. The composition pins
 * briefly while its texture and numbers settle, then releases. With
 * reduced motion the section is a normal dark block (no pinning).
 */
export default function Milestones({
  dictionary,
  locale,
}: {
  dictionary: Dictionary;
  locale: Locale;
}) {
  const milestones = dictionary.milestones;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || prefersReducedMotion()) return;

      ensureGsap();

      // Entrance plays once while the section is approaching the pin —
      // so content is fully present the moment "top top" pins it. A user
      // anchor-jumping straight to #about lands on visible content.
      gsap.from(section.querySelectorAll(".milestones__intro > *"), {
        y: 46,
        autoAlpha: 0,
        duration: 0.9,
        ease: EASE.soft,
        stagger: 0.09,
        scrollTrigger: {
          trigger: section,
          start: "top 68%",
          once: true,
        },
      });

      gsap.from(section.querySelectorAll(".stat"), {
        y: 40,
        autoAlpha: 0,
        duration: 0.8,
        ease: EASE.soft,
        stagger: 0.08,
        scrollTrigger: {
          trigger: section,
          start: "top 62%",
          once: true,
        },
      });

      // The pinned phase is atmosphere only: texture parallax and a
      // gentle settle on the display heading — no hidden states involved.
      // It is desktop/tablet only: on phones the section stays in normal
      // flow so touch visitors are never held inside a long pin.
      const mm = gsap.matchMedia();
      mm.add("(min-width: 701px)", () => {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "+=60%",
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })
          .fromTo(
            section.querySelector(".milestones__texture"),
            { scale: 1.16, yPercent: -4 },
            { scale: 1, yPercent: 4, ease: "none" },
            0,
          )
          .fromTo(
            section.querySelector(".milestones__display"),
            { scale: 0.965 },
            { scale: 1, ease: "none" },
            0,
          );
      });

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  const [lineOne, lineTwo] = milestones.lines;

  return (
    <section className="milestones" id="about" ref={sectionRef}>
      <div className="milestones__texture" aria-hidden="true" />
      <div className="milestones__inner">
        <div className="milestones__intro">
          <p className="eyebrow eyebrow--light">{milestones.eyebrow}</p>
          <h2 aria-label={milestones.lines.join(" ")} className="milestones__display">
            {lineOne}<br />
            {lineTwo}
          </h2>
          <p>{milestones.description}</p>
          <a className="arrow-link" href={localizedPath(locale, "/about")}>
            {milestones.readMore} <ArrowIcon />
          </a>
        </div>
        <div className="milestones__stats">
          {milestones.stats.map((figure) => (
            <div className="stat" key={figure.label}>
              <span aria-hidden="true" className="stat__value">{figure.value}</span>
              <span className="stat__label">{figure.label}</span>
            </div>
          ))}
        </div>
        <p className="milestones__note">{milestones.note}</p>
      </div>
    </section>
  );
}
