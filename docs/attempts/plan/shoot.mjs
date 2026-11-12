/**
 * Captures PLAN setting screens at iPhone frame 421×880, splash skipped, toggles hidden.
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

const browser = await chromium.launch({ headless: true });
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
  const phone = page.locator('.iphone');
  await phone.screenshot({ path: join(OUT, `${name}.png`) });
  console.log('shot', name);
};

await prepare('/plan');
await sleep(500);
await shot('01-plan');

await page.locator('a.plan-fab, a[href="/plan/new"]').first().click();
await sleep(800);
await shot('02-plan-new-name');

await page.locator('#plan-memo').fill('국어랑 영어 집중적으로 하기');
await sleep(300);
await shot('02b-plan-new-name-filled');

await page.getByRole('button', { name: '다음' }).click();
await sleep(700);
await shot('03-plan-new-subjects');

await page.locator('.plan-new__subject-name').fill('국어');
await page.locator('.plan-new__goal-input').fill('국어 90점 넘기기');
await sleep(300);
await shot('03b-plan-new-subjects-filled');

await page.getByRole('button', { name: '저장하기' }).click();
await sleep(1000);
await shot('04-plan-after-save');

await page.locator('.plan-card__more').first().click();
await sleep(400);
await shot('05-plan-menu');

await page.getByRole('menuitem', { name: '수정하기' }).click();
await sleep(800);
await shot('06-plan-edit');

await browser.close();
console.log('done');
