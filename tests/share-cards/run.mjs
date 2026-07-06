// Share-cards artifact pack (2026-07-06) — headless proof over the REAL page.
// Boots index.html against a fully mocked Supabase REST layer seeded with a QF-week
// world (France's path, an armed+cashed armband, a rival, a pick twin, honours),
// then drives all ten new share cards and every entry surface, asserting each
// 1080×1350 canvas builds with zero page errors. No live traffic, no writes.
// Run: node tests/share-cards/run.mjs   (env: CHROMIUM_BIN, PLAYWRIGHT_DIR, OUT_DIR)
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';

const { chromium } = await import(process.env.PLAYWRIGHT_DIR || '/opt/node22/lib/node_modules/playwright/index.mjs');
const PAGE_URL = new URL('../../index.html', import.meta.url).href;
const SCRATCH = process.env.OUT_DIR || (os.tmpdir() + '/share-cards-out');
fs.mkdirSync(SCRATCH, { recursive: true });
const results = []; const fail = (m)=>{results.push(['FAIL',m]);console.log('FAIL',m);};
const pass = (m)=>{results.push(['PASS',m]);console.log('PASS',m);};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || '/opt/pw-browsers/chromium',
  args:['--force-prefers-reduced-motion'] });

/* ---------- PASS A: scrape fixture/bracket structure from the real page ---------- */
const ctxA = await browser.newContext();
const pgA = await ctxA.newPage();
await pgA.route('**://*.supabase.co/**', r=>r.fulfill({status:404, body:'{}'}));
await pgA.route('**://site.api.espn.com/**', r=>r.abort());
await pgA.route('**://fonts.googleapis.com/**', r=>r.fulfill({status:200, contentType:'text/css', body:''}));
await pgA.route('**://flagcdn.com/**', r=>r.abort());
await pgA.goto(PAGE_URL);
await pgA.waitForTimeout(800);
const world = await pgA.evaluate(()=>({
  fixtures: FIXTURES.map(f=>({id:f.id,ko:f.ko,kn:!!f.kn,round:f.round,tag:f.tag||null,h:f.home&&f.home.n,a:f.away&&f.away.n})),
  bracket: BRACKET, childOf: CHILD_OF, fl: FL
}));
await ctxA.close();
console.log('scraped fixtures:', world.fixtures.length);

/* ---------- build the seeded world (QF week, France's path) ---------- */
const qfs = world.fixtures.filter(f=>f.kn && f.round==='QF').sort((x,y)=>new Date(x.ko)-new Date(y.ko));
const qf0 = qfs[0];
const r16f = world.bracket[qf0.id][0];
const r32f = world.bracket[r16f][0];
console.log('france path:', r32f, '->', r16f, '->', qf0.id, 'ko', qf0.ko);
const NOW = new Date(new Date(qfs[1].ko).getTime() + 40*60*1000).toISOString();

const teams = Object.keys(world.fl);
const pool = teams.filter(t=>t!=='France'); let pi=0;
const kteams = {};
const r32ids = world.fixtures.filter(f=>f.kn&&f.round==='R32').map(f=>f.id);
r32ids.forEach(id=>{ kteams[id] = (id===r32f) ? {h:'France',a:pool[pi++]} : {h:pool[pi++],a:pool[pi++]}; });
const winner = id => kteams[id].h;                 // home always advances (France is home on its path)
const feedW = fid => winner(fid);
const results_ = {};
world.fixtures.filter(f=>!f.kn).forEach((f,i)=>{ results_[f.id] = [{h:2,a:0},{h:1,a:0},{h:3,a:1},{h:1,a:1}][i%4]; });
r32ids.forEach(id=>{ results_[id] = {w:winner(id), h:2, a: id===r32f?1:0}; });
const r16ids = world.fixtures.filter(f=>f.kn&&f.round==='R16').map(f=>f.id);
r16ids.forEach(id=>{ const [f1,f2]=world.bracket[id]; kteams[id]={h:feedW(f1),a:feedW(f2)}; results_[id]={w:kteams[id].h,h:2,a:0}; });
qfs.forEach(q=>{ const [f1,f2]=world.bracket[q.id]; kteams[q.id]={h:winner(f1),a:winner(f2)}; });
results_[qf0.id] = {w:'France', h:2, a:1};          // the settled QF — France, exact for me
console.log('k26 tie:', qfs[1].id, kteams[qfs[1].id]);

/* players */
const groupFx = world.fixtures.filter(f=>!f.kn);
const outcomeOf = r => r.h>r.a?'H':(r.h<r.a?'A':'D');
const mkGroupPicks = (n, exactN=0) => { const o={}; groupFx.slice(0,n).forEach((f,i)=>{ const r=results_[f.id];
  o[f.id] = i<exactN ? {o:outcomeOf(r),h:r.h,a:r.a} : {o:outcomeOf(r)}; }); return o; };
const koSettled = [...r32ids, ...r16ids];
const me = { slug:'khalid-almannai', name:'Khalid Al-Mannai', dept:'Group Treasury', champ:'France', chips:{qf:qf0.id},
  predictions:(()=>{ const p=mkGroupPicks(18,4);
    koSettled.forEach((id,i)=>{ const r=results_[id]; p[id] = (i>=16&&i<22)?{w:r.w,h:r.h,a:r.a}:{w:r.w}; }); // 6 KO exacts on R16
    p[qf0.id]={w:'France',h:2,a:1};                       // exact, armband armed
    p[qfs[1].id]={w:kteams[qfs[1].id].h};                 // tonight's second call
    p['k29']={w:'France'}; p['k32']={w:'France'};
    return p; })() };
const aisha = { slug:'aisha-alsulaiti', name:'Aisha Al-Sulaiti', dept:'Compliance', champ:'France',
  predictions:(()=>{ const p=mkGroupPicks(30); // first 18 identical to mine → twin
    r32ids.slice(0,8).forEach(id=>{ p[id]={w:results_[id].w}; }); return p; })() };
const yousef = { slug:'yousef-darwish', name:'Yousef Darwish', dept:'Retail Banking', champ:'Argentina',
  predictions:(()=>{ const p=mkGroupPicks(25);
    r16ids.forEach((id,i)=>{ p[id] = i<4 ? {w:results_[id].w} : {w:kteams[id].a}; }); // 4 right, 4 wrong on shared R16
    p[qf0.id]={w:kteams[qf0.id].a};                       // backed the loser
    return p; })() };
const others = Array.from({length:9},(_,i)=>({ slug:'p'+(i+1), name:['Maryam Al-Thani','Omar Haddad','Sara Kamal','Hassan Noor','Leila Farid','Adel Rashid','Nadia Salem','Tariq Aziz','Huda Jaber'][i],
  dept:['IT Operations','IT Operations','IT Operations','Group Treasury','Group Treasury','Retail Banking','Retail Banking','Compliance','Compliance'][i],
  champ:['Argentina','Spain','Brazil','France','Spain','Argentina','Brazil','France','Spain'][i],
  predictions:(()=>{ const p=mkGroupPicks(40+i); r32ids.slice(0,3).forEach(id=>{ p[id]={w:kteams[id].a}; }); return p; })() }));
const blobs = [me, aisha, yousef, ...others];

const standings = [
  {slug:'p1',name:'Maryam Al-Thani',dept:'IT Operations',pts:131,exact:5,correct:44,predicted:92},
  {slug:'khalid-almannai',name:'Khalid Al-Mannai',dept:'Group Treasury',pts:118,exact:7,correct:40,predicted:90},
  {slug:'aisha-alsulaiti',name:'Aisha Al-Sulaiti',dept:'Compliance',pts:101,exact:3,correct:38,predicted:84},
  {slug:'yousef-darwish',name:'Yousef Darwish',dept:'Retail Banking',pts:96,exact:2,correct:36,predicted:88},
  ...others.slice(1).map((p,i)=>({slug:p.slug,name:p.name,dept:p.dept,pts:88-6*i,exact:Math.max(0,2-i),correct:30-i,predicted:80-i}))
];
const consCounts = { n:309, champN:245, champMap:{France:88,Argentina:60,Spain:41,Brazil:30},
  map: Object.fromEntries(qfs.slice(1).map(q=>{ const t=kteams[q.id];
    return [q.id, {H:0,D:0,A:0,sc:{}, w:{[t.h]:193,[t.a]:116}}]; })) };
const roomRows = Array.from({length:10},(_,i)=>({ slug:'r'+i, name:'Colleague '+i, dept:'Ops', chips:null,
  o:null, w: i<4 ? 'France' : kteams[qf0.id].a, h: i===0?2:null, a: i===0?1:null }));

const KV = {
  'wc:results': results_,
  'wc:kteams': kteams,
  'wc:powerups_live': true,
};
blobs.forEach(b=>{ KV['wc:player:'+b.slug]=b; });

/* flags used on cards → pre-download so the route can serve them CORS-clean */
const flagCodes = new Set(['fr']);
[kteams[qf0.id], kteams[qfs[1].id]].forEach(t=>{ flagCodes.add(world.fl[t.h]); flagCodes.add(world.fl[t.a]); });
for (const c of flagCodes) {
  const f = `${SCRATCH}/flag-${c}.png`;
  if (!fs.existsSync(f)) { try { execSync(`curl -sS -o "${f}" "https://flagcdn.com/w160/${c}.png"`); } catch(e){} }
}

/* ---------- PASS B: full boot ---------- */
const ctx = await browser.newContext();
const pg = await ctx.newPage();
const errs = [];
pg.on('pageerror', e=>errs.push('PAGEERROR: '+e.message));
pg.on('console', m=>{ if(m.type()==='error' && !/Failed to load resource/.test(m.text())) errs.push('CONSOLE: '+m.text()); });

await pg.addInitScript(({now, rival, meSlug})=>{
  // deterministic clock (server_time mock agrees, so CLOCK_OFFSET ≈ 0)
  const off = new Date(now).getTime() - Date.now();
  const RD = Date;
  function ND(...a){ return a.length===0 ? new RD(RD.now()+off) : new RD(...a); }
  ND.now = ()=>RD.now()+off; ND.parse=RD.parse.bind(RD); ND.UTC=RD.UTC.bind(RD); ND.prototype=RD.prototype;
  window.Date = ND;
  localStorage.setItem('wc:me', JSON.stringify(meSlug));
  localStorage.setItem('wc:rival', JSON.stringify(rival));
  localStorage.setItem('wc:rivalnudge','1');
  localStorage.setItem('wc:revealed', JSON.stringify([]));  // let reveal queue drain naturally? no — mark all below
  // capture every canvas the page creates; neuter downloads
  window.__cvs = [];
  const oce = Document.prototype.createElement;
  Document.prototype.createElement = function(t,o){ const el=oce.call(this,t,o);
    if(String(t).toLowerCase()==='canvas') window.__cvs.push(el); return el; };
  HTMLAnchorElement.prototype.click = function(){ window.__lastDownload = this.download; };
}, { now: NOW, rival: 'yousef-darwish', meSlug: 'khalid-almannai' });

// mark all settled results as already revealed so the reveal overlay doesn't open at boot
await pg.addInitScript((ids)=>{ localStorage.setItem('wc:revealed', JSON.stringify(ids)); },
  Object.keys(results_));

let fontsCss=''; try{ fontsCss = fs.readFileSync(`${SCRATCH}/fonts.css`,'utf8'); }catch(e){} /* cosmetic only */
await pg.route('**://fonts.googleapis.com/**', r=>r.fulfill({status:200, contentType:'text/css', body:fontsCss}));
await pg.route('**://fonts.gstatic.com/**', r=>{
  const u=r.request().url();
  const f = `${SCRATCH}/` + (u.includes('/anton/') ? 'anton.woff2' : 'hanken.woff2');
  if (fs.existsSync(f)) r.fulfill({status:200, contentType:'font/woff2', headers:{'access-control-allow-origin':'*'}, body:fs.readFileSync(f)});
  else r.abort();
});
await pg.route('**://flagcdn.com/**', r=>{
  const mtc = r.request().url().match(/w160\/([a-z-]+)\.png/);
  const f = mtc ? `${SCRATCH}/flag-${mtc[1]}.png` : null;
  if (f && fs.existsSync(f)) r.fulfill({status:200, contentType:'image/png', headers:{'access-control-allow-origin':'*'}, body:fs.readFileSync(f)});
  else if (fs.existsSync(`${SCRATCH}/flag-fr.png`)) r.fulfill({status:200, contentType:'image/png', headers:{'access-control-allow-origin':'*'}, body:fs.readFileSync(`${SCRATCH}/flag-fr.png`)});
  else r.abort();
});
await pg.route('**://site.api.espn.com/**', r=>r.fulfill({status:200, contentType:'application/json', body:'{}'}));
await pg.route('**://*.supabase.co/**', r=>{
  const u = new URL(r.request().url());
  const send = (j)=>r.fulfill({status:200, contentType:'application/json', body:JSON.stringify(j)});
  if (u.pathname.endsWith('/rpc/server_time')) return send(NOW);
  if (u.pathname.endsWith('/rpc/standings')) return send(standings);
  if (u.pathname.endsWith('/rpc/consensus_counts')) return send(consCounts);
  if (u.pathname.endsWith('/rpc/room_board')) {
    const body = r.request().postData()||'{}';
    let match=null; try{ match=JSON.parse(body).p_match; }catch(e){}
    return send(match===qf0.id ? roomRows : []);
  }
  if (u.pathname.endsWith('/kv')) {
    const key = u.searchParams.get('key')||'';
    if (key.startsWith('in.')) {
      const names = decodeURIComponent(key.slice(3)).replace(/^\(|\)$/g,'').split(',').map(s=>s.replace(/^"|"$/g,'').replace(/\\"/g,'"'));
      return send(names.filter(k=>k in KV).map(k=>({key:k, value:JSON.stringify(KV[k])})));
    }
    if (key.startsWith('eq.')) {
      const k = decodeURIComponent(key.slice(3));
      return send(k in KV ? [{key:k, value:JSON.stringify(KV[k])}] : []);
    }
    if (key.startsWith('like.')) {
      const pre = decodeURIComponent(key.slice(5)).replace(/\*$/,'');
      return send(Object.keys(KV).filter(k=>k.startsWith(pre)).sort().map(k=>({key:k, value:JSON.stringify(KV[k])})));
    }
    return send([]);
  }
  return r.fulfill({status:404, body:'{}'});
});

await pg.goto(PAGE_URL);
await pg.waitForFunction(()=>typeof state!=='undefined' && state.player && state.meSlug==='khalid-almannai', null, {timeout:15000})
  .catch(()=>fail('boot: signed-in state not reached'));
await pg.waitForTimeout(600);

const flags = await pg.evaluate(()=>({ puLive: puLive(), champLocked: champLocked(), grpDone: groupStageComplete(),
  slip: slipEligible(), climbCps: climbCps().map(c=>c.lab), road: !!roadState(), ftOver: ftOver() }));
console.log('boot flags:', JSON.stringify(flags));
if(!flags.puLive) fail('puLive should be true'); else pass('puLive on');
if(!flags.slip) fail('slipEligible false'); else pass('slipEligible');
if(flags.climbCps.join(',')!=='GROUPS,R32,R16') fail('climbCps='+flags.climbCps.join(',')); else pass('climb checkpoints GROUPS,R32,R16');
if(!flags.road) fail('roadState null'); else pass('roadState alive');

/* what's-new shows the share-cards item */
const wn = await pg.evaluate(()=>{ const ov=document.getElementById('wnov');
  const shown = ov && ov.style.display!=='none';
  const has = !!(ov && ov.textContent.includes('New share cards'));
  try{ dismissWhatsNew(); }catch(e){}
  return {shown, has}; });
if(wn.shown && wn.has) pass('whatsnew shows share-cards item'); else fail('whatsnew: shown='+wn.shown+' hasItem='+wn.has);

/* cons-share chip on an upcoming match card */
const consChip = await pg.evaluate(async ()=>{ try{
  go('matches'); state.filter='QF'; renderMatches(); await fillConsensus();
  await new Promise(r=>setTimeout(r,300));
  const nodes=document.querySelectorAll('.cons[data-cons]');
  if(document.querySelector('.cons-share'))return true;
  return 'consNodes='+nodes.length+' first='+(nodes[0]?nodes[0].innerHTML.slice(0,160):'-');
}catch(e){return String(e);} });
if(consChip===true) pass('cons-share chip on match card'); else fail('cons-share chip: '+consChip);


/* helper: run a card fn, wait for a 1080×1350 canvas, return scaled PNG */
async function grabCard(label, code){
  const res = await pg.evaluate(async (code)=>{
    const filt=()=>window.__cvs.filter(c=>c.width===1080&&c.height===1350);
    const before=filt().length; let err=null;
    try{ await eval('(async()=>{'+code+'})()'); }catch(e){ err=String(e&&e.message||e); }
    const t0=Date.now();
    while(Date.now()-t0<9000){
      const cs=filt();
      if(cs.length>before){
        const c=cs[cs.length-1];
        const s=document.createElement('canvas');const k=480/c.width;s.width=480;s.height=Math.round(c.height*k);
        s.getContext('2d').drawImage(c,0,0,s.width,s.height);
        let data=null,taint=null; try{ data=s.toDataURL('image/png'); }catch(e){ taint=String(e); }
        return {ok:!!data,data,taint,err,toast:document.getElementById('toast').textContent};
      }
      await new Promise(r=>setTimeout(r,120));
    }
    return {ok:false,err,toast:document.getElementById('toast').textContent};
  }, code);
  if(res.ok){ pass('card built: '+label);
    fs.writeFileSync(`${SCRATCH}/live-${label}.png`, Buffer.from(res.data.split(',')[1],'base64')); }
  else fail('card '+label+': err='+res.err+' taint='+(res.taint||'')+' toast="'+res.toast+'"');
  return res.ok;
}

await grabCard('slip', 'await shareSlip();');
await grabCard('split', `await shareSplit(${JSON.stringify(qfs[1].id)});`);
await grabCard('receipt', 'await bragReceipt();');
await grabCard('belt-oracle', 'computeHonours((await fetchStandings()).slice().sort(cmpSt)); await shareBelt("oracle");');
await grabCard('climb', 'await shareClimb();');
await grabCard('road', 'await shareRoad();');
await grabCard('armband', `ROOM_SEL=${JSON.stringify(qf0.id)}; await bragCall();`);
await grabCard('club', 'await bragMilestone();');
await grabCard('twin', 'await consensusFull(); await shareTwin();');

/* UI surfaces */
await pg.evaluate(async ()=>{ await consensusFull(); go('me'); });
await pg.waitForTimeout(900);
const meChips = await pg.evaluate(()=>Array.from(document.querySelectorAll('.brag-chip')).map(b=>b.textContent.trim()));
console.log('brag chips:', JSON.stringify(meChips));
['Tonight’s slip','Oracle belt','The climb','Road to the final','The 100 club','Same brain'].forEach(want=>{
  if(meChips.some(c=>c.includes(want))) pass('chip: '+want); else fail('chip missing: '+want); });
const rvBtn = await pg.evaluate(()=>!!document.querySelector('.rv-h2h .room-brag'));
if(rvBtn) pass('receipt button in rival panel'); else fail('receipt button missing in rival panel');

/* Room pre-settle buttons (the in-play QF) */
const roomBtns = await pg.evaluate(async (mid)=>{ try{
  LB_MODE='room'; go('leaderboard'); await new Promise(r=>setTimeout(r,400));
  ROOM_SEL=mid; await renderRoomBody();
  const host=document.getElementById('room-body'); if(!host) return {err:'no room-body'};
  return {slip:host.innerHTML.includes('Share my slip'), split:host.innerHTML.includes('Share the office split')};
}catch(e){return {err:String(e)};} }, qfs[1].id);
if(roomBtns.slip&&roomBtns.split) pass('Room pre-settle buttons'); else fail('Room buttons: '+JSON.stringify(roomBtns));

/* header integrity: the hub must never collide with the brand or chip at any width
   (regression: 440-699px signed-in band, caught live 2026-07-06) */
for (const w of [340,390,460,600,700,1024]){
  await pg.setViewportSize({width:w,height:900});
  await pg.waitForTimeout(200);
  const r = await pg.evaluate(()=>{
    const bx=e=>e.getBoundingClientRect();
    const hub=document.getElementById('sharehub'), wm=document.querySelector('.mark .wm'), chip=document.getElementById('userchip');
    const shown=hub&&getComputedStyle(hub).display!=='none';
    const inter=(a,b)=>!(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top);
    return { bad: shown&&(inter(bx(hub),bx(wm))||inter(bx(hub),bx(chip))),
      overflow: document.documentElement.scrollWidth>document.documentElement.clientWidth };
  });
  if(r.bad||r.overflow) fail('header overlap at '+w+'px '+JSON.stringify(r)); else pass('header clean at '+w+'px');
}
await pg.setViewportSize({width:1280,height:720});
await pg.waitForTimeout(200);

/* 📤 Share tray — the always-visible discovery door */
await pg.waitForTimeout(1600); /* boot badge kicks at +1.2s */
const hub = await pg.evaluate(()=>{ const sh=document.getElementById('sharehub');
  const dot=document.getElementById('share-new');
  return { visible: !!(sh && sh.style.display!=='none'), dot: !!(dot && dot.style.display!=='none'), n: dot?dot.textContent:'' }; });
if(hub.visible) pass('share hub visible in header'); else fail('share hub hidden');
if(hub.dot && /^([1-9]|9\+)/.test(hub.n)) pass('hub badge counts unseen cards ('+hub.n+')'); else fail('hub badge: shown='+hub.dot+' n="'+hub.n+'"');
/* persistent banner repointed at the tray */
const xb = await pg.evaluate(()=>{ const b=document.getElementById('xbanner');
  return { shown: !!(b && b.style.display!=='none'), tray: !!(b && b.innerHTML.includes('openShareTray()')), copy: !!(b && b.textContent.includes('share cards are here')) }; });
if(xb.shown && xb.tray && xb.copy) pass('banner shows every visit + opens the tray'); else fail('banner: '+JSON.stringify(xb));
await pg.screenshot({ path: `${SCRATCH}/live-header.png`, clip:{x:0,y:0,width:1280,height:300} });
const tray = await pg.evaluate(async ()=>{ try{
  /* earlier tests ran consensusFull() over the 12 seeded blobs, dropping QF counts below
     the k-floor — reset so the tray reads the counts RPC, as a fresh prod session would */
  CONS={t:0,map:null,busy:null,busyF:null,full:false};
  await openShareTray();
  await new Promise(r=>setTimeout(r,300));
  const tiles=Array.from(document.querySelectorAll('#sh-grid .sh-tile:not(.lk) b')).map(b=>b.textContent.trim());
  const locked=Array.from(document.querySelectorAll('#sh-grid .sh-tile.lk b')).map(b=>b.textContent.trim());
  const dotGone=document.getElementById('share-new').style.display==='none';
  return {tiles, locked, dotGone};
}catch(e){ return {err:String(e)}; } });
if(tray.err) fail('tray: '+tray.err);
else{
  console.log('tray tiles:', JSON.stringify(tray.tiles), 'locked:', JSON.stringify(tray.locked));
  ['Tonight’s slip','Office split','My standing card','The climb','Road to the final','The 100 club','The receipt','Oracle belt','Brag my last call'].forEach(w=>{
    if(tray.tiles.some(t=>t.includes(w))) pass('tray tile: '+w); else fail('tray tile missing: '+w); });
  if(tray.locked.some(t=>t.includes('The podium'))) pass('tray locked rack shows podium'); else fail('tray locked rack missing podium');
  if(tray.dotGone) pass('hub badge clears on first open'); else fail('hub badge did not clear');
  const seenSet = await pg.evaluate(()=>{ try{ return JSON.parse(localStorage.getItem('wc:shareseen')||'[]').length; }catch(e){ return 0; } });
  if(seenSet>=8) pass('seen-set written on open ('+seenSet+' keys)'); else fail('seen-set too small: '+seenSet);
}
await pg.screenshot({ path: `${SCRATCH}/live-tray.png` });
/* tap a tile end-to-end: slip via the tray */
const tapped = await pg.evaluate(async ()=>{ 
  const filt=()=>window.__cvs.filter(c=>c.width===1080&&c.height===1350);
  const before=filt().length;
  const tile=Array.from(document.querySelectorAll('#sh-grid .sh-tile')).find(b=>b.textContent.includes('Tonight’s slip'));
  if(!tile)return 'no tile';
  tile.click();
  const t0=Date.now();
  while(Date.now()-t0<9000){ if(filt().length>before) return true; await new Promise(r=>setTimeout(r,120)); }
  return 'no canvas';
});
if(tapped===true) pass('tray tile tap builds the card + closes'); else fail('tray tap: '+tapped);
await pg.evaluate(()=>closeShareTray());

/* reveal earn-moment handoff: un-reveal the settled QF, walk the ritual, tap through to the tray */
const rev = await pg.evaluate(async (qf)=>{ try{
  closeShareTray();
  const seen=JSON.parse(localStorage.getItem('wc:revealed')||'[]').filter(id=>id!==qf);
  localStorage.setItem('wc:revealed', JSON.stringify(seen));
  if(!openReveal()) return {err:'reveal did not open'};
  revealSummary();
  await new Promise(r=>setTimeout(r,200));
  const foot=document.getElementById('rv-foot');
  const btn=foot&&Array.from(foot.querySelectorAll('button')).find(b=>b.textContent.includes('Cards earned'));
  if(!btn) return {err:'no Cards earned button', foot: foot?foot.textContent:'-'};
  btn.click();
  await new Promise(r=>setTimeout(r,700));
  const trayOpen=document.getElementById('sharetray').style.display!=='none';
  closeShareTray();
  return {ok:true, trayOpen};
}catch(e){ return {err:String(e)}; } }, qf0.id);
if(rev.ok && rev.trayOpen) pass('reveal summary hands off to the tray on a scoring night'); else fail('reveal handoff: '+JSON.stringify(rev));

/* Podium — simulate full time in-page, then build */
await grabCard('podium', 'state.results._champ="France"; state.results.k32={w:"France",h:2,a:1}; bustStandings(); await sharePodium();');

if(errs.length){ fail('page errors: '+errs.join(' | ')); } else pass('zero page errors');

console.log('\n==== SUMMARY ====');
results.forEach(([s,m])=>console.log(s.padEnd(5), m));
const bad = results.filter(r=>r[0]==='FAIL').length;
console.log(bad? `${bad} FAILURES` : 'ALL GREEN');
await browser.close();
process.exit(bad?1:0);
