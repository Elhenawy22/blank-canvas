import SiteFooter from "@/components/footer";
import SiteHeader from "@/components/header";
import SmoothScroll from "@/components/smooth-scroll";
import WhatsAppFab from "@/components/whatsapp-fab";
import { ArrowIcon, WhatsAppIcon } from "@/components/icons";
import { brand } from "@/data/brand";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default function AboutPage({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const about = dictionary.about;
  const homeHref = localePath(locale);

  return (
    <>
      <SmoothScroll />
      <a className="skip-link" href="#main-content">
        {dictionary.nav.skipToContent}
      </a>
      <SiteHeader dictionary={dictionary} locale={locale} subpath="/about" />
      <main className="about-page" id="main-content">
        <section className="about-hero">
          <a className="project-back" href={homeHref}>
            <ArrowIcon />
            {about.backHome}
          </a>
          <p className="eyebrow">{about.eyebrow}</p>
          <h1>{about.title}</h1>
          <p className="about-hero__lead">{about.lead}</p>
        </section>

        <section className="about-sectors" aria-labelledby="about-sectors-heading">
          <p className="eyebrow" id="about-sectors-heading">
            {about.sectorsHeading}
          </p>
          <ul className="about-sectors__grid">
            {about.sectors.map((sector) => (
              <li className="about-sector" key={sector.title}>
                <h2>{sector.title}</h2>
                <p>{sector.copy}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className="about-markets">{about.markets}</p>

        <div className="about-counters" aria-label={about.title}>
          {about.counters.map((figure) => (
            <div className="stat" key={figure.label}>
              <span aria-hidden="true" className="stat__value">
                {figure.value}
              </span>
              <span className="stat__label">{figure.label}</span>
            </div>
          ))}
        </div>

        <div className="about-cta">
          <a
            className="button button--whatsapp"
            href={brand.whatsappHref}
            rel="noreferrer noopener"
            target="_blank"
          >
            <WhatsAppIcon />
            {about.whatsappCta}
          </a>
        </div>
      </main>
      <SiteFooter dictionary={dictionary} locale={locale} subpath="/about" />
      <WhatsAppFab label={dictionary.contact.whatsappAria} />
    </>
  );
}
