/**
 * Application icon — a faithful crop of the supplied arrow-in-box mark,
 * taken from the traced vector artwork (not a redraw). Generates the SVG
 * favicon plus PNG fallbacks used by iOS/bookmarks.
 *
 * Run after `trace-brand-logo.mjs`:
 *   node scripts/build-brand-icon.mjs
 */
import sharp from "sharp";
import { readFile, writeFile, copyFile } from "node:fs/promises";

const LOGO_SVG = "public/brand/reach-logo.svg";
const OUT = "public/brand";
const PREVIEW = "validation/brand/icon-vector-scales.png";

const source = await readFile(LOGO_SVG, "utf8");
const paths = [...source.matchAll(/<path d="([^"]+)"\/>/g)].map((match) => match[1]);
if (paths.length !== 2) throw new Error(`Expected 2 traced paths, found ${paths.length}`);
const [white, yellow] = paths;

// Square crop around the arrow + its outlined box. Coordinates are in the
// traced logo's viewBox; the SVG clips the rest of the lockup.
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="885 42 400 400" width="512" height="512" role="img" aria-label="Reach">
<rect x="885" y="42" width="400" height="400" fill="#4545b5"/>
<g fill="#ffffff" fill-rule="evenodd"><path d="${white}"/></g>
<g fill="#ffdb00" fill-rule="evenodd"><path d="${yellow}"/></g>
</svg>
`;

await writeFile(`${OUT}/reach-icon.svg`, icon);
// Keep the conventional /icon.svg path pointing at the new artwork too, so
// no old brand asset survives at the previous favicon URL.
await writeFile("public/icon.svg", icon);

for (const size of [512, 192, 180, 32]) {
  await sharp(Buffer.from(icon))
    .resize(size, size, { fit: "cover", kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/reach-icon-${size}.png`);
}
await copyFile(`${OUT}/reach-icon-512.png`, `${OUT}/reach-icon.png`);

const sizes = [512, 192, 180, 32];
const tiles = await Promise.all(
  sizes.map(async (size, index) => ({
    input: await sharp(`${OUT}/reach-icon-${size}.png`)
      .resize({ width: size > 128 ? 160 : size })
      .png()
      .toBuffer(),
    left: [60, 280, 460, 620][index],
    top: size > 128 ? 80 : 152,
  })),
);

await sharp({
  create: { width: 760, height: 320, channels: 4, background: "#f2f0ec" },
})
  .composite(tiles)
  .png()
  .toFile(PREVIEW);

console.log("wrote public/brand/reach-icon.svg + 512/192/180/32 PNGs");
console.log("wrote public/icon.svg (replacement) and", PREVIEW);
