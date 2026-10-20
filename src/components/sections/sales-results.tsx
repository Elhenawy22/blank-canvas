"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import RevealWords from "@/components/motion/reveal-words";
import { setScrollLock } from "@/components/smooth-scroll";
import { salesResults, type SalesResult } from "@/data/sales-results";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { ensureGsap, gsap, prefersReducedMotion } from "@/lib/motion";

/**
 * Homepage sales-results ribbon. Cards loop continuously (paused on
 * hover and while a report is open). Clicking a card opens a dialog with
 * the full report image and the campaign details underneath.
 */
export default function SalesResults({
  dictionary,
  locale,
}: {
  dictionary: Dictionary;
  locale: Locale;
}) {
  const copy = dictionary.results;
  const headingId = useId();
  const dialogTitleId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [activeId, setActiveId] = useState<SalesResult["id"] | null>(null);

  const active = salesResults.find((item) => item.id === activeId) ?? null;
  const activeCopy = active ? copy.cases[active.id] : null;

  useGSAP(
    () => {
      const viewport = viewportRef.current;
      if (!viewport || prefersReducedMotion()) return;

      ensureGsap();

      const tween = gsap.to(viewport.querySelector(".results-strip__track"), {
        xPercent: locale === "ar" ? 50 : -50,
        duration: 48,
        ease: "none",
        repeat: -1,
      });
      tweenRef.current = tween;

      const pause = () => tween.pause();
      const play = () => {
        if (!dialogRef.current?.open) tween.play();
      };

      viewport.addEventListener("pointerenter", pause);
      viewport.addEventListener("pointerleave", play);
      viewport.addEventListener("focusin", pause);
      viewport.addEventListener("focusout", play);

      return () => {
        viewport.removeEventListener("pointerenter", pause);
        viewport.removeEventListener("pointerleave", play);
        viewport.removeEventListener("focusin", pause);
        viewport.removeEventListener("focusout", play);
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

  const openCase = (id: SalesResult["id"], trigger: HTMLButtonElement) => {
    lastTriggerRef.current = trigger;
    setActiveId(id);
  };

  const closeCase = () => setActiveId(null);

  const metricItems = active
    ? [
        {
          label: copy.metricLabels.sales,
          value: active.metrics.sales,
          delta: active.metrics.salesDelta,
        },
        {
          label: copy.metricLabels.orders,
          value: active.metrics.orders,
          delta: active.metrics.ordersDelta,
        },
        {
          label: copy.metricLabels.conversion,
          value: active.metrics.conversion,
          delta: active.metrics.conversionDelta,
        },
        ...(active.metrics.aov
          ? [{ label: copy.metricLabels.aov, value: active.metrics.aov }]
          : []),
        {
          label: copy.metricLabels.period,
          value: `${active.metrics.period} ${copy.periodSuffix}`,
        },
      ]
    : [];

  return (
    <section
      aria-labelledby={headingId}
      className="results-section"
      id="results"
      ref={sectionRef}
    >
      <div className="section results-section__intro">
        <div className="section-heading section-heading--center">
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
        className="results-strip"
        ref={viewportRef}
      >
        <div className="results-strip__track">
          {[0, 1].map((copyIndex) => (
            <ul
              aria-hidden={copyIndex === 1}
              className="results-strip__list"
              key={copyIndex}
            >
              {salesResults.map((item) => {
                const card = copy.cases[item.id];
                return (
                  <li key={`${copyIndex}-${item.id}`}>
                    <button
                      className="results-card"
                      onClick={(event) => openCase(item.id, event.currentTarget)}
                      tabIndex={copyIndex === 1 ? -1 : 0}
                      type="button"
                    >
                      <span className="sr-only">
                        {card.title}. {copy.openHint}
                      </span>
                      <span className="results-card__media" aria-hidden="true">
                        <Image
                          alt=""
                          fill
                          sizes="(max-width: 700px) 78vw, 320px"
                          src={item.image}
                        />
                      </span>
                      <span className="results-card__caption" aria-hidden="true">
                        <span className="results-card__market">{card.market}</span>
                        <span className="results-card__title">{card.title}</span>
                        <span className="results-card__stat">
                          {item.metrics.sales}
                          {item.metrics.salesDelta ? (
                            <em>{item.metrics.salesDelta}</em>
                          ) : null}
                        </span>
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
        className="results-dialog"
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
          <div className="results-dialog__panel">
            <button
              className="results-dialog__close"
              onClick={closeCase}
              type="button"
            >
              {copy.close}
            </button>
            <div className="results-dialog__image">
              <Image
                alt={activeCopy.alt}
                height={1080}
                sizes="(max-width: 760px) 92vw, 640px"
                src={active.image}
                width={1080}
              />
            </div>
            <div className="results-dialog__details">
              <p className="results-dialog__kicker">
                {activeCopy.subtitle}
                <span>{activeCopy.market}</span>
              </p>
              <h3 id={dialogTitleId}>{activeCopy.title}</h3>
              <p className="results-dialog__summary">{activeCopy.summary}</p>
              <dl className="results-dialog__metrics">
                {metricItems.map((metric) => (
                  <div key={metric.label}>
                    <dt>{metric.label}</dt>
                    <dd>
                      {metric.value}
                      {"delta" in metric && metric.delta ? (
                        <em>{metric.delta}</em>
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
