import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { brand } from "@/data/brand";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";

/**
 * Social share card per locale, generated at build time with the
 * self-hosted Alexandria (which carries both the Latin and Arabic
 * glyphs). Deep navy base with purple-blue illumination and restrained
 * yellow accents; the Arabic card is right-aligned with untracked letterforms
 * so the connected script stays intact (Satori defaults deliveries).
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const displayFont = await readFile(
  join(process.cwd(), "public", "fonts", "alexandria-bold.ttf"),
);

const bodyFont = await readFile(
  join(process.cwd(), "public", "fonts", "alexandria-regular.ttf"),
);

// The supplied lockup, rendered from the transparent asset. Data URI avoids
// any runtime URL assumptions for the generated card.
const logoPng = await readFile(
  join(process.cwd(), "public", "brand", "reach-logo-header.png"),
);
const logoDataUri = `data:image/png;base64,${logoPng.toString("base64")}`;

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : "en";
  const isArabic = lang === "ar";
  const dictionary = getDictionary(lang as "en" | "ar");

  const lines = isArabic ? dictionary.hero.title : ["Ideas that", "reach further."];
  const description = dictionary.meta.description;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 84px",
          background:
            "linear-gradient(118deg, #080A24 0%, #11112F 44%, #26265F 76%, #4545B5 100%)",
          color: "#fff",
          fontFamily: "Alexandria",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: isArabic ? "flex-end" : "flex-start",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoDataUri} width={150} height={84} alt="" style={{ display: "block" }} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            ...(isArabic ? { textAlign: "right", lineHeight: 1.25 } : null),
          }}
        >
          {lines.map((line) => (
            <div
              key={line}
              style={{
                fontSize: isArabic ? 96 : 108,
                fontWeight: 800,
                letterSpacing: isArabic ? 0 : -6,
                lineHeight: 1,
                textTransform: isArabic ? "none" : "uppercase",
              }}
            >
              {line}
            </div>
          ))}
          <div
            style={{
              marginTop: isArabic ? 14 : 26,
              fontSize: 28,
              lineHeight: 1.4,
              color: "#ffffffbd",
              fontFamily: "Alexandria Body",
            }}
          >
            {description}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Alexandria", data: displayFont.buffer, weight: 800, style: "normal" },
        { name: "Alexandria Body", data: bodyFont.buffer, weight: 400, style: "normal" },
      ],
    },
  );
}

export async function generateImageMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : "en";
  const dictionary = getDictionary(lang as "en" | "ar");
  return [
    {
      id: "default",
      alt: `${brand.name} — ${dictionary.meta.title}`,
      size,
      contentType,
    },
  ];
}
