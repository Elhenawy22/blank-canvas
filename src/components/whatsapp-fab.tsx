"use client";
import { useBrand } from "@/lib/site-settings";
import { WhatsAppIcon } from "./icons";

/** Persistent official WhatsApp launcher — green roundel, brand glyph. */
export default function WhatsAppFab({ label }: { label: string }) {
  const brand = useBrand();
  return (
    <a
      aria-label={label}
      className="whatsapp-fab"
      href={brand.whatsappHref}
      rel="noreferrer noopener"
      target="_blank"
    >
      <WhatsAppIcon />
    </a>
  );
}
