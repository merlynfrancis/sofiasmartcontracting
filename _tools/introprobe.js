// Jump to the Phase 2 intro via the nav menu, screenshot it, and measure the
// title vs. paragraph boxes (position, font size, the vertical gap between them)
// so the hierarchy fix is driven by real numbers.
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/private/tmp/claude-501/-Users-manalaptop-Downloads-nrg-build-your-data-center/694cbc96-19b9-43d9-9dd3-ce4ba2a7126d/scratchpad';
const TAG = process.argv[2] || 'introphase2';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required',
           '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1728, height: 1080 });
  await page.goto('http://localhost:8899/index.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4000));

  const box = await page.evaluate(() => {
    const el = [...document.querySelectorAll('a,button,div,span')]
      .find(e => /^\s*enter site\s*$/i.test(e.textContent || '') && e.getBoundingClientRect().width > 0);
    const r = el.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 };
  });
  await page.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 5000));

  // open menu, click "Approvals & Procurement"
  await page.click('#menu-icon');
  await new Promise(r => setTimeout(r, 1200));
  const clicked = await page.evaluate(() => {
    const li = [...document.querySelectorAll('#menu-links *')].find(e => /Approvals & Procurement/.test(e.textContent) && e.getBoundingClientRect().width>0);
    if (li) { li.click(); return true; } return false;
  });
  await new Promise(r => setTimeout(r, 4500));
  await page.screenshot({ path: `${OUT}/${TAG}.png` });

  const m = await page.evaluate(() => {
    const t = document.querySelector('.introScreen .phaseTitle');
    const p = document.querySelector('.introScreen .paragraph');
    const pick = e => { if(!e) return null; const r=e.getBoundingClientRect(); const cs=getComputedStyle(e);
      return { top:Math.round(r.top), bottom:Math.round(r.bottom), left:Math.round(r.left), right:Math.round(r.right),
               w:Math.round(r.width), h:Math.round(r.height), font:cs.fontSize, lh:cs.lineHeight }; };
    const T=pick(t), P=pick(p);
    return { title:T, para:P, gapY: P&&T ? P.top - T.bottom : null,
             vh: window.innerHeight, htmlFont: getComputedStyle(document.documentElement).fontSize,
             clicked: document.querySelector('.introScreen') ? true : false };
  });
  console.log(JSON.stringify(m, null, 2));
  await browser.close();
})();
