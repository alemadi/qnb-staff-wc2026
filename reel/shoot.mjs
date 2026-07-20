import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/index.js');
const { chromium } = require('playwright');

const WD='/tmp/claude-0/-home-user-staff-wc2026/eeb8af3d-b659-50ba-8563-2689496a991b/scratchpad/reel';
const mode = process.argv[2] || 'qa';

async function launch(){
  const cands=[null,'/opt/pw-browsers/chromium-1194/chrome-linux/chrome','/opt/pw-browsers/chromium/chrome-linux/chrome'];
  for(const ep of cands){try{return await chromium.launch({executablePath:ep||undefined,args:['--force-color-profile=srgb','--font-render-hinting=none']});}catch(e){if(ep===cands[cands.length-1])throw e;}}
}

const browser=await launch();
const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
await page.goto('file://'+WD+'/spine.html');
await page.waitForFunction('window.__ready===true',{timeout:8000}).catch(()=>{});
console.log('fontinfo:',await page.evaluate('window.__fontinfo'));
const DUR=await page.evaluate('window.DURATION');
const FPS=await page.evaluate('window.FPS');

if(mode==='qa'){
  await page.evaluate(()=>{document.getElementById('stage').style.background='#07070a';});
  const times=[1.8,5.3,11.9,16.6,20.1,24.7,29.7];
  let i=0;
  for(const t of times){i++;
    await page.evaluate(tt=>window.render(tt),t);
    await page.screenshot({path:`${WD}/qa_${String(i).padStart(2,'0')}.jpg`,quality:82,type:'jpeg'});
  }
  console.log('QA frames written:',times.length);
}else{
  const N=Math.round(DUR*FPS);
  const dir=WD+'/frames';
  for(const f of fs.readdirSync(dir)) fs.unlinkSync(dir+'/'+f);
  const t0=Date.now();
  for(let i=0;i<N;i++){const t=i/FPS;
    await page.evaluate(tt=>window.render(tt),t);
    await page.screenshot({path:`${dir}/f_${String(i).padStart(4,'0')}.png`,omitBackground:true});
    if(i%120===0)console.log(`frame ${i}/${N}  (${((Date.now()-t0)/1000).toFixed(1)}s)`);
  }
  console.log('FULL capture done:',N,'frames in',((Date.now()-t0)/1000).toFixed(1)+'s');
}
await browser.close();
