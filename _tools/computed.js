const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
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
  await new Promise(r => setTimeout(r, 4000));
  const info = await page.evaluate(() => {
    // find the VISIBLE introScreen (there are several in the DOM)
    const screens=[...document.querySelectorAll('.introScreen')];
    const vis = screens.find(s=>{const r=s.getBoundingClientRect();return r.width>0&&r.left>=-50&&r.left<300&&r.top>=-50&&r.top<300;}) || screens[0];
    const w = vis.querySelector('.introScreen__explain');
    const p = vis.querySelector('.introScreen__explain .paragraph');
    const cs = e => e?getComputedStyle(e):null;
    const rect = e => {const r=e.getBoundingClientRect();return {L:Math.round(r.left),T:Math.round(r.top),R:Math.round(r.right),B:Math.round(r.bottom)};};
    const wc=cs(w), pc=cs(p);
    return {
      nScreens: screens.length,
      wrapper: w?{pos:wc.position, top:wc.top, bottom:wc.bottom, left:wc.left, right:wc.right, width:wc.width, rect:rect(w)}:null,
      para: p?{pos:pc.position, top:pc.top, bottom:pc.bottom, left:pc.left, right:pc.right, rect:rect(p)}:null,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
