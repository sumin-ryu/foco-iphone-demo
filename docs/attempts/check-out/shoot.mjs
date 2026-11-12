/**
 * STEP 06 OUT · CHECK-OUT — finish focus report, phone/kiosk check-out, day record.
 * Phone: 421×880. Kiosk: KioskFrame. Toggles hidden, splash=0.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'http://localhost:5173';
const FRAME_W = 421;
const FRAME_H = 880;
const KIOSK_W = 596;
const KIOSK_H = 1284;
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

const browser = await chromium.launch({ headless: true, channel: 'chrome' });

async function phonePage() {
  const page = await browser.newPage({
    viewport: { width: FRAME_W, height: FRAME_H },
    deviceScaleFactor: 2,
  });
  return page;
}

async function prepare(page, path) {
  const url = `${ORIGIN}${path}${path.includes('?') ? '&' : '?'}demo=on&splash=0`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('foco-onboarded', '1');
    localStorage.setItem('foco:demo-mode', 'on');
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: PHONE_CSS });
  await page.waitForFunction(() => !document.querySelector('.splash'));
  await sleep(400);
}

async function shot(page, name) {
  await sleep(350);
  await page.locator('.iphone').screenshot({ path: join(OUT, `${name}.png`) });
  console.log('phone', name);
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
  await page.goto(`${ORIGIN}/kiosk/?${qs}`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: KIOSK_CSS });
  await sleep(settleMs);
  const device = page.locator('.kiosk-device');
  if ((await device.count()) === 0) {
    await page.locator('.kiosk-stage').screenshot({ path: join(OUT, `${name}.png`) });
  } else {
    await device.screenshot({ path: join(OUT, `${name}.png`) });
  }
  console.log('kiosk', name);
  await page.close();
}

// —— Phone: end focus → report → feedback → check-out → record ——
const page = await phonePage();
await prepare(page, '/focus?scene=review-focus');
await sleep(500);

// End focus (confirm twice)
await page.getByRole('button', { name: '집중 종료하기' }).click();
await sleep(400);
await page.getByRole('button', { name: '한 번 더 누르면 종료돼요' }).click();
await sleep(1000);
await shot(page, '01-focus-done');

// Fill tomorrow review + mood
const noteInputs = page.locator('.focus-done__note input');
const n = await noteInputs.count();
if (n > 0) await noteInputs.nth(0).fill('비유·상징 구분');
if (n > 1) await noteInputs.nth(1).fill('동의어 헷갈린 단어');
await page.getByRole('radio', { name: /좋|괜찮|아쉬/ }).first().click().catch(async () => {
  await page.locator('.focus-done__mood').first().click();
});
await page.locator('.focus-done__feedback-input').fill('집중이 잘 이어졌어요. 다음엔 휴식 타이밍을 더 짧게.');
await sleep(400);
await shot(page, '02-focus-done-feedback');

// Still in session → 퇴실하기
await page.getByRole('button', { name: '퇴실하기' }).click();
await sleep(500);
await shot(page, '03-checkout-scan');

// Wait for auto-detect → connected card
await page.waitForSelector('.checkin__card-title', { timeout: 5000 });
await sleep(700);
await shot(page, '04-checkout-done');

// Open report again (session cleared) or calendar
const reportBtn = page.getByRole('button', { name: '오늘의 집중 리포트 보기' });
if (await reportBtn.count()) {
  await reportBtn.click();
  await sleep(900);
  await shot(page, '05-focus-done-after-out');
  const cal = page.getByRole('button', { name: '캘린더에서 보기' });
  if (await cal.count()) {
    await cal.click();
    await sleep(1000);
    await shot(page, '06-record-day');
  }
} else {
  await page.getByRole('button', { name: '홈으로' }).click();
  await sleep(800);
}

await page.close();

// Home with session → 퇴실하기 entry (seeded check-in done)
const home = await phonePage();
await prepare(home, '/?scene=checkin-done');
await sleep(600);
await shot(home, '00-home-checkout-entry');
await home.close();

// —— Kiosk check-out ——
await kioskShot('07-kiosk-checkout-qr', 'to=/check-out', { settleMs: 350 });
await kioskShot('08-kiosk-checkout-done', 'to=/check-out/done', { settleMs: 400 });

await browser.close();
console.log('done →', OUT);
