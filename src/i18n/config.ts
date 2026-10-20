/**
 * Locale configuration — single source of truth for supported locales,
 * document direction, and route helpers. English stays at the site root
 * (established architecture) and Arabic lives under /ar.
 */

export const locales = ["en", "ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeDir: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
};

/** Locale display names for the switcher. */
export const localeLabels: Record<Locale, string> = {
  en: "EN",
  ar: "العربية",
};

/** Root path of a locale on this site. */
export function localePath(locale: Locale): string {
  return locale === defaultLocale ? "/" : `/${locale}`;
}

/** Locale-prefixed path. English stays unprefixed (`/about`, `/projects/x`). */
export function localizedPath(locale: Locale, subpath = ""): string {
  const base = localePath(locale);
  if (!subpath) return base;
  const path = subpath.startsWith("/") ? subpath : `/${subpath}`;
  return base === "/" ? path : `${base}${path}`;
}

/**
 * Resolve a header/footer item. Hash anchors stay on the locale home;
 * document paths (`/about`) pick up the locale prefix.
 */
export function siteHref(locale: Locale, href: string, fromSubpage = false): string {
  if (href.startsWith("#")) {
    if (!fromSubpage) return href;
    const home = localePath(locale);
    return home === "/" ? `/${href}` : `${home}${href}`;
  }
  return localizedPath(locale, href);
}

/** The opposite locale — used by every language switcher. */
export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "ar" : "en";
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
