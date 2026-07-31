// Focused check on the final boundary: jump to phase 7, then reverse out of it,
// sampling from the very first moment (the full sequence probe wheels before it
// takes its first sample, so it cannot observe the starting state).
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const snap = () => {
  const e = window.experience;
  const i = window.twoWayScroll ? window.twoWayScroll.phaseIndex() : -1;
  const p = window.content && window.content.phases ? window.content.phases[i - 1] : null;
  const live = e && e.explore && p && e.explore.currentPhase === p;
  return i + (p && p.type === 'explore' && live ? '.' + (e.explore.stepIndex | 0) : '');
};

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

  await page.goto('http://localhost:8899/index.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4000));
  const box = await page.evaluate(() => {
    const el = [...document.querySelectorAll('a,button,div,span')]
      .find(e => /^\s*enter site\s*$/i.test(e.textContent || '') && e.getBoundingClientRect().width > 0);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (box) await page.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 6000));
  await page.evaluate(() => window.experience.skipToPhase(7));
  await new Promise(r => setTimeout(r, 5000));
  await page.mouse.move(800, 500);

  const seq = [];
  const sample = async () => { const k = await page.evaluate(snap); if (seq[seq.length - 1] !== k) seq.push(k); };

  await sample();                                  // <-- record the starting state first
  for (let t = 0; t < 12; t++) {
    for (let k = 0; k < 10; k++) { await page.mouse.wheel({ deltaY: -320 }); await new Promise(r => setTimeout(r, 70)); }
    for (let s = 0; s < 10; s++) { await sample(); await new Promise(r => setTimeout(r, 160)); }
    if (seq[seq.length - 1].split('.')[0] <= '4') break;
  }
  console.log('reverse from phase 7:', seq.join(' -> '));
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
})();
