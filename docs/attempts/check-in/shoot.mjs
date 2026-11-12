/**
 * STEP 04 IN · CHECK-IN — phone + kiosk screenshots.
 * Phone: 421×880 iPhone frame (splash=0, toggles hidden).
 * Kiosk: demo KioskFrame at scale 1 (toggles hidden).
 * Dual: /story/check-in stage (phone + kiosk side by side).
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'http://localhost:5173';
const FRAME_W = 421;
const FRAME_H = 880;
const KIOSK_W = 596; // DEVICE_WIDTH
const KIOSK_H = 1284; // DEVICE_HEIGHT
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

const KIOSK_CSS = `
  .demo-controls { display: none !important; }
  .kiosk-stage--demo {
    padding: 0 !important;
    gap: 0 !important;
    min-height: ${KIOSK_H}px !important;
    height: ${KIOSK_H}px !important;
    width: ${KIOSK_W}px !important;
    justify-content: flex-start !important;
    background: #eef0f4 !important;
  }
  .kiosk-stage__fit {
    width: ${KIOSK_W}px !important;
    height: ${KIOSK_H}px !important;
  }
  .kiosk-device { transform: none !important; }
`;

const STORY_CSS = `
  .checkin-story__header,
  .checkin-story__nav,
  .checkin-story__back { display: none !important; }
  .checkin-story {
    padding: 24px !important;
    min-height: auto !important;
    height: auto !important;
    justify-content: flex-start !important;
  }
  .checkin-story__slot figcaption { display: none !important; }
`;

const browser = await chromium.launch({
  headless: true,
  channel: 'chrome', // system Chrome — avoids sandbox Playwright browser cache
});

async function phoneShot(name, path) {
  const page = await browser.newPage({
    viewport: { width: FRAME_W, height: FRAME_H },
    deviceScaleFactor: 2,
  });
  const sep = path.includes('?') ? '&' : '?';
  const url = `${ORIGIN}${path}${sep}demo=on&splash=0`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('foco-onboarded', '1');
    localStorage.setItem('foco:demo-mode', 'on');
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: PHONE_CSS });
  await page.waitForFunction(() => !document.querySelector('.splash')).catch(() => {});
  await sleep(500);
  await page.locator('.iphone').screenshot({ path: join(OUT, `${name}.png`) });
  console.log('phone', name);
  await page.close();
}

async function kioskShot(name, toQuery, { settleMs = 500 } = {}) {
  const page = await browser.newPage({
    viewport: { width: KIOSK_W + 8, height: KIOSK_H + 8 },
    deviceScaleFactor: 2,
  });
  await page.addInitScript(() => {
    localStorage.setItem('foco-kiosk:demo-mode', 'on');
  });
  const qs = toQuery ? `${toQuery}&demo=on` : 'demo=on';
  const url = `${ORIGIN}/kiosk/?${qs}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: KIOSK_CSS });
  await sleep(settleMs);
  const device = page.locator('.kiosk-device');
  if ((await device.count()) === 0) {
    console.warn('no .kiosk-device for', name, '— capturing stage');
    await page.locator('.kiosk-stage').screenshot({ path: join(OUT, `${name}.png`) });
  } else {
    await device.screenshot({ path: join(OUT, `${name}.png`) });
  }
  console.log('kiosk', name);
  await page.close();
}

async function dualShots() {
  // Wide enough for phone + kiosk side by side at story scale
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1100 },
    deviceScaleFactor: 2,
  });
  await page.goto(`${ORIGIN}/story/check-in`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: STORY_CSS });
  await sleep(1200);

  const scenes = [
    { name: 'dual-01-scan', click: null },
    { name: 'dual-02-pass', click: '다음' },
    { name: 'dual-03-seat', click: '다음' },
    { name: 'dual-04-done', click: '다음' },
  ];

  for (const scene of scenes) {
    if (scene.click) {
      // Story nav is hidden by CSS — advance via keyboard / re-show briefly
      await page.keyboard.press('ArrowRight');
      await sleep(1400);
    } else {
      // Wait for iframes to settle on first scene
      await sleep(1600);
    }
    // Wait for phone iframe check-in content
    await sleep(800);
    const stage = page.locator('.checkin-story__stage');
    await stage.screenshot({ path: join(OUT, `${scene.name}.png`) });
    console.log('dual', scene.name);
  }
  await page.close();
}

// —— Phone frames ——
await phoneShot('01-phone-scan', '/check-in?hold=scan&scene=checkin-scan');
await phoneShot('02-phone-linking', '/check-in?hold=linking&scene=checkin-linking');
await phoneShot('03-phone-done', '/check-in?scene=checkin-done');

// —— Kiosk frames ——
await kioskShot('04-kiosk-home', '');
await kioskShot('05-kiosk-dialog', 'to=/check-in');
// QrScan auto-advances at 4s without embed — shoot before that
await kioskShot('06-kiosk-member-qr', 'to=/member&member=1', { settleMs: 350 });
await kioskShot('07-kiosk-pass', 'to=/pass&member=1');
await kioskShot('08-kiosk-seat', 'to=/seat&member=1&hours=4');
await kioskShot('09-kiosk-done', 'to=/done&member=1&hours=4&seat=A12', { settleMs: 400 });

// —— Dual story beats ——
await dualShots();

await browser.close();
console.log('done →', OUT);
