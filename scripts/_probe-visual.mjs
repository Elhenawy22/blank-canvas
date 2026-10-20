import { chromium } from "playwright";

const base = "http://127.0.0.1:3108";
const browser = await chromium.launch({ channel: "chrome" });

async function open(viewport, name, lang = "en") {
  const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`${base}/${lang}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  const preloader = await page.evaluate(() => {
    const root = document.querySelector(".preloader");
    const logo = document.querySelector(".preloader__logo");
    const bar = document.querySelector(".preloader__bar");
    const rect = (el) => (el ? el.getBoundingClientRect().toJSON() : null);
    return {
      present: !!root,
      root: rect(root),
      logo: rect(logo),
      bar: rect(bar),
      innerWidth: window.innerWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      logoCenter: logo ? logo.getBoundingClientRect().left + logo.getBoundingClientRect().width / 2 : null,
    };
  });
  if (preloader.present) {
    await page.screenshot({ path: `validation/probe-preloader-${name}.png` });
  }
  await page.waitForSelector("[data-preloader]", { state: "detached", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);

  const start = await page.evaluate(() => {
    const scene = document.querySelector(".hero__scene");
    const style = scene ? getComputedStyle(scene) : null;
    return {
      videoCount: document.querySelectorAll("video").length,
      canvasCount: document.querySelectorAll(".hero canvas").length,
      opacity: style ? Number(style.opacity) : null,
      perspective: style?.perspective ?? null,
      sceneProgress: scene ? Number(scene.dataset.progress) : null,
      modelCount: document.querySelectorAll(".hero__scene-model").length,
      cubeTransform: document.querySelector(".hero__scene-cube--large")?.getAttribute("style") ?? null,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      heroHeight: document.querySelector(".hero")?.getBoundingClientRect().height ?? null,
      pinSpacer: !!document.querySelector("#home")?.closest(".pin-spacer"),
      servicesTop: Math.round(document.querySelector("#services")?.getBoundingClientRect().top ?? 0),
    };
  });
  await page.screenshot({ path: `validation/probe-hero-${name}-top.png` });

  await page.evaluate((distance) => window.scrollTo({ top: distance, behavior: "instant" }), Math.round(viewport.height * 0.62));
  await page.waitForTimeout(1200);
  const mid = await page.evaluate(() => {
    const scene = document.querySelector(".hero__scene");
    const content = document.querySelector(".hero__content");
    return {
      scrollY: Math.round(window.scrollY),
      sceneProgress: scene ? Number(scene.dataset.progress) : null,
      cubeTransform: document.querySelector(".hero__scene-cube--large")?.getAttribute("style") ?? null,
      contentOpacity: content ? Number(getComputedStyle(content).opacity) : null,
      servicesTop: Math.round(document.querySelector("#services")?.getBoundingClientRect().top ?? 0),
      headerTop: Math.round(document.querySelector(".site-header")?.getBoundingClientRect().top ?? 0),
    };
  });
  await page.screenshot({ path: `validation/probe-hero-${name}-mid.png` });

  console.log(name, { preloader, start, mid, errors });
  await context.close();
}

await open({ width: 1440, height: 900 }, "desktop");
await open({ width: 390, height: 844 }, "phone");
await open({ width: 1440, height: 900 }, "desktop-ar", "ar");
await browser.close();
