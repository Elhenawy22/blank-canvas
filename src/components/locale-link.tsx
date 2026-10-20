"use client";

import { useEffect, useRef, type AnchorHTMLAttributes } from "react";

/**
 * Locale-switch anchor that preserves the visitor's current section.
 *
 * The site is a single page whose sections are hash anchors. A plain link
 * to the other locale lands at the top; this component decorates the href
 * with the active `window.location.hash` after hydration (and on every
 * hashchange), so switching EN ⇄ العربية keeps you on the equivalent
 * section. The base href is identical on server and client, so hydration
 * stays mismatch-free; the hash is only ever added through the DOM.
 *
 * A plain `<a>` (not `next/link`) is intentional: a full document request
 * is what lets the server render the correct `lang`/`dir` for the new
 * locale.
 */
export default function LocaleLink({
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const anchor = ref.current;
    if (!anchor) return;

    const sync = () => {
      anchor.setAttribute("href", `${href}${window.location.hash}`);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [href]);

  return <a href={href} ref={ref} {...props} />;
}
