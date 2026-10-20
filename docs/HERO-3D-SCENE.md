# Scroll-Driven 3D Hero

The hero uses a locally rendered CSS 3D composition instead of animation
videos. The scene consists of a perspective orbit, a sculpted ring, a shaded
sphere, two faceted cubes, and the Reach lockup in the Reach palette.

- Markup and scroll transforms: `src/components/sections/hero.tsx`
- 3D materials, perspective, and responsive layout: `src/app/globals.css`
- No video, canvas, WebGL renderer, external model, or media download is used.
- The pinned ScrollTrigger drives each object's rotation and lift from scroll
  progress, in either direction. It also brings the logo forward and scales it
  into focus as the hero copy clears.
- The logo is the existing inline brand artwork, not a re-created mark.
- On narrow screens, the 3D objects scale and shift behind the hero copy; the
  same scene works at desktop, tablet, phone, English, and Arabic RTL widths.
- Reduced-motion visitors see the static scene and normal page flow without
  the pinned scroll sequence.

The original video sources remain archived in `assets/videos/`, but are no
longer part of the site. Generated hero MP4s and the old video poster have
been removed from `public/`.

## Validation

Run `npm run validate:scroll` for the browser checks covering desktop, tablet,
phone widths, scroll/reverse mapping, responsive resizing, Arabic RTL, and
reduced motion. Run `npm run validate` to run the complete browser suite.
