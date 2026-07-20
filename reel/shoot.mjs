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
  const times=[1.8,8.3,16.6,20.1,21.95,24.7,29.7];
  let i=0;
  for(const t of times){i++;
    await page.evaluate(tt=>window.render(tt),t);
    await page.screenshot({path:`${WD}/qa_${String(i).padStart(2,'0')}.jpg`,quality:82,type:'jpeg'});
  }
  console.log('QA frames written:',times.length);
}else{
  const N=Math.round(DUR*FPS);
  const startF = process.argv[3]!==undefined ? parseInt(process.argv[3],10) : 0;
  const endF   = process.argv[4]!==undefined ? parseInt(process.argv[4],10) : N-1;
  const dir=WD+'/frames';
  if(startF===0 && endF===N-1){ for(const f of fs.readdirSync(dir)) fs.unlinkSync(dir+'/'+f); }
  const t0=Date.now();
  for(let i=startF;i<=endF;i++){const t=i/FPS;
    await page.evaluate(tt=>window.render(tt),t);
    await page.screenshot({path:`${dir}/f_${String(i).padStart(4,'0')}.png`,omitBackground:true});
    if((i-startF)%120===0)console.log(`frame ${i}/${endF}  (${((Date.now()-t0)/1000).toFixed(1)}s)`);
  }
  console.log('capture done:',startF,'..',endF,'in',((Date.now()-t0)/1000).toFixed(1)+'s');
}
await browser.close();
