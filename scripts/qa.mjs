// Browser QA for roteiros/05-validacao.md, plus the "whole picture on one screen" density rules.
// Needs the preview running (npm run dev). QA_BASE targets another URL, e.g. the live site.
import { launch } from './browser.mjs';

const base = process.env.QA_BASE || 'http://localhost:4416/';
const results = [];
const ok = (name, pass, detail = '') => {
  results.push(pass);
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail !== '' ? `  (${detail})` : ''}`);
};
const b = await launch();
const open = async (w, h, opts = {}) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, ...opts });
  const p = await ctx.newPage();
  p.problems = [];
  p.on('console', m => m.type() === 'error' && p.problems.push(m.text()));
  p.on('pageerror', e => p.problems.push(String(e)));
  p.on('requestfailed', r => !r.url().includes('google.com') && p.problems.push('failed ' + r.url()));
  p.on('response', r => r.status() >= 400 && p.problems.push(r.status() + ' ' + r.url()));
  return p;
};
const go = async (p, path = '') => { await p.goto(base + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(300); };
const to = async (p, y) => { await p.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y); await p.waitForTimeout(160); };
const walk = async p => {
  const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y < max; y += 260) await to(p, y);
  await to(p, max);
  await p.waitForTimeout(1300);
};
const docY = (p, sel) => p.evaluate(s => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);

// 1. Density: the complaint this site answers. Real browser windows, not just screen sizes.
const desktops = [[1280, 650], [1366, 650], [1440, 790], [1440, 900], [1536, 730], [1792, 1000], [1920, 950], [1920, 1080], [2560, 1300]];
for (const [w, h] of desktops) {
  const p = await open(w, h);
  await go(p);
  const m = await p.evaluate(() => {
    const r = s => document.querySelector(s).getBoundingClientRect();
    const hero = r('.hero'), pic = r('.hero-picture'), f = r('.frieze'), l = r('.location'), c = r('.closing');
    const fs = f.height / 900;
    return {
      hero: hero.height / innerHeight, picTop: pic.top, picBottom: pic.bottom,
      head: pic.height * 700 / 1014 / innerHeight,
      friezeZone: fs * (800 - 92) / innerHeight, friezeHead: fs * 450 / innerHeight,
      location: l.height / innerHeight, closing: c.height / innerHeight,
      total: document.documentElement.scrollHeight / innerHeight,
      sw: document.documentElement.scrollWidth, iw: innerWidth,
      cover: [...document.querySelectorAll('.scene img')].filter(i => getComputedStyle(i).objectFit === 'cover').length
    };
  });
  const tag = `${w}x${h}`;
  ok(`${tag} hero fits one screen, head whole`, m.hero <= 1 && m.head <= .66 && m.picTop >= 0, `hero ${m.hero.toFixed(2)}, head ${(m.head * 100).toFixed(0)} %`);
  ok(`${tag} frieze: three subjects on one screen`, m.friezeZone <= 1.0 && m.friezeHead <= .62, `zone ${m.friezeZone.toFixed(2)}, head ${(m.friezeHead * 100).toFixed(0)} %`);
  ok(`${tag} location <= 0.8, closing <= 1`, m.location <= .8 && m.closing <= 1, `${m.location.toFixed(2)} / ${m.closing.toFixed(2)}`);
  ok(`${tag} no cover-crop, no side scroll`, m.cover === 0 && m.sw === m.iw, `page = ${m.total.toFixed(1)} screens`);
  await p.context().close();
}

// 2. Scroll never zooms: stage scale stays within the kit's limit at every position.
{
  const p = await open(1440, 790);
  await go(p);
  const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  let peak = 0;
  for (let y = 0; y <= max; y += 120) {
    await to(p, y);
    const s = await p.evaluate(() => Math.max(...['.hero-picture', '.frieze-stage', '.closing-stage'].map(q => new DOMMatrix(getComputedStyle(document.querySelector(q)).transform).a)));
    peak = Math.max(peak, s);
  }
  ok('scroll scale <= 1.02 everywhere', peak <= 1.02, peak.toFixed(3));
  const sticky = await p.evaluate(() => [...document.querySelectorAll('*')].filter(e => getComputedStyle(e).position === 'sticky').length);
  ok('no sticky runway, no captured scroll', sticky === 0);
  const sum = await p.evaluate(() => {
    const s = [...document.querySelectorAll('.scene')];
    return Math.abs(s[3].getBoundingClientRect().bottom - s[0].getBoundingClientRect().top - document.documentElement.scrollHeight);
  });
  ok('page height = the four scenes', sum < 2, sum.toFixed(1));
  await p.context().close();
}

// 3. Breakpoints of roteiro 05.
for (const [w, h] of [[320, 640], [360, 740], [375, 812], [390, 844], [430, 932], [700, 900], [768, 1024], [1024, 768], [1440, 900]]) {
  const p = await open(w, h, { hasTouch: w < 800, isMobile: w < 800 });
  await go(p);
  await walk(p);
  const m = await p.evaluate(() => {
    const out = [];
    for (const s of ['h1', '.hero-copy .button', '.frieze-heading', '.service-word:nth-child(1)', '.service-word:nth-child(3)', '.location-copy', '.closing-copy', '.site-footer']) {
      const r = document.querySelector(s).getBoundingClientRect();
      if (r.left < -1 || r.right > innerWidth + 1) out.push(`${s} ${Math.round(r.left)}..${Math.round(r.right)}`);
    }
    const f = document.querySelector('h1').getBoundingClientRect(), pic = document.querySelector('.hero-picture').getBoundingClientRect();
    const small = [...document.querySelectorAll('a,p,address,button,summary')].filter(e => e.offsetParent && parseFloat(getComputedStyle(e).fontSize) < 11).map(e => e.className || e.tagName);
    const broken = [...document.images].filter(i => (i.currentSrc || i.src) && !(i.complete && i.naturalWidth)).map(i => i.src);
    return { sw: document.documentElement.scrollWidth, iw: innerWidth, out, small, broken };
  });
  ok(`${w}x${h} no overflow, everything inside the window`, m.sw === m.iw && !m.out.length, m.out.join(' | '));
  ok(`${w}x${h} no broken images, text >= 11 px`, !m.broken.length && !m.small.length, [...m.broken, ...m.small].join(' '));
  ok(`${w}x${h} no console or network errors`, !p.problems.length, p.problems[0] || '');
  await p.context().close();
}

// 4. Fonts, headings, reveal end states.
{
  const p = await open(1440, 790);
  await go(p);
  const fonts = await p.evaluate(async () => {
    await document.fonts.ready;
    return ['700 40px Bricolage', '600 40px Bricolage', '400 16px DM', '500 16px DM', '600 16px DM', '500 40px Caveat'].every(f => document.fonts.check(f));
  });
  ok('the six local font faces in use are active', fonts);
  await walk(p);
  const s = await p.evaluate(() => {
    const hidden = [...document.querySelectorAll('[data-reveal]')].filter(e => getComputedStyle(e).opacity !== '1').length;
    const css = q => getComputedStyle(document.querySelector(q));
    const f = document.getElementById('les-coupes'), l = document.getElementById('nous-trouver'), c = document.getElementById('contact');
    return { hidden, wipe: f.style.getPropertyValue('--wipe'), written: f.classList.contains('is-written'), teeth: l.style.getPropertyValue('--teeth'), dev: c.style.getPropertyValue('--dev'), land: c.style.getPropertyValue('--land') };
  });
  ok('every reveal ends visible', s.hidden === 0);
  ok('end states reached: paint, words, 14, macro, line', +s.wipe === 1 && s.written && +s.teeth === 1 && +s.dev === 1 && +s.land === 1, JSON.stringify(s));
  await p.context().close();
}

// 5. Calls to action with a real pointer.
{
  const p = await open(1440, 790);
  await p.context().route('**google.com/**', r => r.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' }));
  await go(p);
  await p.waitForTimeout(2300);
  const maps = 'query=14+rue+Maurice+Sambron+44160+Pontchateau+France';
  for (const sel of ['.desktop-nav .button', '.hero-copy .button']) {
    const [pop] = await Promise.all([p.waitForEvent('popup'), p.click(sel)]);
    await pop.waitForLoadState();
    ok(`${sel} opens the route`, decodeURIComponent(pop.url()).includes(maps));
    await pop.close();
  }
  await p.click('.desktop-nav a[href="#nous-trouver"]');
  await p.waitForTimeout(1400);
  const seen = await p.evaluate(() => { const r = document.getElementById('nous-trouver').getBoundingClientRect(); return r.top < innerHeight * .5 && r.bottom > 0; });
  ok('nav reaches Nous trouver', seen);
  await p.waitForTimeout(900);
  const [pop] = await Promise.all([p.waitForEvent('popup'), p.click('.location .button')]);
  await pop.waitForLoadState();
  ok('Voir l’itinéraire opens the route', decodeURIComponent(pop.url()).includes(maps));
  await pop.close();
  const phones = await p.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map(a => a.getAttribute('href')))]);
  ok('one phone number everywhere', phones.length === 1 && phones[0] === 'tel:+33758127370', phones.join());
  await p.context().close();
}

// 6. Service dialog: mouse, keyboard, focus return, hover focus.
{
  const p = await open(1440, 790);
  await go(p);
  await to(p, (await docY(p, '#les-coupes')) + 10);
  await p.waitForTimeout(1900);
  await p.hover('[data-service="enfant"]');
  await p.waitForTimeout(600);
  const focus = await p.evaluate(() => ({ f: document.getElementById('les-coupes').dataset.focus, o: getComputedStyle(document.querySelector('.frieze-focus')).opacity }));
  ok('hover keeps the word’s field in colour', focus.f === 'enfant' && +focus.o > .9, JSON.stringify(focus));
  await p.click('[data-service="homme"]');
  await p.waitForTimeout(200);
  const title = () => p.textContent('#service-title');
  ok('Homme opens the dialog on its tab', (await p.evaluate(() => document.getElementById('service-dialog').open)) && (await title()) === 'Coupe homme');
  await p.keyboard.press('ArrowRight');
  ok('ArrowRight → Enfant', (await title()) === 'Coupe enfant');
  await p.keyboard.press('End');
  ok('End → Barbe', (await title()) === 'Barbe & contours');
  await p.keyboard.press('Home');
  ok('Home → Homme', (await title()) === 'Coupe homme');
  await p.keyboard.press('ArrowLeft');
  ok('ArrowLeft wraps to Barbe', (await title()) === 'Barbe & contours');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(150);
  const back = await p.evaluate(() => [document.getElementById('service-dialog').open, document.activeElement.dataset.service]);
  ok('Escape closes, focus returns to the word', back[0] === false && back[1] === 'homme', back.join());
  await p.context().close();
}

// 7. Phone menu.
{
  const p = await open(375, 812, { hasTouch: true, isMobile: true });
  await go(p);
  await p.tap('.mobile-menu summary');
  ok('menu opens', await p.evaluate(() => document.querySelector('.mobile-menu').open));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(100);
  const esc = await p.evaluate(() => [document.querySelector('.mobile-menu').open, document.activeElement.tagName]);
  ok('Escape closes and focuses the summary', esc[0] === false && esc[1] === 'SUMMARY', esc.join());
  await p.tap('.mobile-menu summary');
  await p.tap('.mobile-menu nav a[href="#les-coupes"]');
  await p.waitForTimeout(1100);
  ok('following a link closes the menu', !(await p.evaluate(() => document.querySelector('.mobile-menu').open)));
  await walk(p);
  await to(p, (await docY(p, '#les-coupes')));
  await p.waitForTimeout(1500);
  await p.tap('[data-service="barbe"]');
  await p.waitForTimeout(200);
  ok('Barbe tap opens the dialog', (await p.textContent('#service-title')) === 'Barbe & contours');
  await p.context().close();
}

// 8. Motion off, every way the kit asks for.
const fullyVisible = p => p.evaluate(() => {
  const bad = [];
  for (const e of document.querySelectorAll('[data-reveal],.script,.service-word span,.trait,.closing-brand,.phone,.button,.accent-rule')) {
    if (!e.getClientRects().length) continue;
    const c = getComputedStyle(e);
    if (c.opacity !== '1' || c.visibility === 'hidden' || (c.clipPath !== 'none' && /100%/.test(c.clipPath))) bad.push(e.className.baseVal ?? e.className ?? e.tagName);
  }
  return bad;
});
{
  const p = await open(1440, 790, { reducedMotion: 'reduce' });
  await go(p);
  await walk(p);
  const bad = await fullyVisible(p);
  const st = await p.evaluate(() => [document.documentElement.classList.contains('motion-off'), document.getElementById('motion-toggle').disabled, new DOMMatrix(getComputedStyle(document.querySelector('.frieze-stage')).transform).a, document.querySelector('.frieze-sketch').getAttribute('src')]);
  ok('reduced motion: nothing hidden, toggle locked, no transforms, no sketch download', !bad.length && st[0] && st[1] && st[2] === 1 && !st[3], bad.join() || st.join());
  await p.context().close();
}
{
  const p = await open(1440, 790);
  await p.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true, addEventListener() {} } }));
  await go(p);
  await walk(p);
  ok('Save-Data: nothing hidden', !(await fullyVisible(p)).length && await p.evaluate(() => document.documentElement.classList.contains('motion-off')));
  await p.context().close();
}
{
  const p = await open(1440, 790);
  await go(p);
  await p.click('#motion-toggle');
  await p.reload({ waitUntil: 'networkidle' });
  await walk(p);
  const st = await p.evaluate(() => [localStorage.getItem('karim.motion.paused'), document.documentElement.classList.contains('motion-off'), document.getElementById('motion-toggle').getAttribute('aria-pressed')]);
  ok('pause survives reload, nothing hidden', st[0] === '1' && st[1] && st[2] === 'true' && !(await fullyVisible(p)).length, st.join());
  await p.evaluate(() => localStorage.removeItem('karim.motion.paused'));
  await p.context().close();
}
{
  const p = await open(1440, 790, { javaScriptEnabled: false });
  await go(p);
  const shot = await p.screenshot({ fullPage: true });
  ok('no JS: page renders', shot.length > 200000);
  const text = await p.locator('body').innerText();
  ok('no JS: all contacts and copy present', ['L’art', 'Trois gestes.', 'Homme.', 'Enfant.', 'Barbe.', 'de Pontchâteau.', '14 rue Maurice Sambron', '07 58 12 73 70', 'Le prochain', 'c’est le vôtre.'].every(t => text.includes(t)));
  await p.context().close();
}

// 9. Entry points: the intro never traps anyone.
for (const hash of ['#le-geste', '#nous-trouver', '#contact']) {
  const p = await open(1440, 790);
  await go(p, hash);
  await p.waitForTimeout(1600);
  const m = await p.evaluate(() => ({ y: scrollY, intro: document.querySelector('.hero-picture').getAnimations().length }));
  ok(`${hash} lands with no intro running`, m.y > 100 && m.intro === 0, JSON.stringify(m));
  await p.context().close();
}
{
  const p = await open(1440, 790);
  await go(p);
  await to(p, 900);
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  const m = await p.evaluate(() => [scrollY, document.querySelector('.hero-picture').getAnimations().length]);
  ok('restored scroll skips the intro', m[0] > 100 && m[1] === 0, m.join());
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await p.context().close();
}
{
  const p = await open(1440, 790);
  await go(p);
  const running = await p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect.getTiming().iterations === Infinity).length);
  ok('no endless animation', running === 0);
  await p.mouse.wheel(0, 90);
  await p.waitForTimeout(450);
  ok('first wheel tick cancels the intro', await p.evaluate(() => document.querySelector('.hero-picture').getAnimations().length === 0));
  await p.context().close();
}

// 10. Speed, for the record: wheel scrolling and first-load bytes.
{
  const p = await open(1440, 790);
  await go(p);
  await p.waitForTimeout(2300);
  await p.evaluate(() => {
    window.__t = [];
    const tick = t => { window.__t.push(t); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  for (let i = 0; i < 90; i++) { await p.mouse.wheel(0, 34); await p.waitForTimeout(16); }
  const d = await p.evaluate(() => window.__t.slice(1).map((t, i) => t - window.__t[i]).sort((a, b) => a - b));
  const med = d[d.length >> 1], p95 = d[Math.floor(d.length * .95)];
  console.log(`INFO  frame time while scrolling: median ${med.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms (headless, software raster)`);
  await p.context().close();
}
for (const [w, h, mobile] of [[1440, 790, false], [375, 812, true]]) {
  const p = await open(w, h, { isMobile: mobile, deviceScaleFactor: mobile ? 3 : 2 });
  let bytes = 0;
  const seen = [];
  p.on('response', async r => { try { const n = (await r.body()).length; bytes += n; seen.push([r.url().split('/').pop(), n]); } catch {} });
  await go(p);
  await p.waitForTimeout(1200);
  console.log(`INFO  first load ${w}px @${mobile ? 3 : 2}x: ${(bytes / 1048576).toFixed(2)} MB over ${seen.length} files`);
  if (mobile) ok('phone never fetches the desktop hero', !seen.some(([n]) => /^hero-art/.test(n)));
  await p.context().close();
}

await b.close();
const failed = results.filter(r => !r).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
