// Confirm the rebranded copy renders: start-screen text, then open the nav menu
// and read the phase links (these come straight from content.json menuLink).
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/private/tmp/claude-501/-Users-manalaptop-Downloads-nrg-build-your-data-center/694cbc96-19b9-43d9-9dd3-ce4ba2a7126d/scratchpad';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required',
           '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:8899/index.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4000));

  const box = await page.evaluate(() => {
    const el = [...document.querySelectorAll('a,button,div,span')]
      .find(e => /^\s*enter site\s*$/i.test(e.textContent || '') && e.getBoundingClientRect().width > 0);
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: OUT + '/rb-start.png' });

  // scroll the start screen a touch to reveal the intro paragraphs + bottom
  await page.evaluate(() => window.scrollBy(0, 900));
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: OUT + '/rb-intro.png' });

  // open the nav menu and read the phase links
  await page.click('#menu-icon');
  await new Promise(r => setTimeout(r, 1500));
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('#menu-links li, #menu-links a')].map(e => e.textContent.trim()).filter(Boolean));
  await page.screenshot({ path: OUT + '/rb-menu.png' });

  console.log('menu links:', JSON.stringify(links));
  console.log('intro paras:', JSON.stringify(await page.evaluate(() =>
    [...document.querySelectorAll('.startScreen__intro')].map(p => p.textContent.replace(/\s+/g,' ').trim()))));
  console.log('tooltip:', await page.evaluate(() => {
    const t = document.querySelector('#tab-power'); return t ? t.textContent.replace(/\s+/g,' ').trim() : null; }));
  await browser.close();
})();
