import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9341;
const OUT = dirname(fileURLToPath(import.meta.url));
const PROFILE = join(OUT, '.chrome-profile');
const BASE = 'http://localhost:5173/onboarding?demo=on';
const [width, height] = [520, 1100];

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
    console.error('eval err', expression.slice(0, 80), res.result.exceptionDetails.text);
  }
  return res.result?.result?.value;
};

const phoneClip = async () => {
  const box = await evaluate(`(() => {
    const el = document.querySelector('.iphone') || document.querySelector('.bare') || document.querySelector('.stage__device');
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
  await sleep(450);
  const clip = await phoneClip();
  const res = await send('Page.captureScreenshot', {
    format: 'png',
    ...(clip ? { clip } : {}),
  });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(res.result.data, 'base64'));
  console.log('shot', name);
};

const clickText = (text) =>
  evaluate(`(() => {
    const el = [...document.querySelectorAll('button,a')].find((e) => e.textContent.includes(${JSON.stringify(text)}));
    if (!el) return 'missing:' + ${JSON.stringify(text)};
    el.click();
    return 'ok';
  })()`).then((v) => {
    if (v !== 'ok') console.log(v);
  });

const clickAria = (label) =>
  evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(`[aria-label="${label}"]`)});
    if (!el) return 'missing-aria:' + ${JSON.stringify(label)};
    el.click();
    return 'ok';
  })()`);

const fill = (selector, value) =>
  evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return 'missing';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return 'ok';
  })()`);

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width,
  height,
  deviceScaleFactor: 2,
  mobile: false,
});

await send('Page.navigate', { url: BASE });
await sleep(2200);

await shot('01-intro-pass');
await clickText('다음');
await sleep(600);
await shot('02-intro-kiosk');
await sleep(1800);
await shot('02b-intro-kiosk-scanned');
await clickText('다음');
await sleep(600);
await shot('03-intro-focus');
await clickText('다음');
await sleep(600);
await shot('04-account');

await clickText('이미 회원이에요');
await sleep(500);
await shot('05-login');
await clickAria('이전');
await sleep(400);

await clickText('회원가입');
await sleep(600);
await shot('06-signup-terms');
await clickText('전체 동의하기');
await sleep(200);
await shot('06b-signup-terms-agreed');
await clickText('동의하고 계속하기');
await sleep(500);
await shot('07-signup-profile');
await fill('input[placeholder="홍길동"]', '류수민');
await fill('input[type="tel"]', '01012345678');
await sleep(200);
await clickText('인증번호 받기');
await sleep(400);
await shot('07b-signup-profile-code');
await fill('input[placeholder="6자리 숫자"]', '123456');
await sleep(200);
await clickText('인증 완료');
await sleep(500);
await shot('08-signup-password');
await fill('input[type="password"]', 'foco1234');
await evaluate(`(() => {
  const inputs = [...document.querySelectorAll('input[type="password"]')];
  const confirm = inputs[1];
  if (!confirm) return 'no confirm';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(confirm, 'foco1234');
  confirm.dispatchEvent(new Event('input', { bubbles: true }));
  return 'ok';
})()`);
await sleep(200);
await shot('08b-signup-password-filled');
await clickText('가입하기');
await sleep(600);
await shot('09-signup-welcome');
await clickText('계속하기');
await sleep(600);
await shot('10-guide');
await clickText('다음');
await sleep(600);
await shot('11-done');

ws.close();
chrome.kill();
try {
  rmSync(PROFILE, { recursive: true, force: true });
} catch {
  /* ignore */
}
process.exit(0);
