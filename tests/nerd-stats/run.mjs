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
            firstTitle: $('.nrd-jump button')?$('.nrd-jump button').title:null },
    yous: $$('.aw-you').map(y=>text(y)),
  };
});
console.log(JSON.stringify(got,null,1).slice(0,3600));

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
if(got.jump.present && got.jump.chips===got.jump.cards && got.jump.firstTitle==='The points curve')
  pass('jump chips: '+got.jump.chips+' chips = '+got.jump.cards+' cards, first → The points curve');
else fail('jump: present='+got.jump.present+' chips='+got.jump.chips+' cards='+got.jump.cards+' first='+got.jump.firstTitle);
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

if(errs.length){ fail('page errors: '+errs.join(' || ')); } else pass('zero page errors');

await browser.close();
const bad = results.filter(r=>r[0]==='FAIL').length;
console.log(bad? `\n${bad} FAILURES` : '\nALL GREEN');
process.exit(bad?1:0);
