"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import RevealWords from "@/components/motion/reveal-words";
import { setScrollLock } from "@/components/smooth-scroll";
import { showcaseItems, type ShowcaseId } from "@/data/showcase";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { attachStripDrag } from "@/lib/strip-drag";
import { ensureGsap, gsap, prefersReducedMotion } from "@/lib/motion";
import { useDict } from "@/lib/site-settings";

/**
 * Services-and-outcomes gallery. A seamless, auto-moving ribbon that travels
 * in the opposite direction to the sales-results strip, with a full detail
 * dialog for every card. The ribbon pauses on hover and focus, and while a
 * dialog is open.
 */
export default function Showcase({
  dictionary: rawDict,
  locale,
}: {
  dictionary: Dictionary;
  locale: Locale;
}) {
  const dictionary = useDict(rawDict);
  const copy = dictionary.showcase;
  const headingId = useId();
  const dialogTitleId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [activeId, setActiveId] = useState<ShowcaseId | null>(null);

  const active = showcaseItems.find((item) => item.id === activeId) ?? null;
  const activeCopy = active ? copy.items[active.id] : null;

  useGSAP(
    () => {
      const viewport = viewportRef.current;
      if (!viewport || prefersReducedMotion()) return;

      ensureGsap();

      const track = viewport.querySelector<HTMLElement>(".showcase-strip__track");
      if (!track) return;

      // The results strip travels toward the start edge of the reading
      // direction; this ribbon deliberately travels the other way. Starting
      // one full copy in and easing back to zero keeps the loop seamless.
      const startX = locale === "ar" ? 50 : -50;
      const tween = gsap.fromTo(
        track,
        { xPercent: startX },
        {
          xPercent: 0,
          duration: 72,
          ease: "none",
          repeat: -1,
        },
      );
      tweenRef.current = tween;
      const detachDrag = attachStripDrag(viewport, track, tween, locale === "ar" ? -1 : 1);

      let snappedForFocus = false;

      const pause = () => tween.pause();
      const play = () => {
        if (!dialogRef.current?.open) tween.play();
      };

      const handleFocusIn = (event: FocusEvent) => {
        tween.pause();
        const target = event.target as HTMLElement | null;
        if (!target) return;
        // The accessible copy is the second one. If keyboard focus lands on
        // it while that copy is outside the viewport, bring it back before
        // the focus ring disappears off-screen.
        const rect = target.getBoundingClientRect();
        if (rect.right < 0 || rect.left > window.innerWidth) {
          gsap.set(track, { xPercent: startX });
          snappedForFocus = true;
        }
      };

      const handleFocusOut = (event: FocusEvent) => {
        if (viewport.contains(event.relatedTarget as Node)) return;
        if (dialogRef.current?.open) return;
        if (snappedForFocus) {
          snappedForFocus = false;
          tween.restart();
        } else {
          tween.play();
        }
      };

      viewport.addEventListener("pointerenter", pause);
      viewport.addEventListener("pointerleave", play);
      viewport.addEventListener("focusin", handleFocusIn);
      viewport.addEventListener("focusout", handleFocusOut);

      return () => {
        viewport.removeEventListener("pointerenter", pause);
        viewport.removeEventListener("pointerleave", play);
        viewport.removeEventListener("focusin", handleFocusIn);
        viewport.removeEventListener("focusout", handleFocusOut);
        detachDrag();
        tweenRef.current = null;
      };
    },
    { scope: sectionRef, dependencies: [locale] },
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (active) {
      if (!dialog.open) dialog.showModal();
      setScrollLock(true);
      tweenRef.current?.pause();
    } else {
      if (dialog.open) dialog.close();
      setScrollLock(false);
      if (!prefersReducedMotion()) tweenRef.current?.play();
      lastTriggerRef.current?.focus();
    }

    return () => setScrollLock(false);
  }, [active]);

  const openCase = (id: ShowcaseId, trigger: HTMLButtonElement) => {
    lastTriggerRef.current = trigger;
    setActiveId(id);
  };

  const closeCase = () => setActiveId(null);

  return (
    <section
      aria-labelledby={headingId}
      className="showcase-section"
      id="showcase"
      ref={sectionRef}
    >
      <div className="section showcase-section__intro">
        <div className="section-heading section-heading--left">
          <p className="eyebrow">{copy.eyebrow}</p>
          <RevealWords
            ariaLabel={copy.lines.join(" ")}
            className="section-heading__display"
            id={headingId}
            lines={copy.lines}
          />
          <p className="section-heading__description">{copy.description}</p>
        </div>
      </div>

      <div
        aria-label={copy.trackAria}
        className="showcase-strip"
        ref={viewportRef}
      >
        <div className="showcase-strip__track">
          {[0, 1].map((copyIndex) => (
            <ul
              aria-hidden={copyIndex === 0}
              className="showcase-strip__list"
              key={copyIndex}
            >
              {showcaseItems.map((item) => {
                const card = copy.items[item.id];
                return (
                  <li key={`${copyIndex}-${item.id}`}>
                    <button
                      className="showcase-card"
                      onClick={(event) => openCase(item.id, event.currentTarget)}
                      tabIndex={copyIndex === 0 ? -1 : 0}
                      type="button"
                    >
                      <span className="sr-only">
                        {card.title}. {copy.openHint}
                      </span>
                      <span className="showcase-card__media" aria-hidden="true">
                        <Image
                          alt=""
                          fill
                          sizes="(max-width: 700px) 76vw, 19rem"
                          src={item.image}
                        />
                        <span className="showcase-card__cue">+</span>
                      </span>
                      <span className="showcase-card__caption" aria-hidden="true">
                        <span className="showcase-card__category">
                          {card.category}
                        </span>
                        <span className="showcase-card__title">{card.title}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>

      <dialog
        aria-labelledby={dialogTitleId}
        aria-modal="true"
        className="showcase-dialog"
        onCancel={(event) => {
          event.preventDefault();
          closeCase();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeCase();
        }}
        ref={dialogRef}
      >
        {active && activeCopy ? (
          <div className="showcase-dialog__panel">
            <button
              className="showcase-dialog__close"
              onClick={closeCase}
              type="button"
            >
              {copy.close}
            </button>

            <div className="showcase-dialog__media">
              <Image
                alt={activeCopy.alt}
                height={active.height}
                sizes="(max-width: 860px) 92vw, 460px"
                src={active.image}
                width={active.width}
              />
            </div>

            <div className="showcase-dialog__details">
              <p className="showcase-dialog__kicker">
                {activeCopy.kind === "service"
                  ? copy.serviceLabel
                  : copy.resultLabel}
                <span>{activeCopy.category}</span>
              </p>
              <h3 id={dialogTitleId}>{activeCopy.title}</h3>
              <p className="showcase-dialog__summary">{activeCopy.summary}</p>

              {activeCopy.deliverables ? (
                <div className="showcase-dialog__block">
                  <h4>{copy.deliverablesHeading}</h4>
                  <ul className="showcase-dialog__list">
                    {activeCopy.deliverables.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {activeCopy.metrics ? (
                <div className="showcase-dialog__block">
                  <h4>{copy.highlightsHeading}</h4>
                  <dl className="showcase-dialog__metrics">
                    {activeCopy.metrics.map((metric) => (
                      <div key={metric.label}>
                        <dt>{metric.label}</dt>
                        <dd>{metric.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
