/**
 * Records two onboarding videos at the project's iPhone frame size (421×880),
 * with demo toggles hidden so it looks like a real phone.
 */
import { chromium } from 'playwright';
import { copyFileSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'http://localhost:5173';
/** Same as `IPhoneFrame` PHONE_WIDTH / PHONE_HEIGHT. */
const FRAME_W = 421;
const FRAME_H = 880;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Hide demo chrome and lock the phone to 1:1 inside the viewport. */
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
  .iphone {
    transform: none !important;
  }
`;

async function withRecording(filename, run) {
  const videoDir = join(OUT, `.video-${filename}`);
  mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: FRAME_W, height: FRAME_H },
    deviceScaleFactor: 2,
    recordVideo: { dir: videoDir, size: { width: FRAME_W, height: FRAME_H } },
  });
  const page = await context.newPage();

  const prepare = async (url) => {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.removeItem('foco-onboarded');
      localStorage.setItem('foco:demo-mode', 'on');
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: FRAME_CSS });
    await sleep(300);
  };

  try {
    await run(page, prepare);
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();
    const rawPath = await video.path();
    const finalPath = join(OUT, filename);
    try {
      renameSync(rawPath, finalPath);
    } catch {
      copyFileSync(rawPath, finalPath);
      rmSync(rawPath, { force: true });
    }
    try {
      rmSync(videoDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    console.log('saved', finalPath);
  }
}

const clickText = async (page, text) => {
  await page.getByRole('button', { name: text }).first().click();
  await sleep(550);
};

async function recordTutorial() {
  await withRecording('onboarding-tutorial.webm', async (page, prepare) => {
    await prepare(`${ORIGIN}/onboarding?demo=on`);
    await sleep(1400);
    await clickText(page, '다음');
    await sleep(2200);
    await clickText(page, '다음');
    await sleep(1600);
  });
}

async function recordAuth() {
  await withRecording('onboarding-auth.webm', async (page, prepare) => {
    await prepare(`${ORIGIN}/onboarding?demo=on&step=account`);
    await sleep(1200);

    await clickText(page, '이미 회원이에요');
    await sleep(900);
    await page.getByPlaceholder('010-0000-0000').fill('01012345678');
    await page.locator('input[type="password"]').fill('demo');
    await sleep(700);
    await page.getByRole('button', { name: '이전' }).click();
    await sleep(700);

    await clickText(page, '회원가입');
    await sleep(800);
    await clickText(page, '전체 동의하기');
    await sleep(450);
    await clickText(page, '동의하고 계속하기');
    await sleep(650);

    await page.getByPlaceholder('홍길동').fill('류수민');
    await page.getByPlaceholder('010-0000-0000').fill('01012345678');
    await sleep(450);
    await clickText(page, '인증번호 받기');
    await sleep(550);
    await page.getByPlaceholder('6자리 숫자').fill('123456');
    await sleep(400);
    await clickText(page, '인증 완료');
    await sleep(650);

    await page.locator('input[type="password"]').nth(0).fill('foco1234');
    await page.locator('input[type="password"]').nth(1).fill('foco1234');
    await sleep(450);
    await clickText(page, '가입하기');
    await sleep(1400);
  });
}

await recordTutorial();
await recordAuth();
