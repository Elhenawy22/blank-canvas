/**
 * Brand + configuration facts that are identical in every language.
 * Localized *text* lives in `src/i18n/dictionaries/{en,ar}.ts`; this file
 * keeps the identity constants and the owner-editable integration points:
 *
 * - `email`      — set the approved business mailbox to activate the
 *                  contact form (buttons + footer) in both languages.
 * - `socials`    — set `href` on a platform row to activate its hero and
 *                  footer icon in both languages. Rows with an empty href
 *                  render as clearly-identified placeholders (no fake
 *                  destinations are ever linked).
 */

export const brand = {
  name: "Reach Agency",
  wordmark: "REACH",
  email: "",
  phone: "+201207312268",
  phoneHref: "tel:+201207312268",
  whatsappHref: "https://wa.me/201207312268",
};

export type SocialPlacement = {
  /** Stable id, also used by icon lookup in components/icons.tsx. */
  id: "instagram" | "facebook" | "linkedin" | "x" | "youtube" | "tiktok" | "whatsapp";
  /** Human label, shared across locales for aria-labels. */
  label: string;
  /** Official account URL. Empty string = not configured yet. */
  href: string;
};

export const socials: SocialPlacement[] = [
  { id: "instagram", label: "Instagram", href: "" },
  { id: "facebook", label: "Facebook", href: "" },
  { id: "linkedin", label: "LinkedIn", href: "" },
  { id: "x", label: "X (Twitter)", href: "" },
  { id: "youtube", label: "YouTube", href: "" },
  { id: "whatsapp", label: "WhatsApp", href: "https://wa.me/201207312268" },
];

/** Developer credit — rendered with the localized wording from the
 *  dictionaries, but the exact developer name stays untouched. */
export const developerCredit = "Ahmed Elhenawy";
