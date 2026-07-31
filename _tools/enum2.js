const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/private/tmp/claude-501/-Users-manalaptop-Downloads-nrg-build-your-data-center/694cbc96-19b9-43d9-9dd3-ce4ba2a7126d/scratchpad';
const [w,h,tag] = [parseInt(process.argv[2]), parseInt(process.argv[3]), process.argv[4]];
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox','--hide-scrollbars','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--use-gl=swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto('http://localhost:8899/index.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4000));
  const box = await page.evaluate(() => { const el=[...document.querySelectorAll('a,button,div,span')].find(e=>/^\s*enter site\s*$/i.test(e.textContent||'')&&e.getBoundingClientRect().width>0); const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; });
  await page.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 5000));
  await page.click('#menu-icon'); await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => { const li=[...document.querySelectorAll('#menu-links *')].find(e=>e.textContent.includes('Fit-Out & Finishes')); li&&li.click(); });
  await new Promise(r => setTimeout(r, 4500));
  await page.screenshot({ path: `${OUT}/enum-${tag}.png` });
  const out = await page.evaluate((vh) => {
    const p=[...document.querySelectorAll('.paragraph')].find(e=>/In Phase 4/.test(e.textContent)&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().top<vh&&e.getBoundingClientRect().bottom>0);
    const s=[...document.querySelectorAll('.introScreen__scrollMessage')].find(e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().top<vh&&e.getBoundingClientRect().bottom>0);
    const R=e=>{const r=e.getBoundingClientRect();return{L:Math.round(r.left),T:Math.round(r.top),R:Math.round(r.right),B:Math.round(r.bottom)};};
    let overlap=null;
    if(p&&s){const a=R(p),b=R(s);overlap=!(a.right<b.left||a.left>b.right||a.bottom<b.top||a.top>b.bottom);}
    return {para:p?R(p):null, scroll:s?R(s):null, overlap, vh};
  }, h);
  console.log(tag, JSON.stringify(out));
  await browser.close();
})();
