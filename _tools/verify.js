// Drive the mirror through Enter Site + full scroll, capture errors and failed requests.
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.env.OUT;
const URL = process.argv[2];
const TAG = process.argv[3];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const errors = [], failed = [], statuses = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('requestfailed', r => failed.push(r.url().slice(0, 140) + ' :: ' + (r.failure()||{}).errorText));
  page.on('response', r => { if (r.status() >= 400) statuses.push(r.status() + ' ' + r.url().slice(0, 140)); });

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 3000));

  // click Enter Site
  const entered = await page.evaluate(() => {
    const el = [...document.querySelectorAll('a,button,div,span')]
      .find(e => /enter site/i.test(e.textContent || '') && e.offsetParent !== null);
    if (el) { el.click(); return true; }
    return false;
  });
  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: `${OUT}/${TAG}-entered.png` });

  // scroll through the whole experience
  const shots = [];
  for (let i = 1; i <= 6; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 3));
    await new Promise(r => setTimeout(r, 4000));
    const p = `${OUT}/${TAG}-scroll${i}.png`;
    await page.screenshot({ path: p });
    shots.push(p);
  }

  const info = await page.evaluate(() => ({
    scrollHeight: document.body.scrollHeight,
    videos: [...document.querySelectorAll('video')].map(v => ({
      src: (v.currentSrc || v.src || '').split('/').slice(-1)[0],
      ready: v.readyState, w: v.videoWidth, h: v.videoHeight,
    })),
    canvases: document.querySelectorAll('canvas').length,
    lenis: typeof window.Lenis !== 'undefined' || !!document.querySelector('[class*=lenis]'),
    contentLoaded: !!window.content,
    phases: window.content ? window.content.phases.length : null,
    fonts: document.fonts ? document.fonts.size : null,
  }));

  console.log(JSON.stringify({ tag: TAG, entered, info, errors, failed, statuses }, null, 2));
  await browser.close();
})();
