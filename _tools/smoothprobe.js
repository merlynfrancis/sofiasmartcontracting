// Smoothness probe: drive a CONTINUOUS trackpad-like scroll and record state
// changes IN-PAGE (no per-event round trip, which would dominate the timing).
// Reports how long the experience sits unresponsive while the user is actively
// scrolling. Gaps much larger than the forward baseline are friction we added.
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DIR = process.argv[2] === 'back' ? -1 : 1;
const SECONDS = +(process.argv[3] || 60);

const RECORDER = () => {
  window.__marks = [];
  window.__t0 = performance.now();
  var last = null;
  setInterval(function () {
    var e = window.experience;
    var i = window.twoWayScroll ? window.twoWayScroll.phaseIndex() : -1;
    var p = window.content && window.content.phases ? window.content.phases[i - 1] : null;
    var live = e && e.explore && p && e.explore.currentPhase === p;
    var step = p && p.type === 'explore' && live ? (e.explore.stepIndex | 0) : null;
    var y = Math.round((window.lenis ? window.lenis.scroll : window.scrollY) / 400) * 400;
    var k = i + (step === null ? '@' + y : '.' + step);
    if (k !== last) { window.__marks.push({ t: Math.round(performance.now() - window.__t0), k: k }); last = k; }
  }, 25);
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars',
           '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
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
  if (DIR < 0) {
    await page.evaluate(() => window.experience.skipToPhase(7));
    await new Promise(r => setTimeout(r, 5000));
  }
  await page.mouse.move(800, 500);
  await page.evaluate(RECORDER);

  // Continuous scroll, never pausing. ~60 events/sec at 50 delta each.
  const t0 = Date.now();
  while (Date.now() - t0 < SECONDS * 1000) {
    await page.mouse.wheel({ deltaY: 50 * DIR });
    await new Promise(r => setTimeout(r, 16));
  }

  const marks = await page.evaluate(() => window.__marks);
  console.log((DIR < 0 ? 'BACKWARD' : 'FORWARD') + ' — continuous scroll for ' + SECONDS + 's');
  let prev = 0;
  const gaps = [];
  for (const m of marks) {
    const gap = m.t - prev;
    gaps.push({ gap, k: m.k });
    console.log('  +' + String(gap).padStart(5) + 'ms  ->  ' + m.k);
    prev = m.t;
  }
  const sorted = gaps.map(g => g.gap).sort((a, b) => a - b);
  console.log('\n  transitions:', gaps.length,
              '| median gap:', (sorted[Math.floor(sorted.length / 2)] || 0) + 'ms',
              '| worst:', (sorted[sorted.length - 1] || 0) + 'ms');
  console.log('  stalls over 1.2s:', gaps.filter(g => g.gap > 1200).map(g => g.k + '=' + g.gap + 'ms').join(', ') || 'none');
  await browser.close();
})();
