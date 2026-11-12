/**
 * STEP 08 — month summary as 4 composed panels (like the presentation collage):
 *   A  hero + hours + passes
 *   B  type (올라운더 + scatter)
 *   C  when + next tips
 *   D  balance radar + subjects
 *
 * Content-only dark panels (no phone chrome), matching the reference layout.
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

const COMPOSES = [
  { file: 'A-overview', keep: ['hero', 'hours', 'passes'] },
  { file: 'B-type', keep: ['type'] },
  { file: 'C-when-tips', keep: ['when', 'tips'] },
  { file: 'D-balance-subjects', keep: ['balance', 'subjects'] },
];

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: W, height: 900 },
  deviceScaleFactor: 2,
});

const url = `${ORIGIN}/record/month/2026-10?demo=on&splash=0&frame=off`;
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.setItem('foco-onboarded', '1');
  localStorage.setItem('foco:demo-mode', 'on');
});
await page.goto(url, { waitUntil: 'networkidle' });
await page.addStyleTag({
  content: `
    .demo-controls { display: none !important; }
    body, html { background: #1c1b1c !important; margin: 0 !important; }
    .stage--demo {
      padding: 0 !important;
      gap: 0 !important;
      min-height: 100vh !important;
      height: auto !important;
      width: ${W}px !important;
      justify-content: flex-start !important;
      background: #1c1b1c !important;
    }
    .stage__device, .bare, .bare__screen, .iphone, .iphone__screen {
      width: ${W}px !important;
      max-width: ${W}px !important;
      height: auto !important;
      min-height: 100vh !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
      transform: none !important;
      background: #1c1b1c !important;
    }
    .iphone__status, .iphone__island, .iphone__home-indicator, .iphone__btn { display: none !important; }
    .app, .app__scroll {
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      background: #1c1b1c !important;
    }
    .page-header { display: none !important; }
    .app__status-backdrop { display: none !important; }
  `,
});
await page.waitForFunction(() => !document.querySelector('.splash'));
await sleep(500);

if (await page.getByText('이 달에는 집중한 기록이 없어요').count()) {
  await page.goto(`${ORIGIN}/record/month/2026-09?demo=on&splash=0&frame=off`, {
    waitUntil: 'networkidle',
  });
  await sleep(500);
}

const titleKey = (text) => {
  if (/집중 유형/.test(text)) return 'type';
  if (/비교하면|집중 균형/.test(text)) return 'balance';
  if (/몇 시간째/.test(text)) return 'hours';
  if (/언제 집중/.test(text)) return 'when';
  if (/과목별 집중/.test(text)) return 'subjects';
  if (/스스로 돌아본/.test(text)) return 'self';
  if (/사용한 이용권/.test(text)) return 'passes';
  if (/이렇게 해보세요/.test(text)) return 'tips';
  return null;
};

const applyKeep = async (keep) => {
  await page.evaluate((keepKeys) => {
    const pageEl = document.querySelector('.page.month');
    if (!pageEl) return;
    const mapTitle = (text) => {
      if (/집중 유형/.test(text)) return 'type';
      if (/비교하면|집중 균형/.test(text)) return 'balance';
      if (/몇 시간째/.test(text)) return 'hours';
      if (/언제 집중/.test(text)) return 'when';
      if (/과목별 집중/.test(text)) return 'subjects';
      if (/스스로 돌아본/.test(text)) return 'self';
      if (/사용한 이용권/.test(text)) return 'passes';
      if (/이렇게 해보세요/.test(text)) return 'tips';
      return null;
    };
    for (const el of [...pageEl.children]) {
      if (el.classList.contains('month__hero')) {
        el.style.display = keepKeys.includes('hero') ? '' : 'none';
        continue;
      }
      if (el.classList.contains('month__actions')) {
        el.style.display = 'none';
        continue;
      }
      if (el.matches('h2, .section-title, .month__title')) {
        const key = mapTitle(el.textContent || '');
        const show = key && keepKeys.includes(key);
        el.style.display = show ? '' : 'none';
        const body = el.nextElementSibling;
        if (body && !body.matches('h2, .section-title')) {
          body.style.display = show ? '' : 'none';
        }
      }
    }
  }, keep);
  await sleep(350);
};

for (const compose of COMPOSES) {
  await applyKeep(compose.keep);
  // Measure content height and grow viewport
  const box = await page.evaluate(() => {
    const pageEl = document.querySelector('.page.month');
    const app = document.querySelector('.app') || pageEl;
    const rect = pageEl.getBoundingClientRect();
    // visible children only
    let top = Infinity;
    let bottom = 0;
    for (const el of pageEl.children) {
      if (el.style.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.height === 0) continue;
      top = Math.min(top, r.top);
      bottom = Math.max(bottom, r.bottom);
    }
    if (!Number.isFinite(top)) {
      top = rect.top;
      bottom = rect.bottom;
    }
    return {
      x: Math.max(0, rect.left),
      y: Math.max(0, top - 16),
      width: rect.width,
      height: bottom - top + 32,
      appBottom: app.getBoundingClientRect().bottom,
    };
  });

  const needH = Math.ceil(box.y + box.height + 24);
  await page.setViewportSize({ width: W, height: Math.max(needH, 600) });
  await sleep(200);

  // Re-measure after resize (layout may shift)
  const clip = await page.evaluate(() => {
    const pageEl = document.querySelector('.page.month');
    const rect = pageEl.getBoundingClientRect();
    let top = Infinity;
    let bottom = 0;
    for (const el of pageEl.children) {
      if (el.style.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.height === 0) continue;
      top = Math.min(top, r.top);
      bottom = Math.max(bottom, r.bottom);
    }
    return {
      x: Math.max(0, Math.floor(rect.left)),
      y: Math.max(0, Math.floor(top - 20)),
      width: Math.ceil(rect.width),
      height: Math.ceil(bottom - top + 48),
    };
  });

  const needClipH = Math.ceil(clip.y + clip.height + 16);
  const vp = page.viewportSize();
  if (vp && needClipH > vp.height) {
    await page.setViewportSize({ width: W, height: needClipH });
    await sleep(150);
  }

  await page.screenshot({
    path: join(OUT, `${compose.file}.png`),
    clip,
  });
  console.log('compose', compose.file, clip.width, '×', clip.height);
}

await browser.close();
console.log('done →', OUT);
