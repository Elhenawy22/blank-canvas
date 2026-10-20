import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/**
 * Shared motion foundation.
 *
 * - GSAP plugins are registered lazily and idempotently so client
 *   components can call `ensureGsap()` inside their effects.
 * - All helpers are browser-only; never call them during SSR.
 */

let pluginsRegistered = false;

/** Register plugins once per session, the first time any client
 *  component asks for motion. `registerPlugin` tolerates repeats, but the
 *  flag keeps every call site cheap. */
export function ensureGsap(): void {
  if (pluginsRegistered) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.registerPlugin(SplitText);
  // Mobile browsers resize the viewport when their toolbars collapse; that
  // is not a layout change and must not re-measure (and jump) every pin.
  ScrollTrigger.config({ ignoreMobileResize: true });
  pluginsRegistered = true;
}

/** True when the visitor prefers reduced motion. Evaluated on demand so
 *  value changes are always picked up by freshly-run animations. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True on devices with a fine pointer (mouse/trackpad/pen). Used to gate
 *  pointer-following effects away from touch devices. */
export function hasFinePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
}

/** True on touch-primary small devices where heavy motion is skipped. */
export function prefersLightMotion(): boolean {
  return prefersReducedMotion() || !hasFinePointer();
}

/** Signature easings so every section feels cut from the same cloth. */
export const EASE = {
  out: "power4.out",
  soft: "power3.out",
  inOut: "power2.inOut",
} as const;

/**
 * Scroll-entrance system driven by data attributes so sections stay declarative:
 *
 *   <div data-reveal>…</div>               — fades/rises on its own trigger
 *   <div data-reveal-group>                — coordinates its children:
 *     <div data-reveal-child>…</div> …     — staggered rise
 *     <div data-reveal-child="0.15">…</div> — with an extra delay (seconds)
 *
 * `data-reveal="0.3"` accepts a delay in seconds. Initial states are set by
 * JS only, so the page remains fully visible without JavaScript and for
 * reduced-motion visitors.
 *
 * Returns a cleanup that reverts the created tweens/triggers, so a mount
 * that goes away (route change, re-render) never leaves dead triggers behind.
 */
export function autoReveal(container: Element | null): () => void {
  ensureGsap();
  if (!container || prefersReducedMotion()) return () => {};

  const selector = gsap.utils.selector(container);

  const context = gsap.context(() => {
    const singles = selector<HTMLElement>("[data-reveal]");
    singles.forEach((el) => {
      gsap.fromTo(
        el,
        { y: 38, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 1,
          delay: Number(el.dataset.reveal || 0),
          ease: EASE.soft,
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true,
          },
        },
      );
    });

    const groups = selector<HTMLElement>("[data-reveal-group]");
    groups.forEach((group) => {
      const children = Array.from(
        group.querySelectorAll<HTMLElement>("[data-reveal-child]"),
      );
      children.forEach((child, index) => {
        gsap.fromTo(
          child,
          { y: 44, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.95,
            delay: Number(child.dataset.revealChild || 0) + index * 0.09,
            ease: EASE.soft,
            scrollTrigger: {
              trigger: group,
              start: "top 85%",
              once: true,
            },
          },
        );
      });
    });
  }, container);

  return () => context.revert();
}

export { gsap, ScrollTrigger, SplitText };
