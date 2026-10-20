import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AboutPage from "@/components/about-page";
import { brand } from "@/data/brand";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const dictionary = getDictionary(lang);
  const meta = dictionary.about.meta;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const pathname = lang === "en" ? "/about" : `${localePath(lang)}/about`;

  return {
    title: meta.title,
    description: meta.description,
    ...(siteUrl
      ? {
          alternates: {
            canonical: pathname,
            languages: {
              en: "/about",
              ar: "/ar/about",
              "x-default": "/about",
            },
          },
          openGraph: {
            title: `${meta.title} — ${brand.name}`,
            description: meta.description,
            type: "website",
          },
        }
      : {}),
  };
}

export default async function LocalizedAboutPage({ params }: Params) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return <AboutPage locale={lang} />;
}
