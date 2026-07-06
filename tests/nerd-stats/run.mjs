// Stats-for-nerds (2026-07-06) — headless proof over the REAL page.
// Boots index.html against a mocked Supabase REST layer seeded with a rich QF-week
// world (~48 players across 5 departments, deterministic-but-varied picks so the office
// splits, confidence bands and department spreads are non-degenerate), clicks the 🤓
// Nerds leaderboard mode, and asserts every card renders with the NUMBERS INDEPENDENTLY
// RECOMPUTED HERE from the same seed. Covers all twelve cards (original six + batch two:
// desk spread, payoff matrix, overconfidence curve, goals by round, still alive, swing).
// No live traffic, no writes. Run: node tests/nerd-stats/run.mjs  (env: CHROMIUM_BIN, PLAYWRIGHT_DIR, OUT_DIR)
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

/* ---------- PASS A: scrape fixture/bracket structure + scoring constants ---------- */
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
  bracket: BRACKET, fl: FL, wnVer: (typeof WHATSNEW_VER!=='undefined')?WHATSNEW_VER:'',
  KO_PTS: (typeof KO_PTS!=='undefined')?KO_PTS:null, KO_BONUS: (typeof KO_BONUS!=='undefined')?KO_BONUS:null,
  PU_RANK: (typeof PU_RANK!=='undefined')?PU_RANK:{}, QZ: (typeof QZ!=='undefined')?QZ:'Asia/Qatar'
}));
await ctxA.close();
console.log('scraped fixtures:', world.fixtures.length, '· KO_PTS', JSON.stringify(world.KO_PTS));
const KP = world.KO_PTS, KB = world.KO_BONUS;
const koPtsOf  = f => f.tag==='final'?KP.final:(f.tag==='third'?KP.third:(KP[f.round]||3));
const koBonusOf= f => f.tag==='final'?KB.final:(f.tag==='third'?KB.third:(KB[f.round]||0));

/* ---------- seeded world: all groups + R32 + R16 + first QF settled; rest upcoming ---------- */
const fxById = {}; world.fixtures.forEach(f=>fxById[f.id]=f);
const qfs = world.fixtures.filter(f=>f.kn && f.round==='QF').sort((x,y)=>new Date(x.ko)-new Date(y.ko));
const qf0 = qfs[0];
const NOW = new Date(new Date(qfs[1].ko).getTime() + 40*60*1000).toISOString();   // qfs[1] kicked off 40m ago → locked, unsettled

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
const outcomeOf = r => r.h>r.a?'H':(r.h<r.a?'A':'D');
const settledIds = Object.keys(results_).filter(id=>{ const f=fxById[id]; return f && (f.kn?results_[id].w!=null:results_[id].h!=null); });
const settledFx = world.fixtures.filter(f=>settledIds.includes(f.id));

/* ---------- ~48 players, 5 departments, deterministic-but-varied picks ---------- */
const DEPTS = ['Group Treasury','Compliance','Retail Banking','IT Operations','Group Risk'];
const CHAMPS = ['France','France','Argentina','Spain','Brazil','France','Portugal',pool[3]/*a mid team, likely dead*/];
const hash = (i,j)=>((i*131 + j*57 + 17) % 100);
const koWinnerFor = (id, correct)=> correct ? kteams[id].h : kteams[id].a;
function mkPlayer(i, slug, name, dept, champ, sharpOverride){
  const sharp = sharpOverride!=null ? sharpOverride : (35 + ((i*37)%61));   // 35..95 correct-rate
  const predictions = {};
  // group picks: every settled group match
  groupFx.forEach((f,j)=>{ const r=results_[f.id], ro=outcomeOf(r), h=hash(i,j), correct=h<sharp;
    let o = ro;
    if(!correct){ const alt=['H','D','A'].filter(x=>x!==ro); o = alt[h%2]; }
    const pk = {o};
    if(correct && (h%3===0)){ pk.h=r.h; pk.a=r.a; }          // some exact-score calls
    predictions[f.id]=pk; });
  // KO picks: every settled KO match (R32, R16, qf0)
  [...r32ids, ...r16ids, qf0.id].forEach((id,j)=>{ const r=results_[id], h=hash(i, 40+j), correct=h<sharp;
    const w = koWinnerFor(id, correct); const pk={w};
    if(correct && (h%4===0)){ pk.h=r.h; pk.a=r.a; }
    predictions[id]=pk; });
  // a couple of upcoming picks (feed swing/consensus for locked qfs[1])
  predictions[qfs[1].id] = { w: (hash(i,99)<sharp) ? kteams[qfs[1].id].h : kteams[qfs[1].id].a };
  return { slug, name, dept, champ, predictions };
}
const blobs = [];
blobs.push(mkPlayer(0,'khalid-almannai','Khalid Al-Mannai','Group Treasury','France', 90)); // me: sharp
blobs.push(mkPlayer(1,'aisha-alsulaiti','Aisha Al-Sulaiti','Compliance','France', 78));
blobs.push(mkPlayer(2,'yousef-darwish','Yousef Darwish','Retail Banking','Argentina', 55));
const NAMES = ['Maryam Al-Thani','Omar Haddad','Sara Kamal','Hassan Noor','Leila Farid','Adel Rashid','Nadia Salem','Tariq Aziz','Huda Jaber','Faisal Nasser','Reem Saleh','Yara Kassab','Bilal Aziz','Dana Fadel','Karim Wahba','Mona Sabri','Sami Rizk','Lina Haddad','Ziad Aoun','Rana Khoury','Nabil Fares','Hind Zayd','Tamer Saad','Ola Mansour','Wael Barakat','Dina Habib','Ramez Toma','Suha Nader','Fadi Ghanem','Nour Aziz','Amir Sayed','Rima Daher','Jad Btaddini','Salma Eid','Karam Hijazi','Layan Odeh','Mazen Ali','Aya Sultan','Hadi Karam','Yasmin Adel','Tala Rahal','Nasser Beydoun','Joud Sami','Maya Chidiac','Rami Zein'];
NAMES.forEach((nm,k)=>{ const i=k+3; blobs.push(mkPlayer(i,'p'+i, nm, DEPTS[i%DEPTS.length], CHAMPS[i%CHAMPS.length])); });
console.log('players:', blobs.length, '· depts', DEPTS.map(d=>d+':'+blobs.filter(b=>b.dept===d).length).join(' '));

/* standings computed from the blobs (mirrors scoreFor sans streak/champ, which is fine —
   the page uses THIS array verbatim; champion is undecided so nobody banks the +25). */
function scoreOf(p){
  let pts=0,exact=0,correct=0,predicted=0;
  for(const id in p.predictions){ const pk=p.predictions[id]; if(pk&&(pk.o||pk.w))predicted++; }
  settledFx.forEach(f=>{
    const r=results_[f.id], pk=p.predictions[f.id]; if(!pk)return;
    if(f.kn){
      if(!pk.w)return;
      if(pk.w===r.w){pts+=koPtsOf(f);correct++;}
      if(pk.h!=null&&+pk.h===r.h&&+pk.a===r.a){pts+=koBonusOf(f);exact++;}
    } else {
      if(!pk.o)return;
      const ro=outcomeOf(r);
      if(pk.o===ro){pts+=3;correct++;}
      if(pk.h!=null&&+pk.h===r.h&&+pk.a===r.a){pts+=2;exact++;}
    }
  });
  return {pts,exact,correct,predicted};
}
const standings = blobs.map(p=>{ const s=scoreOf(p); return {slug:p.slug,name:p.name,dept:p.dept,pts:s.pts,exact:s.exact,correct:s.correct,predicted:s.predicted}; });

const KV = { 'wc:results': results_, 'wc:kteams': kteams, 'wc:powerups_live': false };
blobs.forEach(b=>{ KV['wc:player:'+b.slug]=b; });

/* ---------- EXPECTED values, recomputed here independently of the page ---------- */
// office counts per settled fixture (from blobs), floored 5 group / 8 KO
function officeCounts(f){ if(f.kn){ const t=kteams[f.id]; let hN=0,aN=0;
    blobs.forEach(b=>{ const v=b.predictions[f.id]; if(!v||!v.w)return; if(v.w===t.h)hN++; else if(v.w===t.a)aN++; });
    return {kn:true, hN, aN, tot:hN+aN, home:t.h, away:t.a}; }
  let H=0,D=0,A=0; blobs.forEach(b=>{ const v=b.predictions[f.id]; if(!v||!v.o)return; if(v.o==='H')H++;else if(v.o==='D')D++;else A++; });
  return {kn:false,H,D,A,tot:H+D+A}; }
// goals / draws
let expGoals=0,expGN=0,expDraws=0,expGDone=0;
settledFx.forEach(f=>{ const r=results_[f.id]; if(r.h!=null&&r.a!=null){expGoals+=r.h+r.a;expGN++;} if(!f.kn){expGDone++;if(r.h===r.a)expDraws++;} });
const expDrawPct = Math.round(expDraws/expGDone*100);
// crowd (majority) accuracy — the hive-mind meter
let expCrowdHit=0,expCrowdTot=0;
settledFx.forEach(f=>{ const c=officeCounts(f), r=results_[f.id];
  if(f.kn){ if(c.tot<8)return; if(r.w!==c.home&&r.w!==c.away)return; expCrowdTot++; if((c.hN>=c.aN?c.home:c.away)===r.w)expCrowdHit++; }
  else{ if(c.tot<5)return; expCrowdTot++; const ro=outcomeOf(r), mo=(c.H>=c.D&&c.H>=c.A)?'H':((c.D>=c.A)?'D':'A'); if(mo===ro)expCrowdHit++; } });
const expCrowdPct = Math.round(expCrowdHit/expCrowdTot*100);
// PAYOFF MATRIX cells
let SR=0,HT=0,SF=0,BW=0;
settledFx.forEach(f=>{ const c=officeCounts(f), r=results_[f.id];
  if(f.kn){ if(c.tot<8)return; if(r.w!==c.home&&r.w!==c.away)return; const fav=c.hN>=c.aN?c.home:c.away;
    [[c.home,c.hN],[c.away,c.aN]].forEach(([t,n])=>{ if(!n)return; const cons=t===fav,right=t===r.w;
      if(cons&&right)SR+=n;else if(cons)HT+=n;else if(right)SF+=n;else BW+=n; }); }
  else{ if(c.tot<5)return; const ro=outcomeOf(r), fav=(c.H>=c.D&&c.H>=c.A)?'H':((c.D>=c.A)?'D':'A');
    [['H',c.H],['D',c.D],['A',c.A]].forEach(([o,n])=>{ if(!n)return; const cons=o===fav,right=o===ro;
      if(cons&&right)SR+=n;else if(cons)HT+=n;else if(right)SF+=n;else BW+=n; }); } });
const allCons=SR+HT, allContra=SF+BW, payTotal=allCons+allContra;
const expRideS=Math.round(SR/allCons*100), expFadeS=allContra?Math.round(SF/allContra*100):null, expVolPct=Math.round(allContra/payTotal*100);
// GOALS BY ROUND peak
const rb={}; world.fixtures.forEach(f=>{ const r=results_[f.id]; if(!r)return; const set=f.kn?(r.w!=null):(r.h!=null); if(!set||r.h==null)return;
  (rb[f.round]=rb[f.round]||{g:0,m:0}); rb[f.round].g+=r.h+r.a; rb[f.round].m++; });
const ROUND_ORDER=['MD1','MD2','MD3','R32','R16','QF','SF','FINAL'];
const roundLong={MD1:'Matchday 1',MD2:'Matchday 2',MD3:'Matchday 3',R32:'Round of 32',R16:'Round of 16',QF:'Quarter-finals',SF:'Semi-finals',FINAL:'Final'};
let expPeak=null; ROUND_ORDER.forEach(k=>{ if(!rb[k])return; const g=rb[k].g/rb[k].m; if(expPeak==null||g>rb[expPeak].g/rb[expPeak].m)expPeak=k; });
// STILL ALIVE: remMax + aliveN (from the standings array we built)
const unsettled = world.fixtures.filter(f=>{ const r=results_[f.id]; return !(r&&(f.kn?r.w!=null:r.h!=null)); });
let expRemMax=0; unsettled.forEach(f=>{ if(!f.kn){expRemMax+=5;return;} expRemMax += koPtsOf(f)+koBonusOf(f); });   // powerups off
if(!results_._champ) expRemMax += 25;
const playingRows = standings.filter(r=>(r.predicted|0)>0);
const L = playingRows.reduce((m,r)=>Math.max(m,r.pts),0);
const expAliveN = playingRows.filter(r=>(L-r.pts)<=expRemMax).length;
// DESK SPREAD: departments with >=5 playing members
const deptCount={}; playingRows.forEach(r=>{ deptCount[r.dept]=(deptCount[r.dept]||0)+1; });
const expDesks = Object.keys(deptCount).filter(d=>deptCount[d]>=5).length;
// champion dead-ticket share (koKnown true since all 32 R32 slots resolved)
const koField=new Set(); r32ids.forEach(id=>{ koField.add(kteams[id].h); koField.add(kteams[id].a); });
const beaten=new Set(); settledFx.forEach(f=>{ if(!f.kn)return; const r=results_[f.id],t=kteams[f.id]; const l=r.w===t.h?t.a:(r.w===t.a?t.h:null); if(l)beaten.add(l); });
const champMap={}; blobs.forEach(b=>{ if(b.champ)champMap[b.champ]=(champMap[b.champ]||0)+1; });
const champN=blobs.filter(b=>b.champ).length;
let expDeadN=0; Object.keys(champMap).forEach(t=>{ if(beaten.has(t)||!koField.has(t))expDeadN+=champMap[t]; });
const expDeadPct=Math.round(expDeadN/champN*100);
/* ---- batch-3 expectations ---- */
const RANK = world.PU_RANK;
// FAVOURITE TAX: delivery over ranked settled matches; office backing over floored ones
let favW=0,favT=0,backN=0,backTot=0;
settledFx.forEach(f=>{ const r=results_[f.id];
  const hN_=f.kn?kteams[f.id].h:f.h, aN_=f.kn?kteams[f.id].a:f.a;
  const rh=RANK[hN_], ra=RANK[aN_]; if(!rh||!ra||rh===ra)return;
  const favHome=rh<ra;
  favT++;
  const favWon = f.kn ? (r.w===(favHome?hN_:aN_)) : (favHome?(r.h>r.a):(r.a>r.h));
  if(favWon)favW++;
  const c=officeCounts(f);
  if(f.kn){ if(c.tot<8)return; backN+=favHome?c.hN:c.aN; backTot+=c.tot; }
  else{ if(c.tot<5)return; backN+=favHome?c.H:c.A; backTot+=c.tot; } });
const expBack=Math.round(backN/backTot*100), expDeliv=Math.round(favW/favT*100);
// HERD-O-METER: average top-pick share over floored settled matches
let hsum=0,hn=0;
settledFx.forEach(f=>{ const c=officeCounts(f);
  if(f.kn){ if(c.tot<8)return; hsum+=Math.max(c.hN,c.aN)/c.tot; hn++; }
  else{ if(c.tot<5)return; hsum+=Math.max(c.H,c.D,c.A)/c.tot; hn++; } });
const expHerd=Math.round(hsum/hn*100);
// MARKETS LAB: Over 2.5 called vs happened (group)
let mTot=0,mOv=0,aTot2=0,aOv=0;
settledFx.forEach(f=>{ if(f.kn)return; const r=results_[f.id];
  aTot2++; if(r.h+r.a>=3)aOv++;
  const c=officeCounts(f); if(c.tot<5)return;
  blobs.forEach(b=>{ const v=b.predictions[f.id]; if(!v||v.h==null||v.a==null)return; mTot++; if((+v.h)+(+v.a)>=3)mOv++; }); });
const expOvCalled=Math.round(mOv/mTot*100), expOvHappened=Math.round(aOv/aTot2*100);
// STREAK SPECTRUM: per-player best run over settled engaged picks in kickoff order (mirrors consensusCompute)
const doneSorted = settledFx.slice().sort((a,b)=>new Date(a.ko)-new Date(b.ko));
const runsAll=[];
blobs.forEach(b=>{ let runBest=0,runCur=0;
  doneSorted.forEach(f=>{ const v=b.predictions[f.id]; if(!v)return; if(f.kn?!v.w:!v.o)return;
    const r=results_[f.id];
    const hit=f.kn?(v.w===r.w):(v.o===outcomeOf(r));
    if(hit){runCur++;if(runCur>runBest)runBest=runCur;}else runCur=0; });
  if(runBest>0)runsAll.push(runBest); });
const runsAsc=runsAll.slice().sort((a,b)=>a-b);
const expRunN=runsAll.length, expRunMed=runsAsc[runsAll.length>>1];
// STAGE WINS: dayTop replicated (players in slug order = sbulkJSON key order; strict > keeps the first)
const dayKeyOf=(()=>{ const f=new Intl.DateTimeFormat('en-CA',{timeZone:world.QZ,year:'numeric',month:'2-digit',day:'2-digit'}); return iso=>f.format(new Date(iso)); })();
const blobsBySlug = blobs.slice().sort((a,b)=>('wc:player:'+a.slug).localeCompare('wc:player:'+b.slug));
const dayTop={};
blobsBySlug.forEach(b=>{ const ptsBy={};
  doneSorted.forEach(f=>{ const v=b.predictions[f.id]; if(!v)return; if(f.kn?!v.w:!v.o)return;
    const r=results_[f.id];
    const hit=f.kn?(v.w===r.w):(v.o===outcomeOf(r));
    let vp=0;
    if(f.kn){ if(hit)vp=koPtsOf(f); }
    else{ if(hit)vp=3; if(v.h!=null&&v.a!=null&&(+v.h)===r.h&&(+v.a)===r.a)vp+=2; }
    if(vp)ptsBy[dayKeyOf(f.ko)]=(ptsBy[dayKeyOf(f.ko)]||0)+vp; });
  for(const k in ptsBy){ const cur=dayTop[k]; if(!cur||ptsBy[k]>cur.pts)dayTop[k]={slug:b.slug,pts:ptsBy[k]}; } });
const stageDays=Object.keys(dayTop).length;
const stageHolders=new Set(Object.values(dayTop).map(x=>x.slug)).size;
console.log('EXPECTED b3:', JSON.stringify({expBack,expDeliv,favT,expHerd,hn,expOvCalled,expOvHappened,expRunN,expRunMed,stageDays,stageHolders}));

const meRow = standings.find(r=>r.slug==='khalid-almannai');
console.log('EXPECTED:', JSON.stringify({settled:settledIds.length, crowd:expCrowdPct+'% /'+expCrowdTot, payTotal, expRideS, expFadeS, expVolPct, peak:expPeak, remMax:expRemMax, aliveN:expAliveN+'/'+playingRows.length, desks:expDesks, deadPct:expDeadPct, mePts:meRow.pts, drawPct:expDrawPct, gpm:(expGoals/expGN).toFixed(2)}));
if(payTotal<150){ fail('SEED too thin: payoff total '+payTotal+' <150'); }

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
  localStorage.setItem('wc:whatsnew', wnVer);
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
    if (key.startsWith('eq.')) { const k=decodeURIComponent(key.slice(3)); return send(k in KV ? [{key:k, value:JSON.stringify(KV[k])}] : []); }
    if (key.startsWith('like.')) { const pre=decodeURIComponent(key.slice(5)).replace(/\*$/,''); return send(Object.keys(KV).filter(k=>k.startsWith(pre)).sort().map(k=>({key:k, value:JSON.stringify(KV[k])}))); }
    return send([]);
  }
  return r.fulfill({status:404, body:'{}'});
});

await pg.goto(PAGE_URL);
await pg.waitForFunction(()=>typeof state!=='undefined' && state.player && state.meSlug==='khalid-almannai', null, {timeout:15000})
  .catch(()=>fail('boot: signed-in state not reached'));
await pg.waitForTimeout(600);
await pg.evaluate(()=>go('leaderboard'));
await pg.waitForTimeout(400);

const badge = await pg.evaluate(()=>{ const b=document.getElementById('nrd-new'); return b && b.style.display!=='none'; });
if(badge) pass('NEW badge on the Nerds pill before first visit'); else fail('nrd-new badge not shown');
const btn = pg.locator('#lbmode button[data-m="nerds"]');
if(await btn.count()===1) pass('🤓 Nerds pill present'); else fail('nerds pill missing');
await btn.click();
await pg.waitForSelector('.nrd-tiles', {timeout:8000}).then(()=>pass('panel renders on click')).catch(()=>fail('panel did not render'));
await pg.waitForSelector('.nrd-quad', {timeout:12000}).then(()=>pass('analytics tier arrived (payoff matrix grid)')).catch(()=>fail('payoff grid never rendered — analytics tier stuck'));
await pg.waitForTimeout(500);

const got = await pg.evaluate(()=>{
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const text=el=>el?el.textContent.replace(/\s+/g,' ').trim():null;
  const cardByTitle=(t)=>{ const hd=$$('.aw-card .aw-t b').find(b=>b.textContent.trim()===t); return hd?hd.closest('.aw-card'):null; };
  const cardTxt=(t)=>{ const c=cardByTitle(t); return c?text(c):null; };
  const cardPend=(t)=>{ const c=cardByTitle(t); return !!(c&&c.querySelector('.aw-pend')); };
  return {
    badgeAfter: (()=>{ const b=document.getElementById('nrd-new'); return b && b.style.display!=='none'; })(),
    onPill: text($('#lbmode button.on')),
    tiles: $$('.nrd-tiles')[0] ? $$('.nrd-tiles')[0].children.length : 0,
    titles: $$('.aw-card .aw-t b').map(b=>b.textContent.trim()),
    anyPend: $$('.aw-pend').length,
    // batch-two cards
    desk: { txt: cardTxt('Desk spread'), rows: cardByTitle('Desk spread')?cardByTitle('Desk spread').querySelectorAll('.nrd-boxrow').length:0,
            meRow: !!(cardByTitle('Desk spread')&&cardByTitle('Desk spread').querySelector('.nrd-boxrow.me')) },
    payoff: { txt: cardTxt('The payoff matrix'), pend: cardPend('The payoff matrix'),
              quad: cardByTitle('The payoff matrix')?cardByTitle('The payoff matrix').querySelectorAll('.nrd-qc').length:0,
              meters: cardByTitle('The payoff matrix')?Array.from(cardByTitle('The payoff matrix').querySelectorAll('.nrd-meter .lab')).map(x=>x.textContent.replace(/\s+/g,' ').trim()):[] },
    calib: { txt: cardTxt('The overconfidence curve'), pend: cardPend('The overconfidence curve'),
             bands: cardByTitle('The overconfidence curve')?cardByTitle('The overconfidence curve').querySelectorAll('.nrd-duo').length:0,
             hasSkill: !!(cardByTitle('The overconfidence curve')&&/skill vs a coin toss/.test(cardByTitle('The overconfidence curve').textContent)) },
    goals: { txt: cardTxt('Goals by round'), bars: cardByTitle('Goals by round')?cardByTitle('Goals by round').querySelectorAll('.nrd-rounds .rc').length:0 },
    alive: { txt: cardTxt('Still alive'), pend: cardPend('Still alive'),
             tiles: cardByTitle('Still alive')?Array.from(cardByTitle('Still alive').querySelectorAll('.nrd-tile b')).map(x=>x.textContent.replace(/\s+/g,' ').trim()):[] },
    swing: { txt: cardTxt('Swing matches'), pend: cardPend('Swing matches'),
             rows: cardByTitle('Swing matches')?cardByTitle('Swing matches').querySelectorAll('.nrd-swing').length:0 },
    herd: { txt: cardTxt('The herd-o-meter'), pend: cardPend('The herd-o-meter'),
            meter: cardByTitle('The herd-o-meter')?text(cardByTitle('The herd-o-meter').querySelector('.nrd-meter .lab')):null },
    markets: { txt: cardTxt('The markets lab'), pend: cardPend('The markets lab'),
               rows: cardByTitle('The markets lab')?Array.from(cardByTitle('The markets lab').querySelectorAll('.nrd-duo .lab')).map(x=>text(x)):[] },
    favtax: { txt: cardTxt('The favourite tax'), pend: cardPend('The favourite tax'),
              meters: cardByTitle('The favourite tax')?Array.from(cardByTitle('The favourite tax').querySelectorAll('.nrd-meter .lab')).map(x=>text(x)):[] },
    streak: { txt: cardTxt('The streak spectrum'), pend: cardPend('The streak spectrum'),
              n: cardByTitle('The streak spectrum')?text(cardByTitle('The streak spectrum').querySelector('.aw-prz')):null,
              bars: (cardByTitle('The streak spectrum')&&cardByTitle('The streak spectrum').querySelector('.nrd-plot'))?cardByTitle('The streak spectrum').querySelector('.nrd-plot').children.length:0 },
    stage: { txt: cardTxt('Stage wins'), pend: cardPend('Stage wins'),
             rows: cardByTitle('Stage wins')?cardByTitle('Stage wins').querySelectorAll('.nrd-crown').length:0 },
    yous: $$('.aw-you').map(y=>text(y)),
  };
});
console.log(JSON.stringify(got,null,1).slice(0,3600));

// ---- assertions ----
if(got.onPill && got.onPill.includes('Nerds')) pass('mode pill switched'); else fail('mode pill not on');
if(got.badgeAfter===false) pass('NEW badge cleared after visit'); else fail('NEW badge still on after click');
if(got.tiles===6) pass('6 KPI tiles'); else fail('tiles='+got.tiles);
['The points curve','Desk spread','The hive mind','The payoff matrix','The overconfidence curve','The herd-o-meter','The scoreline lab','The markets lab','Goals by round','The favourite tax','The form curve','The streak spectrum','Stage wins','The champion market','Still alive','Swing matches','Nerd corner'].forEach(t=>{
  if(got.titles.includes(t)) pass('card present: '+t); else fail('card MISSING: '+t);
});
// batch 3 numeric checks
if(!got.herd.pend && got.herd.meter && got.herd.meter.includes(expHerd+'%') && got.herd.meter.includes(hn+' matches'))
  pass('herd-o-meter avg = '+expHerd+'% over '+hn); else fail('herd meter "'+got.herd.meter+'" expected '+expHerd+'% / '+hn);
const ovRow = got.markets.rows.find(x=>/Over 2.5/.test(x));
if(!got.markets.pend && ovRow && ovRow.includes(expOvCalled+'% called') && ovRow.includes(expOvHappened+'% happened'))
  pass('markets Over 2.5 = '+expOvCalled+'% called / '+expOvHappened+'% happened'); else fail('markets row "'+ovRow+'" expected '+expOvCalled+'/'+expOvHappened);
const backM = got.favtax.meters.find(x=>/backing the favourite/.test(x));
const delM = got.favtax.meters.find(x=>/actually winning/.test(x));
if(!got.favtax.pend && backM && backM.includes(expBack+'%')) pass('favourite-tax backing = '+expBack+'%'); else fail('favtax back "'+backM+'" expected '+expBack+'%');
if(delM && delM.includes(expDeliv+'%') && delM.includes(favT+' matches')) pass('favourite-tax delivery = '+expDeliv+'% over '+favT); else fail('favtax deliver "'+delM+'" expected '+expDeliv+'% / '+favT);
if(!got.streak.pend && got.streak.n==='n = '+expRunN && got.streak.bars===8)
  pass('streak spectrum: n = '+expRunN+', 8 bins'); else fail('streak n="'+got.streak.n+'" bars='+got.streak.bars+' expected n='+expRunN);
if(got.streak.txt && got.streak.txt.includes('Median best run: ×'+expRunMed)) pass('streak median = ×'+expRunMed); else fail('streak median missing ×'+expRunMed+' in: '+(got.streak.txt||'').slice(0,200));
if(!got.stage.pend && got.stage.rows===Math.min(8,stageDays)) pass('stage wins: '+got.stage.rows+' crown rows'); else fail('stage rows='+got.stage.rows+' expected '+Math.min(8,stageDays));
if(got.stage.txt && got.stage.txt.includes(stageHolders+' different crown-holders in '+stageDays+' matchdays'))
  pass('stage wins: '+stageHolders+' holders / '+stageDays+' days'); else fail('stage holders line missing '+stageHolders+'/'+stageDays+': '+(got.stage.txt||'').slice(-260));
// desk spread
if(got.desk.rows===expDesks) pass('desk spread: '+expDesks+' department box-plots'); else fail('desk rows='+got.desk.rows+' expected '+expDesks);
if(got.desk.meRow) pass('desk spread highlights your desk'); else fail('desk spread: your desk not highlighted');
// payoff matrix
if(!got.payoff.pend && got.payoff.quad===4) pass('payoff matrix: 2×2 quadrant rendered'); else fail('payoff quad='+got.payoff.quad+' pend='+got.payoff.pend);
const rideMeter = got.payoff.meters.find(m=>/with the crowd/.test(m));
const fadeMeter = got.payoff.meters.find(m=>/Fading the crowd/.test(m));
if(rideMeter && rideMeter.includes(expRideS+'%')) pass('payoff ride-success = '+expRideS+'%'); else fail('ride meter "'+rideMeter+'" expected '+expRideS+'%');
if(fadeMeter && (expFadeS==null || fadeMeter.includes(expFadeS+'%'))) pass('payoff fade-success = '+expFadeS+'%'); else fail('fade meter "'+fadeMeter+'" expected '+expFadeS+'%');
// overconfidence
if(!got.calib.pend && got.calib.bands>=1 && got.calib.hasSkill) pass('overconfidence curve: '+got.calib.bands+' confidence bands + skill score'); else fail('calib bands='+got.calib.bands+' skill='+got.calib.hasSkill+' pend='+got.calib.pend);
// goals by round
if(got.goals.bars>=1) pass('goals-by-round: '+got.goals.bars+' round bars'); else fail('goals bars='+got.goals.bars);
if(got.goals.txt && got.goals.txt.includes(roundLong[expPeak])) pass('goals-by-round wildest = '+roundLong[expPeak]); else fail('wildest round mismatch, expected '+roundLong[expPeak]+' in: '+got.goals.txt);
// still alive
if(!got.alive.pend && got.alive.tiles.length===3) pass('still-alive: 3 tiles rendered'); else fail('alive tiles='+JSON.stringify(got.alive.tiles)+' pend='+got.alive.pend);
if(got.alive.tiles[0]===String(expRemMax)) pass('still-alive points-on-the-table = '+expRemMax); else fail('remMax tile='+got.alive.tiles[0]+' expected '+expRemMax);
if(got.alive.tiles[1]===String(expAliveN)) pass('still-alive can-still-win = '+expAliveN); else fail('aliveN tile='+got.alive.tiles[1]+' expected '+expAliveN);
// swing
if(!got.swing.pend && got.swing.rows>=1) pass('swing matches: '+got.swing.rows+' locked-unsettled tie(s)'); else fail('swing rows='+got.swing.rows+' pend='+got.swing.pend);
// personal line ties to my computed points
if(got.yous.some(y=>y.startsWith('You:')&&y.includes(String(meRow.pts)))) pass('points-curve personal line = '+meRow.pts+' pts'); else fail('personal points line missing '+meRow.pts+': '+got.yous.join(' | '));
// nothing stuck pending anywhere
if(got.anyPend===0) pass('no card stuck on pending'); else fail(got.anyPend+' card(s) pending');

/* other modes untouched */
await pg.locator('#lbmode button[data-m="people"]').click();
await pg.waitForSelector('.podium', {timeout:8000}).then(()=>pass('People mode still renders')).catch(()=>fail('People mode broke'));
await pg.locator('#lbmode button[data-m="awards"]').click();
await pg.waitForSelector('.aw-card', {timeout:8000}).then(()=>pass('Awards mode still renders')).catch(()=>fail('Awards mode broke'));

/* screenshot for the eyeball pass */
await pg.locator('#lbmode button[data-m="nerds"]').click();
await pg.waitForSelector('.nrd-quad', {timeout:8000}).catch(()=>{});
await pg.waitForTimeout(700);
await pg.screenshot({ path: `${SCRATCH}/nerds-390.png`, fullPage: true });
console.log('screenshot:', `${SCRATCH}/nerds-390.png`);

if(errs.length){ fail('page errors: '+errs.join(' || ')); } else pass('zero page errors');

await browser.close();
const bad = results.filter(r=>r[0]==='FAIL').length;
console.log(bad? `\n${bad} FAILURES` : '\nALL GREEN');
process.exit(bad?1:0);
