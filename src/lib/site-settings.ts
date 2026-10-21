"use client";

import { useEffect, useMemo, useState } from "react";
import { brand, socials } from "@/data/brand";
import { db } from "@/lib/db";

export type SiteSettings = {
  siteName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  x?: string;
  youtube?: string;
  /** Text overrides per language and section, merged over the dictionaries. */
  content?: Record<string, Record<string, unknown>>;
  /** Overrides for built-in portfolio projects / sales results, by index. */
  projects?: Record<string, unknown>[];
  results?: Record<string, unknown>[];
};

let cache: SiteSettings | null = null;
let pending: Promise<SiteSettings> | null = null;

export function fetchSettings(force = false): Promise<SiteSettings> {
  if (cache && !force) return Promise.resolve(cache);
  if (!pending || force)
    pending = Promise.resolve(
      db.from("site_settings").select("data").eq("id", 1).maybeSingle(),
    ).then(({ data }) => (cache = ((data?.data as SiteSettings) ?? {})));
  return pending;
}

const digits = (v: string) => v.replace(/\D/g, "");

/** Brand values merged with what the admin saved in the dashboard. */
export function useSettings() {
  const [s, setS] = useState<SiteSettings>(cache ?? {});
  useEffect(() => {
    fetchSettings().then(setS).catch(() => {});
  }, []);
  return s;
}

/** Deep merge: objects by key, arrays by index; empty strings are ignored. */
export function deepMerge<T>(base: T, over: unknown): T {
  if (over === undefined || over === null || over === "") return base;
  if (Array.isArray(base)) {
    const o = Array.isArray(over) ? over : Object.values(over as object);
    return base.map((b, i) => deepMerge(b, o[i])) as T;
  }
  if (base && typeof base === "object") {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [k, v] of Object.entries(over as object)) out[k] = k in out ? deepMerge(out[k], v) : v;
    return out as T;
  }
  return (typeof over === typeof base ? over : base) as T;
}

/** Dictionary with the admin's text edits for the current language applied. */
export function useDict<T>(dictionary: T): T {
  const s = useSettings();
  const [loc, setLoc] = useState("ar");
  useEffect(() => setLoc(window.location.pathname.startsWith("/en") ? "en" : "ar"), []);
  return useMemo(() => deepMerge(dictionary, s.content?.[loc]), [dictionary, s, loc]);
}

export function useBrand() {
  const s = useSettings();
  const phone = s.phone || brand.phone;
  const wa = s.whatsapp ? digits(s.whatsapp) : digits(brand.whatsappHref);
  return {
    name: s.siteName || brand.name,
    email: s.email ?? brand.email,
    phone,
    address: s.address,
    whatsappHref: `https://wa.me/${wa}`,
    socials: socials.map((so) =>
      so.id === "whatsapp"
        ? { ...so, href: `https://wa.me/${wa}` }
        : { ...so, href: (s as Record<string, string | undefined>)[so.id] || so.href },
    ),
  };
}
