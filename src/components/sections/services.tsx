"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { ArrowIcon } from "@/components/icons";
import RevealWords from "@/components/motion/reveal-words";
import type { Dictionary } from "@/i18n/dictionaries";
import { useDict, useLoc, useSettings } from "@/lib/site-settings";
import { localizedPath } from "@/i18n/config";
import { ensureGsap, gsap, prefersReducedMotion, EASE } from "@/lib/motion";

/**
 * Services — four art-directed cards that rise into 3D view on scroll.
 * Hover floats the gradient layer; the arrow signal is hover-only.
 */
export default function Services({ dictionary: raw }: { dictionary: Dictionary }) {
  const dictionary = useDict(raw);
  const settings = useSettings();
  const loc = useLoc();
  const list = settings.servicesList;
  const services = {
    ...dictionary.services,
    items: list
      ? list.map((i) => ({ ...(i.text[loc] ?? i.text.ar ?? { title: "", description: "" }), image: i.image }))
      : dictionary.services.items.map((i, n) => ({ ...i, image: serviceArtwork[n % serviceArtwork.length] })),
  };
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || prefersReducedMotion()) return;

      ensureGsap();

      gsap.from(section.querySelectorAll(".service-card"), {
        yPercent: 10,
        rotateX: 9,
        autoAlpha: 0,
        transformPerspective: 1000,
        transformOrigin: "50% 100%",
        duration: 1.05,
        ease: EASE.out,
        stagger: 0.09,
        scrollTrigger: {
          trigger: section.querySelector(".services-grid"),
          start: "top 84%",
          once: true,
        },
      });
    },
    { scope: sectionRef },
  );

  return (
    <section className="section services-section" id="services" ref={sectionRef}>
      <div className="section-heading section-heading--left">
        <p className="eyebrow">{services.eyebrow}</p>
        <RevealWords
          ariaLabel={services.lines.join(" ")}
          className="section-heading__display"
          lines={services.lines}
        />
        <p className="section-heading__description" data-reveal>
          {services.description}
        </p>
      </div>

      <div className="services-grid">
        {services.items.map((service, index) => (
          <a
            aria-label={`${service.title}${services.cardAriaSuffix}`}
            className={`service-card ${styles[index % styles.length]}`}
            href={localizedPath(loc, `/services/${index + 1}`)}
            key={index}
          >
            <Image
              alt=""
              aria-hidden="true"
              className="service-card__art"
              fill
              sizes="(max-width: 700px) 100vw, 50vw"
              src={service.image}
            />
            <span aria-hidden="true" className="service-card__number">
              0{index + 1}
            </span>
            <span className="service-card__copy">
              <span className="service-card__title">{service.title}</span>
              <span className="service-card__description">{service.description}</span>
              {service.tags && service.tags.length ? (
                <span className="service-card__tags">
                  {service.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </span>
              ) : null}
            </span>
            <span className="service-card__arrow">
              <ArrowIcon />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

/** Card styles are presentation, not content — shared across locales. */
const styles = [
  "service-card--marketing",
  "service-card--identity",
  "service-card--social",
  "service-card--web",
  "service-card--ai",
  "service-card--content",
];

export const serviceArtwork = [
  "/images/concept-color.svg",
  "/images/concept-desert.svg",
  "/images/concept-skin.svg",
  "/images/concept-digital.svg",
  "/images/concept-digital.svg",
  "/images/concept-color.svg",
];
