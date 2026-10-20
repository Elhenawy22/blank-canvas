import SmoothScroll from "@/components/smooth-scroll";
import SiteHeader from "@/components/header";
import Hero from "@/components/sections/hero";
import Services from "@/components/sections/services";
import Milestones from "@/components/sections/milestones";
import MarqueeStrip from "@/components/sections/marquee";
import Principles from "@/components/sections/principles";
import Showcase from "@/components/sections/showcase";
import SalesResults from "@/components/sections/sales-results";
import Work from "@/components/sections/work";
import Contact from "@/components/sections/contact";
import SiteFooter from "@/components/footer";
import WhatsAppFab from "@/components/whatsapp-fab";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

/**
 * Shared single-page composition for every locale. Same components, same
 * behaviour, localized content only.
 */
export default function SitePage({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);

  return (
    <>
      <SmoothScroll />
      <a className="skip-link" href="#main-content">
        {dictionary.nav.skipToContent}
      </a>
      <SiteHeader dictionary={dictionary} locale={locale} />
      <main id="main-content">
        <Hero dictionary={dictionary} locale={locale} />
        <Services dictionary={dictionary} />
        <Milestones dictionary={dictionary} locale={locale} />
        <MarqueeStrip dictionary={dictionary} locale={locale} />
        <Principles dictionary={dictionary} />
        <Showcase dictionary={dictionary} locale={locale} />
        <SalesResults dictionary={dictionary} locale={locale} />
        <Work dictionary={dictionary} />
        <Contact dictionary={dictionary} />
      </main>
      <SiteFooter dictionary={dictionary} locale={locale} />
      <WhatsAppFab label={dictionary.contact.whatsappAria} />
    </>
  );
}
