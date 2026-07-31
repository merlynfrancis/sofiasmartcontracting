const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/private/tmp/claude-501/-Users-manalaptop-Downloads-nrg-build-your-data-center/694cbc96-19b9-43d9-9dd3-ce4ba2a7126d/scratchpad';
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox','--hide-scrollbars','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--use-gl=swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1512, height: 900 });
  await page.goto('http://localhost:8899/index.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4000));
  const box = await page.evaluate(() => { const el=[...document.querySelectorAll('a,button,div,span')].find(e=>/^\s*enter site\s*$/i.test(e.textContent||'')&&e.getBoundingClientRect().width>0); const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; });
  await page.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 5000));
  for (const [name, tag] of [['Approvals & Procurement','final-p2'],['Project Tour','final-p6']]) {
    await page.click('#menu-icon'); await new Promise(r => setTimeout(r, 1000));
    await page.evaluate((n) => { const li=[...document.querySelectorAll('#menu-links *')].find(e=>e.textContent.includes(n)); li&&li.click(); }, name);
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: `${OUT}/${tag}.png` });
  }
  // scroll into phase-4 rail for the badge; go via menu to Fit-Out then scroll
  await page.click('#menu-icon'); await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => { const li=[...document.querySelectorAll('#menu-links *')].find(e=>e.textContent.includes('Fit-Out & Finishes')); li&&li.click(); });
  await new Promise(r => setTimeout(r, 3500));
  for(let i=0;i<70;i++){ await page.evaluate(()=>window.scrollBy(0,300)); await new Promise(r=>setTimeout(r,200));
    const seen = await page.evaluate(()=>{const d=[...document.querySelectorAll('.nodeDotPoint__dot')].find(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.top>80&&r.top<500;}); return !!d;});
    if(seen) break;
  }
  await page.screenshot({ path: `${OUT}/final-badge.png` });
  console.log('done');
  await browser.close();
})();
