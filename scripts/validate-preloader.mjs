/**
 * Focused preloader + brand integration validation.
 * Run against the production server: TEST_URL=http://localhost:3100 node scripts/validate-preloader.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const BASE = process.env.TEST_URL ?? "http://localhost:3100";
const OUT = "validation/brand";
await mkdir(OUT, { recursive: true });

const issues = [];
const notes = [];
const fail = (message) => issues.push(message);

/**
 * Prefer the installed Chrome (real-world GPU/video stack); fall back to the
 * bundled Playwright Chromium so the suite still runs on a Chrome-less box.
 */
async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch (error) {
    console.warn(
      `Chrome channel unavailable (${error.message.split("\n")[0]}); using Playwright Chromium.`,
    );
    return chromium.launch();
  }
}

const browser = await launchBrowser();

function watch(page, label) {
  page.on("pageerror", (error) => fail(`[${label}] pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") fail(`[${label}] console.error: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) fail(`[${label}] HTTP ${response.status()}: ${response.url()}`);
  });
}

async function waitForExit(page, label) {
  const start = Date.now();
  try {
    await page.waitForSelector("[data-preloader]", { state: "detached", timeout: 12000 });
  } catch {
    fail(`[${label}] preloader did not detach within 12s`);
    return Date.now() - start;
  }
  return Date.now() - start;
}

/**
 * Hydration + the intro keep the main thread busy, so a test-side evaluate
 * can land after the overlay has already exited. This sampler lives in the
 * page and records the first visible frame, the first frame with the shell
 * locked, and the exit time without any test-side race.
 */
async function installPreloaderAudit(page) {
  await page.addInitScript(() => {
    const audit = (window.__preloaderAudit = {
      first: null,
      locked: null,
      last: null,
      appearedAt: null,
      goneAt: null,
      frames: 0,
    });
    const readState = () => {
      const root = document.querySelector("[data-preloader]");
      if (!root) return null;
      const logo = root.querySelector(".preloader__logo");
      const bar = root.querySelector(".preloader__bar");
      const track = root.querySelector(".preloader__track");
      const yellow = root.querySelector("[data-reach-yellow]");
      const main = document.getElementById("main-content");
      const label = root.querySelector(".preloader__label");
      const rectOf = (element) => {
        const r = element.getBoundingClientRect();
        return {
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      };
      return {
        t: Math.round(performance.now()),
        present: true,
        logoOpacity: logo ? getComputedStyle(logo).opacity : null,
        clipPath: logo ? getComputedStyle(logo).clipPath : null,
        logoTransform: logo ? getComputedStyle(logo).transform : null,
        barTransform: bar ? getComputedStyle(bar).transform : null,
        barOrigin: bar ? getComputedStyle(bar).transformOrigin : null,
        yellowTransform: yellow ? getComputedStyle(yellow).transform : null,
        label: label?.textContent ?? null,
        labelTracking: label ? getComputedStyle(label).letterSpacing : null,
        logoRect: logo ? rectOf(logo) : null,
        barRect: track ? rectOf(track) : null,
        labelRect: label ? rectOf(label) : null,
        mainInert: main ? main.hasAttribute("inert") : null,
        scrollLocked: document.documentElement.classList.contains("is-scroll-locked"),
        role: root.getAttribute("role"),
        ariaLabel: root.getAttribute("aria-label"),
        focusableCount: root.querySelectorAll("a,button,input,select,textarea,[tabindex]").length,
      };
    };
    const tick = () => {
      const state = readState();
      if (state) {
        if (!audit.first) {
          audit.first = state;
          audit.appearedAt = state.t;
        }
        if (!audit.locked && state.scrollLocked && state.mainInert === true) {
          audit.locked = state;
        }
        audit.last = state;
        audit.frames += 1;
      } else if (audit.first && audit.goneAt === null) {
        audit.goneAt = Math.round(performance.now());
      }
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  });
}

/* ------------------------------------------------------------------ *
 * Server-rendered first paint check
 * ------------------------------------------------------------------ */
const html = await fetch(`${BASE}/`).then((response) => response.text());
if (!html.includes("data-preloader")) fail("Initial HTML does not contain the server-rendered preloader");
if (!html.includes("reach-logo__white")) fail("Initial HTML does not contain the inline logo");
for (const icon of ["reach-icon.svg", "reach-icon-192.png", "reach-icon-512.png"]) {
  const response = await fetch(`${BASE}/brand/${icon}`);
  if (!response.ok) fail(`Favicon asset ${icon} returned ${response.status}`);
  else notes.push(`favicon ${icon}: ${response.headers.get("content-type")} (${response.status})`);
}
const legacyIcon = await fetch(`${BASE}/icon.svg`);
const legacyIconBody = await legacyIcon.text();
if (!legacyIcon.ok) fail(`Legacy /icon.svg returned ${legacyIcon.status}`);
if (!legacyIconBody.includes("#4545b5")) fail("Legacy /icon.svg was not replaced with the new mark");
if (legacyIconBody.includes("24 3.5")) fail("Legacy /icon.svg still contains the old star path");

// The generated social card must use the supplied lockup.
const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
if (!ogMatch) {
  fail("Open Graph image meta tag is missing");
} else {
  const ogUrl = new URL(ogMatch[1].replaceAll("&amp;", "&"), BASE);
  const ogResponse = await fetch(`${BASE}${ogUrl.pathname}${ogUrl.search}`);
  if (!ogResponse.ok) {
    fail(`OG image returned ${ogResponse.status}`);
  } else {
    const ogBuffer = Buffer.from(await ogResponse.arrayBuffer());
    await writeFile(`${OUT}/og-image.png`, ogBuffer);
    const ogMeta = await sharp(ogBuffer).metadata();
    notes.push(`OG image: ${ogResponse.headers.get("content-type")} ${ogMeta.width}x${ogMeta.height}`);
    if (ogMeta.width !== 1200 || ogMeta.height !== 630) {
      fail(`OG image is ${ogMeta.width}x${ogMeta.height}, expected 1200x630`);
    }
  }
}

// Fresh-load timing: intro + real readiness + exit, measured without
// screenshot pauses.
const timingContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const timingPage = await timingContext.newPage();
watch(timingPage, "timing");
const timingStart = Date.now();
await timingPage.goto(`${BASE}/`, { waitUntil: "commit" });
await timingPage.waitForSelector("[data-preloader]", { state: "visible", timeout: 8000 });
const timingAppeared = Date.now();
await timingPage.waitForSelector("[data-preloader]", { state: "detached", timeout: 12000 });
const timingGone = Date.now();
const timingVisible = timingGone - timingAppeared;
notes.push(
  `fresh load: first paint ${timingAppeared - timingStart}ms, preloader visible ${timingVisible}ms, page interactive ${timingGone - timingStart}ms`,
);
if (timingVisible > 5000) fail(`Preloader stayed ${timingVisible}ms on a fast local load`);
await timingContext.close();

/* ------------------------------------------------------------------ *
 * Desktop English
 * ------------------------------------------------------------------ */
const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await desktop.newPage();
watch(page, "en-desktop");
await installPreloaderAudit(page);
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
const earlyPresent = await page.evaluate(() => !!document.querySelector("[data-preloader]"));
if (earlyPresent) await page.screenshot({ path: `${OUT}/preloader-1440-early.png` });
await waitForExit(page, "en-desktop");
const audit = await page.evaluate(() => window.__preloaderAudit ?? null);

const early = audit?.first ?? { present: false };
notes.push(`preloader first frame (page-sampled at ${early.t ?? "?"}ms): ${JSON.stringify(early)}`);
if (audit?.appearedAt != null && audit?.goneAt != null) {
  notes.push(`desktop preloader visible for ${audit.goneAt - audit.appearedAt}ms (page-sampled, ${audit.frames} frames)`);
}
if (!audit?.first) fail("Preloader sampler never saw the overlay");
if (early.role !== "status") fail("Preloader is missing role=status");
if (!early.ariaLabel) fail("Preloader has no accessible label");
if (early.focusableCount !== 0) fail(`Preloader contains ${early.focusableCount} focusable controls`);
if (!audit?.locked) {
  fail("No frame kept the main content inert and the scroll locked during the load");
} else {
  notes.push(`preloader locked frame: mainInert=${audit.locked.mainInert}, scrollLocked=${audit.locked.scrollLocked}`);
}

await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/hero-after-preloader-1440.png` });

const after = await page.evaluate(() => {
  const plate = document.querySelector(".site-header .brand__plate");
  const svg = plate?.querySelector("svg");
  const plateRect = plate?.getBoundingClientRect();
  const svgRect = svg?.getBoundingClientRect();
  const footerPlate = document.querySelector(".site-footer__brand .brand__plate");
  const footerSvg = footerPlate?.querySelector("svg");
  const footerRect = footerPlate?.getBoundingClientRect();
  return {
    scrollLocked: document.documentElement.classList.contains("is-scroll-locked"),
    inertShells: document.querySelectorAll("#main-content[inert], .site-header[inert], .site-footer[inert]").length,
    headerPlate: plateRect
      ? {
          bg: getComputedStyle(plate).backgroundColor,
          x: Math.round(plateRect.x),
          y: Math.round(plateRect.y),
          w: Math.round(plateRect.width),
          h: Math.round(plateRect.height),
          svgW: Math.round(svgRect?.width ?? 0),
          svgH: Math.round(svgRect?.height ?? 0),
          paths: svg?.querySelectorAll("path").length,
        }
      : null,
    footerPlate: footerRect
      ? {
          bg: getComputedStyle(footerPlate).backgroundColor,
          x: Math.round(footerRect.x),
          w: Math.round(footerRect.width),
          h: Math.round(footerRect.height),
          svgW: Math.round(footerSvg?.getBoundingClientRect().width ?? 0),
          svgH: Math.round(footerSvg?.getBoundingClientRect().height ?? 0),
        }
      : null,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    preloaderGone: !document.querySelector("[data-preloader]"),
    favicons: [...document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')].map((link) => ({
      rel: link.getAttribute("rel"),
      href: link.getAttribute("href"),
      sizes: link.getAttribute("sizes"),
    })),
  };
});
notes.push(`after preloader: ${JSON.stringify(after)}`);
if (after.scrollLocked) fail("Scroll remained locked after preloader exit");
if (after.inertShells !== 0) fail("Inert remained on page after preloader exit");
if (!after.preloaderGone) fail("Preloader still in DOM after exit");
if (!after.headerPlate || after.headerPlate.bg !== "rgb(69, 69, 181)") fail("Header logo plate is not the brand purple");
if (!after.headerPlate || after.headerPlate.svgW < 50) fail("Header logo is suspiciously small");
if (!after.footerPlate) fail("Footer logo plate missing");
if (after.overflow > 1) fail(`Desktop horizontal overflow: ${after.overflow}px`);

await page.locator(".site-header").screenshot({ path: `${OUT}/header-1440.png` });

// Footer brand and credit.
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/footer-1440.png` });
const footer = await page.evaluate(() => {
  const brand = document.querySelector(".site-footer__brand .brand");
  const rect = brand?.getBoundingClientRect();
  return {
    brandY: rect?.top,
    credit: document.body.innerText.includes("Ahmed Elhenawy"),
    tagline: document.querySelector(".site-footer__tagline")?.textContent,
  };
});
if (!footer.credit) fail("Developer credit missing in footer");
notes.push(`footer: ${JSON.stringify(footer)}`);

// Hash navigation must not re-mount the preloader.
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.waitForTimeout(250);
await page.click('.site-header__links a[href="#services"]');
await page.waitForTimeout(500);
const afterHash = await page.evaluate(() => ({
  preloader: !!document.querySelector("[data-preloader]"),
  hash: location.hash,
}));
if (afterHash.preloader) fail("Preloader reappeared on hash navigation");
if (afterHash.hash !== "#services") fail(`Hash navigation failed: ${afterHash.hash}`);

/* ------------------------------------------------------------------ *
 * Arabic
 * ------------------------------------------------------------------ */
const arabicPage = await desktop.newPage();
watch(arabicPage, "ar-desktop");
await installPreloaderAudit(arabicPage);
await arabicPage.goto(`${BASE}/ar`, { waitUntil: "domcontentloaded" });
if (await arabicPage.evaluate(() => !!document.querySelector("[data-preloader]"))) {
  await arabicPage.screenshot({ path: `${OUT}/preloader-ar-1440.png` });
}
await waitForExit(arabicPage, "ar-desktop");
const arAudit = await arabicPage.evaluate(() => window.__preloaderAudit ?? null);
const arMid = arAudit?.first ?? arAudit?.last ?? { present: false };
const arLabel = arMid.label ?? "";
if (!arAudit?.first) fail("Arabic: preloader sampler never saw the overlay");
if (!/التحميل|تحميل/.test(arLabel)) fail(`Arabic preloader label is not localized: ${arLabel}`);
if (!arAudit?.locked) fail("Arabic: no frame kept the main content inert and the scroll locked");
notes.push(`Arabic preloader first frame ${JSON.stringify(arMid)}`);
if (arAudit?.appearedAt != null && arAudit?.goneAt != null) {
  notes.push(`Arabic preloader visible for ${arAudit.goneAt - arAudit.appearedAt}ms (page-sampled)`);
}
await arabicPage.evaluate(() => document.fonts.ready);
await arabicPage.waitForTimeout(500);
await arabicPage.screenshot({ path: `${OUT}/hero-after-preloader-ar-1440.png` });
const arState = await arabicPage.evaluate(() => {
  const plate = document.querySelector(".site-header .brand__plate");
  const rect = plate?.getBoundingClientRect();
  const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  const label = document.querySelector(".preloader__label");
  return {
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    plateRight: rect ? Math.round(window.innerWidth - rect.right) : null,
    plateLeft: rect ? Math.round(rect.left) : null,
    overflow,
    hero: document.querySelector(".hero__title, .hero h1")?.textContent?.slice(0, 60),
  };
});
notes.push(`Arabic after: ${JSON.stringify(arState)}`);
if (arState.lang !== "ar" || arState.dir !== "rtl") fail("Arabic document language/direction incorrect");
if (arState.overflow > 1) fail(`Arabic horizontal overflow: ${arState.overflow}px`);
if (arMid.labelTracking && arMid.labelTracking !== "0px" && arMid.labelTracking !== "normal") {
  fail(`Arabic preloader label still letter-spaced: ${arMid.labelTracking}`);
}
notes.push(`Arabic bar transform-origin: ${arMid.barOrigin}`);
await arabicPage.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
await arabicPage.waitForTimeout(600);
await arabicPage.screenshot({ path: `${OUT}/footer-ar-1440.png` });

/* ------------------------------------------------------------------ *
 * Reduced motion
 * ------------------------------------------------------------------ */
const reduced = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const reducedPage = await reduced.newPage();
watch(reducedPage, "reduced");
await installPreloaderAudit(reducedPage);
await reducedPage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
if (await reducedPage.evaluate(() => !!document.querySelector("[data-preloader]"))) {
  await reducedPage.screenshot({ path: `${OUT}/preloader-reduced.png` });
}
await waitForExit(reducedPage, "reduced");
const reducedAudit = await reducedPage.evaluate(() => window.__preloaderAudit ?? null);
const reducedState = reducedAudit?.first ?? { present: false };
const reducedVisibleMs =
  reducedAudit?.appearedAt != null && reducedAudit?.goneAt != null
    ? reducedAudit.goneAt - reducedAudit.appearedAt
    : 0;
notes.push(`reduced-motion preloader: visible ${reducedVisibleMs}ms; first ${JSON.stringify(reducedState)}`);
if (!reducedState.present) fail("Reduced-motion preloader never appeared");
if (reducedVisibleMs > 4000) fail(`Reduced-motion preloader took ${reducedVisibleMs}ms`);
if (reducedState.logoOpacity !== "1") {
  fail(`Reduced-motion logo is not statically visible (opacity ${reducedState.logoOpacity})`);
}
if (reducedState.clipPath !== "none") {
  fail(`Reduced-motion logo is clipped (${reducedState.clipPath})`);
}
if (reducedState.barTransform?.startsWith("matrix(0,")) {
  fail("Reduced-motion loading bar is collapsed");
}
if (!reducedAudit?.locked) fail("Reduced-motion: no frame kept the shell inert and the scroll locked");
await reducedPage.waitForTimeout(300);
const reducedAfter = await reducedPage.evaluate(() => ({
  locked: document.documentElement.classList.contains("is-scroll-locked"),
  inert: document.querySelectorAll("#main-content[inert], .site-header[inert]").length,
}));
if (reducedAfter.locked || reducedAfter.inert) fail("Reduced-motion shell not released");

/* ------------------------------------------------------------------ *
 * Viewport sweep (portrait + landscape)
 * ------------------------------------------------------------------ */
const preloaderViewports = [
  { name: "320", width: 320, height: 760 },
  { name: "375", width: 375, height: 812 },
  { name: "390", width: 390, height: 844 },
  { name: "430", width: 430, height: 932 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 1024 },
  { name: "1920", width: 1920, height: 1080 },
  { name: "568x320-landscape", width: 568, height: 320 },
];
for (const viewport of preloaderViewports) {
  const { name, width, height } = viewport;
  const context = await browser.newContext({ viewport: { width, height } });
  const m = await context.newPage();
  watch(m, `viewport-${name}`);
  await installPreloaderAudit(m);
  await m.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });

  if (["320", "768", "1920", "568x320-landscape"].includes(name)) {
    if (await m.evaluate(() => !!document.querySelector("[data-preloader]"))) {
      await m.screenshot({ path: `${OUT}/preloader-${name}.png` });
    }
  }

  await waitForExit(m, `viewport-${name}`);
  const mAudit = await m.evaluate(() => window.__preloaderAudit ?? null);
  const sample = mAudit?.locked ?? mAudit?.first;
  const mState = sample
    ? { logo: sample.logoRect, bar: sample.barRect, label: sample.labelRect }
    : { logo: null, bar: null, label: null };
  notes.push(`viewport ${name}: ${JSON.stringify(mState)}`);

  if (!sample) {
    fail(`Viewport ${name}: preloader sampler never saw the overlay`);
  } else if (!mState.logo || !mState.bar) {
    fail(`Viewport ${name}: preloader logo or bar missing`);
  } else {
    const l = mState.logo;
    const b = mState.bar;
    if (l.x < 0 || l.x + l.w > width + 1 || l.y < 0 || l.y + l.h > height + 1) {
      fail(`Viewport ${name}: preloader logo outside viewport`);
    }
    if (b.x < 0 || b.x + b.w > width + 1 || b.y < 0 || b.y > height) {
      fail(`Viewport ${name}: loading bar outside viewport`);
    }
    if (Math.abs(l.x + l.w / 2 - width / 2) > 2 || Math.abs(b.x + b.w / 2 - width / 2) > 2) {
      fail(`Viewport ${name}: preloader content is not horizontally centred`);
    }
  }
  if (!mAudit?.locked) fail(`Viewport ${name}: no locked frame while the preloader was visible`);

  await m.waitForTimeout(450);

  if (["320", "768", "1024", "1920"].includes(name)) {
    await m.screenshot({ path: `${OUT}/mobile-${name}-header.png`, fullPage: false });
  }

  const mAfter = await m.evaluate(() => {
    const plate = document.querySelector(".site-header .brand__plate")?.getBoundingClientRect();
    const svg = document.querySelector(".site-header .brand__plate svg")?.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      plate: plate
        ? { x: Math.round(plate.x), y: Math.round(plate.y), w: Math.round(plate.width), h: Math.round(plate.height) }
        : null,
      svg: svg ? { w: Math.round(svg.width), h: Math.round(svg.height) } : null,
    };
  });
  if (mAfter.overflow > 1) fail(`Viewport ${name}: post-preloader horizontal overflow ${mAfter.overflow}px`);
  if (!mAfter.plate || mAfter.plate.x < 0 || mAfter.plate.x + mAfter.plate.w > width + 1) {
    fail(`Viewport ${name}: header logo missing or offscreen`);
  }
  if (!mAfter.svg || mAfter.svg.h < 30) fail(`Viewport ${name}: header logo rendered too small`);
  notes.push(`viewport ${name} after: ${JSON.stringify(mAfter)}`);
  await context.close();
}

/* ------------------------------------------------------------------ *
 * Transparent PNG alpha proof
 * ------------------------------------------------------------------ */
const { data, info } = await sharp("public/brand/reach-logo.png")
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
let transparent = 0;
let opaqueWhite = 0;
let opaqueYellow = 0;
for (let i = 0; i < info.width * info.height; i++) {
  const p = i * 4;
  const a = data[p + 3];
  if (a === 0) transparent++;
  else if (a === 255 && data[p] === 255 && data[p + 1] === 255 && data[p + 2] === 255) opaqueWhite++;
  else if (a === 255 && data[p] === 255 && data[p + 1] === 219 && data[p + 2] === 0) opaqueYellow++;
}
const total = info.width * info.height;
notes.push(
  `logo alpha: ${info.width}x${info.height}; transparent ${((transparent / total) * 100).toFixed(1)}%; white ${opaqueWhite}; yellow ${opaqueYellow}`,
);
if (transparent === 0) fail("Logo PNG has no transparent pixels");
if (opaqueWhite === 0) fail("Logo PNG lost its white artwork");
if (opaqueYellow === 0) fail("Logo PNG lost its yellow arrow");
const corner = await sharp("public/brand/reach-logo.png")
  .extract({ left: 0, top: 0, width: 8, height: 8 })
  .raw()
  .toBuffer();
if (corner[3] !== 0) fail(`Logo master corner alpha is ${corner[3]}, expected 0`);

/* ------------------------------------------------------------------ *
 * Global 404 (complete document, no locale layout)
 * ------------------------------------------------------------------ */
const nfContext = await browser.newContext({ viewport: { width: 1200, height: 800 } });
const nf = await nfContext.newPage();
nf.on("pageerror", (error) => fail(`[not-found] pageerror: ${error.message}`));
nf.on("console", (message) => {
  // The document itself is intentionally a 404; Chrome logs that expected
  // response as a console error. Any non-404 error is still a failure.
  if (message.type() === "error" && !message.text().includes("404")) {
    fail(`[not-found] console.error: ${message.text()}`);
  }
});
const nfResponse = await nf.goto(`${BASE}/this-page-does-not-exist`, { waitUntil: "networkidle" });
await nf.waitForTimeout(300);
const nfState = await nf.evaluate(() => {
  const plate = document.querySelector(".nf__brand .brand__plate");
  const svg = plate?.querySelector("svg");
  const code = document.querySelector(".nf__code")?.textContent;
  return {
    plate: plate
      ? {
          bg: getComputedStyle(plate).backgroundColor,
          w: Math.round(plate.getBoundingClientRect().width),
          h: Math.round(plate.getBoundingClientRect().height),
          paths: svg?.querySelectorAll("path").length,
        }
      : null,
    code,
    lang: document.documentElement.lang,
    title: document.title,
    preloader: !!document.querySelector("[data-preloader]"),
  };
});
notes.push(`404: status=${nfResponse?.status()} ${JSON.stringify(nfState)}`);
if (nfResponse?.status() !== 404) fail(`Unknown route returned ${nfResponse?.status()} instead of 404`);
if (!nfState.plate || nfState.plate.bg !== "rgb(69, 69, 181)") fail("404 page is missing the new logo plate");
if (nfState.preloader) fail("404 page unexpectedly renders the preloader");
await nf.screenshot({ path: `${OUT}/not-found-404.png` });
await nfContext.close();

await browser.close();

console.log("\nNOTES");
notes.forEach((note) => console.log(" -", note));
if (issues.length) {
  console.log("\nISSUES");
  issues.forEach((issue) => console.log(" -", issue));
  process.exitCode = 1;
} else {
  console.log("\nPRELOADER + BRAND CHECKS PASSED");
}
