"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowIcon } from "@/components/icons";
import SocialLinks from "@/components/social-links";
import ReachLogo from "@/components/reach-logo";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  ensureGsap,
  gsap,
  prefersReducedMotion,
  hasFinePointer,
  EASE,
  SplitText,
} from "@/lib/motion";
import { useDict } from "@/lib/site-settings";

/**
 * The hero pairs its localized copy with a lightweight CSS 3D scene. Scroll
 * progress rotates the scene in either direction without video, canvas,
 * WebGL, or per-frame React state.
 */
function heroScrollDistance(): number {
  const viewport = window.innerHeight || 800;
  const compact = window.innerWidth <= 700;
  return Math.round(Math.max(compact ? 520 : 680, viewport * (compact ? 0.9 : 1.25)));
}

export default function Hero({
  dictionary: rawDict,
  locale,
}: {
  dictionary: Dictionary;
  locale: string;
}) {
  const dictionary = useDict(rawDict);
  const heroRef = useRef<HTMLElement>(null);
  const isArabic = locale === "ar";

  useGSAP(
    () => {
      const hero = heroRef.current;
      if (!hero) return;

      ensureGsap();
      if (prefersReducedMotion()) return;

      const title = hero.querySelector<HTMLElement>(".hero__title");
      const eyebrow = hero.querySelector(".hero__eyebrow");
      const description = hero.querySelector(".hero__description");
      const actions = hero.querySelector(".hero__actions");
      const foot = hero.querySelector(".hero__foot");
      const aurora = hero.querySelector(".hero__aurora");
      const scene = hero.querySelector<HTMLElement>(".hero__scene");
      const sceneLogo = hero.querySelector<HTMLElement>(".hero__scene-logo");
      const sceneModels = Array.from(
        hero.querySelectorAll<HTMLElement>(".hero__scene-model"),
      );
      const footItems = foot ? Array.from(foot.children) : [];

      if (!title) return;

      const split = SplitText.create(title, {
        type: isArabic ? "words" : "chars",
        mask: isArabic ? "words" : "chars",
        aria: "auto",
        autoSplit: true,
        onSplit: (self) => {
          const targets = isArabic ? self.words : self.chars;
          if (!targets?.length) return undefined;
          return gsap.from(targets, {
            yPercent: 118,
            rotate: isArabic ? 0 : 4,
            duration: 1.25,
            ease: EASE.out,
            stagger: isArabic ? 0.085 : 0.042,
            delay: 0.3,
          });
        },
      });

      gsap
        .timeline({ delay: 0.3 })
        .from(
          [eyebrow, description, actions, ...footItems].filter(Boolean),
          { y: 26, autoAlpha: 0, duration: 0.9, ease: EASE.soft, stagger: 0.09 },
          0.28,
        )
        .from(
          [aurora, scene].filter(Boolean),
          { autoAlpha: 0, scale: 1.12, duration: 2.1, ease: EASE.out },
          0,
        );

      const applySceneProgress = (progress: number) => {
        if (!scene) return;
        scene.dataset.progress = progress.toFixed(4);

        const [orbit, ring, largeCube, sphere, smallCube] = sceneModels;
        if (!orbit || !ring || !largeCube || !sphere || !smallCube) return;

        if (sceneLogo) {
          gsap.set(sceneLogo, {
            autoAlpha: 0.16 + progress * 0.84,
            scale: 0.68 + progress * 0.34,
            rotationZ: -12 + progress * 12,
            y: 22 - progress * 22,
          });
        }

        gsap.set(orbit, {
          rotationZ: -18 + progress * 68,
          rotationX: 58 + progress * 16,
        });
        gsap.set(ring, {
          rotationY: -32 - progress * 86,
          rotationX: 66 + progress * 10,
        });
        gsap.set(largeCube, {
          rotationX: 24 + progress * 54,
          rotationY: -34 + progress * 82,
          rotationZ: -8 + progress * 24,
          y: -24 * progress,
        });
        gsap.set(sphere, { rotationY: 20 + progress * 115, y: 30 * progress });
        gsap.set(smallCube, {
          rotationX: 18 - progress * 72,
          rotationY: 30 + progress * 96,
          rotationZ: 14 - progress * 38,
          y: -42 * progress,
        });
      };

      gsap.timeline({
        defaults: { duration: 1, ease: "none" },
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: () => `+=${heroScrollDistance()}`,
          scrub: 0.35,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => applySceneProgress(self.progress),
          onRefresh: (self) => applySceneProgress(self.progress),
        },
      })
        .to(".hero__content", { yPercent: -30, autoAlpha: 0 }, 0)
        .to(".hero__aurora i", { yPercent: -30, scale: 1.12 }, 0)
        .to(foot, { autoAlpha: 0, y: 20 }, 0)
        .to(sceneModels, { scale: 0.88 }, 0);

      gsap.fromTo(
        ".hero__scroll-line",
        { scaleX: 0.25, transformOrigin: isArabic ? "right center" : "left center" },
        { scaleX: 1, duration: 1.5, repeat: -1, yoyo: true, ease: "sine.inOut" },
      );

      let onMove: ((event: PointerEvent) => void) | undefined;
      if (hasFinePointer() && aurora) {
        const auroraX = gsap.quickTo(aurora, "x", { duration: 1.6, ease: EASE.soft });
        const auroraY = gsap.quickTo(aurora, "y", { duration: 1.6, ease: EASE.soft });

        onMove = (event: PointerEvent) => {
          const relX = event.clientX / window.innerWidth - 0.5;
          const relY = event.clientY / window.innerHeight - 0.5;
          auroraX(relX * -12);
          auroraY(relY * -9);
        };

        window.addEventListener("pointermove", onMove, { passive: true });
      }

      return () => {
        if (onMove) window.removeEventListener("pointermove", onMove);
        split.revert();
      };
    },
    { scope: heroRef, dependencies: [isArabic] },
  );

  return (
    <section className="hero" id="home" ref={heroRef}>
      <div className="hero__aurora" aria-hidden="true">
        <i className="hero__aurora-blob hero__aurora-blob--blue" />
        <i className="hero__aurora-blob hero__aurora-blob--gold" />
        <i className="hero__aurora-blob hero__aurora-blob--purple" />
      </div>

      <div className="hero__scene" aria-hidden="true" data-progress="0">
        <i className="hero__scene-glow" />
        <div className="hero__scene-logo">
          <ReachLogo decorative />
        </div>
        <i className="hero__scene-model hero__scene-orbit">
          <i className="hero__scene-satellite" />
        </i>
        <i className="hero__scene-model hero__scene-ring" />
        <i className="hero__scene-model hero__scene-sphere" />
        <div className="hero__scene-model hero__scene-cube hero__scene-cube--large">
          {Array.from({ length: 6 }, (_, index) => (
            <i className={`hero__scene-face hero__scene-face--${index + 1}`} key={index} />
          ))}
        </div>
        <div className="hero__scene-model hero__scene-cube hero__scene-cube--small">
          {Array.from({ length: 6 }, (_, index) => (
            <i className={`hero__scene-face hero__scene-face--${index + 1}`} key={index} />
          ))}
        </div>
        <i className="hero__scene-ground" />
      </div>

      <div className="hero__grain" aria-hidden="true" />
      <div className="hero__haze" aria-hidden="true" />

      <div className="hero__content">
        <p className="eyebrow hero__eyebrow">{dictionary.hero.eyebrow}</p>
        <h1 aria-label={dictionary.hero.titleAria} className="hero__title">
          {dictionary.hero.title.map((line) => (
            <span className="hero__title-line" key={line}>
              {line}
            </span>
          ))}
        </h1>
        <p className="hero__description">{dictionary.hero.description}</p>
        <div className="hero__actions">
          <a className="button button--dark hero__button" href="#contact">
            {dictionary.hero.primaryCta} <ArrowIcon />
          </a>
          <a className="arrow-link" href="#work">
            {dictionary.hero.secondaryCta} <ArrowIcon />
          </a>
        </div>
      </div>

      <div className="hero__foot">
        <SocialLinks className="social-links" dictionary={dictionary} />
        <a className="hero__scroll" href="#services">
          <span>{dictionary.hero.scrollCue}</span>
          <span className="hero__scroll-line" />
        </a>
      </div>
    </section>
  );
}
