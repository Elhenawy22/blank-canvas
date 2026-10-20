/**
 * Brand asset pipeline — turns the supplied raster logo (white/yellow
 * artwork on a purple gradient) into a genuinely transparent, high quality
 * master plus optimized variants.
 *
 * The background is not a flat colour: the source has a soft gradient.
 * A quadratic surface is fitted to the purple pixels, then every pixel is
 * projected onto the line between its local background colour and one of
 * the two known brand foregrounds (white or yellow). That produces a real
 * alpha matte with clean, fringe-free edges instead of a chroma-key halo.
 *
 * Run: node scripts/build-brand-assets.mjs
 */
import sharp from "sharp";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE =
  process.env.LOGO_SOURCE ??
  path.resolve("assets/brand/reach-logo-source.jpg");
const ASSET_DIR = "assets/brand";
const OUT_DIR = "public/brand";
const PREVIEW_DIR = "validation/brand";

await mkdir(ASSET_DIR, { recursive: true });
await mkdir(OUT_DIR, { recursive: true });
await mkdir(PREVIEW_DIR, { recursive: true });
const archivedSource = path.resolve(ASSET_DIR, "reach-logo-source.jpg");
if (path.resolve(SOURCE) !== archivedSource) {
  await copyFile(SOURCE, archivedSource);
}

const { data, info } = await sharp(SOURCE)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const C = info.channels;

/* ------------------------------------------------------------------ *
 * 1. Fit the purple background gradient (quadratic surface per channel)
 * ------------------------------------------------------------------ */
const N = 6;
const terms = (x, y) => {
  const u = (x / (W - 1)) * 2 - 1;
  const v = (y / (H - 1)) * 2 - 1;
  return [1, u, v, u * u, u * v, v * v];
};

const normal = Array.from({ length: N }, () => new Float64Array(N));
const rhs = [new Float64Array(N), new Float64Array(N), new Float64Array(N)];
let bgSamples = 0;

for (let y = 0; y < H; y += 2) {
  for (let x = 0; x < W; x += 2) {
    const i = (y * W + x) * C;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Purple background: blue-dominant and relatively dark in R/G.
    if (!(b > r + 45 && b > g + 45 && b > 120 && r < 190 && g < 190)) continue;
    bgSamples++;
    const f = terms(x, y);
    for (let a = 0; a < N; a++) {
      for (let c = 0; c < N; c++) normal[a][c] += f[a] * f[c];
      rhs[0][a] += f[a] * r;
      rhs[1][a] += f[a] * g;
      rhs[2][a] += f[a] * b;
    }
  }
}

function solveMatrix(A, b) {
  const n = b.length;
  const M = A.map((row) => Float64Array.from(row));
  const x = Float64Array.from(b);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];
    [x[col], x[pivot]] = [x[pivot], x[col]];
    const d = M[col][col] || 1e-9;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col] / d;
      if (!factor) continue;
      for (let k = col; k < n; k++) M[row][k] -= factor * M[col][k];
      x[row] -= factor * x[col];
    }
  }
  return Array.from(x, (value, i) => value / (M[i][i] || 1e-9));
}

const coeffs = [0, 1, 2].map((channel) => solveMatrix(normal, rhs[channel]));
console.log("background samples:", bgSamples);
const samples = [
  [10, 10],
  [W - 10, 10],
  [10, H - 10],
  [W - 10, H - 10],
  [W / 2, H - 10],
];
for (const [x, y] of samples) {
  const f = terms(x, y);
  const b = [0, 1, 2].map((k) => Math.round(f.reduce((sum, v, i) => sum + v * coeffs[k][i], 0)));
  console.log(`model bg (${x},${y})`, b);
}

/* ------------------------------------------------------------------ *
 * 2. Alpha matte: project each pixel onto white / yellow against the
 *    locally modelled purple background.
 * ------------------------------------------------------------------ */
const FOREGROUNDS = [
  { name: "white", rgb: [255, 255, 255] },
  { name: "yellow", rgb: [255, 219, 0] },
];

const rgba = Buffer.alloc(W * H * 4);
// Strong foreground bounds: the soft corner glow has a low alpha and must
// not define the crop.
let minX = W;
let minY = H;
let maxX = 0;
let maxY = 0;

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C;
    const o = (y * W + x) * 4;
    const px = [data[i], data[i + 1], data[i + 2]];
    const f = terms(x, y);
    const bg = [0, 1, 2].map((k) =>
      Math.min(255, Math.max(0, f.reduce((sum, v, j) => sum + v * coeffs[k][j], 0))),
    );
    const diff = [px[0] - bg[0], px[1] - bg[1], px[2] - bg[2]];

    let best = null;
    for (const fg of FOREGROUNDS) {
      const dir = [fg.rgb[0] - bg[0], fg.rgb[1] - bg[1], fg.rgb[2] - bg[2]];
      const denom = dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2;
      if (denom < 1) continue;
      const alpha = Math.min(1, Math.max(0, (diff[0] * dir[0] + diff[1] * dir[1] + diff[2] * dir[2]) / denom));
      const predicted = [
        bg[0] + alpha * dir[0],
        bg[1] + alpha * dir[1],
        bg[2] + alpha * dir[2],
      ];
      const err =
        (px[0] - predicted[0]) ** 2 +
        (px[1] - predicted[1]) ** 2 +
        (px[2] - predicted[2]) ** 2;
      if (!best || err < best.err) best = { fg, alpha, err };
    }

    let alpha = best?.alpha ?? 0;
    // Suppress JPEG noise and the soft background glow.
    if (alpha < 0.07) alpha = 0;
    if (alpha > 0.985) alpha = 1;

    rgba[o] = best?.fg.rgb[0] ?? 0;
    rgba[o + 1] = best?.fg.rgb[1] ?? 0;
    rgba[o + 2] = best?.fg.rgb[2] ?? 0;
    rgba[o + 3] = Math.round(alpha * 255);

    if (alpha > 0.75) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log("strong artwork bbox:", { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 });

/* ------------------------------------------------------------------ *
 * 3. Crop with balanced transparent padding, write master + variants
 * ------------------------------------------------------------------ */
const pad = 56;
const left = Math.max(0, minX - pad);
const top = Math.max(0, minY - pad);
const cropW = Math.min(W - left, maxX - minX + 1 + pad * 2);
const cropH = Math.min(H - top, maxY - minY + 1 + pad * 2);

const cropped = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left, top, width: cropW, height: cropH })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();

const master = await sharp(cropped).png({ compressionLevel: 9 }).toBuffer();
await writeFile(path.join(OUT_DIR, "reach-logo.png"), master);

for (const [name, width] of [
  ["reach-logo-720.png", 720],
  ["reach-logo-header.png", 360],
]) {
  const resized = await sharp(master)
    .resize({ width, kernel: "lanczos3", withoutEnlargement: true })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  await writeFile(path.join(OUT_DIR, name), resized);
}

const meta = await sharp(master).metadata();
console.log("master:", { width: meta.width, height: meta.height, bytes: master.length });
console.log("crop:", { left, top, cropW, cropH });

/* ------------------------------------------------------------------ *
 * 4. Inspection previews (checker, purple, light, dark)
 * ------------------------------------------------------------------ */
const PW = 1400;
const PH = 760;
const logoPreview = await sharp(master)
  .resize({ width: PW - 120, height: PH - 120, fit: "inside", kernel: "lanczos3" })
  .png()
  .toBuffer();
for (const [name, bg] of [
  ["purple", "#4545b5"],
  ["light", "#f2f0ec"],
  ["dark", "#0b0b11"],
]) {
  await sharp({
    create: { width: PW, height: PH, channels: 4, background: bg },
  })
    .composite([{ input: logoPreview, gravity: "center" }])
    .png()
    .toFile(path.join(PREVIEW_DIR, `logo-on-${name}.png`));
}

// Alpha checkerboard to prove real transparency.
const checker = Buffer.alloc(PW * PH * 3);
for (let y = 0; y < PH; y++) {
  for (let x = 0; x < PW; x++) {
    const v = (Math.floor(x / 24) + Math.floor(y / 24)) % 2 ? 205 : 245;
    const i = (y * PW + x) * 3;
    checker[i] = v;
    checker[i + 1] = v;
    checker[i + 2] = v;
  }
}
await sharp(checker, { raw: { width: PW, height: PH, channels: 3 } })
  .composite([{ input: logoPreview, gravity: "center" }])
  .png()
  .toFile(path.join(PREVIEW_DIR, "logo-checker.png"));

console.log("done — run trace-brand-logo.mjs then build-brand-icon.mjs for the vector + icons");
