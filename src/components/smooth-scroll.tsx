"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { ensureGsap, gsap, ScrollTrigger } from "@/lib/motion";

/**
 * Initializes Lenis smooth scrolling and keeps GSAP ScrollTrigger
 * synchronized with Lenis's update loop.
 *
 * Rendered once at the top of the page. Skips initialization for visitors
 * who prefer reduced motion, who keep the browser's native scrolling with
 * the CSS `scroll-behavior: smooth` fallback intact.
 *
 * `setScrollLock(locked)` is consumed by the header to freeze the page
 * behind the full-screen navigation overlay and by the preloader. While the
 * page is locked the scrollbar is hidden, which changes the document width;
 * every unlock therefore re-measures ScrollTrigger once the layout is back.
 */

let lenisInstance: Lenis | null = null;

/** Re-measure once the unlock has actually been painted. */
function refreshAfterUnlock(): void {
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => {
    if (document.documentElement.classList.contains("is-scroll-locked")) return;
    ScrollTrigger.refresh();
  });
}

export function setScrollLock(locked: boolean): void {
  if (lenisInstance) {
    if (locked) {
      lenisInstance.stop();
    } else {
      lenisInstance.start();
    }
  }
  // Native fallback so the page also freezes pre-Lenis / reduced-motion.
  document.documentElement.classList.toggle("is-scroll-locked", locked);
  if (!locked) refreshAfterUnlock();
}

export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    ensureGsap();

    // Anchor targets land with room below the fixed header. `scroll-padding-
    // top` in globals.css is the single source of truth: native anchor jumps
    // honour it, and Lenis subtracts it itself before applying `offset`. Pass
    // no extra offset here or it would be counted twice (landing ~204px low).
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Native touch scrolling stays untouched on mobile for input fidelity.
      syncTouch: false,
      anchors: true,
    });

    lenisInstance = lenis;

    // The preloader locks scrolling before this effect mounts. Respect that
    // lock so Lenis does not quietly re-enable wheel scrolling underneath it.
    if (document.documentElement.classList.contains("is-scroll-locked")) {
      lenis.stop();
    }

    lenis.on("scroll", ScrollTrigger.update);

    // One shared clock: Lenis advances on the GSAP ticker so ScrollTrigger
    // and smoothing never drift apart.
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Once fonts settle, re-measure every trigger.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh).catch(() => undefined);
    window.addEventListener("load", refresh);
    window.addEventListener("reach:preloaded", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      window.removeEventListener("reach:preloaded", refresh);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
      document.documentElement.classList.remove("is-scroll-locked");
    };
  }, []);

  return null;
}
