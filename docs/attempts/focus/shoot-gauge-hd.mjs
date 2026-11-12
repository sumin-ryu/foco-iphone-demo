/**
 * Focus gauge/timer only — 1920×1080 landscape board.
 */
import { chromium } from 'playwright';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));
const HTML = pathToFileURL(join(OUT, 'gauge-hd.html')).href;
const W = 1920;
const H = 1080;

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
});

await page.goto(HTML, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200); // rays + twinkle settle

await page.screenshot({ path: join(OUT, 'gauge-hd-1920x1080.png'), fullPage: false });
console.log('shot gauge-hd-1920x1080.png');

// Clean crop: label + timer + bar only (no legend)
await page.evaluate(() => {
  document.querySelector('.gauge__legend')?.remove();
});
const box = await page.locator('.gauge').boundingBox();
const padX = 80;
const padY = 100;
await page.screenshot({
  path: join(OUT, 'gauge-hd-crop.png'),
  clip: {
    x: Math.max(0, box.x - padX),
    y: Math.max(0, box.y - padY),
    width: box.width + padX * 2,
    height: box.height + padY * 2,
  },
});
console.log('shot gauge-hd-crop.png');

await browser.close();
console.log('done →', OUT);
