// Verify the nav palette: resting state, hover on the menu icon, and the menu
// open — hover/open states are where a colour swap usually gets missed.
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/private/tmp/claude-501/-Users-manalaptop-Downloads-nrg-build-your-data-center/694cbc96-19b9-43d9-9dd3-ce4ba2a7126d/scratchpad';

const isGreen = 'const green = c => { const m = c.match(/\\d+/g); if (!m) return false; ' +
  'const [r,g,b] = m.map(Number); return g > r + 12 && g > b + 12; };';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required',
           '--enable-unsafe-swiftshader', '--use-gl=swiftshader'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:8899/index.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 5000));
  const box = await page.evaluate(() => {
    const el = [...document.querySelectorAll('a,button,div,span')]
      .find(e => /^\s*enter site\s*$/i.test(e.textContent || '') && e.getBoundingClientRect().width > 0);
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.click(box.x, box.y);
  await new Promise(r => setTimeout(r, 7000));

  const report = async (label) => {
    const out = await page.evaluate(new Function(isGreen + `
      const sel = ['.nav__menu', '.nav__phaseCircle', '.nav__menuIcon span', '.nav__menuIcon',
                   '.nav__menuContactButton', '.nav__menuLink', '.scrollButton__progress',
                   '.progress__dot.active', '.nav__menuBG'];
      const hits = [];
      for (const s of sel) {
        for (const el of document.querySelectorAll(s)) {
          const cs = getComputedStyle(el);
          for (const prop of ['color','backgroundColor','borderColor','fill','stroke']) {
            const v = cs[prop];
            if (v && green(v)) hits.push(s + ' ' + prop + '=' + v);
          }
        }
      }
      const m = document.querySelector('.nav__menu');
      const c = document.querySelector('.nav__phaseCircle');
      return { greens: hits,
               menuColor: m ? getComputedStyle(m).color : null,
               circleBg: c ? getComputedStyle(c).backgroundColor : null,
               circleColor: c ? getComputedStyle(c).color : null };
    `));
    console.log(label, JSON.stringify(out));
  };

  await report('resting :');
  await page.hover('#menu-icon');
  await new Promise(r => setTimeout(r, 700));
  await report('hovered :');
  await page.screenshot({ path: OUT + '/nav-hover.png' });
  await page.click('#menu-icon');
  await new Promise(r => setTimeout(r, 1500));
  await report('open    :');
  await page.screenshot({ path: OUT + '/nav-open.png' });
  await browser.close();
})();
