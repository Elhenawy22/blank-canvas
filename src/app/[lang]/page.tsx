import { notFound } from "next/navigation";
import SitePage from "@/components/site-page";
import { isLocale } from "@/i18n/config";

/**
 * Shared homepage — one implementation serving every locale. The locale
 * picks the dictionary; direction and language come from the locale
 * layout's server-rendered <html> attributes.
 */

type Params = { params: Promise<{ lang: string }> };

export default async function LocalePage({ params }: Params) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return <SitePage locale={lang} />;
}
