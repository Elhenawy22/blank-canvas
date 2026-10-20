import type { Locale } from "@/i18n/config";
import en, { type Dictionary } from "./dictionaries/en";
import ar from "./dictionaries/ar";

/**
 * Dictionary registry (server-side). Mirrors the Next.js i18n guide: the
 * dictionaries are only imported on the server and only the rendered
 * markup crosses the client boundary.
 */

const dictionaries: Record<Locale, Dictionary> = { en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
