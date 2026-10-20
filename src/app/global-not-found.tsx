import type { Metadata } from "next";
import "./globals.css";
import ReachLogo from "@/components/reach-logo";
import en from "@/i18n/dictionaries/en";
import ar from "@/i18n/dictionaries/ar";

/**
 * Global 404 — required because the root layout lives under the `[lang]`
 * dynamic segment (documented Next.js case for `global-not-found.js`).
 * It bypasses all layouts, so it must render a complete document. Both
 * languages are listed since the global 404 has no locale context.
 */
export const metadata: Metadata = {
  title: "404 — Page not found",
  description: "The page you are looking for does not exist or has moved.",
  icons: {
    icon: [
      { url: "/brand/reach-icon.svg", type: "image/svg+xml" },
      { url: "/brand/reach-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/brand/reach-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/brand/reach-icon-180.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr">
      <head />
      <body>
        <main className="nf">
          <div className="nf__inner">
            <div className="nf__brand">
              <span className="brand__plate">
                <ReachLogo />
              </span>
            </div>
            <p className="nf__code" aria-hidden="true">
              404
            </p>
            <h1 className="nf__title">Page not found</h1>
            <p className="nf__body">{en.notFound.body}</p>
            <p className="nf__body" lang="ar" dir="rtl">
              {ar.notFound.title} — {ar.notFound.body}
            </p>
            <div className="nf__links">
              <a className="nf__link" href="/">
                {en.notFound.home}
              </a>
              <a className="nf__link" href="/ar" lang="ar">
                {ar.notFound.home}
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
