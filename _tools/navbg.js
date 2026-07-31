// Sample the actual backdrop luminance behind the nav logo in every phase, so
// the logo colour is chosen from measurement rather than the app's menu-dark
// flag (which turns out to fire over mid-tone artwork too).
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/private/tmp/claude-501/-Users-manalaptop-Downloads-nrg-build-your-data-center/694cbc96-19b9-43d9-9dd3-ce4ba2a7126d/scratchpad';
const fs = require('fs');
const { PNG } = (() => { try { return {}; } catch (e) { return {}; } })();

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
  await new Promise(r => setTimeout(r, 7000));

  const rect = await page.evaluate(() => {
    const r = document.querySelector('.nav__logo').getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
  });

  for (let ph = 0; ph <= 7; ph++) {
    if (ph > 0) {
      await page.evaluate(p => window.experience.skipToPhase(p), ph);
      await new Promise(r => setTimeout(r, 6000));
    }
    // Hide the logo so we sample the backdrop, not the artwork plus the logo.
    await page.evaluate(() => { document.querySelector('.nav__logo').style.visibility = 'hidden'; });
    // Full-frame shot, cropped afterwards — clipped screenshots error out here.
    const buf = await page.screenshot();
    await page.evaluate(() => { document.querySelector('.nav__logo').style.visibility = ''; });
    fs.writeFileSync(OUT + '/navbg-' + ph + '.png', buf);
    const md = await page.evaluate(() => document.documentElement.classList.contains('menu-dark'));
    console.log('phase', ph, 'menuDark=' + md, '-> ' + OUT + '/navbg-' + ph + '.png');
  }
  await browser.close();
})();
