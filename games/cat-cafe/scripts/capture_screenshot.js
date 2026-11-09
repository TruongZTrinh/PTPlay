import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const TEMP_PROFILE = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_ptplay_' + Date.now());

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        const json = await res.json();
        return json.webSocketDebuggerUrl;
      }
    } catch (e) {
      // wait
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Chrome remote debugging did not respond');
}

export async function capture(url, outputPath, width = 540, height = 960, waitMs = 2500, evalScript = '') {
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${TEMP_PROFILE}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { detached: false });

  try {
    const wsUrl = await getWsUrl();
    const ws = new WebSocket(wsUrl);

    await new Promise((resolve) => ws.onopen = resolve);

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (evt) => {
          const res = JSON.parse(evt.data);
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            if (res.error) reject(res.error);
            else resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    // Target creation
    const { targetId } = await send('Target.createTarget', { url });
    const targetWsUrl = `ws://127.0.0.1:${PORT}/devtools/page/${targetId}`;
    const pageWs = new WebSocket(targetWsUrl);
    await new Promise((resolve) => pageWs.onopen = resolve);

    let pageMsgId = 1;
    function sendPage(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = pageMsgId++;
        const handler = (evt) => {
          const res = JSON.parse(evt.data);
          if (res.id === id) {
            pageWs.removeEventListener('message', handler);
            if (res.error) reject(res.error);
            else resolve(res.result);
          }
        };
        pageWs.addEventListener('message', handler);
        pageWs.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendPage('Page.enable');
    await sendPage('Runtime.enable');
    await sendPage('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await sendPage('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, waitMs));

    if (evalScript) {
      console.log(`Evaluating script: ${evalScript}`);
      await sendPage('Runtime.evaluate', { expression: evalScript });
      await new Promise((r) => setTimeout(r, 600));
    }

    const { data } = await sendPage('Page.captureScreenshot', { format: 'png' });
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, Buffer.from(data, 'base64'));
    console.log(`Saved screenshot to ${outputPath} (${data.length} b64 chars)`);

    pageWs.close();
    ws.close();
  } finally {
    chromeProc.kill('SIGKILL');
    try {
      fs.rmSync(TEMP_PROFILE, { recursive: true, force: true });
    } catch {}
  }
}

const args = process.argv.slice(2);
const targetUrl = args[0] || 'http://localhost:5174/';
const out = args[1] || 'current_view.png';
const w = parseInt(args[2] || '540', 10);
const h = parseInt(args[3] || '960', 10);
const wait = parseInt(args[4] || '2500', 10);
const script = args[5] || '';

capture(targetUrl, out, w, h, wait, script).catch(err => {
  console.error(err);
  process.exit(1);
});
