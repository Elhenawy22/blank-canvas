/**
 * Browser regression checks for the scroll-driven 3D hero.
 *
 * Covers desktop/tablet/phone layouts, forward and reverse scene progress,
 * locale direction, resizing, reduced motion, and absence of hero videos.
 * Expects a running server at TEST_URL (default http://localhost:3000).
 */
import { chromium } from "playwright";

const BASE = process.env.TEST_URL ?? "http://localhost:3000";
const failures = [];
const results = [];

function fail(message) {
  failures.push(message);
}

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch (error) {
    console.warn(`Chrome channel unavailable (${error.message.split("\n")[0]}); using Playwright Chromium.`);
    return chromium.launch();
  }
}

async function readMetrics(page) {
  return page.evaluate(() => {
    const box = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      };
    };
    const hero = document.querySelector(".hero");
    const scene = document.querySelector(".hero__scene");
    const spacer = hero?.closest(".pin-spacer");
    const copy = document.querySelector(".hero__content");

    return {
      width: innerWidth,
      height: innerHeight,
      scrollY,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      hero: box(hero),
      scene: box(scene),
      spacerHeight: spacer ? spacer.getBoundingClientRect().height : null,
      copyOpacity: copy ? Number(getComputedStyle(copy).opacity) : null,
      sceneProgress: scene ? Number(scene.dataset.progress) : null,
      sceneModelCount: document.querySelectorAll(".hero__scene-model").length,
      scenePerspective: scene ? getComputedStyle(scene).perspective : null,
      sceneTransform: document.querySelector(".hero__scene-cube--large")?.getAttribute("style") ?? "",
      videoCount: document.querySelectorAll("video").length,
      canvasCount: document.querySelectorAll(".hero canvas").length,
    };
  });
}

async function waitForPage(page, label, errors) {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`${BASE}${label}`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-preloader]", { state: "detached", timeout: 15000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(1500);
}

async function scrollTo(page, y) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await page.waitForTimeout(850);
}

function assertScene(metrics, label) {
  if (metrics.videoCount !== 0) fail(`[${label}] rendered ${metrics.videoCount} video(s)`);
  if (metrics.canvasCount !== 0) fail(`[${label}] rendered a canvas instead of CSS 3D`);
  if (metrics.sceneModelCount !== 5) {
    fail(`[${label}] expected 5 CSS 3D models, found ${metrics.sceneModelCount}`);
  }
  if (metrics.scenePerspective !== "1100px") {
    fail(`[${label}] scene perspective is "${metrics.scenePerspective}"`);
  }
  if (!metrics.scene || metrics.scene.width < 100 || metrics.scene.height < 100) {
    fail(`[${label}] 3D scene is missing or has no visible dimensions`);
  }
  if (metrics.scrollWidth - metrics.clientWidth > 1) {
    fail(`[${label}] horizontal overflow ${metrics.scrollWidth - metrics.clientWidth}px`);
  }
}

function pinDistance(metrics) {
  return metrics.spacerHeight === null
    ? 0
    : Math.max(0, metrics.spacerHeight - (metrics.hero?.height ?? 0));
}

async function runViewport(browser, viewport) {
  const label = `viewport-${viewport.width}`;
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.mobile ?? false,
    hasTouch: viewport.mobile ?? false,
    deviceScaleFactor: viewport.mobile ? 2 : 1,
  });
  const page = await context.newPage();
  const errors = [];
  const mediaRequests = [];
  page.on("request", (request) => {
    if (/\.mp4(?:\?|$)/i.test(request.url())) mediaRequests.push(request.url());
  });

  await waitForPage(page, "/", errors);
  let metrics = await readMetrics(page);
  assertScene(metrics, label);
  if (Math.abs(metrics.hero?.top ?? 99) > 1) fail(`[${label}] hero starts at ${metrics.hero?.top}px`);
  if ((metrics.hero?.height ?? 0) < metrics.height - 1) fail(`[${label}] hero does not fill the viewport`);

  const distance = pinDistance(metrics);
  if (distance <= 0) fail(`[${label}] hero did not pin during scroll`);
  if (metrics.sceneProgress !== 0) fail(`[${label}] scene should start at progress 0, got ${metrics.sceneProgress}`);

  const downTransforms = new Map();
  for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
    await scrollTo(page, Math.round(distance * fraction));
    metrics = await readMetrics(page);
    const expected = fraction;
    if (Math.abs((metrics.sceneProgress ?? -1) - expected) > 0.06) {
      fail(
        `[${label}] scene progress at ${fraction} is ${metrics.sceneProgress}; expected approximately ${expected}`,
      );
    }
    if (fraction < 1 && Math.abs(metrics.hero?.top ?? 99) > 1) {
      fail(`[${label}] hero unpinned at ${fraction * 100}%`);
    }
    if (fraction > 0 && fraction < 1 && (metrics.copyOpacity ?? 1) > 1 - fraction + 0.15) {
      fail(`[${label}] copy did not fade with the pinned scroll`);
    }
    downTransforms.set(fraction, metrics.sceneTransform);
    if (fraction === 0.5) {
      await page.screenshot({ path: `validation/scroll-${label}-mid.png` });
    }
  }

  for (const fraction of [0.75, 0.5, 0.25, 0]) {
    await scrollTo(page, Math.round(distance * fraction));
    metrics = await readMetrics(page);
    if (Math.abs((metrics.sceneProgress ?? -1) - fraction) > 0.06) {
      fail(`[${label}] reverse scroll at ${fraction} produced progress ${metrics.sceneProgress}`);
    }
    if (fraction > 0 && metrics.sceneTransform !== downTransforms.get(fraction)) {
      fail(`[${label}] scene rotation differs when returning to the same scroll position`);
    }
  }

  if (mediaRequests.length) {
    fail(`[${label}] requested hero video asset(s): ${[...new Set(mediaRequests)].join(", ")}`);
  }
  if (errors.length) errors.forEach((error) => fail(`[${label}] ${error}`));
  results.push(`${label}: ${viewport.width}x${viewport.height}, ${metrics.sceneModelCount} 3D objects, no video`);
  await context.close();
}

async function runArabic(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  const errors = [];
  await waitForPage(page, "/ar", errors);
  let metrics = await readMetrics(page);
  assertScene(metrics, "Arabic");
  if (metrics.lang !== "ar" || metrics.dir !== "rtl") {
    fail(`[Arabic] expected lang=ar and dir=rtl, got lang=${metrics.lang} dir=${metrics.dir}`);
  }

  const distance = pinDistance(metrics);
  await scrollTo(page, Math.round(distance * 0.5));
  metrics = await readMetrics(page);
  if (Math.abs((metrics.sceneProgress ?? -1) - 0.5) > 0.06) {
    fail(`[Arabic] scene does not track scroll (progress ${metrics.sceneProgress})`);
  }
  if (errors.length) errors.forEach((error) => fail(`[Arabic] ${error}`));
  results.push("Arabic RTL: 3D scene tracks scroll");
  await context.close();
}

async function runResize(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  await waitForPage(page, "/", errors);
  const desktop = await readMetrics(page);
  await scrollTo(page, Math.round(pinDistance(desktop) * 0.5));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1200);
  const mobile = await readMetrics(page);
  assertScene(mobile, "resize-mobile");
  if (Math.abs(mobile.hero?.top ?? 99) > 1) fail("[resize] hero shifted after viewport change");
  if (mobile.spacerHeight === null) fail("[resize] scroll pin disappeared after viewport change");
  if (errors.length) errors.forEach((error) => fail(`[resize] ${error}`));
  results.push("Resize: desktop to mobile keeps scene and pin");
  await context.close();
}

async function runReducedMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  const mediaRequests = [];
  page.on("request", (request) => {
    if (/\.mp4(?:\?|$)/i.test(request.url())) mediaRequests.push(request.url());
  });
  await waitForPage(page, "/", errors);
  const metrics = await readMetrics(page);
  assertScene(metrics, "reduced-motion");
  if (metrics.spacerHeight !== null) fail("[reduced-motion] hero should not be pinned");
  if ((metrics.copyOpacity ?? 0) < 0.99) fail("[reduced-motion] hero copy is not visible");
  if (mediaRequests.length) fail("[reduced-motion] requested a video asset");
  if (errors.length) errors.forEach((error) => fail(`[reduced-motion] ${error}`));
  results.push("Reduced motion: static 3D scene, no pin");
  await context.close();
}

const browser = await launchBrowser();
try {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 430, height: 844, mobile: true },
    { width: 390, height: 844, mobile: true },
    { width: 360, height: 800, mobile: true },
    { width: 320, height: 568, mobile: true },
  ]) {
    await runViewport(browser, viewport);
  }
  await runArabic(browser);
  await runResize(browser);
  await runReducedMotion(browser);
} finally {
  await browser.close();
}

if (failures.length) {
  console.error("\n3D HERO VALIDATION FAILED:");
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exitCode = 1;
} else {
  console.log("\n3D HERO VALIDATION PASSED:");
  results.forEach((result) => console.log(` - ${result}`));
}
