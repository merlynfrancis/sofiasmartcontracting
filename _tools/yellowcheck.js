// Sample the headline area repeatedly through the reveal and count yellow
// pixels. A static screenshot can miss it — the band is only mid-sweep.
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
  await new Promise(r => setTimeout(r, 5000));

  const box = await page.evaluate(() => {
    const el = [...document.querySelectorAll('a,button,div,span')]
      .find(e => /^\s*enter site\s*$/i.test(e.textContent || '') && e.getBoundingClientRect().width > 0);
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.click(box.x, box.y);

  // Dense sampling right through the splash clearing and the headline revealing.
  for (let i = 0; i < 24; i++) {
    await page.screenshot({ path: `${OUT}/yc-${String(i).padStart(2, '0')}.png` });
    await new Promise(r => setTimeout(r, 220));
  }
  console.log('gradient in force:');
  console.log(' ', await page.evaluate(() => {
    const e = [...document.querySelectorAll('.phaseTitle .line .inner')]
      .find(x => x.getBoundingClientRect().width > 0);
    const cs = getComputedStyle(e);
    return cs.backgroundImage.slice(0, 110) + ' | size=' + cs.backgroundSize + ' pos=' + cs.backgroundPosition;
  }));
  await browser.close();
})();
