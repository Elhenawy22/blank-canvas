"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import RevealWords from "@/components/motion/reveal-words";
import { categoryOrder, projects, type CategoryId } from "@/data/portfolio";
import type { Dictionary } from "@/i18n/dictionaries";
import { ensureGsap, gsap, prefersReducedMotion, EASE, ScrollTrigger } from "@/lib/motion";

/**
 * Selected work — filterable concept gallery.
 *
 * - Category filtering is preserved exactly as before (client state); it
 *   now keys on stable category ids so localized labels can never break
 *   the matcher.
 * - Card entrances run through one useGSAP whose dependencies include the
 *   active category; `revertOnUpdate` wipes its ScrollTriggers on every
 *   filter change so removed cards never leave dead triggers behind, and
 *   in-view cards re-stagger in.
 * - Each card's inner image drifts slightly while travelling through the
 *   viewport (transform-only scrub).
 */
export default function Work({ dictionary }: { dictionary: Dictionary }) {
  const work = dictionary.work;
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const sectionRef = useRef<HTMLElement>(null);

  const heading = (project: (typeof projects)[number]) => work.projects[project.slug];

  const visibleProjects =
    activeCategory === "all"
      ? projects
      : projects.filter((project) => project.categoryId === activeCategory);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      if (prefersReducedMotion()) return;

      ensureGsap();

      const cards = gsap.utils.toArray<HTMLElement>(".project-card", section);
      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          { y: 56, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 1,
            delay: (index % 2) * 0.08,
            ease: EASE.out,
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              once: true,
            },
          },
        );

        const image = card.querySelector(".project-card__image img");
        if (image) {
          gsap.fromTo(
            image,
            { yPercent: -7, scale: 1.14 },
            {
              yPercent: 7,
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
            },
          );
        }
      });
    },
    { scope: sectionRef, dependencies: [activeCategory], revertOnUpdate: true },
  );

  // Filtering changes the document height, so every trigger below the grid
  // must re-measure once the new cards have painted. Two frames let the
  // reverted entrance animations settle before the refresh reads the layout.
  useEffect(() => {
    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    return () => {
      window.cancelAnimationFrame(first);
      if (second) window.cancelAnimationFrame(second);
    };
  }, [activeCategory]);

  return (
    <section className="section work-section" id="work" ref={sectionRef}>
      <div className="section-heading section-heading--center">
        <p className="eyebrow">{work.eyebrow}</p>
        <RevealWords
          ariaLabel={work.lines.join(" ")}
          className="section-heading__display"
          lines={work.lines}
        />
      </div>

      <div aria-label={work.filtersAria} className="work-filters">
        {categoryOrder.map((categoryId) => (
          <button
            aria-pressed={activeCategory === categoryId}
            className={`filter-button${activeCategory === categoryId ? " is-active" : ""}`}
            key={categoryId}
            onClick={() => setActiveCategory(categoryId)}
            type="button"
          >
            {work.categories[categoryId]}
          </button>
        ))}
      </div>

      <div aria-label={work.gridAria} aria-live="polite" className="project-grid">
        {visibleProjects.map((project) => {
          const { title, alt } = heading(project);
          return (
            <article
              className={`project-card ${project.className}`}
              key={project.slug}
            >
              <a className="project-card__link" href={`/projects/${project.slug}`}>
                <div className="project-card__image">
                  <Image
                    alt={alt}
                    fill
                    sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 45vw"
                    src={project.image}
                  />
                  <span className="project-card__open" aria-hidden="true">↗</span>
                </div>
                <div className="project-card__info">
                  <h3>
                    {title}
                    <span className="project-card__kind">{work.projectTypes[project.kind]}</span>
                  </h3>
                  <p>{work.categories[project.categoryId]}</p>
                </div>
              </a>
            </article>
          );
        })}
        {visibleProjects.length === 0 && (
          <p className="project-empty">{work.empty}</p>
        )}
      </div>

      <p className="work-note">{work.disclaimer}</p>
    </section>
  );
}
