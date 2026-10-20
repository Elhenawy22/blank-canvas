import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import "../globals.css";
import { brand } from "@/data/brand";
import Preloader from "@/components/preloader";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, localeDir, localePath, locales } from "@/i18n/config";

/**
 * Root layout, nested under the locale segment (per the Next.js
 * internationalization guide). Rendering `<html lang>` / `dir` here keeps
 * the document language and direction server-correct for both routes:
 *   /    → lang="en" dir="ltr"
 *   /ar  → lang="ar" dir="rtl"
 */

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const dynamicParams = false;

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const dictionary = getDictionary(lang);
  const meta = dictionary.meta;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  // Set NEXT_PUBLIC_SITE_URL (e.g. https://reach.agency) when the domain
  // is confirmed; canonical links, hreflang alternates and absolute OG
  // references then activate.
  return {
    title: {
      default: `${brand.name} — ${meta.title}`,
      template: `%s — ${brand.name}`,
    },
    description: meta.description,
    applicationName: brand.name,
    ...(siteUrl
      ? {
          metadataBase: new URL(siteUrl),
          alternates: {
            canonical: localePath(lang),
            languages: {
              en: localePath("en"),
              ar: localePath("ar"),
              "x-default": localePath("en"),
            },
          },
        }
      : {}),
    openGraph: {
      title: `${brand.name} — ${meta.title}`,
      description: meta.description,
      type: "website",
      siteName: brand.name,
      locale: lang === "ar" ? "ar" : "en_US",
      alternateLocale: lang === "ar" ? "en_US" : "ar",
    },
    icons: {
      icon: [
        { url: "/brand/reach-icon.svg", type: "image/svg+xml" },
        { url: "/brand/reach-icon-192.png", type: "image/png", sizes: "192x192" },
        { url: "/brand/reach-icon-512.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/brand/reach-icon-180.png", type: "image/png", sizes: "180x180" }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#080a24",
  colorScheme: "dark",
};

export default async function LocaleLayout({
  children,
  params,
}: Params & { children: React.ReactNode }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  // Both weights are used above the fold (hero display + body/nav), so
  // warm the browser cache as early as possible. Keeping the TTF files in
  // /public preserves their use by the OG image renderer and the global
  // 404 document, which render outside this layout.
  preload("/fonts/alexandria-regular.ttf", {
    as: "font",
    type: "font/ttf",
    crossOrigin: "anonymous",
  });
  preload("/fonts/alexandria-bold.ttf", {
    as: "font",
    type: "font/ttf",
    crossOrigin: "anonymous",
  });

  const dictionary = getDictionary(lang);

  return (
    <html dir={localeDir[lang]} lang={lang}>
      <body>
        <Preloader label={dictionary.preloader.label} status={dictionary.preloader.status} />
        {children}
      </body>
    </html>
  );
}
