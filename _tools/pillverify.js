const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/private/tmp/claude-501/-Users-manalaptop-Downloads-nrg-build-your-data-center/694cbc96-19b9-43d9-9dd3-ce4ba2a7126d/scratchpad';
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox','--hide-scrollbars','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--use-gl=swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:8899/index.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 4000));
  const box = await page.evaluate(() => { const el=[...document.querySelectorAll('a,button,div,span')].find(e=>/^\s*enter site\s*$/i.test(e.textContent||'')&&e.getBoundingClientRect().width>0); const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; });
  await page.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 5000));
  // jump to phase 1
  await page.click('#menu-icon'); await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => { const li=[...document.querySelectorAll('#menu-links *')].find(e=>e.textContent.includes('Design & Feasibility')); li&&li.click(); });
  await new Promise(r => setTimeout(r, 3500));
  // scroll to find the Design Approvals pill
  let hit = null;
  for (let i=0;i<80;i++){
    await page.evaluate(() => window.scrollBy(0, 400));
    await new Promise(r => setTimeout(r, 250));
    hit = await page.evaluate(() => {
      const t = [...document.querySelectorAll('.exploreScreen__nodeTitle')].find(e => /Design\s*Approvals|DesignApprovals/.test(e.textContent) && e.getBoundingClientRect().width>0 && e.getBoundingClientRect().top>0 && e.getBoundingClientRect().top<900);
      if(!t) return null;
      const r=t.getBoundingClientRect();
      return { text: JSON.stringify(t.textContent), hasSpace: /Design Approvals/.test(t.textContent), scrollW: t.scrollWidth, clientW: t.clientWidth, x: Math.round(r.x), y: Math.round(r.y) };
    });
    if (hit) break;
  }
  if (hit) { await page.screenshot({ path: OUT + '/pill-fixed.png' }); }
  console.log(JSON.stringify(hit));
  await browser.close();
})();
