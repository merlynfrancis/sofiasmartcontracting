// Check the nav lockup: does it fit without colliding with the nav's right-hand
// controls, and does it swap to the light copy over dark artwork?
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/private/tmp/claude-501/-Users-manalaptop-Downloads-nrg-build-your-data-center/694cbc96-19b9-43d9-9dd3-ce4ba2a7126d/scratchpad';

const probe = () => {
  const L = document.querySelector('.nav__logo').getBoundingClientRect();
  const R = document.querySelector('.nav__right').getBoundingClientRect();
  const light = document.querySelector('.nav__logoImg--onLight');
  const dark = document.querySelector('.nav__logoImg--onDark');
  return {
    menuDark: document.documentElement.classList.contains('menu-dark'),
    logo: { l: Math.round(L.left), r: Math.round(L.right), h: Math.round(L.height), w: Math.round(L.width) },
    rightStarts: Math.round(R.left),
    overlap: Math.round(L.right) > Math.round(R.left),
    onLightOpacity: getComputedStyle(light).opacity,
    onDarkOpacity: getComputedStyle(dark).opacity,
  };
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required',
           '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
  });
  for (const [w, h] of [[1600, 1000], [1280, 800], [390, 844]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h });
    await page.goto('http://localhost:8899/index.html', { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(r => setTimeout(r, 5000));
    const box = await page.evaluate(() => {
      const el = [...document.querySelectorAll('a,button,div,span')]
        .find(e => /^\s*enter site\s*$/i.test(e.textContent || '') && e.getBoundingClientRect().width > 0);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (box) await page.mouse.click(box.x, box.y);
    await new Promise(r => setTimeout(r, 7000));
    console.log(w + 'x' + h + ' LIGHT section:', JSON.stringify(await page.evaluate(probe)));

    await page.evaluate(() => window.experience.skipToPhase(1));   // dark artwork phase
    await new Promise(r => setTimeout(r, 6000));
    console.log(w + 'x' + h + ' DARK  section:', JSON.stringify(await page.evaluate(probe)));
    if (w === 1600) await page.screenshot({ path: OUT + '/nav-dark.png' });
    await page.close();
  }
  await browser.close();
})();
