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
// flagcdn is blocked headlessly, so instead of aborting (which leaves empty flag slots and
// invites a false "missing flags" alarm), fulfil every flag request with a valid solid 1x1
// PNG. The slots then render as filled colour blocks — flag imagery is verifiable at a glance.
const FLAG_STUB_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPYMj0SAAOnAaUfn5/rAAAAAElFTkSuQmCC';
const flagStub = (r)=>r.fulfill({status:200, contentType:'image/png', body:Buffer.from(FLAG_STUB_B64,'base64')});

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
  PU_RANK: (typeof PU_RANK!=='undefined')?PU_RANK:{}, QZ: (typeof QZ!=='undefined')?QZ:'Asia/Qatar',
  PU_FROM_K: (typeof PU_FROM_K!=='undefined')?PU_FROM_K:25, PU_UPSET: (typeof PU_UPSET!=='undefined')?PU_UPSET:2,
  venues: FIXTURES.map(f=>({id:f.id, v:f.v||''}))
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

/* batch-5 seed: power-ups LIVE, armbands armed, join dates spread over 48 days */
blobs.forEach((b,idx)=>{ b.joinedAt = Date.UTC(2026,4,20) + idx*86400000; });    // May 20 + idx days, in blobs order
blobs[0].chips = { qf: qf0.id };          // settled armband — cashed/burned per the hash-derived pick; the expectation block recomputes it
blobs[1].chips = { qf: qfs[1].id };       // unsettled → pending
blobs[2].chips = { qf: qf0.id };          // second settled armband (outcome recomputed, not assumed)
blobs[5].chips = { fin: 'k32' };          // Final armband → pending
/* WAVE C seed: give six players a `country` matching seeded teams (two each across three
   nations) so ❤️ heart-vs-head clears its 15-own-nation-call floor with a mix of hits &
   misses (each player's sharpness varies by index). Champion picks already vary; SCORES has
   {1,0} (|h−a|=1) so ≥1 settled one-goal group game exists for the fragility card. */
[[6,'France'],[9,'France'],[12,'Brazil'],[15,'Brazil'],[18,'Argentina'],[21,'Argentina']]
  .forEach(([idx,ctry])=>{ if(blobs[idx]) blobs[idx].country = ctry; });
const KV = { 'wc:results': results_, 'wc:kteams': kteams, 'wc:powerups_live': true };
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
let expRemMax=0; unsettled.forEach(f=>{ if(!f.kn){expRemMax+=5;return;}
  let k=koPtsOf(f)+koBonusOf(f);
  if(/^k[0-9]+$/.test(f.id) && (+f.id.slice(1))>=world.PU_FROM_K) k+=world.PU_UPSET;   // powerups LIVE in this seed
  expRemMax+=k; });
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
/* ---- batch-4 expectations ---- */
// RAFFLE OR RACETRACK: per-player {hits, engaged calls} (mirrors CONS.perP), variance decomposition
const perP=[];
blobs.forEach(b=>{ let hits=0,n=0;
  doneSorted.forEach(f=>{ const v=b.predictions[f.id]; if(!v)return; if(f.kn?!v.w:!v.o)return;
    n++; const r=results_[f.id]; if(f.kn?(v.w===r.w):(v.o===outcomeOf(r)))hits++; });
  if(n>0)perP.push({c:hits,n}); });
const qual=perP.filter(p=>p.n>=10);
let C4=0,N4=0; qual.forEach(p=>{C4+=p.c;N4+=p.n;});
const pb=C4/N4;
let ov=0,lv=0; qual.forEach(p=>{ const hr=p.c/p.n; ov+=(hr-pb)*(hr-pb); lv+=pb*(1-pb)/p.n; });
ov/=qual.length; lv/=qual.length;
const expMult=(ov/lv).toFixed(1), expSkill=Math.max(0,Math.round((1-lv/Math.max(ov,1e-9))*100)), expQual=qual.length;
// PREDICTABILITY LADDER: weighted office accuracy per round (floored)
const ra4={};
settledFx.forEach(f=>{ const c=officeCounts(f), r=results_[f.id];
  if(f.kn){ if(c.tot<8)return; const ok=(r.w===c.home?c.hN:(r.w===c.away?c.aN:0)); (ra4[f.round]=ra4[f.round]||{ok:0,t:0}); ra4[f.round].ok+=ok; ra4[f.round].t+=c.tot; }
  else{ if(c.tot<5)return; const ro=outcomeOf(r), ok=ro==='H'?c.H:(ro==='D'?c.D:c.A); (ra4[f.round]=ra4[f.round]||{ok:0,t:0}); ra4[f.round].ok+=ok; ra4[f.round].t+=c.tot; } });
const ladderRounds=ROUND_ORDER.filter(k=>ra4[k]&&ra4[k].t>=20);
const expMD1=ladderRounds.includes('MD1')?Math.round(ra4.MD1.ok/ra4.MD1.t*100):null;
// PHOTO FINISH: from the standings array (page sorts by cmpSt = pts,predicted,exact,correct then name)
const sortedPF=standings.slice().sort((a,b)=>(b.pts-a.pts)||(b.predicted-a.predicted)||(b.exact-a.exact)||(b.correct-a.correct)||a.name.localeCompare(b.name));
const T10=sortedPF.slice(0,10).map(r=>r.pts|0);
const expCushion=T10[0]-T10[1], expTop5=T10[0]-T10[4];
let bi4=0; for(let i=0;i<9;i++){ if(T10[i]-T10[i+1]>T10[bi4]-T10[bi4+1])bi4=i; }
const expBrk=T10[bi4]-T10[bi4+1];
// BELT RACES: oracle leader from standings (v desc, pts desc, name)
const oracleArr=standings.filter(r=>r.exact>0).map(r=>({name:r.name,v:r.exact,pts:r.pts}))
  .sort((a,b)=>b.v-a.v||b.pts-a.pts||a.name.localeCompare(b.name));
const expOracleLead=oracleArr[0], expHotLead=Math.max(...runsAll);
console.log('EXPECTED b4:', JSON.stringify({expMult,expSkill,expQual,expMD1,expCushion,expTop5,expBrk,oracle:expOracleLead&&expOracleLead.v,hot:expHotLead}));
/* ---- batch-5 expectations ---- */
// ARMBAND LEDGER (mirrors consensusCompute's chipLed)
let expArmed=0,expCashed=0,expBurned=0,expPendCh=0,expDoubled=0;
blobs.forEach(b=>{ if(!b.chips)return; ['qf','sf','fin'].forEach(rd=>{ const id=b.chips[rd]; if(!id)return;
  expArmed++;
  const f=fxById[id], r=results_[id];
  if(!(r&&r.w!=null)){ expPendCh++; return; }
  const v=b.predictions[id]; let kp=0;
  if(v&&v.w&&v.w===r.w&&f)kp+=koPtsOf(f);
  if(v&&v.h!=null&&+v.h===r.h&&+v.a===r.a&&f)kp+=koBonusOf(f);
  if(kp>0){expCashed++;expDoubled+=kp;}else expBurned++; }); });
// GRAVEYARD SHIFT: office accuracy by Doha kickoff slot (floored)
const fHr=new Intl.DateTimeFormat('en-GB',{timeZone:world.QZ,hour:'2-digit',hour12:false});
const slotOf=iso=>{ const h=(+fHr.format(new Date(iso)))%24; return h>=7&&h<=17?'day':(h>=18?'eve':(h<=2?'late':'grave')); };
const slots={};
settledFx.forEach(f=>{ const c=officeCounts(f), r=results_[f.id];
  let ok,tot;
  if(f.kn){ if(c.tot<8)return; tot=c.tot; ok=(r.w===c.home?c.hN:(r.w===c.away?c.aN:0)); }
  else{ if(c.tot<5)return; tot=c.tot; const ro=outcomeOf(r); ok=ro==='H'?c.H:(ro==='D'?c.D:c.A); }
  const s=slotOf(f.ko); (slots[s]=slots[s]||{ok:0,t:0,m:0}); slots[s].ok+=ok; slots[s].t+=tot; slots[s].m++; });
const slotOrder=['day','eve','late','grave'].filter(k=>slots[k]&&slots[k].t>=20);
const expSlotN=slotOrder.length;
const expSlot0=slotOrder.length?Math.round(slots[slotOrder[0]].ok/slots[slotOrder[0]].t*100):null;
// SCORELINE STOCK MARKET: tickets on '2-0' (called + paid), from the blobs directly
let expT20=0,expP20=0;
settledFx.forEach(f=>{ if(f.kn)return; const c=officeCounts(f); if(c.tot<5)return; const r=results_[f.id];
  blobs.forEach(b=>{ const v=b.predictions[f.id]; if(!v||v.h==null||v.a==null)return;
    const k=(+v.h)+'-'+(+v.a); if(k!=='2-0')return; expT20++; if(r.h===2&&r.a===0)expP20++; }); });
const expEV20=(expP20/Math.max(1,expT20)*2).toFixed(2);
// HOME-SOIL BIAS: office H-share vs actual home wins (floored settled group)
let hPick=0,pTot=0,hWin=0,mTot2=0;
settledFx.forEach(f=>{ if(f.kn)return; const c=officeCounts(f); if(c.tot<5)return;
  hPick+=c.H; pTot+=c.tot; mTot2++; if(results_[f.id].h>results_[f.id].a)hWin++; });
const expHB=Math.round(hPick/pTot*100), expHW=Math.round(hWin/mTot2*100);
// DRAW BLIND SPOT
let dC=0,dH=0,oC=0,oH=0,expGhost=0;
settledFx.forEach(f=>{ if(f.kn)return; const c=officeCounts(f); if(c.tot<5)return;
  const r=results_[f.id], ro=outcomeOf(r);
  dC+=c.D; oC+=c.H+c.A;
  if(ro==='D'){ dH+=c.D; if(c.D/c.tot<0.10)expGhost++; }
  else if(ro==='H')oH+=c.H; else oH+=c.A; });
const expDrawAcc=Math.round(dH/dC*100), expWinAcc=Math.round(oH/oC*100);
// FOUNDING MEMBERS: join-order terciles over playing rows
const joined={}; blobs.forEach(b=>{ joined[b.slug]=b.joinedAt; });
const js5=playingRows.map(r=>({pts:r.pts|0,j:joined[r.slug]})).filter(x=>x.j).sort((a,b)=>a.j-b.j);
const n35=Math.floor(js5.length/3);
const terAvg=a=>(a.reduce((s,x)=>s+x.pts,0)/a.length).toFixed(1);
const expTer=[terAvg(js5.slice(0,n35)),terAvg(js5.slice(n35,2*n35)),terAvg(js5.slice(2*n35))];
console.log('EXPECTED b5:', JSON.stringify({expArmed,expCashed,expBurned,expPendCh,expDoubled,expSlotN,expSlot0,expT20,expP20,expEV20,expHB,expHW,expDrawAcc,expWinAcc,expGhost,expTer,remMaxNow:expRemMax}));

const meRow = standings.find(r=>r.slug==='khalid-almannai');
console.log('EXPECTED:', JSON.stringify({settled:settledIds.length, crowd:expCrowdPct+'% /'+expCrowdTot, payTotal, expRideS, expFadeS, expVolPct, peak:expPeak, remMax:expRemMax, aliveN:expAliveN+'/'+playingRows.length, desks:expDesks, deadPct:expDeadPct, mePts:meRow.pts, drawPct:expDrawPct, gpm:(expGoals/expGN).toFixed(2)}));
if(payTotal<150){ fail('SEED too thin: payoff total '+payTotal+' <150'); }

/* ================================================================================
   WAVE C — independent recomputation of all 14 new Lab cards.
   Faithful Node ports of scoreFor()/wcHeavy()/the CONS.wc third pass, driven off the
   SAME seed (results_, kteams, blobs, world.bracket). WCR-based cards (futures, time
   machine, journey, comeback, alt, fragility) use scoreFor semantics — including the
   ⚡ armband doubling on the settled QF — so they legitimately diverge from the RPC
   `standings` array (which omits chips). Players are walked in slug-sorted order (`PS`),
   mirroring sbulkJSON, so stable-sort tie-breaks match the page byte-for-byte.
   ================================================================================ */
const FLh = world.fl, PU_RANKh = world.PU_RANK, CHAMP_PTS = 25;
const PU_FROM_Kh = world.PU_FROM_K, PU_UPSETh = world.PU_UPSET, BR = world.bracket;
const PS = blobsBySlug;                                  // slug-sorted, == sbulkJSON order
const nrdNH = n=>{n=Math.round(n);return n>=10000?((n/1000).toFixed(1).replace(/\.0$/,'')+'k'):String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',');};
const ordinalH = n=>{n=Number(n);if(!isFinite(n))return String(n);const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);};
const NOWms = new Date(NOW).getTime();
const koScoreHitH = (p,r)=>!!(p&&r&&p.h!=null&&p.a!=null&&r.h!=null&&r.a!=null&&Number(p.h)===r.h&&Number(p.a)===r.a);
/* resolve a KO tie's teams from kteams overrides + settled-winner feeders (koTeams/koAutoTeams) */
function pairForH(id){
  if(kteams[id]) return {h:kteams[id].h||null,a:kteams[id].a||null};
  const fd=BR[id]; if(!fd) return {h:null,a:null};
  const take=fd[2], winOf=fid=>{const r=results_[fid];return (r&&r.w)?r.w:null;};
  const feed=fid=>{const w=winOf(fid);if(!w)return null;if(take==='W')return w;const q=pairForH(fid);return w===q.h?q.a:(w===q.a?q.h:null);};
  return {h:feed(fd[0])||null,a:feed(fd[1])||null};
}
const koNames = id=>{const p=pairForH(id);return {h:(p.h&&FLh[p.h])?p.h:null,a:(p.a&&FLh[p.a])?p.a:null};};
const koReadyH = id=>{const t=koNames(id);return !!(t.h&&t.a);};
function upsetWinH(f,r){
  if(!f||!r||!r.w||!/^k[0-9]+$/.test(f.id)||(+f.id.slice(1))<PU_FROM_Kh)return false;
  const t=koNames(f.id),h=t.h,a=t.a,loser=(h===r.w)?a:((a===r.w)?h:null);
  if(!loser)return false;
  const rw=PU_RANKh[r.w],rl=PU_RANKh[loser];return !!(rw&&rl&&rw>rl);
}
function koStreakBonusH(preds,results,shield){
  const ids=[];
  for(const id in results){ if(id.charAt(0)==='_'||!/^k[0-9]+$/.test(id))continue;
    const r=results[id]; if(!r||r.w==null)continue; const p=preds[id]; if(!p||(!p.w&&p.h==null))continue; ids.push(id); }
  ids.sort((a,b)=>(+a.slice(1))-(+b.slice(1)));
  let bonus=0,run=0,sh=!!shield;
  for(const id of ids){
    if(koScoreHitH(preds[id],results[id])){run++;bonus+=run===1?0:(run===2?5:(run===3?15:20));}
    else if(sh&&run>0&&(+id.slice(1))>=PU_FROM_Kh)sh=false; else run=0;
  }
  return bonus;
}
const puRnd = kn=>(kn>=25&&kn<=28)?'qf':((kn===29||kn===30)?'sf':(kn===32?'fin':null));
function scoreForH(preds,results,champ,chips){
  const pu=(chips!==undefined), ch=(pu&&chips)?chips:{};
  let pts=0,exact=0,correct=0,scored=0;
  for(const id in results){
    if(id.charAt(0)==='_')continue;
    const r=results[id],p=preds&&preds[id];
    if(r&&r.w!=null){
      if(!p||(!p.w&&p.h==null))continue; scored++;
      const f=fxById[id]; let kp=0;
      if(p.w&&p.w===r.w){kp+=f?koPtsOf(f):4;correct++;}
      if(koScoreHitH(p,r)){kp+=f?koBonusOf(f):0;exact++;}
      if(pu){ const kn=/^k[0-9]+$/.test(id)?(+id.slice(1)):0,rnd=puRnd(kn);
        if(rnd&&ch[rnd]===id)kp*=2;
        if(p.w&&p.w===r.w&&f&&upsetWinH(f,r))kp+=PU_UPSETh; }
      pts+=kp; continue;
    }
    if(!p||!p.o)continue; scored++;
    const ro=outcomeOf(r);
    if(p.o===ro){pts+=3;correct++;}
    if(p.h!=null&&p.a!=null&&Number(p.h)===r.h&&Number(p.a)===r.a){pts+=2;exact++;}
  }
  pts+=koStreakBonusH(preds,results,pu);
  if(results&&results._champ&&champ&&champ===results._champ)pts+=CHAMP_PTS;
  return {pts,exact,correct,scored};
}
const predCntH={}; blobs.forEach(b=>{let n=0;const pr=b.predictions||{};for(const id in pr){const v=pr[id];if(v&&(v.o||v.w))n++;}predCntH[b.slug]=n;});
const rankCmpH=(a,b)=>(b.pts-a.pts)||(b.predicted-a.predicted)||(b.exact-a.exact)||(b.correct-a.correct)||String(a.name).localeCompare(String(b.name));

/* ---- office consensus map (mirrors CONS.map/champMap), walked in PS order ---- */
const mapH={}; const cmH={}; let champN_H=0;
PS.forEach(b=>{
  if(b.champ){champN_H++;cmH[b.champ]=(cmH[b.champ]||0)+1;}
  const pr=b.predictions||{};
  for(const id in pr){ const v=pr[id]; if(!v)continue; const m=fxById[id]; if(!m)continue;
    const c=mapH[id]||(mapH[id]={H:0,D:0,A:0,w:{},sc:{}});
    if(m.kn){ if(v.w)c.w[v.w]=(c.w[v.w]||0)+1; }
    else{ if(v.o)c[v.o]++; if(v.h!=null&&v.a!=null)c.sc[v.h+'-'+v.a]=(c.sc[v.h+'-'+v.a]||0)+1; } }
});
const doneSortedH = settledFx.slice().sort((a,b)=>new Date(a.ko)-new Date(b.ko));
const resPctH={};
doneSortedH.forEach(f=>{const c=mapH[f.id];if(!c)return;const r=results_[f.id];
  if(f.kn){let tot=0;for(const k in c.w)tot+=c.w[k];if(tot>=8&&r.w!=null)resPctH[f.id]=Math.round((c.w[r.w]||0)/tot*100);}
  else{const tot=c.H+c.D+c.A;if(tot>=8)resPctH[f.id]=Math.round(c[outcomeOf(r)]/tot*100);}});
const eligSetH={};
world.fixtures.forEach(m=>{const f=fxById[m.id];const kr=f.kn?koReadyH(f.id):true;const lk=new Date(f.ko).getTime()<=NOWms;if((f.kn?kr:true)&&(lk||results_[f.id]))eligSetH[f.id]=true;});
const doneEH = doneSortedH.filter(f=>eligSetH[f.id]);

/* ---- ⏳ time machine / 🎢 journey / 🧗 comeback: day-by-day replay (scoreFor) ---- */
const byDayH={}; doneSortedH.forEach(f=>{const k=dayKeyOf(f.ko);(byDayH[k]=byDayH[k]||[]).push(f);});
const daysH=Object.keys(byDayH).sort();
const resAcc={}; const leadersH=[]; const rankHist={}; const fieldNsH=[]; let lastRows=null;
blobs.forEach(b=>{rankHist[b.slug]=[];});
daysH.forEach(d=>{
  byDayH[d].forEach(f=>{resAcc[f.id]=results_[f.id];});
  const rowsD=PS.map(b=>{const s=scoreForH(b.predictions,resAcc,b.champ,b.chips||null);
    return {slug:b.slug,name:b.name||b.slug,pts:s.pts,exact:s.exact,correct:s.correct,predicted:predCntH[b.slug]|0};}).sort(rankCmpH);
  rowsD.forEach((r,i)=>rankHist[r.slug].push(i+1));
  fieldNsH.push(rowsD.length); leadersH.push(rowsD.length?rowsD[0].name:''); lastRows=rowsD;
});
const reignsH=[]; let leadChangesH=0;
leadersH.forEach((nm,i)=>{ if(i>0&&nm!==leadersH[i-1])leadChangesH++;
  if(!reignsH.length||reignsH[reignsH.length-1].name!==nm)reignsH.push({name:nm,days:1}); else reignsH[reignsH.length-1].days++; });
const seenLH={}; let distinctH=0; leadersH.forEach(nm=>{if(!seenLH[nm]){seenLH[nm]=1;distinctH++;}});
let longestH=null; reignsH.forEach(rg=>{if(!longestH||rg.days>longestH.days)longestH={name:rg.name,days:rg.days};});
let journeyH=null;
{ const rks=rankHist['khalid-almannai'];
  if(rks&&rks.length){ let peak={r:rks[0],i:0},low={r:rks[0],i:0},best=0,topDays=0;
    rks.forEach((r,i)=>{if(r<peak.r)peak={r,i};if(r>low.r)low={r,i};if(i>0&&rks[i-1]-r>best)best=rks[i-1]-r;if(r<=10)topDays++;});
    journeyH={ranks:rks,peak,low,best,topDays}; } }
const cbAll=[]; let cbMine=null;
PS.forEach(b=>{const rks=rankHist[b.slug];if(!rks||!rks.length)return;let lo=rks[0];rks.forEach(r=>{if(r>lo)lo=r;});
  const now=rks[rks.length-1],v=lo-now; if(v>=10)cbAll.push({slug:b.slug,name:b.name,low:lo,now,v}); if(b.slug==='khalid-almannai')cbMine={low:lo,now,v};});
cbAll.sort((a,b)=>b.v-a.v);
const comebackH={rows:cbAll.slice(0,3),mine:cbMine};

/* ---- 🔮 futures board: enumerate every remaining winner outcome through BRACKET ---- */
let futuresH=null;
(function(){
  if(!daysH.length)return;
  const rem=world.fixtures.filter(f=>{const r=results_[f.id];return !(r&&(f.kn?r.w!=null:r.h!=null));}).sort((a,b)=>new Date(a.ko)-new Date(b.ko));
  if(!rem.length||rem.length>13)return;
  for(const f of rem)if(!f.kn)return;
  const remIdx={}; rem.forEach((f,i)=>remIdx[f.id]=i);
  const cmapW={}; rem.forEach(f=>{ const c=mapH[f.id]; if(c&&c.w&&Object.keys(c.w).length)cmapW[f.id]=c.w; });
  const N=rem.length,U=Math.pow(2,N);
  const picks=PS.map(b=>{ const pr=b.predictions||{},arr=new Array(N),arm=new Array(N);
    rem.forEach((f,i)=>{ const ok=(f.kn?koReadyH(f.id):true)&&(new Date(f.ko).getTime()<=NOWms||results_[f.id]);
      const v=ok?pr[f.id]:null; arr[i]=(v&&v.w)?v.w:null;
      let a2=false; if(ok&&b.chips){const knm=/^k[0-9]+$/.test(f.id)?(+f.id.slice(1)):0,rd=puRnd(knm);if(rd&&b.chips[rd]===f.id)a2=true;} arm[i]=a2; });
    return {slug:b.slug,champ:b.champ,arr,arm}; });
  const basePts={},curRank={}; lastRows.forEach((r,i)=>{basePts[r.slug]=r.pts;curRank[r.slug]=i+1;});
  const finIdx=(remIdx['k32']!=null)?remIdx['k32']:-1;
  const winW={},winC={},aliveSet={},condWin={}; let totW=0;
  const winners=new Array(N),pairHx=new Array(N),pairAx=new Array(N);
  for(let u=0;u<U;u++){
    let w8=1;
    for(let i=0;i<N;i++){
      const f=rem[i],bp=pairForH(f.id); let h=bp.h,a=bp.a; const fd=BR[f.id];
      if(fd&&(!h||!a)){ const take=fd[2];
        const side=fid=>{ let ww=(function(){const r=results_[fid];return (r&&r.w)?r.w:null;})(); const ri=remIdx[fid];
          if(ww==null&&ri!=null)ww=winners[ri]; if(ww==null)return null; if(take==='W')return ww;
          let fh=null,fa=null; if(ri!=null){fh=pairHx[ri];fa=pairAx[ri];}else{const q=pairForH(fid);fh=q.h;fa=q.a;}
          return ww===fh?fa:(ww===fa?fh:null); };
        if(!h)h=side(fd[0]); if(!a)a=side(fd[1]); }
      pairHx[i]=h;pairAx[i]=a;
      const win=((u>>i)&1)?(a||null):(h||null); winners[i]=win;
      let sh=0.5; if(h&&a&&win){const c=cmapW[f.id];if(c){const t2=(c[h]||0)+(c[a]||0);if(t2>=8)sh=(c[win]||0)/t2;}}
      w8*=sh;
    }
    const finW=finIdx>=0?winners[finIdx]:null;
    let bestPts=-1; const tied=[];
    for(let pi=0;pi<PS.length;pi++){ const p=PS[pi]; let pts=basePts[p.slug]|0; const pk=picks[pi];
      for(let i=0;i<N;i++){ if(pk.arr[i]&&pk.arr[i]===winners[i]){let kp=koPtsOf(rem[i]);if(pk.arm[i])kp*=2;pts+=kp;} }
      if(finW&&p.champ===finW)pts+=CHAMP_PTS;
      if(pts>bestPts){bestPts=pts;tied.length=0;tied.push(pi);} else if(pts===bestPts)tied.push(pi); }
    totW+=w8;
    for(const ti of tied){const sl=PS[ti].slug;winW[sl]=(winW[sl]||0)+w8;winC[sl]=(winC[sl]||0)+1;}
    if(finW){aliveSet[finW]=1;const cw=condWin[finW]||(condWin[finW]={});for(const ti of tied){const sl=PS[ti].slug;cw[sl]=(cw[sl]||0)+1;}}
  }
  const nameBy={}; PS.forEach(b=>nameBy[b.slug]=b.name);
  const shareRows=[]; for(const sl in winW)shareRows.push({slug:sl,w:winW[sl],c:winC[sl]});
  shareRows.sort((a,b)=>b.w-a.w||b.c-a.c);
  const pct1=w=>totW>0?Math.round(w/totW*1000)/10:0;
  const top5=shareRows.slice(0,5).map(r=>({name:nameBy[r.slug],pct:pct1(r.w)}));
  let fw=0; shareRows.slice(5).forEach(r=>fw+=r.w);
  let deepest=null; shareRows.forEach(r=>{const cr=curRank[r.slug];if(cr&&(!deepest||cr>deepest.rank))deepest={rank:cr,n:winC[r.slug]};});
  const mineF={w:winC['khalid-almannai']||0,uni:U};
  const slug2p={}; PS.forEach(b=>slug2p[b.slug]=b);
  const hopeN={}; lastRows.slice(0,10).forEach(r=>{const p=slug2p[r.slug];if(p&&p.champ&&aliveSet[p.champ])hopeN[p.champ]=(hopeN[p.champ]||0)+1;});
  const hopes=[]; for(const t in hopeN)hopes.push({t,n:hopeN[t]}); hopes.sort((a,b)=>b.n-a.n);
  let modalChamp=null; for(const t in cmH)if(!modalChamp||cmH[t]>cmH[modalChamp])modalChamp=t;
  let cond=null,condBest=-1;
  for(const t in hopeN){ if(t===modalChamp)continue; const tick=cmH[t]||0;
    if(tick>condBest){const cw=condWin[t]||{};let bn=null,bc=-1;for(const sl in cw)if(cw[sl]>bc){bc=cw[sl];bn=sl;}if(bn){cond={team:t,winner:nameBy[bn]};condBest=tick;}} }
  const alive=[]; for(const t in aliveSet)alive.push(t);
  futuresH={left:N,uni:U,winners:top5,fieldPct:pct1(fw),fieldN:Math.max(0,shareRows.length-top5.length),distinct:shareRows.length,deepest,mine:mineF,cond,hopes,alive};
})();

/* ---- 🪞 alternate universes + 🥚 fragility (need lastRows) ---- */
let altH=null,fragH={oneGoal:0,flips:0,gap:0};
if(lastRows&&lastRows.length){
  const offRank={},offPts={}; lastRows.forEach((r,i)=>{offRank[r.slug]=i+1;offPts[r.slug]=r.pts;});
  const variant=(b,mode)=>{
    if(mode==='official')return offPts[b.slug]|0;
    if(mode==='nochamp'){let v=offPts[b.slug]|0;if(results_._champ&&b.champ===results_._champ)v-=CHAMP_PTS;return v;}
    const pr=b.predictions||{}; let pts=0;
    for(const id in results_){ if(id.charAt(0)==='_')continue; const r=results_[id],v=pr[id]; if(!r||!v)continue; const f=fxById[id]; if(!f)continue;
      if(r.w!=null){ if(mode==='outcome'){if(v.w&&v.w===r.w)pts+=koPtsOf(f);} else if(koScoreHitH(v,r))pts+=koBonusOf(f); }
      else{ if(r.h==null)continue; if(mode==='outcome'){if(v.o&&v.o===outcomeOf(r))pts+=3;} else if(v.h!=null&&v.a!=null&&Number(v.h)===r.h&&Number(v.a)===r.a)pts+=2; } }
    return pts; };
  const modes=[['Official rules','official'],['Outcome only · no exact bonus','outcome'],['Exact scores only','exact'],['No champion bonus','nochamp']];
  const slots=modes.map(md=>{ const rows=PS.map(b=>({slug:b.slug,name:b.name,v:variant(b,md[1])})).sort((a,b)=>b.v-a.v||(offRank[a.slug]||99999)-(offRank[b.slug]||99999));
    return {lab:md[0],podium:rows.slice(0,3).map((r,i)=>({name:r.name,mv:md[1]==='official'?0:((offRank[r.slug]||0)-(i+1))}))}; });
  const leadName=lastRows[0].name; let leadCount=0; slots.forEach(s=>{if(s.podium.length&&s.podium[0].name===leadName)leadCount++;});
  altH={slots,leadName,leadCount};
  if(lastRows.length>=3){
    const slug2p={}; blobs.forEach(b=>slug2p[b.slug]=b);
    const top10=lastRows.slice(0,10),pod=[lastRows[0].name,lastRows[1].name,lastRows[2].name];
    fragH.gap=Math.min(lastRows[0].pts-lastRows[1].pts,lastRows[1].pts-lastRows[2].pts);
    const cands=[];
    doneSortedH.forEach(f=>{const r=results_[f.id];
      if(f.kn){const v=koNames(f.id);const other=r.w===v.h?v.a:(r.w===v.a?v.h:null);if(other)cands.push({f,nr:{w:other,h:r.a,a:r.h}});}
      else if(Math.abs(r.h-r.a)===1)cands.push({f,nr:{h:r.a,a:r.h}});});
    fragH.oneGoal=cands.length;
    cands.forEach(cd=>{ const cp={}; for(const id in results_)cp[id]=results_[id];
      cp[cd.f.id]=Object.assign({},results_[cd.f.id],cd.nr); if(cd.f.id==='k32'&&cp._champ)cp._champ=cd.nr.w;
      const rows=top10.map(rr=>{const p=slug2p[rr.slug];if(!p)return {name:rr.name,pts:rr.pts,exact:rr.exact,correct:rr.correct,predicted:rr.predicted};
        const s=scoreForH(p.predictions,cp,p.champ,p.chips||null);return {slug:p.slug,name:p.name,pts:s.pts,exact:s.exact,correct:s.correct,predicted:predCntH[p.slug]|0};}).sort(rankCmpH);
      for(let i=0;i<3;i++)if(rows[i]&&rows[i].name!==pod[i]){fragH.flips++;return;} });
  }
}

/* ---- CONS.wc cards: 🧊 clutch · ❤️ heart · 🎭 persona · 👯 twin · 🦄 unicorn · 🦢 goose · 🌪️ chaos ---- */
let clutchH=null,heartH=null,personaH=null,twinH=null,unicornH=null,gooseH=null,chaosH=null;
{ // clutch
  const rows=[]; let ogH=0,ogT=0,okH=0,okT=0,mn=null;
  PS.forEach(b=>{const pr=b.predictions||{};let g=0,gn=0,k=0,kn=0;
    doneEH.forEach(f=>{const v=pr[f.id];if(!v)return;const r=results_[f.id];
      if(f.kn){if(!v.w)return;kn++;if(v.w===r.w)k++;}else{if(!v.o)return;gn++;if(v.o===outcomeOf(r))g++;}});
    ogH+=g;ogT+=gn;okH+=k;okT+=kn; const gp=gn?Math.round(g/gn*100):0,kp=kn?Math.round(k/kn*100):0;
    if(b.slug==='khalid-almannai')mn={g:gp,k:kp,gn,kn};
    if(gn>=20&&kn>=12){const d=kp-gp;if(d>0)rows.push({slug:b.slug,name:b.name,g:gp,k:kp,d});}});
  rows.sort((a,b)=>b.d-a.d);
  clutchH={rows:rows.slice(0,3),og:ogT?Math.round(ogH/ogT*100):0,ok:okT?Math.round(okH/okT*100):0,mine:mn};
}
{ // heart
  let calls=0,back=0,hits=0,pPts=0,oCalls=0,oBack=0,oHits=0,oPts=0,shock=null;
  PS.forEach(b=>{const t=(b.country&&FLh[b.country])?b.country:null;if(!t)return;const pr=b.predictions||{};
    doneEH.forEach(f=>{const v=pr[f.id];if(!v)return;const r=results_[f.id],c=mapH[f.id];if(!c)return;
      let backing=false,hit=false,vp=0,ot=0,ob=0,oh=0,op=0;
      if(f.kn){const mv=koNames(f.id);if(mv.h!==t&&mv.a!==t)return;if(!v.w)return;
        backing=(v.w===t);hit=(v.w===r.w);if(hit)vp=koPtsOf(f);
        for(const kk in c.w)ot+=c.w[kk];ob=c.w[t]||0;oh=c.w[r.w]||0;op=oh*koPtsOf(f);}
      else{if(f.h!==t&&f.a!==t)return;if(!v.o)return;const ro=outcomeOf(r);
        backing=(f.h===t?v.o==='H':v.o==='A');hit=(v.o===ro);if(hit)vp=3;
        if(v.h!=null&&v.a!=null&&Number(v.h)===r.h&&Number(v.a)===r.a)vp+=2;
        ot=c.H+c.D+c.A;ob=(f.h===t?c.H:c.A);oh=c[ro];op=oh*3+(c.sc[r.h+'-'+r.a]||0)*2;}
      calls++;if(backing)back++;if(hit)hits++;pPts+=vp;oCalls+=ot;oBack+=ob;oHits+=oh;oPts+=op;
      if(backing&&hit&&resPctH[f.id]!=null&&resPctH[f.id]<=30&&(!shock||resPctH[f.id]<shock.pct))shock={team:t,pct:resPctH[f.id]};});});
  if(calls>=15){const bs=back/calls,os=oCalls?oBack/oCalls:0;
    heartH={calls,backMult:os>0?Math.round(bs/os*10)/10:0,pHit:Math.round(hits/calls*100),oHit:oCalls?Math.round(oHits/oCalls*100):0,
      ptsDelta:Math.round((pPts/calls-(oCalls?oPts/oCalls:0))*10)/10,shock};}
}
{ // persona
  const modal=f=>{const c=mapH[f.id];if(!c||!eligSetH[f.id])return null;
    if(f.kn){let tot=0,bt=null,bn=0;for(const kk in c.w){tot+=c.w[kk];if(c.w[kk]>bn){bn=c.w[kk];bt=kk;}}return tot>=8?bt:null;}
    const tot=c.H+c.D+c.A;if(tot<5)return null;return (c.H>=c.D&&c.H>=c.A)?'H':(c.D>=c.A?'D':'A');};
  const traits=(pr,fxs)=>{let n=0,chN=0,chT=0,dN=0,dT=0,gS=0,gN=0;
    fxs.forEach(f=>{const v=pr[f.id];if(!v)return;
      if(f.kn){if(!v.w)return;n++;const md=modal(f);if(md){chT++;if(v.w===md)chN++;}}
      else{if(!v.o)return;n++;dT++;if(v.o==='D')dN++;const md=modal(f);if(md){chT++;if(v.o===md)chN++;}if(v.h!=null&&v.a!=null){gS+=Number(v.h)+Number(v.a);gN++;}}});
    const chalk=chT?Math.round(chN/chT*100):0;
    return {n,chalk,draw:dT?Math.round(dN/dT*100):0,opt:Math.min(100,gN?Math.round(gS/gN/4*100):0),fade:100-chalk};};
  const archKey=t=>{if(t.fade>=45)return 'wolf';if(t.chalk>=70)return 'chalk';if(t.draw>=20)return 'draw';if(t.fade>=30)return 'maverick';return 'balanced';};
  const census={chalk:0,maverick:0,draw:0,wolf:0,balanced:0};
  PS.forEach(b=>{const t=traits(b.predictions||{},doneEH);if(t.n>=20)census[archKey(t)]++;});
  const meB=blobs.find(b=>b.slug==='khalid-almannai');
  const tMe=traits(meB.predictions||{},world.fixtures.map(f=>fxById[f.id]));
  personaH={census,mine:{chalk:tMe.chalk,draw:tMe.draw,opt:tMe.opt,fade:tMe.fade,key:archKey(tMe)}};
}
{ // twin
  const eligFx=world.fixtures.map(f=>fxById[f.id]).filter(m=>eligSetH[m.id]);
  const sigs=[]; PS.forEach(b=>{const pr=b.predictions||{};const mp={};let n=0;
    eligFx.forEach(f=>{const v=pr[f.id];if(!v)return;if(f.kn){if(v.w){mp[f.id]=v.w;n++;}}else if(v.o){mp[f.id]=v.o;n++;}});
    sigs.push({slug:b.slug,name:b.name,mp,n});});
  const cmp2=(a,b)=>{let sh=0,ag=0;const s=a.n<=b.n?a:b,o=a.n<=b.n?b:a;for(const id in s.mp){if(o.mp[id]!=null){sh++;if(s.mp[id]===o.mp[id])ag++;}}return {sh,ag};};
  let mineT=null,nem=null,meSig=null; for(const s of sigs)if(s.slug==='khalid-almannai'){meSig=s;break;}
  if(meSig){ let bestP=-1,bn=0,bname='',worst=null;
    sigs.forEach(s=>{if(s===meSig)return;const x=cmp2(meSig,s);
      if(x.sh>=15){const pc=x.ag/x.sh*100;if(pc>bestP){bestP=pc;bn=x.sh;bname=s.name;}}
      const dis=x.sh-x.ag;if(dis>=10&&(!worst||dis>worst.dis))worst={dis,s};});
    if(bestP>=0)mineT={name:bname,pct:Math.round(bestP),n:bn};
    if(worst){let meC=0,thC=0;
      for(const id in meSig.mp){const ov=worst.s.mp[id];if(ov==null||ov===meSig.mp[id])continue;const f=fxById[id],r=results_[id];if(!f||!r)continue;
        if(f.kn){if(r.w==null)continue;if(meSig.mp[id]===r.w)meC++;if(ov===r.w)thC++;}
        else{if(r.h==null)continue;const ro=outcomeOf(r);if(meSig.mp[id]===ro)meC++;if(ov===ro)thC++;}}
      nem={name:worst.s.name,n:worst.dis,me:meC,them:thC};}}
  const cands=sigs.filter(s=>s.n>=30); let sum=0,cnt=0,pair=null,pairP=-1;
  for(let i=0;i<cands.length;i++)for(let j=i+1;j<cands.length;j++){const x=cmp2(cands[i],cands[j]);
    if(x.sh>=15){const pc=x.ag/x.sh*100;sum+=pc;cnt++;if(x.sh>=30&&pc>pairP){pairP=pc;pair={a:cands[i].name,b:cands[j].name,pct:Math.round(pc),n:x.sh};}}}
  twinH={mine:mineT,pair,avg:cnt?Math.round(sum/cnt):0,nemesis:nem};
}
{ // unicorn
  const bought={},landed={};
  doneSortedH.forEach(f=>{if(f.kn)return;const c=mapH[f.id],r=results_[f.id];if(c)for(const sc in c.sc)bought[sc]=(bought[sc]||0)+c.sc[sc];landed[r.h+'-'+r.a]=(landed[r.h+'-'+r.a]||0)+1;});
  const rows=[]; for(const sc in bought)if(bought[sc]>=20)rows.push({sc,bought:bought[sc],landed:landed[sc]||0}); rows.sort((a,b)=>b.bought-a.bought);
  unicornH=rows;
}
{ // goose
  const minted={},torched={};
  doneSortedH.forEach(f=>{const c=mapH[f.id];if(!c)return;const r=results_[f.id];
    if(f.kn){let tot=0;for(const kk in c.w)tot+=c.w[kk];if(tot<8)return;const mv=koNames(f.id),pp=koPtsOf(f);const l=r.w===mv.h?mv.a:(r.w===mv.a?mv.h:null);
      minted[r.w]=(minted[r.w]||0)+(c.w[r.w]||0)*pp;if(l)torched[l]=(torched[l]||0)+(c.w[l]||0)*pp;}
    else{const tot=c.H+c.D+c.A;if(tot<5)return;if(r.h===r.a)return;const wt=r.h>r.a?f.h:f.a,lt=r.h>r.a?f.a:f.h,wn=r.h>r.a?c.H:c.A,ln=r.h>r.a?c.A:c.H;
      minted[wt]=(minted[wt]||0)+wn*3;torched[lt]=(torched[lt]||0)+ln*3;}});
  const koSet={};let koAll=true; world.fixtures.forEach(f=>{if(!f.kn||f.round!=='R32')return;const t=koNames(f.id);if(t.h&&t.a){koSet[t.h]=1;koSet[t.a]=1;}else koAll=false;});
  const beaten={}; doneSortedH.forEach(f=>{if(!f.kn)return;const r=results_[f.id],v=koNames(f.id);const l=r.w===v.h?v.a:(r.w===v.a?v.h:null);if(l)beaten[l]=1;});
  const koKnown=koAll&&Object.keys(koSet).length>=32; let burn=null;
  for(const t in cmH){if(!(beaten[t]||(koKnown&&!koSet[t])))continue;torched[t]=(torched[t]||0)+CHAMP_PTS*cmH[t];if(!burn||cmH[t]>burn.n)burn={t,n:cmH[t]};}
  const top3=o=>{const a=[];for(const t in o)if(o[t]>0)a.push({t,v:o[t]});a.sort((x,y)=>y.v-x.v);return a.slice(0,3);};
  gooseH={minted:top3(minted),torched:top3(torched),burn};
}
{ // chaos
  const order=['MD1','MD2','MD3','R32','R16','QF','SF','FIN']; const sum={},cnt={};
  doneSortedH.forEach(f=>{if(f.id==='k31')return;/* third-place playoff shares round FINAL — excluded from FIN, matching the product */const c=mapH[f.id];if(!c)return;const r=results_[f.id];let sh=0,tot=0;
    if(f.kn){for(const kk in c.w)tot+=c.w[kk];if(tot<8)return;sh=(c.w[r.w]||0)/tot;}
    else{tot=c.H+c.D+c.A;if(tot<5)return;sh=c[outcomeOf(r)]/tot;}
    if(sh<=0)sh=0.5/tot; const u=-Math.log(sh)/Math.LN2,b=f.round==='FINAL'?'FIN':f.round;sum[b]=(sum[b]||0)+u;cnt[b]=(cnt[b]||0)+1;});
  const rounds=[];let gS=0,gN=0,mx=0,mxLab='';
  order.forEach(b=>{if(!cnt[b])return;const u=Math.round(sum[b]/cnt[b]*100)/100;rounds.push({lab:b,u,n:cnt[b]});
    if(b==='MD1'||b==='MD2'||b==='MD3'){gS+=sum[b];gN+=cnt[b];}else if(u>mx){mx=u;mxLab=b;}});
  const gAvg=gN?gS/gN:0; chaosH={rounds,mult:(gAvg>0&&mx>0)?Math.round(mx/gAvg*10)/10:0,maxLab:mxLab};
}
const meNow = lastRows ? (lastRows.findIndex(r=>r.slug==='khalid-almannai')+1) : 0;
console.log('EXPECTED wc:', JSON.stringify({
  settledN:settledIds.length, days:daysH.length, leadChanges:leadChangesH, distinct:distinctH,
  longest:longestH&&(longestH.name.split(' ')[0]+'/'+longestH.days), meNow,
  futUni:futuresH&&futuresH.uni, futLeft:futuresH&&futuresH.left, futDistinct:futuresH&&futuresH.distinct,
  futTop1:futuresH&&futuresH.winners[0]&&(futuresH.winners[0].name.split(' ')[0]+'@'+futuresH.winners[0].pct),
  futMine:futuresH&&futuresH.mine, cbTop:comebackH.rows[0]&&(comebackH.rows[0].name.split(' ')[0]+'+'+comebackH.rows[0].v),
  clutchTop:clutchH.rows[0]&&('+'+clutchH.rows[0].d), clOff:[clutchH.og,clutchH.ok],
  heart:heartH&&[heartH.calls,heartH.backMult,heartH.pHit,heartH.oHit,heartH.ptsDelta,heartH.shock],
  persona:personaH.census, personaMine:personaH.mine.key,
  twin:twinH&&[twinH.mine&&twinH.mine.pct,twinH.avg,twinH.pair&&twinH.pair.pct],
  unicorn:unicornH.slice(0,3).map(r=>r.sc+':'+r.bought+'/'+r.landed),
  goose:[gooseH.minted[0]&&gooseH.minted[0].t,gooseH.torched[0]&&gooseH.torched[0].t,gooseH.burn&&gooseH.burn.n],
  chaos:chaosH.rounds.map(r=>r.lab+':'+r.u), chaosMax:chaosH.maxLab, chaosMult:chaosH.mult,
  alt:altH&&[altH.leadName.split(' ')[0],altH.leadCount], frag:[fragH.oneGoal,fragH.flips,fragH.gap],
  lifelines:futuresH&&futuresH.hopes.map(h=>h.t+':'+h.n)
}));

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
await pg.route('**://flagcdn.com/**', flagStub);
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

/* DEV cross-check: read the page's own WCR.v + CONS.wc and diff against the port above.
   These are NOT the card assertions (those grep rendered HTML below) — they just prove the
   independent recomputation matches the compute layer. Remove/keep as belt-and-suspenders. */
const pageWC = await pg.evaluate(()=>{
  const w=(typeof CONS!=='undefined'&&CONS.wc)||null, r=(typeof WCR!=='undefined'&&WCR.v)||null;
  const f=r&&r.futures;
  return {
    days:r&&r.days&&r.days.length, leadChanges:r&&r.leadChanges, distinct:r&&r.distinct,
    longest:r&&r.longest&&(r.longest.name.split(' ')[0]+'/'+r.longest.days),
    futUni:f&&f.uni, futLeft:f&&f.left, futDistinct:f&&f.distinct,
    futTop1:f&&f.winners&&f.winners[0]&&(f.winners[0].name.split(' ')[0]+'@'+f.winners[0].pct),
    futMine:f&&f.mine, futDeepest:f&&f.deepest, futCond:f&&f.cond, futHopes:f&&f.hopes,
    cbTop:r&&r.comeback&&r.comeback.rows[0]&&(r.comeback.rows[0].name.split(' ')[0]+'+'+r.comeback.rows[0].v),
    cbMine:r&&r.comeback&&r.comeback.mine,
    journey:r&&r.journey&&{peak:r.journey.peak,low:r.journey.low,best:r.journey.best,topDays:r.journey.topDays,n:r.journey.ranks.length},
    alt:r&&r.alt&&{lead:r.alt.leadName.split(' ')[0],count:r.alt.leadCount,slots:r.alt.slots.map(s=>s.podium.map(p=>p.name.split(' ')[0]+(p.mv?('/'+p.mv):'')))},
    frag:r&&r.frag,
    clutch:w&&w.clutch&&{top:w.clutch.rows[0]&&('+'+w.clutch.rows[0].d),og:w.clutch.og,ok:w.clutch.ok,mine:w.clutch.mine,rows:w.clutch.rows.map(x=>x.name.split(' ')[0]+':'+x.d)},
    heart:w&&w.heart, persona:w&&w.persona,
    twin:w&&w.twin&&{mine:w.twin.mine,avg:w.twin.avg,pair:w.twin.pair,nem:w.twin.nemesis},
    unicorn:w&&w.unicorn&&w.unicorn.slice(0,4).map(x=>x.sc+':'+x.bought+'/'+x.landed),
    goose:w&&w.goose, chaos:w&&w.chaos
  };
});
console.log('PAGE wc:', JSON.stringify(pageWC));

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
    raffle: { txt: cardTxt('Raffle or racetrack?'), pend: cardPend('Raffle or racetrack?'),
              n: cardByTitle('Raffle or racetrack?')?text(cardByTitle('Raffle or racetrack?').querySelector('.aw-prz')):null,
              tiles: cardByTitle('Raffle or racetrack?')?Array.from(cardByTitle('Raffle or racetrack?').querySelectorAll('.nrd-tile b')).map(x=>text(x)):[] },
    ladder: { txt: cardTxt('The predictability ladder'), pend: cardPend('The predictability ladder'),
              bars: cardByTitle('The predictability ladder')?cardByTitle('The predictability ladder').querySelectorAll('.nrd-rounds .rc').length:0,
              firstBar: cardByTitle('The predictability ladder')?text(cardByTitle('The predictability ladder').querySelector('.nrd-rounds .rc em')):null },
    photo: { txt: cardTxt('The photo finish'), pend: cardPend('The photo finish'),
             tiles: cardByTitle('The photo finish')?Array.from(cardByTitle('The photo finish').querySelectorAll('.nrd-tile b')).map(x=>text(x)):[] },
    belts: { txt: cardTxt('The belt races'), pend: cardPend('The belt races'),
             rows: cardByTitle('The belt races')?Array.from(cardByTitle('The belt races').querySelectorAll('.nrd-belt')).map(x=>text(x)):[] },
    ledger: { txt: cardTxt('The armband ledger'), pend: cardPend('The armband ledger'),
              tiles: cardByTitle('The armband ledger')?Array.from(cardByTitle('The armband ledger').querySelectorAll('.nrd-tile b')).map(x=>text(x)):[] },
    grave: { txt: cardTxt('The graveyard shift'), pend: cardPend('The graveyard shift'),
             meters: cardByTitle('The graveyard shift')?Array.from(cardByTitle('The graveyard shift').querySelectorAll('.nrd-meter .lab')).map(x=>text(x)):[] },
    market5: { txt: cardTxt('The scoreline stock market'), pend: cardPend('The scoreline stock market'),
               rows: cardByTitle('The scoreline stock market')?Array.from(cardByTitle('The scoreline stock market').querySelectorAll('.nrd-crown')).map(x=>text(x)):[] },
    homesoil: { txt: cardTxt('Home-soil bias'), pend: cardPend('Home-soil bias'),
                meters: cardByTitle('Home-soil bias')?Array.from(cardByTitle('Home-soil bias').querySelectorAll('.nrd-meter .lab')).map(x=>text(x)):[] },
    blind: { txt: cardTxt('The draw blind spot'), pend: cardPend('The draw blind spot'),
             meters: cardByTitle('The draw blind spot')?Array.from(cardByTitle('The draw blind spot').querySelectorAll('.nrd-meter .lab')).map(x=>text(x)):[] },
    founding: { txt: cardTxt('The founding members'), pend: cardPend('The founding members'),
                meters: cardByTitle('The founding members')?Array.from(cardByTitle('The founding members').querySelectorAll('.nrd-meter .lab')).map(x=>text(x)):[] },
    jump: { present: !!$('.nrd-jump'), chips: $$('.nrd-jump button').length, cards: $$('.aw-card').length,
            firstTitle: $('.nrd-jump button')?$('.nrd-jump button').title:null,
            labels: $$('.nrd-jump button b').map(x=>x.textContent) },
    secs: { wraps: $$('.nrd-secwrap').map(w=>({id:w.id, n:w.querySelectorAll('.aw-card').length,
              lab: w.querySelector('.nrd-sec b')?w.querySelector('.nrd-sec b').textContent:null})),
            orphans: $$('.aw-card').filter(cd=>!cd.closest('.nrd-secwrap'))
              .map(cd=>{const t=cd.querySelector('.aw-t b');return t?t.textContent:'?';}),
            inWraps: $$('.nrd-secwrap .aw-card').length },
    yous: $$('.aw-you').map(y=>text(y)),
  };
});
console.log(JSON.stringify(got,null,1).slice(0,3600));

/* ---- WAVE C card scrape: pull each new card's rendered numbers from body.innerHTML ---- */
const gotWC = await pg.evaluate(()=>{
  const $$=s=>Array.from(document.querySelectorAll(s));
  const T=el=>el?el.textContent.replace(/\s+/g,' ').trim():null;
  const card=t=>{const b=$$('.aw-card .aw-t b').find(x=>x.textContent.trim()===t);return b?b.closest('.aw-card'):null;};
  const q=(c,s)=>c?Array.from(c.querySelectorAll(s)):[];
  const prz=c=>c&&c.querySelector('.aw-prz')?T(c.querySelector('.aw-prz')):null;
  const tiles=c=>q(c,'.nrd-tile b').map(T);
  const lines=c=>q(c,'.nrd-line').map(T);
  const champs=c=>q(c,'.nrd-champ').map(r=>({nm:T(r.querySelector('.nm')),pc:T(r.querySelector('.pc'))}));
  const you=c=>{const y=c&&c.querySelector('.aw-you');return y?T(y):null;};
  const pend=c=>!!(c&&c.querySelector('.aw-pend'));
  const meters=c=>q(c,'.nrd-meter').map(m=>({lab:T(m.querySelector('.lab span')),b:T(m.querySelector('.lab b'))}));
  const rows=c=>q(c,'.aw-row').map(r=>({nm:T(r.querySelector('.aw-nm')),v:T(r.querySelector('.aw-v'))}));
  const fut=card('The futures board'), tm=card('The time machine'), jo=card('Your rank journey'),
        cb=card('The comeback king'), lf=card('Title lifelines'), tw=card('The prediction twin'),
        he=card('Heart vs head'), go=card('Golden goose & heartbreaker'), cl=card('Clutch rating'),
        un=card('Alternate universes'), ch=card('The chaos meter'), fr=card('The fragility index'),
        pe=card('Predictor personality'), uc=card('The unicorn scores');
  return {
    fut:{present:!!fut,pend:pend(fut),prz:prz(fut),tiles:tiles(fut),champs:champs(fut),lines:lines(fut),you:you(fut)},
    tm:{present:!!tm,pend:pend(tm),prz:prz(tm),tiles:tiles(tm),reign:q(tm,'.reign i').length,lines:lines(tm)},
    jo:{present:!!jo,personal:!!(jo&&jo.classList.contains('nrd-personal')),svg:!!(jo&&jo.querySelector('svg.spark')),you:you(jo),lines:lines(jo)},
    cb:{present:!!cb,pend:pend(cb),rows:rows(cb),lines:lines(cb),you:you(cb)},
    lf:{present:!!lf,pend:pend(lf),champs:champs(lf),lines:lines(lf),you:you(lf)},
    tw:{present:!!tw,pend:pend(tw),prz:prz(tw),meters:meters(tw),lines:lines(tw),h2h:T(tw&&tw.querySelector('.h2h .sc'))},
    he:{present:!!he,pend:pend(he),tiles:tiles(he),duo:T(he&&he.querySelector('.nrd-duo .lab')),lines:lines(he)},
    go:{present:!!go,pend:pend(go),champs:champs(go),lines:lines(go)},
    cl:{present:!!cl,pend:pend(cl),prz:prz(cl),rows:rows(cl),lines:lines(cl),you:you(cl)},
    un:{present:!!un,pend:pend(un),slots:q(un,'.alt-slot').map(s=>({lab:T(s.querySelector('.lb')),pods:q(s,'.pd').map(T),official:s.classList.contains('official')})),lines:lines(un)},
    ch:{present:!!ch,pend:pend(ch),bars:q(ch,'.nrd-rounds .rc i em').map(T),hot:q(ch,'.nrd-rounds .rc i').findIndex(i=>i.classList.contains('hot')),rlab:q(ch,'.nrd-rlab u').map(T),lines:lines(ch)},
    fr:{present:!!fr,pend:pend(fr),tiles:tiles(fr),lines:lines(fr)},
    pe:{present:!!pe,personalWrap:!!(pe&&pe.querySelector('.nrd-personal .persona')),heroE:T(pe&&pe.querySelector('.persona .pe')),heroL:T(pe&&pe.querySelector('.persona .pt b')),meters:meters(pe),quad:q(pe,'.nrd-qc').map(x=>({b:T(x.querySelector('b')),s:T(x.querySelector('span'))})),lines:lines(pe)},
    uc:{present:!!uc,pend:pend(uc),duo:q(uc,'.nrd-duo').map(d=>T(d.querySelector('.lab'))),lines:lines(uc)}
  };
});
console.log('gotWC:', JSON.stringify(gotWC).slice(0,2400));

/* ================= WAVE C — card assertions (rendered HTML vs independent recompute) ================= */
const inc=(s,sub)=>!!(s&&s.indexOf(sub)>=0);
const first=n=>String(n||'').split(' ')[0];
// presence: all 14 new cards render (never pend) in the full signed-in world
['The futures board','The time machine','Your rank journey','The comeback king','Title lifelines','The prediction twin','Heart vs head','Golden goose & heartbreaker','Clutch rating','Alternate universes','The chaos meter','The fragility index','Predictor personality','The unicorn scores'].forEach(t=>{
  if(got.titles.includes(t)) pass('wave-c card present: '+t); else fail('wave-c card MISSING: '+t);
});

// 1 · 🔮 THE FUTURES BOARD (4+)
if(gotWC.fut.prz===nrdNH(futuresH.uni)+' universes') pass('futures prz: '+gotWC.fut.prz); else fail('futures prz='+gotWC.fut.prz+' want '+futuresH.uni+' universes');
if(gotWC.fut.tiles.join('|')===[futuresH.left,nrdNH(futuresH.uni),futuresH.distinct].join('|')) pass('futures tiles: '+gotWC.fut.tiles.join('/')); else fail('futures tiles='+JSON.stringify(gotWC.fut.tiles)+' want '+[futuresH.left,futuresH.uni,futuresH.distinct]);
{ const wantN=futuresH.winners.length + (futuresH.fieldN>0?1:0);
  const okC=gotWC.fut.champs.length===wantN && futuresH.winners.every((w,i)=>inc(gotWC.fut.champs[i].nm,first(w.name))&&gotWC.fut.champs[i].pc===w.pct+'%');
  if(okC) pass('futures winner bars: top-'+futuresH.winners.length+' by title share ('+futuresH.winners.map(w=>first(w.name)+' '+w.pct+'%').join(', ')+')'); else fail('futures champs='+JSON.stringify(gotWC.fut.champs)+' want '+JSON.stringify(futuresH.winners)); }
{ const dl=gotWC.fut.lines.find(l=>inc(l,'Deepest'));
  if(futuresH.deepest && dl && inc(dl,ordinalH(futuresH.deepest.rank)) && inc(dl,String(futuresH.deepest.n))) pass('futures deepest ticket: '+ordinalH(futuresH.deepest.rank)+' in '+futuresH.deepest.n+' futures'); else fail('futures deepest line "'+dl+'" want '+JSON.stringify(futuresH.deepest)); }
{ const w=futuresH.mine.w, want=(w>0?('You win it in')+' ':'')+''; const exp=w>0?(w+' of '+nrdNH(futuresH.uni)):('0 of '+nrdNH(futuresH.uni));
  if(inc(gotWC.fut.you,exp)) pass('futures you-line: '+exp+' futures'); else fail('futures you="'+gotWC.fut.you+'" want '+exp); }

// 2 · ⏳ THE TIME MACHINE (4+)
if(gotWC.tm.prz===settledIds.length+' matches replayed') pass('time machine prz: '+gotWC.tm.prz); else fail('tm prz='+gotWC.tm.prz+' want '+settledIds.length+' matches replayed');
if(gotWC.tm.tiles.join('|')===[String(leadChangesH),String(distinctH),longestH.days+'d'].join('|')) pass('time machine tiles: '+gotWC.tm.tiles.join('/')); else fail('tm tiles='+JSON.stringify(gotWC.tm.tiles)+' want '+[leadChangesH,distinctH,longestH.days+'d']);
if(gotWC.tm.reign===reignsH.length) pass('time machine reign strip: '+reignsH.length+' segments'); else fail('tm reign='+gotWC.tm.reign+' want '+reignsH.length);
{ const ll=gotWC.tm.lines.find(l=>inc(l,'Longest reign'));
  if(ll && inc(ll,longestH.name) && inc(ll,String(longestH.days))) pass('time machine longest reign: '+longestH.name+' · '+longestH.days+'d'); else fail('tm longest line "'+ll+'" want '+longestH.name+'/'+longestH.days); }
{ const lc=gotWC.tm.lines.find(l=>inc(l,'changed hands')||inc(l,'first whistle'));
  if(lc && inc(lc,leadChangesH+' time') && inc(lc,String(distinctH))) pass('time machine lead-changes line: '+leadChangesH+' changes / '+distinctH+' leaders'); else fail('tm leadchange line "'+lc+'" want '+leadChangesH+'/'+distinctH); }

// 3 · 🎢 YOUR RANK JOURNEY (personal)
if(gotWC.jo.present && gotWC.jo.personal && gotWC.jo.svg) pass('journey: personal SVG card renders (nrd-personal)'); else fail('journey present='+gotWC.jo.present+' personal='+gotWC.jo.personal+' svg='+gotWC.jo.svg);
{ const y=gotWC.jo.you;
  if(inc(y,ordinalH(journeyH.peak.r)) && inc(y,ordinalH(journeyH.low.r)) && inc(y,String(journeyH.topDays))) pass('journey you-line: peak '+ordinalH(journeyH.peak.r)+' · low '+ordinalH(journeyH.low.r)+' · '+journeyH.topDays+' top-10 days'); else fail('journey you="'+y+'" want peak '+journeyH.peak.r+' low '+journeyH.low.r+' topDays '+journeyH.topDays); }
{ const bl=gotWC.jo.lines.find(l=>inc(l,'best climb'))||gotWC.jo.lines.find(l=>inc(l,'climb'));
  if(journeyH.best>0 ? (bl&&inc(bl,'+'+journeyH.best)) : true) pass('journey best-climb line: +'+journeyH.best); else fail('journey climb line "'+bl+'" want +'+journeyH.best); }

// 4 · 🧗 THE COMEBACK KING
{ const want=Math.min(3,comebackH.rows.length);
  if(gotWC.cb.rows.length===want) pass('comeback king: '+want+' climber rows'); else fail('comeback rows='+gotWC.cb.rows.length+' want '+want); }
if(comebackH.rows[0] && inc(gotWC.cb.rows[0].nm,first(comebackH.rows[0].name)) && inc(gotWC.cb.rows[0].v,'+'+comebackH.rows[0].v)) pass('comeback #1: '+first(comebackH.rows[0].name)+' +'+comebackH.rows[0].v); else fail('comeback row1='+JSON.stringify(gotWC.cb.rows[0])+' want '+JSON.stringify(comebackH.rows[0]));
if(comebackH.mine && inc(gotWC.cb.you,'+'+comebackH.mine.v) && inc(gotWC.cb.you,ordinalH(comebackH.mine.low)) && inc(gotWC.cb.you,ordinalH(comebackH.mine.now))) pass('comeback you-line: +'+comebackH.mine.v+' ('+comebackH.mine.low+'→'+comebackH.mine.now+')'); else fail('comeback you="'+gotWC.cb.you+'" want +'+comebackH.mine.v);

// 5 · 🧬 TITLE LIFELINES
{ const H=futuresH.hopes;
  if(gotWC.lf.champs.length===H.length && H.every((h,i)=>inc(gotWC.lf.champs[i].nm,h.t)&&inc(gotWC.lf.champs[i].pc,h.n+' of 10'))) pass('lifelines: '+H.length+' alive top-10 team(s) — '+H.map(h=>h.t+' '+h.n+'/10').join(', ')); else fail('lifelines champs='+JSON.stringify(gotWC.lf.champs)+' want '+JSON.stringify(H)); }
{ const tl=gotWC.lf.lines.find(l=>inc(l,'🧬')); const top=futuresH.hopes[0];
  if(top && tl && inc(tl,top.t) && inc(tl,String(top.n))) pass('lifelines headline: '+top.t+' × '+top.n+' of top 10'); else fail('lifelines headline "'+tl+'" want '+JSON.stringify(top)); }
if(inc(gotWC.lf.you,'France')) pass('lifelines you-line names your champion (France)'); else fail('lifelines you="'+gotWC.lf.you+'" want France');

// 6 · 👯 THE PREDICTION TWIN
if(gotWC.tw.prz===twinH.mine.n+' shared calls') pass('twin prz: '+gotWC.tw.prz); else fail('twin prz='+gotWC.tw.prz+' want '+twinH.mine.n+' shared calls');
{ const m0=gotWC.tw.meters[0], m1=gotWC.tw.meters[1];
  if(m0 && inc(m0.lab,twinH.mine.name) && m0.b===twinH.mine.pct+'%') pass('twin meter: You ↔ '+twinH.mine.name+' '+twinH.mine.pct+'%'); else fail('twin meter0='+JSON.stringify(m0)+' want '+twinH.mine.name+'/'+twinH.mine.pct);
  if(m1 && m1.b===twinH.avg+'%') pass('twin office-average meter: '+twinH.avg+'%'); else fail('twin meter1='+JSON.stringify(m1)+' want '+twinH.avg+'%'); }
{ const pl=gotWC.tw.lines.find(l=>inc(l,'Most-alike'));
  if(twinH.pair && pl && inc(pl,twinH.pair.a) && inc(pl,twinH.pair.b) && inc(pl,twinH.pair.pct+'%')) pass('twin office pair: '+twinH.pair.a+' & '+twinH.pair.b+' '+twinH.pair.pct+'%'); else fail('twin pair line "'+pl+'" want '+JSON.stringify(twinH.pair)); }
{ const nm=twinH.nemesis;
  if(nm && gotWC.tw.h2h===nm.me+' – '+nm.them) pass('twin nemesis h2h: '+nm.me+' – '+nm.them+' ('+nm.name+')'); else fail('twin h2h="'+gotWC.tw.h2h+'" want '+(nm&&nm.me+' – '+nm.them)); }

// 7 · ❤️ HEART VS HEAD (aggregate only — no names)
{ const bm=heartH.backMult.toFixed(1), pd=(heartH.ptsDelta>0?'+':'')+heartH.ptsDelta.toFixed(1);
  if(gotWC.he.tiles[0]==='×'+bm && gotWC.he.tiles[1]===pd) pass('heart tiles: ×'+bm+' backing · '+pd+' pts/call'); else fail('heart tiles='+JSON.stringify(gotWC.he.tiles)+' want ×'+bm+' / '+pd); }
if(inc(gotWC.he.duo,heartH.pHit+'%') && inc(gotWC.he.duo,heartH.oHit+'%')) pass('heart hit-rate duo: '+heartH.pHit+'% patriot vs '+heartH.oHit+'% office'); else fail('heart duo="'+gotWC.he.duo+'" want '+heartH.pHit+'/'+heartH.oHit);
{ const diff=heartH.oHit-heartH.pHit, tax=gotWC.he.lines.find(l=>inc(l,'patriot tax')||inc(l,'heart pays')||inc(l,'A wash'));
  if(tax && (diff===0||inc(tax,Math.abs(diff)+' point'))) pass('heart verdict line: '+(diff>0?('tax +'+diff):diff<0?('heart pays '+(-diff)):'wash')); else fail('heart tax line "'+tax+'" diff='+diff);
  const hasShock=gotWC.he.lines.some(l=>inc(l,'The exception'));
  if(!!heartH.shock===hasShock) pass('heart shock line '+(heartH.shock?'present':'absent')+' as recomputed'); else fail('heart shock render='+hasShock+' recompute='+!!heartH.shock); }
if(!/[A-Z][a-z]+ [A-Z]\./.test((gotWC.he.lines||[]).join(' '))) pass('heart names no individual (aggregate only)'); else fail('heart leaked a name: '+gotWC.he.lines.join(' | '));

// 8 · 🦢 GOLDEN GOOSE & HEARTBREAKER
{ const mt=gooseH.minted, tc=gooseH.torched, gc=gotWC.go.champs;
  const okM=mt.every((e,i)=>gc[i]&&inc(gc[i].nm,e.t)&&gc[i].pc===nrdNH(e.v));
  const okT=tc.every((e,i)=>gc[mt.length+i]&&inc(gc[mt.length+i].nm,e.t)&&gc[mt.length+i].pc==='−'+nrdNH(e.v));
  if(okM) pass('goose minted top-3: '+mt.map(e=>e.t+' '+nrdNH(e.v)).join(', ')); else fail('goose minted='+JSON.stringify(gc.slice(0,mt.length))+' want '+JSON.stringify(mt));
  if(okT) pass('goose torched top-3: '+tc.map(e=>e.t+' −'+nrdNH(e.v)).join(', ')); else fail('goose torched='+JSON.stringify(gc.slice(mt.length))+' want '+JSON.stringify(tc)); }
{ const bl=gotWC.go.lines.find(l=>inc(l,'🎫'));
  if(gooseH.burn && bl && inc(bl,nrdNH(gooseH.burn.n)) && inc(bl,gooseH.burn.t)) pass('goose champion-burn line: '+gooseH.burn.n+' tickets died with '+gooseH.burn.t); else fail('goose burn line "'+bl+'" want '+JSON.stringify(gooseH.burn)); }

// 9 · 🧊 CLUTCH RATING
if(gotWC.cl.prz==='min 12 KO calls') pass('clutch prz: min 12 KO calls'); else fail('clutch prz='+gotWC.cl.prz);
{ const r0=clutchH.rows[0];
  if(r0 && inc(gotWC.cl.rows[0].nm,first(r0.name)) && inc(gotWC.cl.rows[0].nm,r0.g+'% groups') && inc(gotWC.cl.rows[0].nm,r0.k+'% KO') && inc(gotWC.cl.rows[0].v,'+'+r0.d)) pass('clutch #1: '+first(r0.name)+' '+r0.g+'→'+r0.k+' (+'+r0.d+')'); else fail('clutch row1='+JSON.stringify(gotWC.cl.rows[0])+' want '+JSON.stringify(r0)); }
if(gotWC.cl.rows.length===clutchH.rows.length) pass('clutch: '+clutchH.rows.length+' clutch rows'); else fail('clutch rows='+gotWC.cl.rows.length+' want '+clutchH.rows.length);
if(clutchH.mine && inc(gotWC.cl.you,clutchH.mine.g+'%') && inc(gotWC.cl.you,clutchH.mine.k+'%')) pass('clutch you-line: '+clutchH.mine.g+'% groups → '+clutchH.mine.k+'% KO'); else fail('clutch you="'+gotWC.cl.you+'" want '+clutchH.mine.g+'/'+clutchH.mine.k);

// 10 · 🪞 ALTERNATE UNIVERSES (4+)
if(gotWC.un.slots.length===4) pass('universes: 4 rulebook slots'); else fail('universes slots='+gotWC.un.slots.length);
if(gotWC.un.slots[0] && gotWC.un.slots[0].official && inc(gotWC.un.slots[0].lab,'Official')) pass('universes: official slot flagged & first'); else fail('universes official slot='+JSON.stringify(gotWC.un.slots[0]));
{ let ok=altH.slots.every((s,si)=>{const rs=gotWC.un.slots[si];return rs && s.podium.every((p,pi)=>inc(rs.pods[pi],first(p.name)) && (p.mv===0 || inc(rs.pods[pi],(p.mv>0?'▲'+p.mv:'▼'+(-p.mv)))));});
  if(ok) pass('universes: all 4 podiums + movers match ('+altH.slots.map(s=>s.podium.map(p=>first(p.name)+(p.mv?(p.mv>0?'▲'+p.mv:'▼'+(-p.mv)):'')).join('/')).join(' | ')+')'); else fail('universes podiums mismatch: '+JSON.stringify(gotWC.un.slots.map(s=>s.pods))+' want '+JSON.stringify(altH.slots.map(s=>s.podium))); }
{ const ll=gotWC.un.lines.find(l=>inc(l,'🪞'));
  if(ll && inc(ll,first(altH.leadName)) && inc(ll,String(altH.leadCount))) pass('universes verdict: '+first(altH.leadName)+' leads '+altH.leadCount+'/4'); else fail('universes verdict "'+ll+'" want '+first(altH.leadName)+'/'+altH.leadCount); }

// 11 · 🌪️ THE CHAOS METER
{ const wantBars=chaosH.rounds.map(r=>(+r.u).toFixed(1)), wantLab=chaosH.rounds.map(r=>r.lab);
  if(gotWC.ch.bars.join('|')===wantBars.join('|')) pass('chaos bars (shock/round): '+wantBars.join(' ')); else fail('chaos bars='+JSON.stringify(gotWC.ch.bars)+' want '+JSON.stringify(wantBars));
  if(gotWC.ch.rlab.join('|')===wantLab.join('|')) pass('chaos round labels: '+wantLab.join(' ')); else fail('chaos rlab='+JSON.stringify(gotWC.ch.rlab)+' want '+JSON.stringify(wantLab));
  const maxIdx=chaosH.rounds.reduce((m,r,i,a)=>r.u>a[m].u?i:m,0);
  if(gotWC.ch.hot===maxIdx) pass('chaos hottest round highlighted: '+chaosH.rounds[maxIdx].lab); else fail('chaos hot idx='+gotWC.ch.hot+' want '+maxIdx); }
{ const longR={MD1:'matchday 1',MD2:'matchday 2',MD3:'matchday 3',R32:'round of 32',R16:'round of 16',QF:'quarter-finals',SF:'semi-finals',FIN:'final'};
  const ml=gotWC.ch.lines.find(l=>inc(l,'🧨'));
  if(chaosH.mult && ml && inc(ml,(+chaosH.mult).toFixed(1)+'×') && inc(ml,longR[chaosH.maxLab])) pass('chaos verdict: '+chaosH.maxLab+' '+chaosH.mult.toFixed(1)+'× group avg'); else fail('chaos verdict "'+ml+'" want '+chaosH.mult+'× '+chaosH.maxLab); }

// 12 · 🥚 THE FRAGILITY INDEX
if(gotWC.fr.tiles.join('|')===[String(fragH.oneGoal),String(fragH.flips),String(fragH.gap)].join('|')) pass('fragility tiles: '+fragH.oneGoal+' games / '+fragH.flips+' flips / gap '+fragH.gap); else fail('fragility tiles='+JSON.stringify(gotWC.fr.tiles)+' want '+[fragH.oneGoal,fragH.flips,fragH.gap]);
{ const fl=gotWC.fr.lines.find(l=>inc(l,'🥚'));
  if(fl && (fragH.flips>0?(inc(fl,fragH.flips+' of '+fragH.oneGoal)):inc(fl,'Not one'))) pass('fragility flip verdict: '+fragH.flips+'/'+fragH.oneGoal); else fail('fragility flip line "'+fl+'"');
  if(gotWC.fr.lines.some(l=>inc(l,'🧱'))) pass('fragility podium-stability line present'); else fail('fragility has no 🧱 line'); }

// 13 · 🎭 PREDICTOR PERSONALITY (personal hero + census)
{ const EMO={chalk:'🐑',maverick:'🦊',draw:'🤝',wolf:'🐺',balanced:'⚖️'}, LAB={chalk:'The Chalk Merchant',maverick:'The Calculated Maverick',draw:'The Draw Truther',wolf:'The Lone Wolf',balanced:'The Balanced Head'};
  if(gotWC.pe.personalWrap && gotWC.pe.heroE===EMO[personaH.mine.key] && gotWC.pe.heroL===LAB[personaH.mine.key]) pass('persona hero: '+EMO[personaH.mine.key]+' '+LAB[personaH.mine.key]); else fail('persona hero e='+gotWC.pe.heroE+' l='+gotWC.pe.heroL+' want '+personaH.mine.key); }
{ const mm=gotWC.pe.meters.map(m=>m.b);
  if(mm.join('|')===[personaH.mine.chalk+'%',personaH.mine.draw+'%',personaH.mine.opt+'%',personaH.mine.fade+'%'].join('|')) pass('persona meters: chalk '+personaH.mine.chalk+' / draw '+personaH.mine.draw+' / opt '+personaH.mine.opt+' / fade '+personaH.mine.fade); else fail('persona meters='+JSON.stringify(mm)+' want '+[personaH.mine.chalk,personaH.mine.draw,personaH.mine.opt,personaH.mine.fade]); }
{ const order=[['chalk',0],['maverick',1],['draw',2],['wolf',3],['balanced',4]].map(([k,ord])=>({k,n:personaH.census[k]|0,ord})).sort((a,b)=>b.n-a.n||a.ord-b.ord);
  const wantCounts=order.map(c=>String(c.n));
  if(gotWC.pe.quad.map(x=>x.b).join('|')===wantCounts.join('|')) pass('persona census quad: '+order.map(c=>c.k+' '+c.n).join(', ')); else fail('persona quad='+JSON.stringify(gotWC.pe.quad.map(x=>x.b))+' want '+wantCounts);
  if(gotWC.pe.lines.some(l=>inc(l,'office census'))) pass('persona census verdict line present'); else fail('persona census line missing'); }

// 14 · 🦄 THE UNICORN SCORES
{ const dash=s=>s.replace(/-/g,'–'); const fav=unicornH[0];
  const favRow=gotWC.uc.duo.find(l=>inc(l,dash(fav.sc)));
  if(favRow && inc(favRow,nrdNH(fav.bought)+' bought') && inc(favRow,'landed '+fav.landed+'×')) pass('unicorn favourite '+dash(fav.sc)+': '+fav.bought+' bought / landed '+fav.landed+'×'); else fail('unicorn fav row "'+favRow+'" want '+JSON.stringify(fav));
  const pureExists=unicornH.some(r=>r.landed===0);
  const hasUniLine=gotWC.uc.lines.some(l=>inc(l,'never happened'))||gotWC.uc.lines.some(l=>inc(l,'No pure unicorns'));
  if(hasUniLine) pass('unicorn verdict line renders ('+(pureExists?'a pure unicorn exists':'none — grounded')+')'); else fail('unicorn has no headline line');
  if(gotWC.uc.lines.some(l=>inc(l,'🥇')&&inc(l,'landed'))) pass('unicorn best-paying humble scoreline line present'); else fail('unicorn humble line missing'); }

// ---- assertions ----
if(got.onPill && got.onPill.includes('The Lab')) pass('mode pill switched (The Lab)'); else fail('mode pill not on: '+got.onPill);
if(got.badgeAfter===false) pass('NEW badge cleared after visit'); else fail('NEW badge still on after click');
if(got.tiles===6) pass('6 KPI tiles'); else fail('tiles='+got.tiles);
['The points curve','Desk spread','Raffle or racetrack?','The hive mind','The payoff matrix','The overconfidence curve','The herd-o-meter','The scoreline lab','The markets lab','The scoreline stock market','The draw blind spot','Goals by round','Home-soil bias','The favourite tax','The form curve','The graveyard shift','The predictability ladder','The streak spectrum','Stage wins','The photo finish','The belt races','The champion market','The armband ledger','Still alive','Swing matches','The founding members','Odds & ends'].forEach(t=>{
  if(got.titles.includes(t)) pass('card present: '+t); else fail('card MISSING: '+t);
});
// batch 5 numeric checks
if(!got.ledger.pend && got.ledger.tiles.join('|')===[expArmed,expCashed,expBurned,expPendCh,expDoubled,0].join('|'))
  pass('armband ledger tiles = '+[expArmed,expCashed,expBurned,expPendCh,expDoubled,0].join('/'));
else fail('ledger tiles='+JSON.stringify(got.ledger.tiles)+' expected '+[expArmed,expCashed,expBurned,expPendCh,expDoubled,0]);
if(!got.grave.pend && got.grave.meters.length===expSlotN && (expSlot0==null||got.grave.meters[0].endsWith(expSlot0+'%')))
  pass('graveyard shift: '+expSlotN+' slots, first = '+expSlot0+'%');
else fail('grave meters='+JSON.stringify(got.grave.meters)+' expected '+expSlotN+' slots / '+expSlot0+'%');
const row20=got.market5.rows.find(x=>x.startsWith('2–0'));
if(!got.market5.pend && row20 && row20.includes(expT20+' tickets · '+expP20+' paid') && row20.endsWith(expEV20+'/tkt'))
  pass('stock market 2–0: '+expT20+' tickets, '+expP20+' paid, EV '+expEV20);
else fail('market row "'+row20+'" expected '+expT20+'/'+expP20+'/'+expEV20);
const hbM=got.homesoil.meters.find(x=>/home side$/.test(x)||/calls on the home side/.test(x));
const hwM=got.homesoil.meters.find(x=>/actually winning/.test(x));
if(!got.homesoil.pend && hbM && hbM.includes(expHB+'%') && hwM && hwM.includes(expHW+'%'))
  pass('home-soil bias: backed '+expHB+'% vs wins '+expHW+'%');
else fail('homesoil meters='+JSON.stringify(got.homesoil.meters)+' expected '+expHB+'/'+expHW);
const dM=got.blind.meters.find(x=>/Draw calls/.test(x)), wM=got.blind.meters.find(x=>/Win calls/.test(x));
if(!got.blind.pend && dM && dM.includes(expDrawAcc+'%') && wM && wM.includes(expWinAcc+'%'))
  pass('draw blind spot: draws '+expDrawAcc+'% vs wins '+expWinAcc+'%');
else fail('blind meters='+JSON.stringify(got.blind.meters)+' expected '+expDrawAcc+'/'+expWinAcc);
if(!got.founding.pend && got.founding.meters.length===3 && got.founding.meters.every((m,i)=>m.endsWith(expTer[i])))
  pass('founding members terciles = '+expTer.join(' / '));
else fail('founding meters='+JSON.stringify(got.founding.meters)+' expected '+expTer.join('/'));
if(got.yous.some(y=>/1st.*to join/.test(y))) pass('founding: "1st to join" personal line'); else fail('join-rank line missing: '+got.yous.join(' | '));
// Wave C·1 wayfinding: five labeled section chips instead of one chip per card
if(got.jump.present && got.jump.chips===5 && got.jump.labels.join(',')==='race,endgame,crowd,football,calls'
   && /^The race — /.test(got.jump.firstTitle||''))
  pass('jump chips: 5 labeled section chips (race…calls), first → The race');
else fail('jump: present='+got.jump.present+' chips='+got.jump.chips+' labels='+JSON.stringify(got.jump.labels)+' first='+got.jump.firstTitle);
{
  const expSecs=[['nrdsec-race','The race'],['nrdsec-endgame','The endgame'],['nrdsec-crowd','The crowd'],['nrdsec-football','The football'],['nrdsec-calls','The calls']];
  const gotSecs=got.secs.wraps.map(w=>[w.id,w.lab]);
  if(JSON.stringify(gotSecs)===JSON.stringify(expSecs)) pass('sections: 5 wraps in order — race, endgame, crowd, football, calls');
  else fail('sections='+JSON.stringify(gotSecs));
  // every card lives in a section except the deliberate footer (Odds & ends)
  if(got.secs.orphans.length===1 && got.secs.orphans[0]==='Odds & ends'
     && got.secs.inWraps===got.jump.cards-1)
    pass('section coverage: '+got.secs.inWraps+' of '+got.jump.cards+' cards grouped, only "Odds & ends" outside');
  else fail('section orphans='+JSON.stringify(got.secs.orphans)+' inWraps='+got.secs.inWraps+' cards='+got.jump.cards);
  // per-section counts are non-degenerate (signed-in seed: journey present → race has 8)
  const cnt={};got.secs.wraps.forEach(w=>cnt[w.id]=w.n);
  if(cnt['nrdsec-race']===8&&cnt['nrdsec-endgame']===8&&cnt['nrdsec-crowd']===9&&cnt['nrdsec-football']===7&&cnt['nrdsec-calls']===8)
    pass('section sizes: race 8 · endgame 8 · crowd 9 · football 7 · calls 8');
  else fail('section sizes='+JSON.stringify(cnt));
}
// batch 4 numeric checks
if(!got.raffle.pend && got.raffle.n==='n = '+expQual && got.raffle.tiles[0]==='×'+expMult && got.raffle.tiles[1]===expSkill+'%')
  pass('raffle-or-racetrack: ×'+expMult+' spread, '+expSkill+'% skill, n='+expQual);
else fail('raffle tiles='+JSON.stringify(got.raffle.tiles)+' n="'+got.raffle.n+'" expected ×'+expMult+' / '+expSkill+'% / n='+expQual);
if(!got.ladder.pend && got.ladder.bars===ladderRounds.length && (expMD1==null||got.ladder.firstBar===expMD1+'%'))
  pass('predictability ladder: '+got.ladder.bars+' rounds, MD1 = '+got.ladder.firstBar);
else fail('ladder bars='+got.ladder.bars+'/'+ladderRounds.length+' firstBar='+got.ladder.firstBar+' expected '+expMD1+'%');
if(!got.photo.pend && got.photo.tiles.join('|')===[expCushion,expTop5,expBrk].join('|'))
  pass('photo finish: cushion '+expCushion+' · top5 '+expTop5+' · break '+expBrk);
else fail('photo tiles='+JSON.stringify(got.photo.tiles)+' expected '+[expCushion,expTop5,expBrk]);
const oracleRow=got.belts.rows.find(x=>/^🔮?\s*Oracle/.test(x)||/Oracle/.test(x));
if(!got.belts.pend && got.belts.rows.length===4 && oracleRow && oracleRow.includes(expOracleLead.name.split(' ')[0]) && oracleRow.endsWith(String(expOracleLead.v)))
  pass('belt races: 4 belts, Oracle = '+expOracleLead.name.split(' ')[0]+' at '+expOracleLead.v);
else fail('belts rows='+JSON.stringify(got.belts.rows).slice(0,300)+' expected Oracle '+expOracleLead.name+' '+expOracleLead.v);
const hotRow=got.belts.rows.find(x=>/Hot Hand/.test(x));
if(hotRow && hotRow.endsWith('×'+expHotLead)) pass('belt races: Hot Hand record ×'+expHotLead); else fail('hot row "'+hotRow+'" expected ×'+expHotLead);
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
// Trophy Room race pulse — replicate the oracle race's expected tension line
await pg.waitForTimeout(400);
{
  const co=oracleArr.filter(x=>x.v===oracleArr[0].v).length;
  const w1=oracleArr.filter(x=>oracleArr[0].v-x.v===1).length;
  const expectPulse = co>=2 ? (co+'-way dead heat') : (w1>=1 ? (w1+' challenger') : null);
  const awTxt = await pg.evaluate(()=>{ const hd=Array.from(document.querySelectorAll('.aw-card .aw-t b')).find(b=>b.textContent.trim()==='Oracle');
    const c=hd&&hd.closest('.aw-card'); const p=c&&Array.from(c.querySelectorAll('.aw-race')).find(x=>x.textContent.includes('🔥')); return p?p.textContent.replace(/\s+/g,' ').trim():null; });
  if(expectPulse===null){ if(awTxt===null) pass('trophy race pulse: correctly absent for Oracle'); else fail('race pulse should be absent, got "'+awTxt+'"'); }
  else if(awTxt && awTxt.includes(expectPulse)) pass('trophy race pulse: "'+expectPulse+'" shown on Oracle'); else fail('race pulse "'+awTxt+'" expected to include "'+expectPulse+'"');
}

/* ---- Trophy Room pass 2: cabinet · chasing packs · race depth/pace · dept ladder · race distance ---- */
const ordinal_=n=>{const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);};
// expected dept ladder (mirrors deptLeague: avg desc → sum desc → name; min 5 players)
const dmap={}; standings.forEach(r=>{ (dmap[r.dept]=dmap[r.dept]||[]).push(r.pts); });
const expDL=Object.keys(dmap).map(d=>{ const a=dmap[d], sum=a.reduce((p,q)=>p+q,0); return {d, n:a.length, sum, avg:sum/a.length}; })
  .filter(x=>x.n>=5).sort((a,b)=>b.avg-a.avg||b.sum-a.sum||a.d.localeCompare(b.d));
// expected podium leader (mirrors cmpSt → name)
const podTop=standings.slice().sort((a,b)=>(b.pts-a.pts)||(b.predicted-a.predicted)||(b.exact-a.exact)||(b.correct-a.correct)||a.name.localeCompare(b.name))[0];
// THE CABINET
{
  const cab=await pg.evaluate(()=>Array.from(document.querySelectorAll('.aw-cab .aw-slot')).map(s=>({
    id:((s.getAttribute('onclick')||'').match(/awJump\('([^']+)'\)/)||[])[1]||'',
    who:(s.querySelector('b')||{textContent:''}).textContent.trim(),
    val:(s.querySelector('.vv')||{textContent:''}).textContent.trim()})));
  if(cab.length===6 && cab.map(s=>s.id).join(',')==='aw-podium,aw-oracle,aw-trailblazer,aw-hothand,aw-perfectionist,aw-dept')
    pass('cabinet: 6 shelves in honour order'); else fail('cabinet shelves: '+JSON.stringify(cab.map(s=>s.id)));
  const oSlot=cab[1], expWho=(oracleArr[0].name||'').split(' ')[0];
  if(oSlot && oSlot.who===expWho && oSlot.val===oracleArr[0].v+' exact') pass('cabinet Oracle shelf: '+oSlot.who+' · '+oSlot.val);
  else fail('cabinet Oracle shelf '+JSON.stringify(oSlot)+' want '+expWho+' / '+oracleArr[0].v+' exact');
  const pSlot=cab[0];
  if(pSlot && pSlot.who===podTop.name.split(' ')[0] && pSlot.val===podTop.pts+' pts') pass('cabinet Podium shelf: '+pSlot.who+' · '+pSlot.val);
  else fail('cabinet Podium shelf '+JSON.stringify(pSlot)+' want '+podTop.name.split(' ')[0]+' / '+podTop.pts+' pts');
  const dSlot=cab[5];
  if(dSlot && dSlot.who===expDL[0].d && dSlot.val===(Math.round(expDL[0].avg*10)/10)+' avg') pass('cabinet Dept Cup shelf: '+dSlot.who+' · '+dSlot.val);
  else fail('cabinet Dept shelf '+JSON.stringify(dSlot)+' want '+expDL[0].d+' / '+(Math.round(expDL[0].avg*10)/10)+' avg');
  const targets=await pg.evaluate(()=>['aw-podium','aw-oracle','aw-trailblazer','aw-hothand','aw-perfectionist','aw-dept','aw-dist'].filter(id=>!document.getElementById(id)));
  if(!targets.length) pass('every cabinet shelf has a jump target card'); else fail('missing jump targets: '+targets.join(','));
}
// CHASING PACK on Oracle
{
  const expPack=Math.min(5,Math.max(0,oracleArr.length-3));
  const st=await pg.evaluate(()=>{ const c=document.getElementById('aw-oracle'); const b=c&&c.querySelector('.aw-more'); const p=c&&c.querySelector('.aw-pack');
    return {btn:b?b.textContent.replace(/\s+/g,' ').trim():null, hidden:p?p.hidden:null, rows:p?p.querySelectorAll('.aw-row').length:0,
      firstRk:p&&p.querySelector('.aw-rk')?p.querySelector('.aw-rk').textContent.trim():null}; });
  if(oracleArr.length>3){
    if(st.btn && st.btn.includes(String(oracleArr.length-3)) && st.hidden===true && st.rows===expPack && st.firstRk==='#4')
      pass('oracle chasing pack: '+st.rows+' rows behind the fold, ranks from #4');
    else fail('oracle pack state '+JSON.stringify(st)+' want '+expPack+' rows from #4');
    await pg.evaluate(()=>document.getElementById('aw-oracle').querySelector('.aw-more').click());
    const openSt=await pg.evaluate(()=>{ const c=document.getElementById('aw-oracle');
      return {hidden:c.querySelector('.aw-pack').hidden, aria:c.querySelector('.aw-more').getAttribute('aria-expanded')}; });
    if(openSt.hidden===false && openSt.aria==='true') pass('oracle chasing pack opens on tap'); else fail('pack did not open: '+JSON.stringify(openSt));
  } else if(st.btn===null) pass('oracle pack correctly absent (race ≤3 deep)'); else fail('unexpected pack on a shallow race');
}
// RACE DEPTH + WINNING PACE lines on Oracle
{
  const T=world.fixtures.length, S=settledIds.length;
  const proj=Math.round(oracleArr[0].v*T/S);
  const expDepth=oracleArr.length>3, expPace=(S>=20&&S<T&&proj>oracleArr[0].v);
  const races=await pg.evaluate(()=>Array.from(document.getElementById('aw-oracle').querySelectorAll('.aw-race')).map(x=>x.textContent.replace(/\s+/g,' ').trim()));
  const depthLine=races.find(t=>t.includes('in this race'))||null;
  const paceLine=races.find(t=>t.includes('winning pace'))||null;
  if(expDepth ? (depthLine&&depthLine.includes(String(oracleArr.length))) : depthLine===null)
    pass('race depth line: '+(depthLine||'absent, correctly')); else fail('depth line "'+depthLine+'" want n='+oracleArr.length);
  if(expPace ? (paceLine&&paceLine.includes(String(proj))) : paceLine===null)
    pass('pace line: '+(paceLine||'absent, correctly ('+S+'/'+T+' proj '+proj+' vs '+oracleArr[0].v+')')); else fail('pace line "'+paceLine+'" want proj='+proj+' (S='+S+')');
}
// YOUR RANK in the race (me = Khalid)
{
  const meIdx=oracleArr.findIndex(x=>x.name==='Khalid Al-Mannai');
  const you=await pg.evaluate(()=>{ const y=document.getElementById('aw-oracle').querySelector('.aw-you'); return y?y.textContent.replace(/\s+/g,' ').trim():null; });
  if(meIdx===0){ if(you&&you.includes('You hold it')) pass('oracle you-line: leader crown'); else fail('you-line "'+you+'" want You hold it'); }
  else if(meIdx>0){ if(you&&you.includes(ordinal_(meIdx+1)+' of '+oracleArr.length+' in the race')) pass('oracle you-line rank: '+ordinal_(meIdx+1)+' of '+oracleArr.length);
    else fail('you-line "'+you+'" want rank '+ordinal_(meIdx+1)+' of '+oracleArr.length); }
  else { if(you===null||!you.includes('in the race')) pass('oracle you-line: no rank (me holds no exact)'); else fail('unexpected rank on you-line: '+you); }
}
// DEPT CUP ladder: bars on every ranked squad, chasing squads behind the fold
{
  const d=await pg.evaluate(()=>{ const c=document.getElementById('aw-dept'); if(!c)return null; const p=c.querySelector('.aw-pack'); const b=c.querySelector('.aw-more');
    return {rows:c.querySelectorAll('.aw-row').length, bars:c.querySelectorAll('.aw-dbar').length,
      btn:b?b.textContent.replace(/\s+/g,' ').trim():null, packRows:p?p.querySelectorAll('.aw-row').length:0}; });
  const expTop=Math.min(3,expDL.length), expPackD=Math.max(0,Math.min(12,expDL.length)-3);
  if(d && d.rows===expTop+expPackD && d.bars===d.rows) pass('dept ladder: '+d.rows+' squads, every one with an avg bar ('+expTop+' up + '+expPackD+' folded)');
  else fail('dept ladder '+JSON.stringify(d)+' want rows='+(expTop+expPackD)+' with bars');
  if(expDL.length>3){ if(d && d.btn && d.btn.includes(String(expDL.length-3))) pass('chasing squads button: "'+d.btn+'"'); else fail('dept pack button "'+(d&&d.btn)+'" want '+(expDL.length-3)); }
  else if(d && d.btn===null) pass('dept pack correctly absent (≤3 squads)'); else fail('unexpected dept pack button');
}
// RACE DISTANCE meter
{
  const T=world.fixtures.length, S=settledIds.length, expPct=Math.round(S/T*100)+'%';
  const rd=await pg.evaluate(()=>{ const c=document.getElementById('aw-dist'); if(!c)return null;
    return {prz:c.querySelector('.aw-prz').textContent.trim(), pct:c.querySelector('.nrd-meter .lab b').textContent.trim(),
      line:(c.querySelector('.nrd-line')||{textContent:''}).textContent.replace(/\s+/g,' ').trim()}; });
  if(rd && rd.prz===S+' / '+T && rd.pct===expPct && rd.line.includes(String(T-S))) pass('race distance: '+rd.prz+' · '+rd.pct);
  else fail('race distance '+JSON.stringify(rd)+' want '+S+' / '+T+' · '+expPct);
}

/* screenshots for the eyeball pass — Awards first (we're already in it, oracle pack open) */
await pg.waitForTimeout(300);
await pg.screenshot({ path: `${SCRATCH}/awards-390.png`, fullPage: true });
console.log('screenshot:', `${SCRATCH}/awards-390.png`);
await pg.locator('#lbmode button[data-m="nerds"]').click();
await pg.waitForSelector('.nrd-quad', {timeout:8000}).catch(()=>{});
await pg.waitForTimeout(700);
await pg.screenshot({ path: `${SCRATCH}/nerds-390.png`, fullPage: true });
console.log('screenshot:', `${SCRATCH}/nerds-390.png`);

/* ================= WAVE C — gate checks (?tv kiosk · signed-out · below-floor) ================= */
/* Boot a fresh context into the Lab with a given identity / KV / tv-flag, returning the page +
   its own error log. Mirrors PASS B's Supabase stub so no live traffic is needed. */
async function openLab(cfg){
  const ctx2 = await browser.newContext({ viewport:{width:390,height:844} });
  const pg2 = await ctx2.newPage();
  const e2 = [];
  pg2.on('pageerror', e=>e2.push('PAGEERROR: '+e.message));
  pg2.on('console', m=>{ if(m.type()==='error' && !/Failed to load resource/.test(m.text())) e2.push('CONSOLE: '+m.text()); });
  await pg2.addInitScript(({now, meSlug, revealed, wnVer})=>{
    const off = new Date(now).getTime() - Date.now(); const RD = Date;
    function ND(...a){ return a.length===0 ? new RD(RD.now()+off) : new RD(...a); }
    ND.now = ()=>RD.now()+off; ND.parse=RD.parse.bind(RD); ND.UTC=RD.UTC.bind(RD); ND.prototype=RD.prototype; window.Date=ND;
    if(meSlug) localStorage.setItem('wc:me', JSON.stringify(meSlug)); else localStorage.removeItem('wc:me');
    localStorage.setItem('wc:revealed', JSON.stringify(revealed)); localStorage.setItem('wc:whatsnew', wnVer);
  }, { now: NOW, meSlug: cfg.me||null, revealed: Object.keys(results_), wnVer: world.wnVer });
  await pg2.route('**://fonts.googleapis.com/**', r=>r.fulfill({status:200, contentType:'text/css', body:''}));
  await pg2.route('**://fonts.gstatic.com/**', r=>r.abort());
  await pg2.route('**://flagcdn.com/**', flagStub);
  await pg2.route('**://site.api.espn.com/**', r=>r.fulfill({status:200, contentType:'application/json', body:'{}'}));
  const KVx = cfg.kv||KV, standx = cfg.standings||standings;
  await pg2.route('**://*.supabase.co/**', r=>{
    const u = new URL(r.request().url());
    const send = j=>r.fulfill({status:200, contentType:'application/json', body:JSON.stringify(j)});
    if (u.pathname.endsWith('/rpc/server_time')) return send(NOW);
    if (u.pathname.endsWith('/rpc/standings')) return send(standx);
    if (u.pathname.endsWith('/rpc/consensus_counts')) return send({n:0,champN:0,champMap:{},map:{}});
    if (u.pathname.endsWith('/rpc/room_board')) return send([]);
    if (u.pathname.endsWith('/kv')) {
      const key = u.searchParams.get('key')||'';
      if (key.startsWith('in.')) { const names=decodeURIComponent(key.slice(3)).replace(/^\(|\)$/g,'').split(',').map(s=>s.replace(/^"|"$/g,'').replace(/\\"/g,'"')); return send(names.filter(k=>k in KVx).map(k=>({key:k, value:JSON.stringify(KVx[k])}))); }
      if (key.startsWith('eq.')) { const k=decodeURIComponent(key.slice(3)); return send(k in KVx ? [{key:k, value:JSON.stringify(KVx[k])}] : []); }
      if (key.startsWith('like.')) { const pre=decodeURIComponent(key.slice(5)).replace(/\*$/,''); return send(Object.keys(KVx).filter(k=>k.startsWith(pre)).sort().map(k=>({key:k, value:JSON.stringify(KVx[k])}))); }
      return send([]);
    }
    return r.fulfill({status:404, body:'{}'});
  });
  await pg2.goto(PAGE_URL + (cfg.tv?'?tv':''));
  await pg2.waitForFunction(()=>typeof state!=='undefined' && typeof CONS!=='undefined', null, {timeout:15000}).catch(()=>{});
  await pg2.waitForTimeout(500);
  await pg2.evaluate(()=>{ try{ go('leaderboard'); }catch(e){} });
  await pg2.waitForTimeout(200);
  await pg2.evaluate(()=>{ const b=document.querySelector('#lbmode button[data-m="nerds"]'); if(b) b.click(); });
  await pg2.waitForFunction(()=>typeof CONS!=='undefined' && CONS.full, null, {timeout:12000}).catch(()=>{});
  await pg2.waitForTimeout(700);
  return { ctx2, pg2, e2 };
}
const WAVEC_TITLES=['The futures board','The time machine','Your rank journey','The comeback king','Title lifelines','The prediction twin','Heart vs head','Golden goose & heartbreaker','Clutch rating','Alternate universes','The chaos meter','The fragility index','Predictor personality','The unicorn scores'];

// (a) ?tv kiosk — personal chrome hidden by CSS (.tv .nrd-personal / .tv .aw-you → display:none)
{
  const tv = await openLab({ me:'khalid-almannai', tv:true });
  const c = await tv.pg2.evaluate(()=>{
    const per=Array.from(document.querySelectorAll('.nrd-personal')), you=Array.from(document.querySelectorAll('.aw-you'));
    const allNone=els=>els.every(e=>getComputedStyle(e).display==='none');
    return { onTv:document.body.classList.contains('tv'), labShown:!!document.querySelector('.nrd-tiles'),
      perN:per.length, youN:you.length, perHidden:per.length>0&&allNone(per), youHidden:you.length>0&&allNone(you) };
  });
  await tv.pg2.screenshot({ path:`${SCRATCH}/nerds-tv-390.png`, fullPage:true }).catch(()=>{});
  if(c.onTv && c.labShown && c.perN>0 && c.perHidden) pass('?tv kiosk: '+c.perN+' .nrd-personal card(s) present but display:none'); else fail('tv .nrd-personal: '+JSON.stringify(c));
  if(c.youN>0 && c.youHidden) pass('?tv kiosk: '+c.youN+' .aw-you line(s) present but display:none'); else fail('tv .aw-you: '+JSON.stringify(c));
  if(tv.e2.length===0) pass('?tv kiosk: zero page errors'); else fail('tv errors: '+tv.e2.join(' || '));
  await tv.ctx2.close();
}
// (b) signed-out — no personal cards, no .aw-you at all; office cards still read
{
  const so = await openLab({ me:null, tv:false });
  const c = await so.pg2.evaluate(()=>{
    const titles=Array.from(document.querySelectorAll('.aw-card .aw-t b')).map(b=>b.textContent.trim());
    return { labShown:!!document.querySelector('.nrd-tiles'), journey:titles.includes('Your rank journey'),
      youN:document.querySelectorAll('.aw-you').length, futures:titles.includes('The futures board'), signedOut:(typeof state!=='undefined') };
  });
  if(c.labShown && !c.journey && c.futures) pass('signed-out: office Lab renders, no 🎢 rank-journey card'); else fail('signed-out cards: '+JSON.stringify(c));
  if(c.youN===0) pass('signed-out: zero .aw-you personal lines in the Lab'); else fail('signed-out .aw-you count='+c.youN);
  if(so.e2.length===0) pass('signed-out: zero page errors'); else fail('signed-out errors: '+so.e2.join(' || '));
  await so.ctx2.close();
}
// (d) below-floor world (4 players) — starved cards degrade to .aw-pend, never NaN / empty charts
{
  const fewBlobs = blobs.slice(0,4);
  const KV3 = { 'wc:results':results_, 'wc:kteams':kteams, 'wc:powerups_live':true };
  fewBlobs.forEach(b=>{ KV3['wc:player:'+b.slug]=b; });
  const standings3 = standings.filter(s=>fewBlobs.some(b=>b.slug===s.slug));
  const bf = await openLab({ me:'khalid-almannai', tv:false, kv:KV3, standings:standings3 });
  const c = await bf.pg2.evaluate((titles)=>{
    const byT=t=>{const b=Array.from(document.querySelectorAll('.aw-card .aw-t b')).find(x=>x.textContent.trim()===t);return b?b.closest('.aw-card'):null;};
    let pend=0,nan=false,present=0,starved=[];
    titles.forEach(t=>{const el=byT(t);if(!el)return;present++;if(el.querySelector('.aw-pend')){pend++;starved.push(t);}if(/NaN/.test(el.textContent))nan=true;});
    return { labShown:!!document.querySelector('.nrd-tiles'), pend, nan, present, starved };
  }, WAVEC_TITLES);
  if(c.labShown && c.pend>0) pass('below-floor (4 players): '+c.pend+' Lab card(s) show .aw-pend — '+c.starved.join(', ')); else fail('below-floor pend='+c.pend+' '+JSON.stringify(c));
  if(!c.nan) pass('below-floor: no "NaN" in any Wave-C card'); else fail('below-floor leaked NaN');
  if(bf.e2.length===0) pass('below-floor: zero page errors'); else fail('below-floor errors: '+bf.e2.join(' || '));
  await bf.ctx2.close();
}

if(errs.length){ fail('page errors: '+errs.join(' || ')); } else pass('zero page errors');

await browser.close();
const bad = results.filter(r=>r[0]==='FAIL').length;
console.log(bad? `\n${bad} FAILURES` : '\nALL GREEN');
process.exit(bad?1:0);
