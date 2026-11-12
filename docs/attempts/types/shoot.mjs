/**
 * Focus-type cards only — one PNG per type (+ grid overview).
 * From /types (dark screen).
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'http://localhost:5173';
const W = 393;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(OUT, { recursive: true });

/** Filename order matches Types page: 2×2 grid then all-round wide. */
const CARDS = [
  { file: '01-relay', name: '릴레이형' },
  { file: '02-triathlon', name: '철인3종형' },
  { file: '03-sprint', name: '스프린트형' },
  { file: '04-marathon', name: '마라톤형' },
  { file: '05-allround', name: '올라운더형' },
];

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: W, height: 900 },
  deviceScaleFactor: 2,
});

const url = `${ORIGIN}/types?demo=on&splash=0`;
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.setItem('foco-onboarded', '1');
  localStorage.setItem('foco:demo-mode', 'on');
});
await page.goto(url, { waitUntil: 'networkidle' });
await page.addStyleTag({
  content: `
    .demo-controls { display: none !important; }
    body, html { background: #1c1b1c !important; }
    .stage--demo {
      padding: 0 !important;
      gap: 0 !important;
      width: ${W}px !important;
      background: #1c1b1c !important;
    }
    .iphone { transform: none !important; }
    .iphone__status, .iphone__island, .iphone__home-indicator, .iphone__btn { display: none !important; }
    .iphone, .iphone__screen, .bare, .bare__screen {
      width: ${W}px !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
      background: #1c1b1c !important;
    }
  `,
});
await page.waitForFunction(() => !document.querySelector('.splash'));
await sleep(500);

const padShot = async (name, locator) => {
  const el = locator.first();
  if ((await el.count()) === 0) {
    console.warn('skip', name);
    return;
  }
  await el.scrollIntoViewIfNeeded();
  await sleep(200);
  const box = await el.boundingBox();
  if (!box) {
    console.warn('no box', name);
    return;
  }
  const pad = 10;
  const clip = {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  };
  const vp = page.viewportSize();
  const needH = Math.ceil(clip.y + clip.height + 8);
  if (vp && needH > vp.height) {
    await page.setViewportSize({ width: W, height: needH });
    await sleep(120);
  }
  await page.screenshot({ path: join(OUT, `${name}.png`), clip });
  console.log('card', name, Math.round(clip.width), '×', Math.round(clip.height));
};

// Full grid (4 + wide all-round) as one panel
const gridTop = page.locator('.types__grid').first();
const allRound = page.locator('a.types__card.is-wide').first();
await gridTop.scrollIntoViewIfNeeded();
await sleep(200);
const overview = await page.evaluate(() => {
  const grid = document.querySelector('.types__grid');
  const wide = document.querySelector('a.types__card.is-wide');
  if (!grid || !wide) return null;
  const a = grid.getBoundingClientRect();
  const b = wide.getBoundingClientRect();
  return {
    x: Math.min(a.left, b.left),
    y: Math.min(a.top, b.top),
    width: Math.max(a.right, b.right) - Math.min(a.left, b.left),
    height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top),
  };
});
if (overview) {
  const pad = 12;
  await page.screenshot({
    path: join(OUT, '00-all-cards.png'),
    clip: {
      x: Math.max(0, overview.x - pad),
      y: Math.max(0, overview.y - pad),
      width: overview.width + pad * 2,
      height: overview.height + pad * 2,
    },
  });
  console.log('card 00-all-cards');
}

for (const { file, name } of CARDS) {
  await padShot(
    file,
    page.locator('a.types__card').filter({ hasText: name }),
  );
}

await browser.close();
console.log('done →', OUT);
