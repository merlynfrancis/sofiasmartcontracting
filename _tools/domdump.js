const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox','--hide-scrollbars','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--use-gl=swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:8899/index.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 3500));
  const box = await page.evaluate(() => { const el=[...document.querySelectorAll('a,button,div,span')].find(e=>/^\s*enter site\s*$/i.test(e.textContent||'')&&e.getBoundingClientRect().width>0); const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; });
  await page.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 5000));
  const dump = await page.evaluate(() => {
    const s = document.querySelector('.introScreen');
    if (!s) return 'no introScreen';
    const walk = (el, d=0) => {
      let out = '  '.repeat(d) + '<' + el.tagName.toLowerCase() + ' class="' + (el.className||'') + '">'
        + (el.children.length===0 ? el.textContent.trim().slice(0,40) : '');
      let lines = [out];
      if (d < 3) for (const c of el.children) lines.push(walk(c, d+1));
      return lines.join('\n');
    };
    return walk(s);
  });
  console.log(dump);
  await browser.close();
})();
