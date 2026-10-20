import { chromium } from "playwright";

const base = process.env.TEST_URL ?? "http://127.0.0.1:3108";
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForSelector("[data-preloader]", { state: "detached", timeout: 15000 });
await page.waitForTimeout(600);

// Reproduce the suite: jump to the bottom, then back to the top.
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
await page.waitForTimeout(900);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.waitForTimeout(900);

const before = await page.evaluate(() => ({
  y: window.scrollY,
  servicesTop: document.querySelector("#services").getBoundingClientRect().top,
  offsetTop: document.querySelector("#services").offsetTop,
  scrollPadding: getComputedStyle(document.documentElement).scrollPaddingTop,
  headerH: document.querySelector(".site-header").offsetHeight,
  pinSpacer: !!document.querySelector("#home")?.closest(".pin-spacer"),
}));
console.log("before click", before);

await page.locator(".site-header__links a", { hasText: "Services" }).click();

const samples = [];
for (let i = 0; i < 30; i += 1) {
  await page.waitForTimeout(100);
  samples.push(
    await page.evaluate(() => ({
      t: Math.round(performance.now()),
      y: Math.round(window.scrollY * 10) / 10,
      top: Math.round(document.querySelector("#services").getBoundingClientRect().top * 10) / 10,
    })),
  );
}
const settled = samples.slice(-6);
console.log("trace tail", settled);
console.log("final offset", settled.at(-1).top, "expected", -100);

await browser.close();
