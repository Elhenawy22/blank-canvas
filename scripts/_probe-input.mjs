import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome" });

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();
await page.goto("http://127.0.0.1:3108/", { waitUntil: "networkidle" });
await page.waitForSelector("[data-preloader]", { state: "detached", timeout: 20000 });
await page.waitForTimeout(800);
await page.locator("body").click({ position: { x: 720, y: 500 } });
await page.keyboard.press("PageDown");
await page.waitForTimeout(1600);
const afterKey = await page.evaluate(() => ({
  y: Math.round(scrollY),
  sceneProgress: Number(document.querySelector(".hero__scene")?.dataset.progress),
  opacity: Number(getComputedStyle(document.querySelector(".hero__content")).opacity),
}));
await page.mouse.move(720, 450);
await page.mouse.wheel(0, 600);
await page.waitForTimeout(1800);
const afterWheel = await page.evaluate(() => ({
  y: Math.round(scrollY),
  sceneProgress: Number(document.querySelector(".hero__scene")?.dataset.progress),
}));
await page.keyboard.press("PageUp");
await page.waitForTimeout(1600);
const afterUp = await page.evaluate(() => ({
  y: Math.round(scrollY),
  sceneProgress: Number(document.querySelector(".hero__scene")?.dataset.progress),
}));
console.log({ afterKey, afterWheel, afterUp });
await desktop.close();

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});
const phone = await mobile.newPage();
await phone.goto("http://127.0.0.1:3108/", { waitUntil: "networkidle" });
await phone.waitForSelector("[data-preloader]", { state: "detached", timeout: 20000 });
await phone.waitForTimeout(800);
const cdp = await mobile.newCDPSession(phone);
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x: 195, y: 760, radiusX: 2, radiusY: 2, force: 1 }],
});
for (let y = 720; y >= 300; y -= 40) {
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 195, y, radiusX: 2, radiusY: 2, force: 1 }],
  });
  await phone.waitForTimeout(16);
}
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await phone.waitForTimeout(1800);
const afterSwipe = await phone.evaluate(() => ({
  y: Math.round(scrollY),
  sceneProgress: Number(document.querySelector(".hero__scene")?.dataset.progress),
  opacity: Number(getComputedStyle(document.querySelector(".hero__content")).opacity),
}));
console.log({ afterSwipe });
await browser.close();
