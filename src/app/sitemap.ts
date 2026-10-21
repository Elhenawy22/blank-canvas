export const dynamic = "force-static";
import type { MetadataRoute } from "next";
import { localePath, locales } from "@/i18n/config";
import { projectPath, projects } from "@/data/portfolio";

/**
 * Localized sitemap with hreflang alternates.
 *
 * Sitemaps require absolute URLs, so nothing is emitted until the
 * production domain is confirmed through NEXT_PUBLIC_SITE_URL (the same
 * switch that activates canonical + hreflang metadata in the locale
 * layout). Once set, both the English root and the /ar route are listed
 * with their equivalents — no translation claims beyond what exists.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return [];

  const lastModified = new Date();
  const languages = {
    en: new URL(localePath("en"), siteUrl).toString(),
    ar: new URL(localePath("ar"), siteUrl).toString(),
    "x-default": new URL(localePath("en"), siteUrl).toString(),
  };

  const homePages = locales.map((locale) => ({
    url: new URL(localePath(locale), siteUrl).toString(),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: locale === "en" ? 1 : 0.9,
    alternates: { languages },
  }));

  const aboutLanguages = {
    en: new URL("/about", siteUrl).toString(),
    ar: new URL("/ar/about", siteUrl).toString(),
    "x-default": new URL("/about", siteUrl).toString(),
  };

  const aboutPages = locales.map((locale) => ({
    url: new URL(locale === "ar" ? "/ar/about" : "/about", siteUrl).toString(),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
    alternates: { languages: aboutLanguages },
  }));

  const projectPages = projects.flatMap((project) => {
    const englishPath = projectPath(project.slug);
    const arabicPath = `/ar${englishPath}`;
    const projectLanguages = {
      en: new URL(englishPath, siteUrl).toString(),
      ar: new URL(arabicPath, siteUrl).toString(),
      "x-default": new URL(englishPath, siteUrl).toString(),
    };

    return (["en", "ar"] as const).map((locale) => ({
      url: new URL(locale === "ar" ? arabicPath : englishPath, siteUrl).toString(),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: { languages: projectLanguages },
    }));
  });

  return [...homePages, ...aboutPages, ...projectPages];
}
