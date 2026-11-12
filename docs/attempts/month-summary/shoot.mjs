/**
 * STEP 08 — 캘린더(날짜별 Focus Shape) + 월 요약 리포트(주제별 프레임).
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

/** Month-report topics (order = slide order after calendar). */
const TOPICS = [
  { file: '02-hero', match: null, hero: true },
  { file: '03-type', match: '이번 달 나의 집중 유형' },
  { file: '04-balance', match: /집중 균형|과 비교하면/ },
  { file: '05-hours', match: '몇 시간째까지 집중이 이어졌나요' },
  { file: '06-when', match: '언제 집중이 잘 됐나요' },
  { file: '07-subjects', match: '과목별 집중' },
  { file: '08-self-review', match: '스스로 돌아본 집중' },
  { file: '09-passes', match: '사용한 이용권' },
  { file: '10-next-tips', match: /이렇게 해보세요/ },
  { file: '11-actions', match: null, actions: true },
];

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

const shotPhone = async (name) => {
  await sleep(280);
  await page.locator('.iphone').screenshot({ path: join(OUT, `${name}.png`) });
  console.log('frame', name);
};

// —— 01 캘린더: 날짜마다 Focus Shape ——
await prepare('/record');
await shotPhone('01-calendar');
const grid = page.locator('.calendar').first();
if (await grid.count()) {
  await grid.screenshot({ path: join(OUT, '01b-calendar-grid-only.png') });
  console.log('crop 01b-calendar-grid-only');
}
const monthEntry = page.locator('a.record-month-entry, a.calendar__month-link').first();
if (await monthEntry.count()) {
  await monthEntry.screenshot({ path: join(OUT, '01c-month-entry-only.png') });
  console.log('crop 01c-month-entry-only');
}

// —— 02–11 월 요약 리포트 주제별 ——
await prepare('/record/month/2026-10');
const empty = await page.getByText('이 달에는 집중한 기록이 없어요').count();
if (empty) {
  await prepare('/record/month/2026-09');
}

const scrollTopicIntoView = async (el) => {
  await el.evaluate((node) => {
    const scroll = document.querySelector('.app__scroll');
    const header = document.querySelector('.page-header');
    if (!scroll) {
      node.scrollIntoView({ block: 'start' });
      return;
    }
    const headerH = header?.getBoundingClientRect().height ?? 54;
    const top = node.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop;
    scroll.scrollTo({ top: Math.max(0, top - headerH - 8), behavior: 'instant' });
  });
  await sleep(350);
};

const shotBlock = async (name, startEl) => {
  const box = await startEl.evaluate((titleOrHero) => {
    const isTitle = titleOrHero.matches?.('h2, .section-title, .month__title');
    let end = titleOrHero;
    if (isTitle) {
      let n = titleOrHero.nextElementSibling;
      while (n && !n.matches('h2, .section-title, .month__title, .month__actions')) {
        end = n;
        n = n.nextElementSibling;
      }
    }
    const a = titleOrHero.getBoundingClientRect();
    const b = end.getBoundingClientRect();
    const left = Math.min(a.left, b.left);
    const top = Math.min(a.top, b.top);
    const right = Math.max(a.right, b.right);
    const bottom = Math.max(a.bottom, b.bottom);
    return { x: left, y: top, width: right - left, height: bottom - top };
  });
  const pad = 8;
  await page.screenshot({
    path: join(OUT, `${name}-block.png`),
    clip: {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: box.width + pad * 2,
      height: box.height + pad * 2,
    },
  });
  console.log('block', name);
};

for (const topic of TOPICS) {
  let el = null;
  if (topic.hero) {
    el = page.locator('.month__hero').first();
  } else if (topic.actions) {
    el = page.locator('.month__actions').first();
  } else if (typeof topic.match === 'string') {
    el = page.locator('h2.month__title, h2.section-title').filter({ hasText: topic.match }).first();
  } else if (topic.match instanceof RegExp) {
    el = page.locator('h2.month__title, h2.section-title').filter({ hasText: topic.match }).first();
  }

  if (!el || (await el.count()) === 0) {
    console.warn('skip missing', topic.file);
    continue;
  }

  await scrollTopicIntoView(el);
  await shotPhone(topic.file);
  await shotBlock(topic.file, el);
}

await browser.close();
console.log('done →', OUT);
