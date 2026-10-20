# Reach Agency website

## Local development

```bash
npm install
npm run dev
```

The project uses Next.js, React, and TypeScript. Next.js supplies its own
development server and bundler, so Vite is intentionally not included. Run
`npm run typecheck` and `npm run build` to validate it.

## Before publishing

- Set the approved agency email in `src/data/brand.ts`. The contact form opens
  the visitor's email application after this address has been configured; it
  does not send or store submissions on a server.
- Replace the clearly labeled demo portfolio concepts and placeholder
  milestone figures with approved Reach Agency work and verified numbers.
- Add official social profile URLs and office details when they are available.
- This starter implements the homepage; navigation items link to homepage
  sections rather than separate About, Services, or Work pages.

The bundled editorial images are downloaded copies from Unsplash; the hero
artwork and abstract service-card visuals are CSS compositions. Alexandria
fonts are self-hosted from Google Fonts. No reference-site client logos,
contact details, or business statistics are reproduced.
