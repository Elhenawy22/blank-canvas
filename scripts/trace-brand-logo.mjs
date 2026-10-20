/**
 * Trace the cleaned raster logo into a two-layer SVG (white artwork +
 * yellow arrow). Potrace follows the actual matte, so the vector is a
 * faithful reproduction of the supplied artwork rather than a redraw.
 *
 * Run: node scripts/trace-brand-logo.mjs
 */
import sharp from "sharp";
import potrace from "potrace";
import { writeFile } from "node:fs/promises";

const MASTER = "public/brand/reach-logo.png";
const OUT_SVG = "public/brand/reach-logo.svg";
const PREVIEW = "validation/brand/logo-traced-on-purple.png";

const { data, info } = await sharp(MASTER)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height } = info;

function maskFor(kind) {
  const out = Buffer.alloc(width * height); // black = foreground
  for (let i = 0, p = 0; i < width * height; i++, p += 4) {
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const a = data[p + 3];
    const isWhite = r === 255 && g === 255 && b === 255;
    const isYellow = r === 255 && g === 219 && b === 0;
    const fg = a > 127 && (kind === "white" ? isWhite : isYellow);
    out[i] = fg ? 0 : 255;
  }
  return sharp(out, { raw: { width, height, channels: 1 } }).png().toBuffer();
}

function trace(mask) {
  return new Promise((resolve, reject) => {
    potrace.trace(
      mask,
      {
        threshold: 128,
        turdSize: 4,
        alphaMax: 1,
        optCurve: true,
        optTolerance: 0.2,
      },
      (err, svg) => (err ? reject(err) : resolve(svg)),
    );
  });
}

const [whiteSvg, yellowSvg] = await Promise.all([trace(await maskFor("white")), trace(await maskFor("yellow"))]);
const extractPaths = (svg) => [...svg.matchAll(/<path[^>]*\sd="([^"]+)"[^>]*\/?>/g)].map((m) => m[1]);

const whitePaths = extractPaths(whiteSvg);
const yellowPaths = extractPaths(yellowSvg);
console.log("paths:", { white: whitePaths.length, yellow: yellowPaths.length });
console.log("bytes:", {
  white: whitePaths.join("").length,
  yellow: yellowPaths.join("").length,
});

const pathMarkup = (paths, fill, id) =>
  `<g id="${id}" fill="${fill}" fill-rule="evenodd">${paths
    .map((d) => `<path d="${d}"/>`)
    .join("")}</g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Reach">
${pathMarkup(whitePaths, "#ffffff", "reach-white")}
${pathMarkup(yellowPaths, "#ffdb00", "reach-yellow")}
</svg>
`;

await writeFile(OUT_SVG, svg);
console.log("wrote", OUT_SVG, svg.length, "bytes");

const vector = Buffer.from(svg);
const master = await sharp(vector)
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();
await writeFile("public/brand/reach-logo.png", master);

for (const [name, width] of [
  ["reach-logo-720.png", 720],
  ["reach-logo-header.png", 360],
]) {
  const raster = await sharp(vector)
    .resize({ width, kernel: "lanczos3" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  await writeFile(`public/brand/${name}`, raster);
}
console.log("wrote transparent PNG variants from traced vector artwork");

// Visual proof: rasterise the traced SVG over the brand purple at a
// representative display size.
const previewW = 1400;
const previewH = 760;
const traced = await sharp(vector)
  .resize({ width: previewW - 120, height: previewH - 120, fit: "inside" })
  .png()
  .toBuffer();
await sharp({
  create: { width: previewW, height: previewH, channels: 4, background: "#4545b5" },
})
  .composite([{ input: traced, gravity: "center" }])
  .png()
  .toFile(PREVIEW);
console.log("wrote", PREVIEW);
