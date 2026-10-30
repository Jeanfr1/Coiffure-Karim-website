// Real captures for the README, written to scripts/out/readme. Then run scripts/readme-compose.py.
import { launch } from './browser.mjs';
import { mkdirSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const base = process.env.QA_BASE || 'http://localhost:4416/';
const out = 'scripts/out/readme';
rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/frames`, { recursive: true });
const b = await launch();
const settle = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const to = (p, y) => p.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y);
const centre = (p, id, d = 0) => p.evaluate(([i, x]) => { const e = document.getElementById(i), r = e.getBoundingClientRect(); return r.top + scrollY + (r.height - innerHeight) / 2 + x; }, [id, d]);

{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(base, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2700);
  await p.screenshot({ path: `${out}/d0.png` });
  // Every frame waits for the page's own transitions to move, as a slow steady scroll would.
  const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const n = 84;
  for (let i = 0; i < n; i++) {
    await to(p, max * (i / (n - 1)));
    await p.waitForTimeout(260);
    await settle(p);
    await p.screenshot({ path: `${out}/frames/f_${String(i).padStart(4, '0')}.png` });
  }
  for (const [i, id, d] of [[1, 'les-coupes', 20], [2, 'nous-trouver', -20]]) {
    await to(p, await centre(p, id, d));
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${out}/d${i}.png` });
  }
  await to(p, max);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/d3.png` });
  await p.close();
}
{
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(base, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/m0.png` });
  const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y < max; y += 280) { await to(p, y); await p.waitForTimeout(120); }
  const y1 = await p.evaluate(() => document.getElementById('les-coupes').getBoundingClientRect().top + scrollY - 40);
  await to(p, y1);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/m1.png` });
  await to(p, max);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/m2.png` });
  await p.close();
}
{
  const p = await b.newPage({ viewport: { width: 1280, height: 480 } });
  await p.goto(pathToFileURL(resolve('scripts/readme-banner.html')).href, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/banner.png` });
  await p.close();
}
await b.close();
