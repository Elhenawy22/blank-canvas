# Reach Agency website

## Local development

```bash
npm install
npm run dev
```

The project uses Next.js, React, and TypeScript. Next.js supplies its own
development server and bundler, so Vite is intentionally not included. Run
`npm run typecheck` and `npm run build` to validate it.

## Validation workflow

One command builds, boots a production server on a free port, runs every
browser suite against it, and tears the server down again:

```bash
npm run typecheck
npm install --no-save playwright   # once; intentionally not a dependency
npm run validate                   # build + serve + all suites
npm run validate -- --no-build     # reuse an existing build
TEST_URL=http://localhost:3000 npm run validate -- --no-build   # existing server
```

`scripts/run-validation.mjs` never assumes a port or kills a foreign process:
it starts at 3100 and walks upward until a port is free, waits for a real HTTP
response, then runs the suites below and stops the server, always. The
individual suites can also be run directly against any running server:

```bash
TEST_URL=http://localhost:3100 npm run validate:scroll      # scroll-driven 3D hero
TEST_URL=http://localhost:3100 npm run validate:pages       # pages/mobile/RTL
TEST_URL=http://localhost:3100 npm run validate:preloader   # preloader/brand
```

`validate-scroll.mjs` checks the scroll-driven 3D hero across desktop, tablet,
and phone widths: one pin spacer, five perspective 3D objects, scroll progress
matching scene transforms in both directions, desktop → mobile resizing,
Arabic RTL, reduced motion, and no video or canvas assets. Screenshots land in
`validation/`.

`validate-desktop-mobile.mjs` runs both locales (English `/` and Arabic
`/ar`). It first asserts root-locale routing (`/` answers in place with no
redirect, `/en` permanently redirects to `/`, `/ar` is served directly), then
waits for the brand preloader to release each page, scrolls the real pages in
desktop (1440x900), mobile touch (390x844, `isMobile`), and
`prefers-reduced-motion` contexts, and sweeps 320, 360, 375, 390, 430, 768,
1024, 1280 and 1920px. It captures per-section and critical-width
screenshots into `validation/`, exercises the work filters and the contact
form, and asserts: correct document `lang`/`dir`, no console/page errors, no
horizontal overflow or clipped key containers at any width, anchor offsets,
the skip link as the first Tab stop, the mobile overlay menu opening/closing
(link tap, toggle tap, with a hit-test proving the brand and close button
stay clickable above the dark panel), the EN ⇄ AR switch, and no
reduced-motion content stuck hidden.

`validate-preloader.mjs` focuses on the intro: SSR output, the localized
label, `role=status` with a localized `aria-label` and no focusable children,
inert/scroll-locked shells during the load, a bounded visible time on a fast
load, the EN/AR duration, release afterwards, no reappearance on hash
navigation, reduced-motion exit, every breakpoint from 320px to 1920px plus a
568x320 landscape, the header/footer logo boxes, favicon content types, the
generated Open Graph card, the standalone 404 (which intentionally has no
preloader), and the logo PNG's transparent corner.

Playwright is intentionally **not** a package.json dependency — install it
ephemerally if missing (`npm install --no-save playwright`). Each suite opens
the installed Chrome when it is available and silently falls back to the
Playwright Chromium build otherwise.

## Languages and routing

English lives at `/` and Arabic at `/ar`; both are rendered by the single
`src/app/[lang]/` route from the localized dictionaries in
`src/i18n/dictionaries/`. `src/app/[lang]/layout.tsx` sets the document
`lang`/`dir` on the server, and `next.config.ts` rewrites `/` to the
prerendered English document and permanently redirects `/en` to `/`, so the
public URL stays `/`. The rules deliberately live in `next.config.ts` rather
than middleware: middleware rewrites carry an absolute origin, which Next can
mistake for an external destination when the server is bound with `-H`, and
that turns the root into a redirect loop. Config rewrites are path-based and
therefore host-independent. Switching languages preserves the current section
hash.

The header/footer language controls and `html lang`/`dir` cover every
user-facing string; fonts (Alexandria, self-hosted) serve both languages.
Project concepts have localized detail pages at `/projects/[slug]` and
`/ar/projects/[slug]`; each page includes its concept brief, creative
direction, deliverables, temporary artwork, and links to the next project.

## Brand assets

The supplied REACH lockup (white letter boxes, white outlines and the yellow
arrow) is the single source of truth. The original file is kept at
`assets/brand/reach-logo-source.jpg`; the processed master is
`public/brand/reach-logo.png` (true alpha, no purple fringe) with header
(`reach-logo-header.png`) and 720px (`reach-logo-720.png`) variants. The
vector master `public/brand/reach-logo.svg` and the inline React component in
`src/components/reach-logo.tsx` come from a traced two-layer artwork (one
white path, one yellow path) and are used for the page and the preloader so
the yellow arrow can animate on its own.

Because the lettering is white, the header, footer and 404 render it inside a
brand-purple plate (`--color-brand-purple` `#4545b5`) instead of recoloring
the logo. The favicon/app icon is a faithful arrow-in-box crop
(`public/brand/reach-icon.svg` plus 180/192/512/32px PNGs, mirrored to
`public/icon.svg`).

Regeneration is scripted: `scripts/build-brand-assets.mjs` (alpha extraction
and PNG variants), `scripts/trace-brand-logo.mjs` (vector trace; needs
`npm install --no-save potrace`), `scripts/build-brand-icon.mjs` (icon SVG +
PNG sizes) and `scripts/generate-logo-component.mjs` (the inline component
from the traced paths). `sharp` is available transitively through Next.js.

## Preloader

`src/components/preloader.tsx` is server-rendered from
`src/app/[lang]/layout.tsx` so the purple panel exists in the first HTML
paint. It shows the supplied logo, an animated yellow-arrow accent and a
refined indeterminate bar, then wipes upward. It runs on each fresh document
load (including the EN ⇄ AR switch) but not on hash navigation. Readiness is
`window.load` + `document.fonts.ready`, capped so a slow asset can never
strand it; prefers-reduced-motion swaps the timeline for a short fade, and
with JavaScript disabled the panel is hidden via `@media (scripting: none)`
plus a `<noscript>` style. The page shells are `inert` and scroll is locked
while the overlay is up, and both are released on exit.

## Scroll-driven 3D hero

The hero artwork is composed from CSS 3D shapes (orbit, ring, sphere, and
faceted cubes) plus the Reach logo in the Reach palette. ScrollTrigger maps
the pinned hero's scroll progress to their rotation and depth, bringing the
logo into focus as the visitor scrolls. The same scene reflows and scales for
phones, tablets, and desktop without downloading video or requiring a
canvas/WebGL renderer.
With reduced motion enabled, the scene stays still and the hero is not pinned.
The scene and validation details are in `docs/HERO-3D-SCENE.md`.

## Before publishing

- Set `NEXT_PUBLIC_SITE_URL` to the verified production origin. Canonical
  links, `hreflang` alternates (including `x-default`), `sitemap.xml` and the
  `robots.txt` sitemap reference stay disabled until then — no domain is
  invented. Without it `/sitemap.xml` is an empty urlset.
- Set the approved agency email in `src/data/brand.ts`. The contact form opens
  the visitor's email application after this address has been configured; it
  does not send or store submissions on a server.
- Replace the clearly labeled demo portfolio concepts and placeholder
  milestone figures with approved Reach Agency work and verified numbers.
- Add official social profile URLs and office details when they are available.

The concept illustrations in `public/images/concept-*.svg` are local,
temporary artwork used by the service cards and project detail pages; replace
them with approved campaign imagery before launch. Alexandria fonts are
self-hosted from Google Fonts. No reference-site client logos, contact
details, or business statistics are reproduced.
