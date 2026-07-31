// Screenshot the splash (and optionally the entered site) to eyeball branding.
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.argv[2] || '/tmp/shot';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars',
           '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  const bad = [];
  page.on('requestfailed', r => bad.push(r.url()));
  page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  await page.goto('http://localhost:8899/index.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: OUT + '-splash.png' });

  const box = await page.evaluate(() => {
    const el = [...document.querySelectorAll('a,button,div,span')]
      .find(e => /^\s*enter site\s*$/i.test(e.textContent || '') && e.getBoundingClientRect().width > 0);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (box) await page.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 7000));
  await page.screenshot({ path: OUT + '-entered.png' });
  console.log('shots written to', OUT + '-{splash,entered}.png');
  console.log('bad requests:', bad.length ? bad : 'none');
  await browser.close();
})();
