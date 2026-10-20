"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowIcon } from "./icons";
import { BrandLogo } from "./brand-logo";
import LocaleLink from "./locale-link";
import type { Dictionary } from "@/i18n/dictionaries";
import { localeLabels, localePath, localizedPath, otherLocale, siteHref, type Locale } from "@/i18n/config";
import { setScrollLock } from "./smooth-scroll";
import { ensureGsap, gsap, hasFinePointer } from "@/lib/motion";

/**
 * Fixed brand header.
 *
 * - Gains a translucent, blurred backdrop once the page scrolls (class
 *   toggled directly on the element — no React state during scrolling).
 * - A language switcher (anchor links to the equivalent locale route —
 *   full document navigation keeps `lang`/`dir` server-rendered).
 * - Desktop links highlight the section currently crossing the viewport
 *   centre via a small IntersectionObserver (budget scroll-spy).
 * - Below 900px the navigation becomes a full-screen overlay whose links
 *   stagger in with GSAP. Scroll is locked behind the overlay and restored
 *   on close (Escape, link click, or the toggle).
 */
export default function SiteHeader({
  dictionary,
  locale,
  subpath,
}: {
  dictionary: Dictionary;
  locale: Locale;
  subpath?: string;
}) {
  const nav = dictionary.nav;
  const lang = dictionary.language;
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setMenuOpen(false);

  // Scroll-aware header styling without triggering re-renders.
  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header) return;

      const update = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 24);
      };
      update();

      let raf = 0;
      const onScroll = () => {
        if (raf) return;
        raf = window.requestAnimationFrame(() => {
          update();
          raf = 0;
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        if (raf) window.cancelAnimationFrame(raf);
      };
    },
    { scope: headerRef },
  );

  // Scroll-spy: highlight the section crossing the viewport centre band.
  useEffect(() => {
    const links = Array.from(
      headerRef.current?.querySelectorAll<HTMLAnchorElement>(".site-header__links a") ?? [],
    );
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    const onAbout = path === "/about" || path.endsWith("/about");

    const set = (id: string | null) => {
      for (const link of links) {
        const href = link.getAttribute("href") ?? "";
        const active = onAbout
          ? href.includes("/about")
          : id !== null && link.hash === `#${id}`;
        link.classList.toggle("is-active", active);
        if (active) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      }
    };

    if (onAbout) {
      set(null);
      return;
    }

    const sections = links
      .filter((link) => link.hash.length > 1)
      .map((link) => document.querySelector<HTMLElement>(link.hash))
      .filter((section): section is HTMLElement => section !== null);
    if (!links.length || !("IntersectionObserver" in window)) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.intersectionRatio);
          } else {
            visible.delete(entry.target.id);
          }
        }
        let best: { id: string; ratio: number } | null = null;
        for (const [id, ratio] of visible) {
          if (!best || ratio > best.ratio) best = { id, ratio };
        }
        set(best?.id ?? null);
      },
      { rootMargin: "-38% 0px -52% 0px", threshold: [0, 0.1, 0.28, 0.55] },
    );

    for (const section of sections) observer.observe(section);
    return () => {
      observer.disconnect();
      for (const link of links) {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      }
    };
  }, [nav.links]);

  // Overlay entrance animation.
  useGSAP(
    () => {
      if (!menuOpen || !overlayRef.current) return;
      ensureGsap();
      if (hasFinePointer() && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .fromTo(
            overlayRef.current,
            { autoAlpha: 0, y: -0.55 * 16 },
            { autoAlpha: 1, y: 0, duration: 0.5 },
          )
          .fromTo(
            overlayRef.current.querySelectorAll("[data-overlay-item]"),
            { autoAlpha: 0, y: 26 },
            { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.055 },
            "-=0.22",
          );
      }
    },
    { dependencies: [menuOpen], scope: overlayRef, revertOnUpdate: true },
  );

  // Scroll lock + Escape handling for the overlay. Only touch the lock when
  // the menu actually opens: on mount the preloader may already own it.
  useEffect(() => {
    if (!menuOpen) return;
    setScrollLock(true);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      setScrollLock(false);
    };
  }, [menuOpen]);

  useEffect(() => {
    return () => setScrollLock(false);
  }, []);

  const switchTarget = otherLocale(locale);
  const homePath = localePath(locale);
  const fromSubpage = Boolean(subpath);
  const navHref = (href: string) => siteHref(locale, href, fromSubpage);
  const switchPath = localizedPath(switchTarget, subpath);

  return (
    <header
      className={`site-header${menuOpen ? " is-menu-open" : ""}`}
      ref={headerRef}
    >
      <div className="site-header__inner">
        <BrandLogo
          ariaLabel={nav.logoAria}
          homeHref={fromSubpage ? homePath : "#home"}
        />
        <nav aria-label={nav.navAria} className="site-header__links">
          {nav.links.map((link) => (
            <a href={navHref(link.href)} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <LanguageSwitch
          current={locale}
          dictionary={dictionary}
          href={switchPath}
        />
        <div className="header-actions">
          <a className="button button--dark header-cta" href={navHref("#contact")}>
            {nav.requestCta}
          </a>
          <button
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            aria-label={menuOpen ? nav.menuClose : nav.menuOpen}
            className={`menu-toggle${menuOpen ? " is-open" : ""}`}
            onClick={() => setMenuOpen((open) => !open)}
            ref={toggleRef}
            type="button"
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <nav
        aria-label={nav.overlayAria}
        className={`navigation${menuOpen ? " navigation--open" : ""}`}
        id="main-navigation"
        inert={!menuOpen}
        ref={overlayRef}
      >
        <div className="navigation__menu">
          {nav.links.map((link, index) => (
            <a
              data-overlay-item
              href={navHref(link.href)}
              key={link.href}
              onClick={closeMenu}
            >
              <i aria-hidden="true">0{index + 1}</i>
              <span>{link.label}</span>
              <ArrowIcon />
            </a>
          ))}
          <a
            className="navigation__cta"
            data-overlay-item
            href={navHref("#contact")}
            onClick={closeMenu}
          >
            {nav.requestCta} <ArrowIcon />
          </a>
          <div data-overlay-item className="navigation__lang">
            <LocaleLink
              href={switchPath}
              hrefLang={switchTarget}
              lang={switchTarget}
              onClick={closeMenu}
            >
              <span>{lang.aria}</span>
              <strong lang={switchTarget}>{localeLabels[switchTarget]}</strong>
              <ArrowIcon />
            </LocaleLink>
          </div>
        </div>
      </nav>
    </header>
  );
}

/**
 * Inline locale switcher — the equivalent page in the other language.
 * The active locale is a marked span (not a link); the target is a plain
 * anchor so navigating swaps the whole document (correct `lang`/`dir`).
 */
function LanguageSwitch({
  current,
  dictionary,
  href,
}: {
  current: Locale;
  dictionary: Dictionary;
  href: string;
}) {
  const lang = dictionary.language;
  const target = otherLocale(current);

  return (
    <div aria-label={lang.aria} className="lang-switch" role="group">
      <span aria-current="true" className="lang-switch__item is-current">
        {localeLabels[current]}
        <span className="sr-only"> {lang.currentSuffix}</span>
      </span>
      <LocaleLink
        className="lang-switch__item"
        href={href}
        hrefLang={target}
        lang={target}
        title={lang.switchTo[target]}
      >
        {localeLabels[target]}
      </LocaleLink>
    </div>
  );
}
