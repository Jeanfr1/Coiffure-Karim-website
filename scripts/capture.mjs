// Contact shots at natural settled positions. node scripts/capture.mjs <out-dir> [WxH ...]
import { launch } from './browser.mjs';
import { mkdirSync } from 'node:fs';
const base = process.env.QA_BASE || 'http://localhost:4416/';
const out = process.argv[2] || 'scripts/out/shots';
const sizes = (process.argv.slice(3).length ? process.argv.slice(3) : ['1440x790']).map(s => s.split('x').map(Number));
mkdirSync(out, { recursive: true });
const b = await launch();
for (const [w, h] of sizes) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(base, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2700);
  await p.screenshot({ path: `${out}/${w}x${h}-0-hero.png` });
  const stops = await p.evaluate(() => {
    const top = id => document.getElementById(id).getBoundingClientRect().top + scrollY;
    const y = id => document.getElementById(id);
    const f = y('les-coupes'), l = y('nous-trouver');
    const max = document.documentElement.scrollHeight - innerHeight;
    return {
      '1-frieze-mid': top('les-coupes') - innerHeight * .5,
      '2-frieze': top('les-coupes') + (f.offsetHeight - innerHeight) / 2 + 20,
      '3-location-mid': top('nous-trouver') - innerHeight * .45,
      '4-location': top('nous-trouver') + (l.offsetHeight - innerHeight) / 2 - 10,
      '5-closing-mid': top('contact') - innerHeight * .5,
      '6-closing': max
    };
  });
  for (const [name, y] of Object.entries(stops)) {
    await p.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y);
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${out}/${w}x${h}-${name}.png` });
  }
  await p.close();
}
await b.close();
