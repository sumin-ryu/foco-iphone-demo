/**
 * STEP 07 RECORD — 하루 Focus Shape + 일자 상세 (과목·1H BAR).
 * Phone frame 421×880 (detail is full-height when content overflows).
 */
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'http://localhost:5173';
const FRAME_W = 421;
const FRAME_H = 880;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(OUT, { recursive: true });

const PHONE_CSS = `
  .demo-controls { display: none !important; }
  .stage--demo {
    padding: 0 !important;
    gap: 0 !important;
    min-height: ${FRAME_H}px !important;
    height: ${FRAME_H}px !important;
    width: ${FRAME_W}px !important;
    justify-content: flex-start !important;
    background: #eef0f4 !important;
  }
  .stage__device { width: ${FRAME_W}px !important; height: ${FRAME_H}px !important; }
  .iphone { transform: none !important; }
`;

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: FRAME_W, height: FRAME_H },
  deviceScaleFactor: 2,
});

const prepare = async (path) => {
  const url = `${ORIGIN}${path}${path.includes('?') ? '&' : '?'}demo=on&splash=0`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('foco-onboarded', '1');
    localStorage.setItem('foco:demo-mode', 'on');
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: PHONE_CSS });
  await page.waitForFunction(() => !document.querySelector('.splash'));
  await sleep(500);
};

const shot = async (name) => {
  await sleep(350);
  await page.locator('.iphone').screenshot({ path: join(OUT, `${name}.png`) });
  console.log('shot', name);
};

const shotEl = async (name, locator) => {
  if ((await locator.count()) === 0) {
    console.warn('skip missing', name);
    return;
  }
  await locator.first().screenshot({ path: join(OUT, `${name}.png`) });
  console.log('crop', name);
};

/** Expand phone frame to fit full scroll content. */
const shotFull = async (name) => {
  await sleep(300);
  await page.evaluate(() => {
    const scroll = document.querySelector('.app__scroll');
    if (!scroll) return;
    scroll.style.height = 'auto';
    scroll.style.maxHeight = 'none';
    scroll.style.overflow = 'visible';
    const app = document.querySelector('.app');
    if (app) {
      app.style.height = 'auto';
      app.style.overflow = 'visible';
    }
  });
  await sleep(200);
  const frameH = await page.evaluate(() => {
    const scroll = document.querySelector('.app__scroll');
    const header = document.querySelector('.page-header, .record__head, header');
    const content =
      Math.ceil((header?.getBoundingClientRect().height ?? 0) + (scroll?.scrollHeight ?? 880)) + 16;
    const h = Math.max(content, 880);
    const screen = document.querySelector('.iphone__screen');
    const phone = document.querySelector('.iphone');
    const stage = document.querySelector('.stage__device, .stage--demo');
    // Match bezel padding (14+14); keep screen bg in sync for dark reports
    const phoneH = h + 28;
    if (screen) {
      screen.style.height = `${h}px`;
      const dark = document.documentElement.dataset.screen === 'dark';
      if (dark) screen.style.background = '#1c1b1c';
    }
    if (phone) phone.style.height = `${phoneH}px`;
    if (stage) {
      stage.style.height = `${phoneH}px`;
      stage.style.minHeight = `${phoneH}px`;
    }
    return phoneH;
  });
  await page.setViewportSize({ width: FRAME_W, height: frameH + 24 });
  await page.addStyleTag({
    content: `
      .stage--demo, .stage__device { height: ${frameH}px !important; min-height: ${frameH}px !important; }
      .iphone { height: ${frameH}px !important; }
      .app, .app__scroll { height: auto !important; max-height: none !important; overflow: visible !important; }
      :root[data-screen='dark'] .iphone__screen { background: #1c1b1c !important; }
    `,
  });
  await sleep(400);
  await page.locator('.iphone').screenshot({ path: join(OUT, `${name}.png`) });
  console.log('full', name, frameH);
  // Keep expanded viewport so section crops below the fold aren't clipped.
  return frameH;
};

// —— 01 하루 Focus Shape (캘린더 + 요약 카드) ——
await prepare('/record');

const richDay = page.locator('.calendar__day:not(.is-outside):not([disabled])').filter({
  has: page.locator('.calendar__mark'),
});
const dayCount = await richDay.count();
let picked = null;
for (let i = 0; i < dayCount; i += 1) {
  const label = (await richDay.nth(i).getAttribute('aria-label')) ?? '';
  if (/[68]시간|집중/.test(label) && !/0분/.test(label)) {
    picked = richDay.nth(i);
  }
}
if (!picked && dayCount > 0) picked = richDay.nth(Math.min(dayCount - 1, Math.floor(dayCount * 0.6)));
if (picked) {
  await picked.click();
  await sleep(700);
}

// Scroll so the day Focus Shape card sits in frame (calendar + summary together)
await page.evaluate(() => {
  const scroll = document.querySelector('.app__scroll');
  const summary = document.querySelector('.record-summary');
  if (!scroll || !summary) return;
  const top =
    summary.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop;
  // Keep a slice of the calendar above the card
  scroll.scrollTo({ top: Math.max(0, top - 280), behavior: 'instant' });
});
await sleep(400);

await shot('01-day-summary');
await shotEl('01b-focus-shape-only', page.locator('.record-summary__mark'));
await shotEl('01c-summary-card-only', page.locator('.record-summary'));

// —— 02 일자 상세 (집중 시간 · 과목별) ——
const more = page.locator('a.record-summary__more');
if (await more.count()) {
  await more.click();
  await sleep(900);
} else {
  const dateKey = await page.evaluate(() => new URL(location.href).searchParams.get('date'));
  if (dateKey) await prepare(`/record/${dateKey}`);
  else await prepare('/record/2026-10-24');
}

await shotFull('02-day-detail');

/** Title + following siblings until next h2 — used for pass / subjects blocks. */
const shotSection = async (name, titleLocator) => {
  if ((await titleLocator.count()) === 0) {
    console.warn('skip missing', name);
    return;
  }
  const title = titleLocator.first();
  // Ensure section is laid out in the expanded frame (not clipped by old viewport)
  await title.evaluate((node) => {
    node.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  await sleep(200);
  const box = await title.evaluate((el) => {
    let end = el;
    let n = el.nextElementSibling;
    while (n && !n.matches('h2, .section-title')) {
      end = n;
      n = n.nextElementSibling;
    }
    const a = el.getBoundingClientRect();
    const b = end.getBoundingClientRect();
    return {
      x: Math.min(a.left, b.left),
      y: Math.min(a.top, b.top),
      width: Math.max(a.right, b.right) - Math.min(a.left, b.left),
      height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top),
    };
  });
  const pad = 12;
  const clip = {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  };
  // Grow viewport if section extends past it (page.screenshot clip can't exceed viewport)
  const vp = page.viewportSize();
  const needH = Math.ceil(clip.y + clip.height + 8);
  const needW = Math.ceil(clip.x + clip.width + 8);
  if (vp && (needH > vp.height || needW > vp.width)) {
    await page.setViewportSize({
      width: Math.max(vp.width, needW),
      height: Math.max(vp.height, needH),
    });
    await sleep(150);
  }
  await page.screenshot({ path: join(OUT, `${name}.png`), clip });
  console.log('crop', name, Math.round(clip.width), '×', Math.round(clip.height));
};

await shotEl('02b-hero-only', page.locator('.record-detail__hero'));
await shotSection('02c-hours-only', page.locator('h2.focus-done__pass-title'));
await shotSection('02d-subjects-only', page.locator('h2.focus-done__subjects-title'));
await page.setViewportSize({ width: FRAME_W, height: FRAME_H });

// Remove leftover STEP 08 / old mixed shots from this folder
const keep = new Set([
  'shoot.mjs',
  '01-day-summary.png',
  '01b-focus-shape-only.png',
  '01c-summary-card-only.png',
  '02-day-detail.png',
  '02b-hero-only.png',
  '02c-hours-only.png',
  '02d-subjects-only.png',
]);
for (const f of readdirSync(OUT)) {
  if (!keep.has(f)) {
    unlinkSync(join(OUT, f));
    console.log('removed', f);
  }
}

await browser.close();
console.log('done →', OUT);
