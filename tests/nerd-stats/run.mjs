// Stats-for-nerds (2026-07-06) — headless proof over the REAL page.
// Boots index.html against a mocked Supabase REST layer seeded with a QF-week world,
// clicks the new 🤓 Nerds leaderboard mode, and asserts every panel renders with the
// NUMBERS INDEPENDENTLY RECOMPUTED HERE from the same seed (crowd accuracy, draw share,
// goals/match, champion market dead-ticket share). No live traffic, no writes.
// Run: node tests/nerd-stats/run.mjs   (env: CHROMIUM_BIN, PLAYWRIGHT_DIR, OUT_DIR)
import fs from 'fs';
import os from 'os';

const { chromium } = await import(process.env.PLAYWRIGHT_DIR || '/opt/node22/lib/node_modules/playwright/index.mjs');
const PAGE_URL = new URL('../../index.html', import.meta.url).href;
const SCRATCH = process.env.OUT_DIR || (os.tmpdir() + '/nerd-stats-out');
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
  bracket: BRACKET, fl: FL, wnVer: (typeof WHATSNEW_VER!=='undefined')?WHATSNEW_VER:''
}));
await ctxA.close();
console.log('scraped fixtures:', world.fixtures.length);

/* ---------- seeded world: QF week, all groups + R32 + R16 + first QF settled ---------- */
const qfs = world.fixtures.filter(f=>f.kn && f.round==='QF').sort((x,y)=>new Date(x.ko)-new Date(y.ko));
const qf0 = qfs[0];
const NOW = new Date(new Date(qfs[1].ko).getTime() + 40*60*1000).toISOString();

const teams = Object.keys(world.fl);
const pool = teams.filter(t=>t!=='France'); let pi=0;
const kteams = {};
const r32ids = world.fixtures.filter(f=>f.kn&&f.round==='R32').map(f=>f.id);
const r32f = world.bracket[world.bracket[qf0.id][0]][0];
r32ids.forEach(id=>{ kteams[id] = (id===r32f) ? {h:'France',a:pool[pi++]} : {h:pool[pi++],a:pool[pi++]}; });
const winner = id => kteams[id].h;                 // home always advances
const results_ = {};
const groupFx = world.fixtures.filter(f=>!f.kn);
const SCORES = [{h:2,a:0},{h:1,a:0},{h:3,a:1},{h:1,a:1}];
groupFx.forEach((f,i)=>{ results_[f.id] = SCORES[i%4]; });
r32ids.forEach(id=>{ results_[id] = {w:winner(id), h:2, a: id===r32f?1:0}; });
const r16ids = world.fixtures.filter(f=>f.kn&&f.round==='R16').map(f=>f.id);
r16ids.forEach(id=>{ const [f1,f2]=world.bracket[id]; kteams[id]={h:winner(f1),a:winner(f2)}; results_[id]={w:kteams[id].h,h:2,a:0}; });
qfs.forEach(q=>{ const [f1,f2]=world.bracket[q.id]; kteams[q.id]={h:winner(f1),a:winner(f2)}; });
results_[qf0.id] = {w:'France', h:2, a:1};

/* players — every group pick is the true outcome; the first `exactN` also nail the score */
const outcomeOf = r => r.h>r.a?'H':(r.h<r.a?'A':'D');
const mkGroupPicks = (n, exactN=0) => { const o={}; groupFx.slice(0,n).forEach((f,i)=>{ const r=results_[f.id];
  o[f.id] = i<exactN ? {o:outcomeOf(r),h:r.h,a:r.a} : {o:outcomeOf(r)}; }); return o; };
const me = { slug:'khalid-almannai', name:'Khalid Al-Mannai', dept:'Group Treasury', champ:'France',
  predictions:(()=>{ const p=mkGroupPicks(18,4);
    [...r32ids, ...r16ids].forEach(id=>{ p[id]={w:results_[id].w}; });
    p[qf0.id]={w:'France',h:2,a:1};
    return p; })() };
const aisha = { slug:'aisha-alsulaiti', name:'Aisha Al-Sulaiti', dept:'Compliance', champ:'France',
  predictions:(()=>{ const p=mkGroupPicks(30); r32ids.slice(0,8).forEach(id=>{ p[id]={w:results_[id].w}; }); return p; })() };
const yousef = { slug:'yousef-darwish', name:'Yousef Darwish', dept:'Retail Banking', champ:'Argentina',
  predictions:(()=>{ const p=mkGroupPicks(25);
    r16ids.forEach((id,i)=>{ p[id] = i<4 ? {w:results_[id].w} : {w:kteams[id].a}; });
    p[qf0.id]={w:kteams[qf0.id].a};
    return p; })() };
const others = Array.from({length:9},(_,i)=>({ slug:'p'+(i+1), name:['Maryam Al-Thani','Omar Haddad','Sara Kamal','Hassan Noor','Leila Farid','Adel Rashid','Nadia Salem','Tariq Aziz','Huda Jaber'][i],
  dept:['IT Operations','IT Operations','IT Operations','Group Treasury','Group Treasury','Retail Banking','Retail Banking','Compliance','Compliance'][i],
  champ:['Argentina','Spain','Brazil','France','Spain','Argentina','Brazil','France','Spain'][i],
  predictions:(()=>{ const p=mkGroupPicks(40+i,20); r32ids.slice(0,3).forEach(id=>{ p[id]={w:kteams[id].a}; }); return p; })() }));
const blobs = [me, aisha, yousef, ...others];

const standings = [
  {slug:'p1',name:'Maryam Al-Thani',dept:'IT Operations',pts:131,exact:5,correct:44,predicted:92},
  {slug:'khalid-almannai',name:'Khalid Al-Mannai',dept:'Group Treasury',pts:118,exact:7,correct:40,predicted:90},
  {slug:'aisha-alsulaiti',name:'Aisha Al-Sulaiti',dept:'Compliance',pts:101,exact:3,correct:38,predicted:84},
  {slug:'yousef-darwish',name:'Yousef Darwish',dept:'Retail Banking',pts:96,exact:2,correct:36,predicted:88},
  ...others.slice(1).map((p,i)=>({slug:p.slug,name:p.name,dept:p.dept,pts:88-6*i,exact:Math.max(0,2-i),correct:30-i,predicted:80-i}))
];

const KV = { 'wc:results': results_, 'wc:kteams': kteams, 'wc:powerups_live': false };
blobs.forEach(b=>{ KV['wc:player:'+b.slug]=b; });

/* ---------- EXPECTED numbers, recomputed here (independent of the page's code) ---------- */
const settledIds = Object.keys(results_).filter(id=>{ const f=world.fixtures.find(x=>x.id===id);
  return f && (f.kn ? results_[id].w!=null : results_[id].h!=null); });
const settledFx = world.fixtures.filter(f=>settledIds.includes(f.id));
// goals / draws
let expGoals=0,expGN=0,expDraws=0,expGDone=0;
settledFx.forEach(f=>{ const r=results_[f.id];
  if(r.h!=null&&r.a!=null){expGoals+=r.h+r.a;expGN++;}
  if(!f.kn){expGDone++;if(r.h===r.a)expDraws++;} });
// crowd (majority) accuracy under the k-anon floors (5 group / 8 knockout)
let expCrowdHit=0,expCrowdTot=0;
settledFx.forEach(f=>{ const r=results_[f.id];
  if(f.kn){ const t=kteams[f.id]; let hN=0,aN=0;
    blobs.forEach(b=>{ const v=b.predictions[f.id]; if(!v||!v.w)return; if(v.w===t.h)hN++; else if(v.w===t.a)aN++; });
    if(hN+aN<8)return; expCrowdTot++; if((hN>=aN?t.h:t.a)===r.w)expCrowdHit++; }
  else{ let H=0,D=0,A=0;
    blobs.forEach(b=>{ const v=b.predictions[f.id]; if(!v||!v.o)return; if(v.o==='H')H++;else if(v.o==='D')D++;else A++; });
    if(H+D+A<5)return; expCrowdTot++;
    const ro=outcomeOf(r), mo=(H>=D&&H>=A)?'H':((D>=A)?'D':'A');
    if(mo===ro)expCrowdHit++; } });
const expCrowdPct = Math.round(expCrowdHit/expCrowdTot*100);
// champion market: dead = beaten in a settled KO tie, or not in the 32-team KO field
const koField = new Set(); r32ids.forEach(id=>{ koField.add(kteams[id].h); koField.add(kteams[id].a); });
const beaten = new Set();
settledFx.forEach(f=>{ if(!f.kn)return; const r=results_[f.id],t=kteams[f.id];
  const l = r.w===t.h?t.a:(r.w===t.a?t.h:null); if(l)beaten.add(l); });
const champMap={}; blobs.forEach(b=>{ if(b.champ)champMap[b.champ]=(champMap[b.champ]||0)+1; });
const champN = blobs.filter(b=>b.champ).length;
let expDeadN=0; Object.keys(champMap).forEach(t=>{ if(beaten.has(t)||!koField.has(t))expDeadN+=champMap[t]; });
const expDeadPct = Math.round(expDeadN/champN*100);
console.log('expected: crowd', expCrowdHit+'/'+expCrowdTot, '('+expCrowdPct+'%) · draws', expDraws+'/'+expGDone,
  '· goals/match', (expGoals/expGN).toFixed(2), '· dead tickets', expDeadPct+'% of', champN);

/* ---------- PASS B: full boot, then click 🤓 Nerds ---------- */
const ctx = await browser.newContext({ viewport:{width:390,height:844} });
const pg = await ctx.newPage();
const errs = [];
pg.on('pageerror', e=>errs.push('PAGEERROR: '+e.message));
pg.on('console', m=>{ if(m.type()==='error' && !/Failed to load resource/.test(m.text())) errs.push('CONSOLE: '+m.text()); });

await pg.addInitScript(({now, meSlug, revealed, wnVer})=>{
  const off = new Date(now).getTime() - Date.now();
  const RD = Date;
  function ND(...a){ return a.length===0 ? new RD(RD.now()+off) : new RD(...a); }
  ND.now = ()=>RD.now()+off; ND.parse=RD.parse.bind(RD); ND.UTC=RD.UTC.bind(RD); ND.prototype=RD.prototype;
  window.Date = ND;
  localStorage.setItem('wc:me', JSON.stringify(meSlug));
  localStorage.setItem('wc:revealed', JSON.stringify(revealed));
  localStorage.setItem('wc:whatsnew', wnVer);               // keep the spotlight closed
}, { now: NOW, meSlug: 'khalid-almannai', revealed: Object.keys(results_), wnVer: world.wnVer });

await pg.route('**://fonts.googleapis.com/**', r=>r.fulfill({status:200, contentType:'text/css', body:''}));
await pg.route('**://fonts.gstatic.com/**', r=>r.abort());
await pg.route('**://flagcdn.com/**', r=>r.abort());
await pg.route('**://site.api.espn.com/**', r=>r.fulfill({status:200, contentType:'application/json', body:'{}'}));
await pg.route('**://*.supabase.co/**', r=>{
  const u = new URL(r.request().url());
  const send = (j)=>r.fulfill({status:200, contentType:'application/json', body:JSON.stringify(j)});
  if (u.pathname.endsWith('/rpc/server_time')) return send(NOW);
  if (u.pathname.endsWith('/rpc/standings')) return send(standings);
  if (u.pathname.endsWith('/rpc/consensus_counts')) return send({n:0,champN:0,champMap:{},map:{}}); // force the full tier
  if (u.pathname.endsWith('/rpc/room_board')) return send([]);
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

/* the mode button exists, shows a NEW badge, and a REAL click opens the panel */
await pg.evaluate(()=>go('leaderboard'));
await pg.waitForTimeout(400);
const badge = await pg.evaluate(()=>{ const b=document.getElementById('nrd-new'); return b && b.style.display!=='none'; });
if(badge) pass('NEW badge on the Nerds pill before first visit'); else fail('nrd-new badge not shown');
const btn = pg.locator('#lbmode button[data-m="nerds"]');
if(await btn.count()===1) pass('🤓 Nerds pill present'); else fail('nerds pill missing');
await btn.click();
await pg.waitForSelector('.nrd-tiles', {timeout:8000}).then(()=>pass('panel renders on click')).catch(()=>fail('panel did not render'));
/* consensusFull resolves async → the pending cards re-render with meters */
await pg.waitForSelector('.nrd-meter', {timeout:12000}).then(()=>pass('analytics tier arrived (hive-mind meters)')).catch(()=>fail('hive-mind meters never rendered'));
await pg.waitForTimeout(500);

const got = await pg.evaluate(()=>{
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const text=el=>el?el.textContent.replace(/\s+/g,' ').trim():null;
  return {
    tiles: $$('.nrd-tile').map(t=>text(t)),
    pend: $$('.aw-pend').map(t=>text(t)),
    badgeAfter: (()=>{ const b=document.getElementById('nrd-new'); return b && b.style.display!=='none'; })(),
    histBars: $$('.nrd-plot')[0] ? $$('.nrd-plot')[0].children.length : 0,
    youBin: !!document.querySelector('.nrd-plot i.hot em'),
    meters: $$('.nrd-meter .lab').map(t=>text(t)),
    heatCells: $$('.nrd-cell').length,
    heatLabeled: $$('.nrd-cell').filter(c=>/%/.test(c.textContent)).length,
    heatWhere: $$('.nrd-cell').map((c,i)=>({h:Math.floor(i/5),a:i%5,t:c.textContent.trim()})).filter(x=>x.t),
    duoRows: $$('.nrd-duo .lab').map(t=>text(t)),
    keyRow: text($('.nrd-key')),
    champRows: $$('.nrd-champ').map(t=>text(t)),
    lines: $$('.nrd-line').map(t=>text(t)),
    yous: $$('.aw-you').map(t=>text(t)),
    onPill: text($('#lbmode button.on')),
  };
});
console.log(JSON.stringify(got,null,1).slice(0,4000));

if(got.onPill && got.onPill.includes('Nerds')) pass('mode pill switched'); else fail('mode pill not on');
if(got.badgeAfter===false) pass('NEW badge cleared after visit'); else fail('NEW badge still on after click');
if(got.tiles.length===6) pass('6 KPI tiles'); else fail('tiles='+got.tiles.length);
if(got.tiles.some(t=>t.includes('matches settled')&&t.includes(String(settledIds.length)))) pass('settled-matches tile = '+settledIds.length);
else fail('settled tile wrong: '+got.tiles.join(' | '));
const expGpm=(expGoals/expGN).toFixed(2);
if(got.tiles.some(t=>t.includes(expGpm))) pass('goals/match tile = '+expGpm); else fail('goals/match tile expected '+expGpm);
if(got.histBars>=8) pass('histogram bars ('+got.histBars+')'); else fail('histogram bars='+got.histBars);
if(got.youBin) pass('"you" emphasis bin in the points curve'); else fail('no "you" bin');
const crowdMeter = got.meters.find(m=>m.includes('Follow-the-crowd'));
if(crowdMeter && crowdMeter.includes(expCrowdPct+'%') && crowdMeter.includes(expCrowdTot+' calls'))
  pass('crowd meter = '+expCrowdPct+'% over '+expCrowdTot+' calls'); else fail('crowd meter wrong: '+crowdMeter);
if(got.heatCells===25) pass('scoreline heatmap 5×5'); else fail('heat cells='+got.heatCells);
if(got.heatLabeled>=3) pass('heatmap labels only the big cells ('+got.heatLabeled+')'); else fail('heat labels='+got.heatLabeled);
/* the four seeded scorelines (2-0 · 1-0 · 3-1 · 1-1) land in exactly the right home×away cells */
const wantCells = ['2,0','1,0','3,1','1,1'].sort().join(' ');
const gotCells = got.heatWhere.map(x=>x.h+','+x.a).sort().join(' ');
if(gotCells===wantCells) pass('heatmap cells at the right home×away coordinates'); else fail('heat cells at '+gotCells+' (want '+wantCells+')');
if(got.keyRow && /office calls/.test(got.keyRow) && /reality/.test(got.keyRow)) pass('duo legend present'); else fail('duo legend missing');
const drawRow = got.duoRows.find(d=>d.startsWith('Any draw'));
const expDrawPct = Math.round(expDraws/expGDone*100);
if(drawRow && drawRow.includes(expDrawPct+'% happened')) pass('draw share (reality) = '+expDrawPct+'%'); else fail('draw row wrong: '+drawRow);
if(got.champRows.length>=3 && /France/.test(got.champRows.map(r=>r).join(' '))) pass('champion market rows'); else fail('champ rows: '+got.champRows.join(' | '));
const deadLine = got.lines.find(l=>l.includes('champion tickets are already dead'));
if(deadLine && deadLine.includes(expDeadPct+'%')) pass('dead-ticket share = '+expDeadPct+'%'); else fail('dead line wrong: '+deadLine+' (expected '+expDeadPct+'%)');
if(got.yous.some(y=>y.startsWith('You:')&&y.includes('118'))) pass('personal points line (aw-you)'); else fail('personal line missing: '+got.yous.join(' | '));
if(!got.pend.length) pass('no panel stuck on pending'); else fail('still pending: '+got.pend.join(' | '));

/* other modes untouched: People still renders a podium */
await pg.locator('#lbmode button[data-m="people"]').click();
await pg.waitForSelector('.podium', {timeout:8000}).then(()=>pass('People mode still renders')).catch(()=>fail('People mode broke'));

/* screenshot for the eyeball pass */
await pg.locator('#lbmode button[data-m="nerds"]').click();
await pg.waitForSelector('.nrd-meter', {timeout:8000}).catch(()=>{});
await pg.waitForTimeout(700);
await pg.screenshot({ path: `${SCRATCH}/nerds-390.png`, fullPage: true });
console.log('screenshot:', `${SCRATCH}/nerds-390.png`);

if(errs.length){ fail('page errors: '+errs.join(' || ')); } else pass('zero page errors');

await browser.close();
const bad = results.filter(r=>r[0]==='FAIL').length;
console.log(bad? `\n${bad} FAILURES` : '\nALL GREEN');
process.exit(bad?1:0);
