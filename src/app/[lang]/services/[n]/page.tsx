import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServicePage from "@/components/service-page";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

type Params = { params: Promise<{ lang: string; n: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: 12 }, (_, i) => ({ n: String(i + 1) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, n } = await params;
  if (!isLocale(lang)) return {};
  const item = getDictionary(lang).services.items[Number(n) - 1];
  return { title: item?.title ?? getDictionary(lang).services.eyebrow, description: item?.description };
}

export default async function Page({ params }: Params) {
  const { lang, n } = await params;
  if (!isLocale(lang)) notFound();
  return <ServicePage locale={lang} n={Number(n)} />;
}
