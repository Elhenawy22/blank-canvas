"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import ReachLogo from "./reach-logo";
import { ensureGsap, gsap, prefersReducedMotion } from "@/lib/motion";
import { setScrollLock } from "./smooth-scroll";

/**
 * Initial-load brand preloader.
 *
 * The markup is server-rendered so the purple panel covers the page before
 * hydration — the site never flashes through an empty loading screen. The
 * timeline is intentionally short; exit waits for the document and fonts
 * (with a hard cap) instead of pretending to measure a percentage.
 *
 * The logo is the traced two-layer SVG. The white lockup is already faintly
 * visible in the server-rendered first paint and brightens into place while
 * the yellow arrow lands independently, so the panel is never empty.
 *
 * Accessibility:
 *  - single polite status announcement, no per-frame live updates;
 *  - the page shell is made inert until the panel is gone;
 *  - reduced motion skips the intro and uses a 180ms fade;
 *  - no focusable controls and no focus trap.
 */
export default function Preloader({ label, status }: { label: string; status: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [ready, setReady] = useState(false);

  /* Real readiness + page lock + inert shell. */
  useEffect(() => {
    const reduced = prefersReducedMotion();
    setScrollLock(true);

    const shells = Array.from(
      document.querySelectorAll<HTMLElement>(
        "#main-content, .site-header, .site-footer, .skip-link",
      ),
    );
    shells.forEach((element) => element.setAttribute("inert", ""));

    let active = true;
    let capTimer = 0;
    let removeLoad = () => {};

    const loaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            const onLoad = () => resolve();
            window.addEventListener("load", onLoad, { once: true });
            removeLoad = () => window.removeEventListener("load", onLoad);
          });

    const fonts = document.fonts?.ready ?? Promise.resolve();
    const cap = new Promise<void>((resolve) => {
      capTimer = window.setTimeout(resolve, reduced ? 1200 : 2800);
    });

    Promise.race([Promise.allSettled([loaded, fonts]), cap]).then(() => {
      if (active) setReady(true);
    });

    return () => {
      active = false;
      window.clearTimeout(capTimer);
      removeLoad();
      shells.forEach((element) => element.removeAttribute("inert"));
      setScrollLock(false);
    };
  }, []);

  /* Intro — skipped entirely for reduced motion. */
  useGSAP(
    () => {
      ensureGsap();
      const root = rootRef.current;
      if (!root) return;

      if (prefersReducedMotion()) {
        setIntroDone(true);
        return;
      }

      const rtl = document.documentElement.dir === "rtl";

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => setIntroDone(true),
      });

      tl.fromTo(
        ".preloader__glow",
        { opacity: 0.45, scale: 0.82 },
        { opacity: 0.85, scale: 1, duration: 0.95, ease: "power2.out" },
        0,
      )
        .fromTo(
          ".preloader__logo",
          { opacity: 0.2, y: 12, scale: 1.025 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.75,
            ease: "power3.out",
          },
          0.05,
        )
        .fromTo(
          ".preloader__logo [data-reach-yellow]",
          { x: rtl ? -14 : 14, y: 12, opacity: 0, scale: 0.94 },
          {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.45,
            ease: "back.out(1.5)",
            transformOrigin: "50% 55%",
          },
          0.52,
        )
        .fromTo(
          ".preloader__meta",
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.4 },
          0.45,
        )
        .fromTo(
          ".preloader__bar",
          { scaleX: 0 },
          {
            scaleX: 0.84,
            duration: 0.8,
            ease: "power2.out",
            transformOrigin: rtl ? "right center" : "left center",
          },
          0.35,
        );

      return () => {
        tl.kill();
      };
    },
    { scope: rootRef },
  );

  /* Exit — only once the intro has finished and the page is actually ready. */
  useGSAP(
    () => {
      if (!ready || !introDone) return;
      const root = rootRef.current;
      if (!root) return;

      ensureGsap();
      root.style.pointerEvents = "none";

      const finish = () => {
        // `hidden` removes the overlay but keeps this component mounted, so
        // release the inert page shell here rather than relying on unmount.
        document
          .querySelectorAll<HTMLElement>(
            "#main-content[inert], .site-header[inert], .site-footer[inert], .skip-link[inert]",
          )
          .forEach((element) => element.removeAttribute("inert"));
        setHidden(true);
        setScrollLock(false);
        window.dispatchEvent(new Event("reach:preloaded"));
      };

      if (prefersReducedMotion()) {
        const reducedTl = gsap.timeline({ onComplete: finish });
        reducedTl.to(root, { autoAlpha: 0, duration: 0.18, ease: "none" });
        return () => {
          reducedTl.kill();
        };
      }

      const exit = gsap.timeline({ onComplete: finish });
      exit
        .to(".preloader__bar", { scaleX: 1, duration: 0.3, ease: "power2.inOut" }, 0)
        .to(
          ".preloader__logo",
          { yPercent: -7, opacity: 0, duration: 0.4, ease: "power2.in" },
          0.03,
        )
        .to(".preloader__meta", { opacity: 0, y: 8, duration: 0.28 }, 0.08)
        .to(root, { yPercent: -100, duration: 0.8, ease: "power4.inOut" }, 0.32);

      return () => {
        exit.kill();
      };
    },
    { scope: rootRef, dependencies: [ready, introDone] },
  );

  if (hidden) return null;

  return (
    <div
      className="preloader"
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-label={status}
      data-preloader=""
    >
      <div className="preloader__veil" aria-hidden="true" />
      <div className="preloader__glow" aria-hidden="true" />
      <div className="preloader__content">
        <div className="preloader__logo" aria-hidden="true">
          <ReachLogo decorative className="preloader__logo-svg" />
        </div>
        <div className="preloader__meta" aria-hidden="true">
          <span className="preloader__label">{label}</span>
          <span className="preloader__track">
            <span className="preloader__bar" data-preloader-bar="" />
          </span>
        </div>
      </div>
      <noscript>
        <style>{`.preloader{display:none!important}`}</style>
      </noscript>
    </div>
  );
}
