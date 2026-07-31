// Confirm the splash still animates in/out and enters the site after the
// Enter Site badge was moved out of absolute positioning into normal flow.
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

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

  await page.goto('http://localhost:8899/index.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 6000));

  console.log('badge when loaded:', JSON.stringify(await page.evaluate(() => {
    const el = document.querySelector('.loadingScreen__button');
    const cs = getComputedStyle(el);
    return { opacity: cs.opacity, pointerEvents: cs.pointerEvents, transform: cs.transform };
  })));

  const box = await page.evaluate(() => {
    const el = [...document.querySelectorAll('a,button,div,span')]
      .find(e => /^\s*enter site\s*$/i.test(e.textContent || '') && e.getBoundingClientRect().width > 0);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  console.log('badge hit box:', JSON.stringify(box));
  if (box) await page.mouse.click(box.x, box.y);

  await new Promise(r => setTimeout(r, 1000));
  console.log('mid-exit spinner transform:', await page.evaluate(() =>
    getComputedStyle(document.querySelector('.loadingScreen__spinner')).transform));

  await new Promise(r => setTimeout(r, 8000));
  console.log('after enter:', JSON.stringify(await page.evaluate(() => {
    const l = document.getElementById('loading');   // the app removes this on entry
    return {
      phase: window.twoWayScroll.phaseIndex(),
      splash: l ? getComputedStyle(l).opacity : 'removed from DOM',
      startVisible: !!document.querySelector('#start-top-content'),
    };
  })));
  console.log('errors:', errs.length ? errs.join(' | ') : 'none');
  await browser.close();
})();
