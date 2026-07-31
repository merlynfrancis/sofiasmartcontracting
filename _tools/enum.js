const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/private/tmp/claude-501/-Users-manalaptop-Downloads-nrg-build-your-data-center/694cbc96-19b9-43d9-9dd3-ce4ba2a7126d/scratchpad';
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox','--hide-scrollbars','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--use-gl=swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 740 });
  await page.goto('http://localhost:8899/index.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4000));
  const box = await page.evaluate(() => { const el=[...document.querySelectorAll('a,button,div,span')].find(e=>/^\s*enter site\s*$/i.test(e.textContent||'')&&e.getBoundingClientRect().width>0); const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; });
  await page.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 5000));
  await page.click('#menu-icon'); await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => { const li=[...document.querySelectorAll('#menu-links *')].find(e=>e.textContent.includes('Fit-Out & Finishes')); li&&li.click(); });
  await new Promise(r => setTimeout(r, 4500));
  await page.screenshot({ path: OUT + '/enum-p4.png' });
  const list = await page.evaluate(() => {
    return [...document.querySelectorAll('.paragraph')]
      .filter(p => /In Phase 4/.test(p.textContent))
      .map(p => { const r=p.getBoundingClientRect(); const cs=getComputedStyle(p);
        const w = p.closest('.introScreen__explain'); const wcs = w?getComputedStyle(w):null; const wr=w?w.getBoundingClientRect():null;
        return { paraRect:{L:Math.round(r.left),T:Math.round(r.top),R:Math.round(r.right),B:Math.round(r.bottom),vis:r.width>0&&r.top<740&&r.bottom>0},
                 paraPos:cs.position,
                 wrapLeft: wcs?wcs.left:null, wrapTop:wcs?wcs.top:null,
                 wrapRect: wr?{L:Math.round(wr.left),T:Math.round(wr.top)}:null }; });
  });
  console.log(JSON.stringify(list, null, 2));
  await browser.close();
})();
