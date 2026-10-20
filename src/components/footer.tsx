import { BrandLogo } from "./brand-logo";
import SocialLinks from "./social-links";
import LocaleLink from "./locale-link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { localeLabels, localePath, localizedPath, siteHref } from "@/i18n/config";
import { brand } from "@/data/brand";
import { WhatsAppIcon } from "./icons";

/**
 * Footer — deliberate four-column hierarchy over the giant outlined
 * wordmark:
 *   1. brand column   — lockup, tagline, social icons (config-driven)
 *   2. site column    — the same single-page anchors as the header
 *   3. services column— service list anchored to #services
 *   4. contact column — email (or the honest "to be added" note) + language
 * Bottom bar: copyright + the developer credit.
 */
export default function SiteFooter({
  dictionary,
  locale,
  subpath,
}: {
  dictionary: Dictionary;
  locale: Locale;
  subpath?: string;
}) {
  const footer = dictionary.footer;
  const contact = dictionary.contact;
  const year = new Date().getFullYear();
  const homePath = localePath(locale);
  const fromSubpage = Boolean(subpath);
  const navHref = (href: string) => siteHref(locale, href, fromSubpage);

  return (
    <footer className="site-footer">
      <p aria-hidden="true" className="site-footer__wordmark">
        REACH FURTHER<span className="site-footer__dot">.</span>
      </p>

      <div className="site-footer__main">
        <div className="site-footer__brand">
          <BrandLogo
            ariaLabel={dictionary.nav.logoAria}
            homeHref={fromSubpage ? homePath : "#home"}
          />
          <p className="site-footer__tagline">{footer.tagline}</p>
          <SocialLinks className="social-links social-links--footer" dictionary={dictionary} />
        </div>

        <nav aria-label={footer.navAria} className="site-footer__col">
          <h2 className="site-footer__title">{footer.navHeading}</h2>
          <ul>
            {dictionary.nav.links.map((link) => (
              <li key={link.href}>
                <a href={navHref(link.href)}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={footer.servicesHeading} className="site-footer__col">
          <h2 className="site-footer__title">{footer.servicesHeading}</h2>
          <ul>
            {dictionary.services.items.map((service) => (
              <li key={service.title}>
                <a href={navHref("#services")}>{service.title}</a>
              </li>
            ))}
          </ul>
          <p className="site-footer__col-note">{footer.servicesNote}</p>
        </nav>

        <div className="site-footer__col">
          <h2 className="site-footer__title">{footer.contactHeading}</h2>
          <p className="site-footer__address">
            <span>{contact.addressLabel}</span>
            {contact.address}
          </p>
          <a
            className="site-footer__whatsapp"
            dir="ltr"
            href={brand.whatsappHref}
            rel="noreferrer noopener"
            target="_blank"
          >
            <WhatsAppIcon />
            {brand.phone}
          </a>
          {brand.email ? (
            <a className="site-footer__email" dir="ltr" href={`mailto:${brand.email}`}>
              {brand.email}
            </a>
          ) : (
            <span className="site-footer__muted">{contact.emailNote}</span>
          )}
          <h2 className="site-footer__title">{dictionary.language.footerHeading}</h2>
          <ul className="site-footer__lang">
            {(["en", "ar"] as const).map((target) => {
              const current = target === locale;
              const item = (
                <>
                  {localeLabels[target]}
                  {current ? <span className="sr-only"> — {dictionary.language.currentSuffix}</span> : null}
                </>
              );
              return (
                <li key={target}>
                  {current ? (
                    <span aria-current="true" lang={target}>
                      {item}
                    </span>
                  ) : (
                    <LocaleLink href={localizedPath(target, subpath)} hrefLang={target} lang={target}>
                      {item}
                    </LocaleLink>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="site-footer__bar">
        <span className="site-footer__copyright">
          {footer.copyright.replace("%year%", String(year))}
        </span>
        <span className="site-footer__credit">{footer.credit}</span>
      </div>
    </footer>
  );
}
