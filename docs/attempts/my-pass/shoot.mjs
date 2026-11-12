/**
 * Captures all MY PASS screens at iPhone frame 421×880.
 * Waits for Splash to finish before shooting so FOCO wordmark never overlaps.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'http://localhost:5173';
const FRAME_W = 421;
const FRAME_H = 880;
const CARD_STEP = 301 + 22;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(OUT, { recursive: true });

const FRAME_CSS = `
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
  .stage__device {
    width: ${FRAME_W}px !important;
    height: ${FRAME_H}px !important;
  }
  .iphone { transform: none !important; }
`;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: FRAME_W, height: FRAME_H },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

const applyFrame = async () => {
  await page.addStyleTag({ content: FRAME_CSS });
};

const waitSplashGone = async () => {
  await page.evaluate(() => {
    localStorage.setItem('foco-onboarded', '1');
    localStorage.setItem('foco:demo-mode', 'on');
  });
  // Splash may still play on first paint — wait until gone or timeout
  try {
    await page.waitForSelector('.splash', { state: 'attached', timeout: 1500 });
    await page.waitForSelector('.splash', { state: 'detached', timeout: 5000 });
  } catch {
    await sleep(2800);
  }
  // Extra beat in case splash is leaving via CSS
  await sleep(400);
  const still = await page.locator('.splash').count();
  if (still > 0) {
    await page.waitForSelector('.splash', { state: 'detached', timeout: 5000 }).catch(() => {});
    await sleep(300);
  }
};

const go = async (path) => {
  // splash=0 skips launch overlay so captures never include the FOCO wordmark
  const sep = path.includes('?') ? '&' : '?';
  const url = `${ORIGIN}${path}${sep}demo=on&splash=0`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('foco-onboarded', '1');
    localStorage.setItem('foco:demo-mode', 'on');
  });
  // Re-navigate once onboarded so we land on Pass, not onboarding redirect
  await page.goto(url, { waitUntil: 'networkidle' });
  await waitSplashGone();
  await sleep(400);
  await applyFrame();
  await sleep(300);
};

const shot = async (name) => {
  await sleep(350);
  // Guard: never save a frame that still shows splash
  const splash = await page.locator('.splash').count();
  if (splash > 0) throw new Error(`splash still visible when shooting ${name}`);
  const clip = await page.locator('.iphone').boundingBox();
  const path = join(OUT, `${name}.png`);
  if (clip) {
    await page.screenshot({
      path,
      clip: { x: clip.x, y: clip.y, width: clip.width, height: clip.height },
    });
  } else {
    await page.screenshot({ path });
  }
  console.log('shot', name);
};

await go('/pass');
await sleep(400);

const cardCount = await page.locator('.pass-card').count();
console.log('pass cards', cardCount);

for (let i = 0; i < cardCount; i += 1) {
  await page.evaluate(
    ({ left }) => document.querySelector('.pass__track')?.scrollTo({ left }),
    { left: i * CARD_STEP },
  );
  await sleep(500);
  const hours = await page.locator('.pass-card.is-active .pass-card__hours').textContent();
  const label = (hours || `${i}`).trim().toLowerCase();
  await shot(`01-pass-${label}`);
}

// Verify 1H card does not contain splash FOCO wordmark
const cardOk = await page.evaluate(() => {
  const card = document.querySelector('.pass-card.is-active');
  if (!card) return false;
  // scroll back to first card
  return true;
});
await page.evaluate(() => document.querySelector('.pass__track')?.scrollTo({ left: 0 }));
await sleep(400);
const oneH = await page.locator('.pass-card.is-active .pass-card__hours').textContent();
const hasSplashInDom = (await page.locator('.splash').count()) > 0;
const hasWordmarkInCard = await page.locator('.pass-card.is-active .splash__wordmark, .pass-card.is-active svg.splash__wordmark').count();
console.log('verify 1H', { oneH: oneH?.trim(), hasSplashInDom, hasWordmarkInCard });
if (hasSplashInDom || hasWordmarkInCard > 0) {
  throw new Error('1H capture contaminated by splash');
}

await page.getByRole('link', { name: '이용권 추가 구매하기' }).click();
await sleep(900);
await applyFrame();
await shot('02-pass-buy');

await page.locator('[aria-label="2H 추가"]').click();
await sleep(120);
await page.locator('[aria-label="2H 추가"]').click();
await sleep(120);
await page.locator('[aria-label="4H 추가"]').click();
await sleep(400);
await shot('02b-pass-buy-cart');

await page.evaluate(() => {
  const sheet = document.querySelector('.pass-buy__sheet');
  if (!sheet) return;
  const r = sheet.getBoundingClientRect();
  sheet.dispatchEvent(
    new PointerEvent('pointerdown', {
      clientX: r.left + 100,
      clientY: r.top + 20,
      bubbles: true,
      pointerId: 1,
    }),
  );
  sheet.dispatchEvent(
    new PointerEvent('pointermove', {
      clientX: r.left + 100,
      clientY: r.top - 220,
      bubbles: true,
      pointerId: 1,
    }),
  );
  sheet.dispatchEvent(
    new PointerEvent('pointerup', {
      clientX: r.left + 100,
      clientY: r.top - 220,
      bubbles: true,
      pointerId: 1,
    }),
  );
});
await sleep(500);
await shot('02c-pass-buy-sheet');

await page.locator('.pass-buy__pay').click();
await sleep(800);
await shot('03-toss-checkout');

await page.locator('.toss__company').first().click();
await sleep(200);
await page.locator('.toss__agree').click();
await sleep(250);
await shot('03b-toss-ready');

await page.locator('.toss__pay').click();
await sleep(700);
await shot('03c-toss-processing');
await sleep(1600);
await shot('03d-toss-success');
await sleep(1400);
await shot('04-pass-done');

await browser.close();
console.log('done');
