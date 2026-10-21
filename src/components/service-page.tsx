"use client";

import { useEffect, useState } from "react";
import SiteFooter from "@/components/footer";
import SiteHeader from "@/components/header";
import WhatsAppFab from "@/components/whatsapp-fab";
import { ArrowIcon } from "@/components/icons";
import { serviceArtwork } from "@/components/sections/services";
import { localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { db } from "@/lib/db";
import { useDict, useSettings } from "@/lib/site-settings";

type Item = { id: string; title: string; image: string; link: string | null };

export default function ServicePage({ locale, n }: { locale: Locale; n: number }) {
  const dictionary = useDict(getDictionary(locale));
  const settings = useSettings();
  const list = settings.servicesList;
  const s = list
    ? { ...(list[n - 1]?.text[locale] ?? list[n - 1]?.text.ar ?? { title: "", description: "" }), image: list[n - 1]?.image }
    : { ...dictionary.services.items[n - 1], image: serviceArtwork[(n - 1) % serviceArtwork.length] };
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    db.from("cms_projects").select("id,title,image,link").eq("category", `service-${n}`).order("sort").order("created_at", { ascending: false })
      .then(({ data }) => setItems(data ?? []));
  }, [n]);
  const ar = locale === "ar";
  const home = localePath(locale);

  return (
    <>
      <SiteHeader dictionary={dictionary} locale={locale} subpath={`/services/${n}`} />
      <main className="project-page" id="main-content">
        <section className="project-hero">
          <div className="project-hero__intro">
            <a className="project-back" href={`${home}#services`}>
              <ArrowIcon />
              {ar ? "العودة للخدمات" : "Back to services"}
            </a>
            <p className="eyebrow">0{n}</p>
            <h1>{s?.title}</h1>
            <p className="project-hero__summary">{s?.description}</p>
            <a className="project-concept-tag" href={`${home}#contact`}>{ar ? "اطلب الخدمة" : "Request this service"}</a>
          </div>
          {s?.image ? (
            <figure className="project-hero__visual">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" src={s.image} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            </figure>
          ) : null}
        </section>
        <section className="section">
          <div className="project-grid">
            {items.map((p) => (
              <article className="project-card" key={p.id}>
                <a className="project-card__link" href={p.link || p.image} target="_blank" rel="noreferrer">
                  <div className="project-card__image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={p.title} src={p.image} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div className="project-card__info"><h3>{p.title}</h3></div>
                </a>
              </article>
            ))}
            {items.length === 0 && <p className="project-empty">{dictionary.work.empty}</p>}
          </div>
        </section>
      </main>
      <SiteFooter dictionary={dictionary} locale={locale} />
      <WhatsAppFab label={dictionary.contact.whatsappAria} />
    </>
  );
}
