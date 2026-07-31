const p=require('puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const pg=await b.newPage();const f=[];
pg.on('requestfailed',r=>f.push(r.url().replace('http://localhost:8899','')+' :: '+(r.failure()||{}).errorText));
await pg.goto('http://localhost:8899/index.html',{waitUntil:'networkidle2',timeout:90000});
await new Promise(r=>setTimeout(r,10000));
console.log(f.length?f.join('\n'):'NO FAILED REQUESTS');await b.close();})();
