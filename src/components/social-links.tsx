"use client";
import type { Dictionary } from "@/i18n/dictionaries";
import { useBrand } from "@/lib/site-settings";
import { socialIcons } from "./icons";

/**
 * Config-driven social icon group (hero rail + footer).
 *
 * Honesty contract: only rows with an `href` in `src/data/brand.ts`
 * become real external links. Unconfigured platforms render as visibly
 * dimmed placeholders whose tooltip says exactly where to add the URL —
 * never a fake destination, never `#`.
 */
export default function SocialLinks({
  dictionary,
  className = "social-links",
}: {
  dictionary: Dictionary;
  className?: string;
}) {
  const { socials } = useBrand();
  return (
    <ul aria-label={dictionary.hero.socialAria} className={className}>
      {socials.map((social) => {
        const Glyph = socialIcons[social.id];
        const configured = social.href.startsWith("http");
        const missingNote = dictionary.hero.socialMissing.replace("%s", social.label);

        if (!configured) {
          return (
            <li key={social.id}>
              <span
                aria-label={missingNote}
                className="social-link social-link--unset"
                role="img"
                title={missingNote}
              >
                <Glyph />
              </span>
            </li>
          );
        }

        return (
          <li key={social.id}>
            <a
              aria-label={`${dictionary.hero.socialAria} — ${social.label}`}
              className="social-link"
              href={social.href}
              rel="noreferrer noopener"
              target="_blank"
              title={social.label}
            >
              <Glyph />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
