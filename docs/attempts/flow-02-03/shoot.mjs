import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9342;
const OUT = dirname(fileURLToPath(import.meta.url));
const PROFILE = join(OUT, '.chrome-profile');
const ORIGIN = 'http://localhost:5173';
const [width, height] = [520, 1100];

mkdirSync(OUT, { recursive: true });
mkdirSync(PROFILE, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--window-size=${width},${height}`,
    '--hide-scrollbars',
    `--user-data-dir=${PROFILE}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(1800);

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));

let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});

const send = (method, params = {}) =>
  new Promise((resolve) => {
    id += 1;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

const evaluate = async (expression) => {
  const res = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (res.result?.exceptionDetails) {
    console.error('eval err', expression.slice(0, 120), res.result.exceptionDetails.text);
  }
  return res.result?.result?.value;
};

const go = async (path) => {
  const sep = path.includes('?') ? '&' : '?';
  await send('Page.navigate', { url: `${ORIGIN}${path}${sep}demo=on` });
  await sleep(1400);
  await evaluate(`localStorage.setItem('foco-onboarded', '1')`);
  // if redirected to onboarding, leave it
  const pathNow = await evaluate(`location.pathname`);
  if (pathNow === '/onboarding') {
    await evaluate(`localStorage.setItem('foco-onboarded', '1')`);
    await send('Page.navigate', { url: `${ORIGIN}${path}${sep}demo=on` });
    await sleep(1400);
  }
};

const phoneClip = async () => {
  const box = await evaluate(`(() => {
    const el = document.querySelector('.iphone') || document.querySelector('.stage__device');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);
  if (!box) return undefined;
  return {
    x: Math.max(0, Math.floor(box.x) - 4),
    y: Math.max(0, Math.floor(box.y) - 4),
    width: Math.ceil(box.width) + 8,
    height: Math.ceil(box.height) + 8,
    scale: 1,
  };
};

const shot = async (name) => {
  await sleep(400);
  const clip = await phoneClip();
  const res = await send('Page.captureScreenshot', {
    format: 'png',
    ...(clip ? { clip } : {}),
  });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(res.result.data, 'base64'));
  console.log('shot', name);
};

const clickText = async (text) => {
  const v = await evaluate(`(() => {
    const el = [...document.querySelectorAll('button,a')].find((e) =>
      e.textContent.replace(/\\s+/g, ' ').includes(${JSON.stringify(text)})
    );
    if (!el) return 'missing:' + ${JSON.stringify(text)};
    el.click();
    return 'ok';
  })()`);
  if (v !== 'ok') console.log(v);
};

const clickAria = async (label) => {
  const v = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(`[aria-label="${label}"]`)});
    if (!el) return 'missing-aria:' + ${JSON.stringify(label)};
    el.click();
    return 'ok';
  })()`);
  if (v !== 'ok') console.log(v);
};

const fill = async (selector, value) => {
  await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return 'missing';
    const setter = Object.getOwnPropertyDescriptor(
      el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
      'value',
    ).set;
    setter.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return 'ok';
  })()`);
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width,
  height,
  deviceScaleFactor: 2,
  mobile: false,
});

await send('Page.navigate', { url: `${ORIGIN}/?demo=on` });
await sleep(1200);
await evaluate(`localStorage.setItem('foco-onboarded', '1')`);

// ─── 02. 이용권 확인·구매 ───
await go('/pass');
await sleep(500);
await shot('02-01-pass');

await evaluate(`document.querySelector('.pass__track')?.scrollTo({ left: 323 })`);
await sleep(500);
await shot('02-01b-pass-4h');

await clickText('이용권 추가 구매하기');
await sleep(900);
await shot('02-02-pass-buy');

await clickAria('2H 추가');
await sleep(150);
await clickAria('2H 추가');
await sleep(150);
await clickAria('4H 추가');
await sleep(400);
await shot('02-02b-pass-buy-cart');

// expand sheet
await evaluate(`document.querySelector('.pass-buy__grab')?.click()`);
await sleep(200);
await evaluate(`(() => {
  const sheet = document.querySelector('.pass-buy__sheet');
  if (!sheet) return;
  sheet.dispatchEvent(new PointerEvent('pointerdown', { clientY: 700, bubbles: true }));
  sheet.dispatchEvent(new PointerEvent('pointermove', { clientY: 500, bubbles: true }));
  sheet.dispatchEvent(new PointerEvent('pointerup', { clientY: 500, bubbles: true }));
})()`);
await sleep(500);
// click sheet title area to expand (tap without drag)
await evaluate(`document.querySelector('.pass-buy__sheet-title')?.click()`);
await sleep(400);
await shot('02-02c-pass-buy-sheet');

await clickText('결제하기');
await sleep(800);
await shot('02-03-toss-checkout');

await clickText('신한');
await sleep(200);
await evaluate(`document.querySelector('.toss__agree')?.click()`);
await sleep(200);
await shot('02-03b-toss-ready');
await clickText('결제하기');
await sleep(900);
await shot('02-03c-toss-processing');
await sleep(2000);
await shot('02-04-pass-done');

// ─── 03. PLAN 설정 ───
await go('/plan');
await sleep(600);
await shot('03-01-plan');

await evaluate(`document.querySelector('a.plan-fab, a[href="/plan/new"]')?.click()`);
await sleep(900);
await shot('03-02-plan-new-name');

await fill('#plan-memo', '국어랑 영어 집중적으로 하기');
await sleep(250);
await shot('03-02b-plan-new-name-filled');
await clickText('다음');
await sleep(700);
await shot('03-03-plan-new-subjects');

await fill('.plan-new__subject-name', '국어');
await fill('.plan-new__subject-goal, input[id^="goal-"]', '국어 90점 넘기기');
await sleep(300);
await shot('03-03b-plan-new-subjects-filled');

await clickText('저장하기');
await sleep(1000);
await shot('03-04-plan-after-save');

await evaluate(`document.querySelector('.plan-card__more')?.click()`);
await sleep(400);
await shot('03-05-plan-menu');

ws.close();
chrome.kill();
try {
  rmSync(PROFILE, { recursive: true, force: true });
} catch {
  /* ignore */
}
process.exit(0);
