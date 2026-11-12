/**
 * STEP 05 ON · FOCUS — plan → goals → focusing / rest / switch / end confirm.
 * Phone frame 421×880, splash skipped, toggles hidden.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'http://localhost:5173';
const FRAME_W = 421;
const FRAME_H = 880;
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
  await page.addStyleTag({ content: FRAME_CSS });
  await page.waitForFunction(() => !document.querySelector('.splash'));
  await sleep(400);
};

const shot = async (name) => {
  await sleep(350);
  await page.locator('.iphone').screenshot({ path: join(OUT, `${name}.png`) });
  console.log('shot', name);
};

// Seeded session (입실 완료) → 집중 기록 시작하기
await prepare('/check-in?scene=checkin-done');
await page.getByRole('button', { name: '집중 기록 시작하기' }).click();
await sleep(800);
await shot('01-plan-select');

await page.locator('.plan-select__card').first().click();
await sleep(500);
await shot('01b-plan-selected');

await page.getByRole('button', { name: '선택한 플랜 불러오기' }).click();
await sleep(800);
await shot('02-plan-goals');

const goalInputs = page.locator('.plan-goals__input');
await goalInputs.nth(0).fill('국어 90점 넘기기');
await goalInputs.nth(1).fill('영단어 50개');
await sleep(300);
await shot('02b-plan-goals-filled');

await page.getByRole('button', { name: '집중 시작' }).click();
await sleep(1000);
await shot('03-focusing');

await page.getByRole('button', { name: '휴식하기' }).click();
await sleep(700);
await shot('04-resting');

await page.getByRole('button', { name: '재개하기' }).click();
await sleep(600);

// Switch to another subject/task (aria-label ends with "항목으로 전환")
const switchBtn = page.getByRole('button', { name: /항목으로 전환$/ }).first();
if (await switchBtn.count()) {
  await switchBtn.click();
  await sleep(700);
}
await shot('05-switched');

await page.getByRole('button', { name: '집중 종료하기' }).click();
await sleep(500);
await shot('06-end-confirm');

// Also capture mid-session with review seed (복습 → 과목)
await prepare('/focus?scene=review-focus');
await sleep(600);
await shot('03b-focus-reviewing');

const doneReview = page.getByRole('button', { name: '복습 마치기' });
if (await doneReview.count()) {
  await doneReview.click();
  await sleep(800);
  await shot('03c-focus-after-review');
}

await browser.close();
console.log('done →', OUT);
