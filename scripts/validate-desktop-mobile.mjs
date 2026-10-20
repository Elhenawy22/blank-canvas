/**
 * Validation script — scrolls the real pages (English + Arabic), captures
 * per-section and responsive states, exercises the menu/filters/form, and
 * reports console + page errors. Run: node scripts/validate-desktop-mobile.mjs
 *
 * Expects a running server (dev or production) at TEST_URL (default :3000).
 */
import { chromium, request as playwrightRequest } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.TEST_URL ?? "http://localhost:3000";
const OUT = "validation";
await mkdir(OUT, { recursive: true });

const issues = [];

/** Per-locale labels the script interacts with and asserts against. */
const locales = {
  en: {
    path: "/",
    dir: "ltr",
    lang: "en",
    navServices: "Services",
    navWork: "Our work",
    filterBranding: "Branding",
    filterAll: "View All",
    submit: /send an enquiry/i,
    toggle: /navigation menu/i,
    nameField: /your name/i,
    values: {
      name: "Test Person",
      email: "test@example.com",
      message: "Hello there",
    },
  },
  ar: {
    path: "/ar",
    dir: "rtl",
    lang: "ar",
    navServices: "خدماتنا",
    navWork: "أعمالنا",
    filterBranding: "الهوية البصرية",
    filterAll: "الكل",
    submit: /أرسل طلبك/,
    toggle: /قائمة التنقل/,
    nameField: /الاسم/,
    values: {
      name: "سارة أحمد",
      email: "test@example.com",
      message: "مرحبًا، أرغب بالاستفسار",
    },
  },
};

function collect(context, label) {
  const onError = (error) =>
    issues.push(`[${label}] pageerror: ${error?.message ?? error}`);
  const onConsole = (message) => {
    if (message.type() === "error") {
      issues.push(`[${label}] console.error: ${message.text()}`);
    }
  };
  context.on("pageerror", onError);
  context.on("console", onConsole);
}

async function settle(page) {
  await page.waitForTimeout(650);
}

/** Waits until Lenis has actually stopped, so anchor measurements are not
 *  sampled mid-ease (the smooth scroll is ~1.1s, longer than `settle`). */
async function waitForScrollSettle(page, timeout = 4000) {
  await page.evaluate(async (limit) => {
    const started = performance.now();
    let last = window.scrollY;
    let stable = 0;
    while (performance.now() - started < limit) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const y = window.scrollY;
      if (Math.abs(y - last) < 0.5) {
        stable += 1;
        if (stable >= 12) return;
      } else {
        stable = 0;
        last = y;
      }
    }
  }, timeout);
}

/** Blocks until the initial brand preloader has released the page. */
async function waitForPreloader(page, label) {
  try {
    await page.waitForSelector("[data-preloader]", { state: "detached", timeout: 12000 });
  } catch {
    issues.push(`[${label}] preloader did not clear within 12s`);
  }
}

async function scrollThrough(page) {
  // Advance a step, let ScrollTrigger work, repeat until the bottom.
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.55);
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 400));
  });
  await settle(page);
}

/** Confirms the server-rendered document language + direction. */
async function assertDocumentLocale(page, { lang, dir, label }) {
  const doc = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
  }));
  if (doc.lang !== lang || doc.dir !== dir) {
    issues.push(
      `[${label}] document locale is lang="${doc.lang}" dir="${doc.dir}" (expected "${lang}"/"${dir}")`,
    );
  }
}

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

async function runDesktop(locale) {
  const label = `${locale.lang}-desktop`;
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  collect(context, label);
  const p = await context.newPage();
  await p.goto(`${BASE}${locale.path}`, { waitUntil: "networkidle" });
  await waitForPreloader(p, label);
  await p.evaluate(() => document.fonts.ready);
  await settle(p);
  await assertDocumentLocale(p, { ...locale, label });

  await p.screenshot({ path: `${OUT}/${locale.lang}-desktop-01-hero.png` });

  // Keyboard-first: the first Tab reaches the skip link, and Enter jumps
  // to the main landmark.
  await p.keyboard.press("Tab");
  const firstFocus = await p.evaluate(() => document.activeElement?.className ?? "");
  if (!firstFocus.includes("skip-link")) {
    issues.push(`[${label}] first Tab focused "${firstFocus}" (expected skip-link)`);
  }
  await p.keyboard.press("Enter");
  await p.waitForTimeout(250);
  const skipHash = await p.evaluate(() => window.location.hash);
  if (skipHash !== "#main-content") {
    issues.push(`[${label}] skip link did not reach #main-content (hash="${skipHash}")`);
  }

  await scrollThrough(p);
  for (const [name, selector] of [
    ["02-services", "#services"],
    ["03-milestones", "#about"],
    ["04-marquee", ".marquee"],
    ["05-principles", ".principles"],
    ["06-work", "#work"],
    ["07-contact", "#contact"],
  ]) {
    await p.evaluate((sel) => {
      document.querySelector(sel)?.scrollIntoView({ behavior: "instant", block: "start" });
    }, selector);
    await p.waitForTimeout(1600);
    await p.screenshot({ path: `${OUT}/${locale.lang}-desktop-${name}.png` });
  }

  // Screenshot the header at the very top for the record.
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await settle(p);
  await p.screenshot({ path: `${OUT}/${locale.lang}-desktop-08-header-top.png` });

  // Horizontal overflow check.
  const overflow = await p.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 1) issues.push(`[${label}] horizontal overflow: ${overflow}px`);

  // Desktop navigation is an inline link row (the overlay is mobile-only).
  const headerLinksVisible = await p.locator(".site-header__links a").first().isVisible();
  if (!headerLinksVisible) issues.push(`[${label}] inline header links should be visible`);
  const toggleVisible = await p.getByRole("button", { name: locale.toggle }).isVisible();
  if (toggleVisible) issues.push(`[${label}] menu toggle should stay hidden on desktop`);
  await p.locator(".site-header__links a", { hasText: locale.navServices }).click();
  await waitForScrollSettle(p);
  await settle(p);
  const servicesTop = await p.evaluate(
    () => document.querySelector("#services").getBoundingClientRect().top,
  );
  if (Math.abs(servicesTop) > 220) {
    issues.push(`[${label}] anchor to #services landed ${Math.round(servicesTop)}px off`);
  }

  // Filters.
  await p.locator(".site-header__links a", { hasText: locale.navWork }).click().catch(() => {});
  await waitForScrollSettle(p);
  await settle(p);
  await p.getByRole("button", { name: locale.filterBranding, exact: true }).click();
  await settle(p);
  const brandingCards = await p.locator(".project-card").count();
  if (brandingCards !== 1) {
    issues.push(`[${label}] Branding filter shows ${brandingCards} cards (expected 1)`);
  }
  await p.screenshot({ path: `${OUT}/${locale.lang}-desktop-09-filter.png` });
  await p.getByRole("button", { name: locale.filterAll, exact: true }).click();
  await settle(p);
  const allCards = await p.locator(".project-card").count();
  if (allCards !== 4) issues.push(`[${label}] View All shows ${allCards} cards (expected 4)`);

  // Contact form (mailto fallback note while brand.email is unset).
  await p.evaluate(() => {
    document.querySelector("#contact")?.scrollIntoView({ behavior: "instant" });
  });
  await settle(p);
  await p.getByRole("textbox", { name: locale.nameField }).first().fill(locale.values.name);
  await p.locator('input[name="email"]').fill(locale.values.email);
  await p.locator('textarea[name="message"]').fill(locale.values.message);
  await p.getByRole("button", { name: locale.submit }).click();
  await settle(p);
  const note = await p.locator(".contact-form__message").textContent();
  if (!note || note.length < 10) {
    issues.push(`[${label}] contact mailto-note did not render`);
  }

  // Language switch keeps you on the same document family.
  await p.locator(".lang-switch__item").last().click();
  await p.waitForLoadState("networkidle");
  await waitForPreloader(p, label);
  const switched = await p.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
  }));
  const expected = locale.lang === "en" ? { lang: "ar", dir: "rtl" } : { lang: "en", dir: "ltr" };
  if (switched.lang !== expected.lang || switched.dir !== expected.dir) {
    issues.push(`[${label}] language switch landed on ${JSON.stringify(switched)}`);
  }

  await context.close();
}

async function runMobile(locale) {
  const label = `${locale.lang}-mobile`;
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  collect(context, label);
  const p = await context.newPage();
  await p.goto(`${BASE}${locale.path}`, { waitUntil: "networkidle" });
  await waitForPreloader(p, label);
  await p.evaluate(() => document.fonts.ready);
  await settle(p);
  await assertDocumentLocale(p, { ...locale, label });
  await p.screenshot({ path: `${OUT}/${locale.lang}-mobile-01-hero.png` });

  await scrollThrough(p);
  for (const [name, selector] of [
    ["02-services", "#services"],
    ["03-work", "#work"],
    ["04-contact", "#contact"],
  ]) {
    await p.evaluate((sel) => {
      document.querySelector(sel)?.scrollIntoView({ behavior: "instant", block: "start" });
    }, selector);
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${OUT}/${locale.lang}-mobile-${name}.png` });
  }

  const overflow = await p.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 1) issues.push(`[${label}] horizontal overflow: ${overflow}px`);

  await p.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await p.locator(".menu-toggle").tap();
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/${locale.lang}-mobile-05-menu.png` });
  const openState = await p.locator(".navigation").evaluate((el) => ({
    open: el.classList.contains("navigation--open"),
    inert: el.hasAttribute("inert"),
    visible: getComputedStyle(el).visibility === "visible",
  }));
  if (!openState.open || openState.inert || !openState.visible) {
    issues.push(`[${label}] overlay did not open contently: ${JSON.stringify(openState)}`);
  }

  // While the overlay is open the fixed brand + toggle must still own their
  // points (regression: the overlay once stacked above the header content).
  const hitTest = await p.evaluate(() => {
    const owns = (el, tag, cls) => {
      if (!el) return "missing";
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!top) return "no-hit";
      return top.closest(`${tag}.${cls}`) ? "ok" : top.tagName.toLowerCase();
    };
    return {
      brand: owns(document.querySelector(".site-header .brand"), "a", "brand"),
      toggle: owns(document.querySelector(".site-header .menu-toggle"), "button", "menu-toggle"),
    };
  });
  if (hitTest.brand !== "ok") {
    issues.push(`[${label}] brand hit-test under open overlay: ${hitTest.brand}`);
  }
  if (hitTest.toggle !== "ok") {
    issues.push(`[${label}] menu-toggle hit-test under open overlay: ${hitTest.toggle}`);
  }

  await p.locator(".navigation [data-overlay-item]", { hasText: locale.navWork }).tap();
  await settle(p);
  const workVisible = await p.locator("#work").isVisible();
  if (!workVisible) issues.push(`[${label}] overlay link did not navigate to #work`);
  const closedState = await p
    .locator(".navigation")
    .evaluate((el) => ({ inert: el.hasAttribute("inert"), open: el.classList.contains("navigation--open") }));
  if (closedState.open || !closedState.inert) {
    issues.push(`[${label}] overlay did not close after link tap: ${JSON.stringify(closedState)}`);
  }

  // Reopen and close via the toggle itself, proving the X stays tappable
  // above the dark panel as long as the page is alive.
  await p.locator(".menu-toggle").tap();
  await p.waitForTimeout(700);
  await p.locator(".menu-toggle").tap();
  await settle(p);
  const reopenedClosed = await p.evaluate(
    () => !document.querySelector(".navigation.navigation--open"),
  );
  if (!reopenedClosed) issues.push(`[${label}] toggle tap did not close the reopened overlay`);

  await context.close();
}

async function runReducedMotion(locale) {
  const label = `${locale.lang}-reduced`;
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  collect(context, label);
  const p = await context.newPage();
  await p.goto(`${BASE}${locale.path}`, { waitUntil: "networkidle" });
  await waitForPreloader(p, label);
  await settle(p);
  await p.screenshot({ path: `${OUT}/${locale.lang}-reduced-01-hero.png` });
  await scrollThrough(p);

  const hidden = await p.evaluate(() => {
    const targets = [
      ".services-grid .service-card",
      "#work .project-card",
      ".contact-form",
    ];
    return targets.flatMap((sel) =>
      Array.from(document.querySelectorAll(sel))
        .filter((el) => {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.opacity === "0" && rect.width > 0 && rect.height > 0;
        })
        .map(() => `${sel} hidden`),
    );
  });
  if (hidden.length) issues.push(`[${label}] content stuck hidden: ${hidden.join(", ")}`);

  const overflow = await p.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 1) issues.push(`[${label}] horizontal overflow: ${overflow}px`);

  await context.close();
}

/**
 * Width sweep — every representative viewport from the brief. Each width
 * gets an overflow assertion and a check that key containers stay inside
 * the viewport; the critical widths keep header + footer screenshots.
 */
const SWEEP_WIDTHS = [320, 360, 375, 390, 430, 768, 1024, 1280, 1920];

async function runWidthSweep(locale) {
  for (const width of SWEEP_WIDTHS) {
    const label = `${locale.lang}-${width}`;
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    collect(context, label);
    const p = await context.newPage();
    await p.goto(`${BASE}${locale.path}`, { waitUntil: "networkidle" });
    await waitForPreloader(p, label);
    await p.evaluate(() => document.fonts.ready);
    await settle(p);

    const overflow = await p.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 1) issues.push(`[${label}] horizontal overflow: ${overflow}px`);

    const clipped = await p.evaluate(() => {
      const selectors = [
        ".site-header__inner",
        ".hero__content",
        ".site-footer__main",
        ".contact-form",
      ];
      return selectors.flatMap((sel) =>
        Array.from(document.querySelectorAll(sel))
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { sel, left: Math.round(r.left), right: Math.round(r.right) };
          })
          .filter((r) => r.left < -1 || r.right > window.innerWidth + 1),
      );
    });
    if (clipped.length) issues.push(`[${label}] clipped containers: ${JSON.stringify(clipped)}`);

    if (width === 320 || width === 768 || width === 1024) {
      await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
      await p.waitForTimeout(500);
      await p.screenshot({ path: `${OUT}/${locale.lang}-width-${width}-footer.png` });
      await p.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await p.waitForTimeout(400);
      await p.screenshot({ path: `${OUT}/${locale.lang}-width-${width}-header.png` });
    }

    await context.close();
  }
}

/**
 * Root-locale routing. `/` is an internal rewrite to `/en` and must answer in
 * place (200, no redirect); `/en` is a permanent redirect to the canonical
 * root; `/ar` is served directly. This is the regression guard for the
 * rewrite-origin loop: an absolute middleware rewrite could turn `/` into a
 * 308 to itself when the server was bound with `-H`.
 */
async function assertRouting() {
  const api = await playwrightRequest.newContext({ baseURL: BASE });
  try {
    const root = await api.get("/", { maxRedirects: 0 });
    if (root.status() !== 200) issues.push(`[routing] / returned ${root.status()} (expected 200)`);
    else if (!/<html[^>]*lang="en"/i.test(await root.text())) {
      issues.push("[routing] / did not render the English document");
    }

    const en = await api.get("/en", { maxRedirects: 0 });
    if (en.status() !== 308) issues.push(`[routing] /en returned ${en.status()} (expected 308)`);
    const location = en.headers()["location"];
    if (!location || new URL(location, `${BASE}/`).pathname !== "/") {
      issues.push(`[routing] /en redirected to ${location}`);
    }

    const followed = await api.get("/en");
    if (followed.status() !== 200) {
      issues.push(`[routing] /en (following redirects) returned ${followed.status()}`);
    } else if (new URL(followed.url()).pathname !== "/") {
      issues.push(`[routing] /en (following redirects) landed on ${followed.url()}`);
    }

    const ar = await api.get("/ar", { maxRedirects: 0 });
    if (ar.status() !== 200) issues.push(`[routing] /ar returned ${ar.status()} (expected 200)`);
    else if (!/<html[^>]*lang="ar"/i.test(await ar.text())) {
      issues.push("[routing] /ar did not render the Arabic document");
    }
  } finally {
    await api.dispose();
  }
}

await assertRouting();

for (const locale of Object.values(locales)) {
  await runDesktop(locale);
  await runMobile(locale);
  await runReducedMotion(locale);
  await runWidthSweep(locale);
}

await browser.close();

if (issues.length) {
  console.log("ISSUES FOUND:");
  issues.forEach((issue) => console.log(` - ${issue}`));
  process.exitCode = 1;
} else {
  console.log("ALL CHECKS PASSED — no console/page errors, overflow, or stuck states.");
}
