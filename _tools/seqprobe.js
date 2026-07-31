// Sequence probe: record every distinct (phase, step) visited going forward,
// then going backward, and check the backward walk mirrors the forward one.
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.argv[2] || 'http://localhost:8899/index.html';

const snap = () => {
  const e = window.experience;
  const i = window.twoWayScroll ? window.twoWayScroll.phaseIndex() : -1;
  const p = window.content && window.content.phases ? window.content.phases[i - 1] : null;
  const live = e && e.explore && p && e.explore.currentPhase === p;
  return {
    ph: i,
    type: p ? p.type : 'start',
    step: p && p.type === 'explore' && live ? (e.explore.stepIndex | 0) : null,
    y: Math.round(window.lenis ? window.lenis.scroll : window.scrollY),
    max: Math.round(document.documentElement.scrollHeight - window.innerHeight),
  };
};

const key = s => s.ph + (s.step === null ? '' : '.' + s.step);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars',
           '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  const errors = [];
  page.on('pageerror', e => { const m = e.message.slice(0, 160); if (!/play\(\) request/.test(m)) errors.push(m); });

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4000));
  const box = await page.evaluate(() => {
    const el = [...document.querySelectorAll('a,button,div,span')]
      .find(e => /^\s*enter site\s*$/i.test(e.textContent || '') && e.getBoundingClientRect().width > 0);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (box) await page.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 7000));
  await page.mouse.move(800, 500);

  // Sample often so no step is missed between wheel bursts.
  const walk = async (dy, maxTicks, stopAt) => {
    const seq = [];
    for (let t = 0; t < maxTicks; t++) {
      // >=2000 total delta per burst: the scroll button decays between bursts,
      // so a smaller burst never reaches its trigger threshold.
      for (let k = 0; k < 10; k++) { await page.mouse.wheel({ deltaY: dy }); await new Promise(r => setTimeout(r, 70)); }
      for (let s = 0; s < 10; s++) {
        const st = await page.evaluate(snap);
        if (!seq.length || seq[seq.length - 1].k !== key(st)) seq.push({ k: key(st), ...st });
        await new Promise(r => setTimeout(r, 160));
      }
      const now = await page.evaluate(snap);
      if (t > 0 && stopAt(now)) break;
    }
    return seq;
  };

  const fwd = await walk(320, 60, s => s.ph >= 7);
  console.log('FORWARD :', fwd.map(s => s.k).join(' -> '));
  const back = await walk(-320, 80, s => s.ph <= 0);
  console.log('BACKWARD:', back.map(s => s.k).join(' -> '));

  const f = fwd.map(s => s.k), b = back.map(s => s.k);
  const expected = f.slice().reverse();
  console.log('\nEXPECTED (forward reversed):', expected.join(' -> '));
  const missing = expected.filter(k => !b.includes(k));
  const extra = b.filter(k => !f.includes(k));
  console.log('\nvisited forward but NOT on the way back:', missing.length ? missing.join(', ') : 'none');
  console.log('on the way back but never seen forward :', extra.length ? extra.join(', ') : 'none');
  console.log('backward is strictly descending        :',
    b.every((k, i) => i === 0 || parseFloat(b[i - 1]) >= parseFloat(k)));
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
})();
