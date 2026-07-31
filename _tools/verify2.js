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
  await new Promise(r => setTimeout(r, 4000));
  // intro overlap check: does paragraph rect intersect the scroll message rect?
  const overlap = await page.evaluate(() => {
    const p = document.querySelector('.introScreen__explain .paragraph');
    const s = document.querySelector('.introScreen__scrollMessage');
    if(!p||!s) return {p:!!p,s:!!s};
    const a=p.getBoundingClientRect(), b=s.getBoundingClientRect();
    const inter = !(a.right<b.left||a.left>b.right||a.bottom<b.top||a.top>b.bottom);
    return { paraTop:Math.round(a.top), paraBottom:Math.round(a.bottom), scrollTop:Math.round(b.top), overlap:inter, vh:window.innerHeight };
  });
  await page.screenshot({ path: `${OUT}/v2-intro-${tag}.png` });
  console.log(tag, 'intro:', JSON.stringify(overlap));
  // scroll to the numbered rail, screenshot the "01" badge, read its bg colour
  let dot=null;
  for(let i=0;i<70;i++){
    await page.evaluate(()=>window.scrollBy(0,350)); await new Promise(r=>setTimeout(r,220));
    dot = await page.evaluate(() => {
      const d=[...document.querySelectorAll('.nodeDotPoint__dot')].find(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.top>0&&r.top<700;});
      if(!d) return null; const cs=getComputedStyle(d); return { bg: cs.backgroundColor };
    });
    if(dot) break;
  }
  if(dot){ await page.screenshot({ path: `${OUT}/v2-badge-${tag}.png` }); }
  console.log(tag, 'badge:', JSON.stringify(dot));
  await browser.close();
})();
