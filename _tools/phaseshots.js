// Step through a phase and screenshot every screen, to check the new media
// reads correctly behind the copy.
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/private/tmp/claude-501/-Users-manalaptop-Downloads-nrg-build-your-data-center/694cbc96-19b9-43d9-9dd3-ce4ba2a7126d/scratchpad';
const PHASE = +(process.argv[2] || 1);
const TAG = process.argv[3] || 'phase';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required',
           '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.slice(0, 120)));
  page.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url().split('/').pop()); });

  await page.goto('http://localhost:8899/index.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 5000));
  const box = await page.evaluate(() => {
    const el = [...document.querySelectorAll('a,button,div,span')]
      .find(e => /^\s*enter site\s*$/i.test(e.textContent || '') && e.getBoundingClientRect().width > 0);
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 7000));
  await page.evaluate(p => window.experience.skipToPhase(p), PHASE);
  await new Promise(r => setTimeout(r, 6000));

  const n = await page.evaluate(p => window.content.phases[p - 1].screens.length, PHASE);
  for (let i = 0; i < n; i++) {
    if (i > 0) {
      await page.evaluate(() => {
        const ex = window.experience.explore;
        ex.exitCurrentStep(); ex.goTo(ex.stepIndex + 1);
      });
      await new Promise(r => setTimeout(r, 3500));
    }
    await page.screenshot({ path: `${OUT}/${TAG}-s${i}.png` });
    const info = await page.evaluate(() => {
      const act = document.querySelector('.media img.active');
      return { step: window.experience.explore.stepIndex, img: act ? act.getAttribute('src').split('/').pop() : null };
    });
    console.log('screen', i, JSON.stringify(info));
  }
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close();
})();
