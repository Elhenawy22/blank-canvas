"use client";

import { useEffect, useState } from "react";
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
export function useBrand() {
  const [s, setS] = useState<SiteSettings>(cache ?? {});
  useEffect(() => {
    fetchSettings().then(setS).catch(() => {});
  }, []);
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
