// Find the node-label pills on screen, dump their class chain, text, and the
// computed box (white-space, overflow, width, padding) so we can see why
// "Design Approvals" overflows its rounded box.
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
  await new Promise(r => setTimeout(r, 3500));

  // Enter site
  const box = await page.evaluate(() => {
    const el = [...document.querySelectorAll('a,button,div,span')]
      .find(e => /^\s*enter site\s*$/i.test(e.textContent || '') && e.getBoundingClientRect().width > 0);
    const r = el.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 };
  });
  await page.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 5000));

  // Scroll down until a pill containing "Approvals" (or any node label) is visible.
  let found = null;
  for (let i = 0; i < 60; i++) {
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 350));
    found = await page.evaluate(() => {
      const els = [...document.querySelectorAll('*')].filter(e => {
        const t = (e.textContent || '').replace(/\s+/g,' ').trim();
        return /Approvals|Client Brief|Site Survey|In-House Design/.test(t)
          && e.children.length <= 3 && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().width < 500;
      });
      if (!els.length) return null;
      const e = els.sort((a,b)=>a.getBoundingClientRect().width-b.getBoundingClientRect().width)[0];
      const cs = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return {
        text: JSON.stringify(e.textContent.replace(/\s+/g,' ').trim()),
        html: e.innerHTML.slice(0,160),
        cls: e.className && e.className.toString(),
        parentCls: e.parentElement && e.parentElement.className.toString(),
        whiteSpace: cs.whiteSpace, overflow: cs.overflow, width: cs.width, maxWidth: cs.maxWidth,
        padding: cs.padding, box: [Math.round(r.width), Math.round(r.height)],
        scrollW: e.scrollWidth, clientW: e.clientWidth,
      };
    });
    if (found) break;
  }
  console.log(JSON.stringify(found, null, 2));
  await page.screenshot({ path: OUT + '/pill.png' });
  await browser.close();
})();
