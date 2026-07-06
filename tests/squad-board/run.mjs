// Squad board (2026-07-06) — headless proof over the REAL page.
// Boots index.html against a mocked Supabase REST layer seeded with 87 players across
// four departments (one under the DEPT_MIN floor, one 70-strong to exercise windowing,
// a within-squad points tie, and a rank snapshot that reorders one squad overnight),
// then drives: Departments → tap a squad → the inside-one-department board, the back
// button, the unranked small-squad path, the Me-card "Squad board ›" deep link, and the
// mode-pill reset. Every rank / subline / arrow asserted is INDEPENDENTLY RECOMPUTED
// here from the same seed. No live traffic, no writes.
// Run: node tests/squad-board/run.mjs  (env: CHROMIUM_BIN, PLAYWRIGHT_DIR, OUT_DIR)
import fs from 'fs';
import os from 'os';

const { chromium } = await import(process.env.PLAYWRIGHT_DIR || '/opt/node22/lib/node_modules/playwright/index.mjs');
const PAGE_URL = new URL('../../index.html', import.meta.url).href;
const SCRATCH = process.env.OUT_DIR || (os.tmpdir() + '/squad-board-out');
fs.mkdirSync(SCRATCH, { recursive: true });
const results = []; const fail = (m)=>{results.push(['FAIL',m]);console.log('FAIL',m);};
const pass = (m)=>{results.push(['PASS',m]);console.log('PASS',m);};

/* ---------- seeded world: standings only (the squad board reads nothing else) ---------- */
// cmpSt mirror: pts, then predictions, exacts, corrects (the page's office scoring order)
const cmpSt=(a,b)=>(b.pts|0)-(a.pts|0)||((b.predicted|0)-(a.predicted|0))||((b.exact|0)-(a.exact|0))||((b.correct|0)-(a.correct|0));
const standings=[];
// Group Treasury (6): t1 is the office frontrunner AND oracle, so the Compliance leader's
// only title is ⭐ Squad Captain — the chip this test pins down.
for(let i=0;i<6;i++)standings.push({slug:'t'+(i+1),name:'Treasury P'+(i+1),dept:'Group Treasury',pts:900-i*10,exact:i===0?9:1,correct:40,predicted:72});
// Compliance (8): strictly descending, EXCEPT c2/c3 — a dead tie on every key (within-squad
// rank must read 1,2,2,4,…). The rank snapshot below swaps c1/c2's overnight order.
for(let i=0;i<8;i++){const tie=(i===2);standings.push({slug:'c'+(i+1),name:'Compliance P'+(i+1),dept:'Compliance',pts:tie?800-10:800-i*10,exact:tie?2:2,correct:tie?30:30,predicted:72});}
// Group Risk (70, mine): 69 players at 500-3i, me wedged at 298 → 69th of 70, below the 60-row fold.
for(let i=0;i<69;i++)standings.push({slug:'gr'+(i+1),name:'Risk P'+(i+1),dept:'Group Risk',pts:500-i*3,exact:1,correct:20,predicted:72});
standings.push({slug:'khalid-almannai',name:'Khalid Al-Mannai',dept:'Group Risk',pts:298,exact:1,correct:12,predicted:72});
// Executive Office (3): under the DEPT_MIN=5 floor → league lists it as "not yet ranked".
for(let i=0;i<3;i++)standings.push({slug:'x'+(i+1),name:'Exec P'+(i+1),dept:'Executive Office',pts:400-i*10,exact:0,correct:15,predicted:70});

/* office ranks (tie-aware) — feed the subline assertions */
const all=standings.slice().sort((a,b)=>cmpSt(a,b)||a.name.localeCompare(b.name));
const officeRk={};{let rk=0,pv=null;all.forEach((r,i)=>{if(pv===null||cmpSt(r,pv)!==0){rk=i+1;pv=r;}officeRk[r.slug]=rk;});}

/* overnight snapshot: yesterday c2 led Compliance (office rank 15) over c1 (16) — today c1
   leads → within-squad arrows must read c1 ▲1, c2 ▼1. Other squads: snapshot order = today's
   order (flat/– arrows are fine; we only pin the Compliance pair). */
const snapRanks={};all.forEach(r=>{snapRanks[r.slug]=officeRk[r.slug];});
['c2','c1','c3','c4','c5','c6','c7','c8'].forEach((s,i)=>{snapRanks[s]=7+i;}); // yesterday: c2 first, c1 second, rest in today's order

/* per-squad expectations, replicating the page's within-squad pass */
const squadOf=d=>standings.filter(r=>r.dept===d).sort((a,b)=>cmpSt(a,b)||a.name.localeCompare(b.name));
const ranksOf=m=>{let rk=0,pv=null;return m.map((r,i)=>{if(pv===null||cmpSt(r,pv)!==0){rk=i+1;pv=r;}return rk;});};
const comp=squadOf('Compliance'), compRanks=ranksOf(comp);
const gr=squadOf('Group Risk');
const sumOf=m=>m.reduce((p,q)=>p+q.pts,0), avgOf=m=>Math.round(sumOf(m)/m.length*10)/10;
// league (avg desc, DEPT_MIN=5 floor) → Group Treasury #1, Compliance #2, Group Risk #3
const league=[['Group Treasury',squadOf('Group Treasury')],['Compliance',comp],['Group Risk',gr]]
  .map(([d,m])=>({d,avg:avgOf(m)})).sort((a,b)=>b.avg-a.avg);
console.log('EXPECTED:', JSON.stringify({league:league.map(x=>x.d), compRanks:compRanks.join(','),
  compAvg:avgOf(comp), compSum:sumOf(comp), grN:gr.length, meOfficeRk:officeRk['khalid-almannai'], c1OfficeRk:officeRk.c1}));

const KV={ 'wc:results':{}, 'wc:powerups_live':false,
  'wc:ranksnap':{t:Date.now()-3600e3, ranks:snapRanks},
  'wc:player:khalid-almannai':{slug:'khalid-almannai',name:'Khalid Al-Mannai',dept:'Group Risk',ig:'khalid',country:'Qatar',predictions:{}} };
const NOW=new Date().toISOString();

/* ---------- boot the real page against the mock ---------- */
const browser=await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || '/opt/pw-browsers/chromium',
  args:['--force-prefers-reduced-motion'] });
const ctx=await browser.newContext({ viewport:{width:390,height:844} });
const pg=await ctx.newPage();
const errs=[];
pg.on('pageerror', e=>errs.push('PAGEERROR: '+e.message));
pg.on('console', m=>{ if(m.type()==='error' && !/Failed to load resource/.test(m.text())) errs.push('CONSOLE: '+m.text()); });

await pg.addInitScript(({meSlug})=>{
  localStorage.setItem('wc:me', JSON.stringify(meSlug));
  localStorage.setItem('wc:revealed', JSON.stringify([]));
}, {meSlug:'khalid-almannai'});
// suppress the one-time spotlight without knowing WHATSNEW_VER: stamp it from the page global on boot
await pg.addInitScript(()=>{ const t=setInterval(()=>{ try{ if(typeof WHATSNEW_VER!=='undefined'){localStorage.setItem('wc:whatsnew',WHATSNEW_VER);clearInterval(t);} }catch(e){} },10); });

await pg.route('**://fonts.googleapis.com/**', r=>r.fulfill({status:200, contentType:'text/css', body:''}));
await pg.route('**://fonts.gstatic.com/**', r=>r.abort());
await pg.route('**://flagcdn.com/**', r=>r.abort());
await pg.route('**://site.api.espn.com/**', r=>r.fulfill({status:200, contentType:'application/json', body:'{}'}));
await pg.route('**://*.supabase.co/**', r=>{
  const u=new URL(r.request().url());
  const send=j=>r.fulfill({status:200, contentType:'application/json', body:JSON.stringify(j)});
  if(u.pathname.endsWith('/rpc/server_time'))return send(NOW);
  if(u.pathname.endsWith('/rpc/standings'))return send(standings);
  if(u.pathname.endsWith('/rpc/consensus_counts'))return send({n:0,champN:0,champMap:{},map:{}});
  if(u.pathname.endsWith('/rpc/room_board'))return send([]);
  if(u.pathname.endsWith('/kv')){
    const key=u.searchParams.get('key')||'';
    if(key.startsWith('in.')){const names=decodeURIComponent(key.slice(3)).replace(/^\(|\)$/g,'').split(',').map(s=>s.replace(/^"|"$/g,'').replace(/\\"/g,'"'));
      return send(names.filter(k=>k in KV).map(k=>({key:k,value:JSON.stringify(KV[k])})));}
    if(key.startsWith('eq.')){const k=decodeURIComponent(key.slice(3));return send(k in KV?[{key:k,value:JSON.stringify(KV[k])}]:[]);}
    if(key.startsWith('like.')){const pre=decodeURIComponent(key.slice(5)).replace(/\*$/,'');return send(Object.keys(KV).filter(k=>k.startsWith(pre)).sort().map(k=>({key:k,value:JSON.stringify(KV[k])})));}
    return send([]);
  }
  return r.fulfill({status:404, body:'{}'});
});

await pg.goto(PAGE_URL);
await pg.waitForFunction(()=>typeof state!=='undefined' && state.player && state.meSlug==='khalid-almannai', null, {timeout:15000})
  .catch(()=>fail('boot: signed-in state not reached'));
await pg.waitForTimeout(500);
await pg.evaluate(()=>go('leaderboard'));
await pg.waitForTimeout(300);

/* ---------- 1 · Departments league: rows are tappable doors ---------- */
await pg.locator('#lbmode button[data-m="dept"]').click();
await pg.waitForSelector('.dept-row', {timeout:8000}).then(()=>pass('Departments league renders')).catch(()=>fail('league did not render'));
const lg=await pg.evaluate(()=>({
  order: Array.from(document.querySelectorAll('.dept-row .lb-info .n')).map(x=>x.textContent.replace('YOUR SQUAD','').trim()),
  taps: document.querySelectorAll('.dept-row.tap[data-d][role="button"]').length,
  chevrons: document.querySelectorAll('.dept-row .dept-go').length,
  minis: Array.from(document.querySelectorAll('.sq-mini')).map(b=>b.dataset.d),
  note: (document.querySelector('.dept-note')||{}).textContent||'',
  cta:(()=>{const b=document.querySelector('button.sq-cta');return b?{d:b.dataset.d,txt:b.textContent.replace(/\s+/g,' ').trim(),crest:!!b.querySelector('.avatar.deptbadge'),go:!!b.querySelector('.go')}:null;})()
}));
if(lg.order.join('|')===league.map(x=>x.d).join('|')) pass('league order = '+lg.order.join(' → ')); else fail('league order '+lg.order+' expected '+league.map(x=>x.d));
if(lg.taps===3 && lg.chevrons===3) pass('all 3 ranked rows tappable with chevrons'); else fail('taps='+lg.taps+' chevrons='+lg.chevrons);
if(lg.minis.includes('Executive Office')) pass('small squad listed as a tappable pill'); else fail('sq-mini missing: '+JSON.stringify(lg.minis));
if(/Tap any squad/.test(lg.note)) pass('league note carries the tap hint'); else fail('tap hint missing from note');
const meSquadIdx=gr.findIndex(r=>r.slug==='khalid-almannai');
if(lg.cta && lg.cta.d==='Group Risk' && lg.cta.crest && lg.cta.go && lg.cta.txt.includes('Your squad board — Group Risk') && lg.cta.txt.includes('#'+(meSquadIdx+1)+' of '+gr.length))
  pass('front-door CTA: "'+lg.cta.txt+'"'); else fail('sq-cta '+JSON.stringify(lg.cta));
await pg.locator('button.sq-cta').click();
await pg.waitForSelector('.sqb-hd', {timeout:8000});
const ctaLand=await pg.evaluate(()=>(document.querySelector('.sqb-hd .sq-name')||{}).textContent);
if(ctaLand==='Group Risk') pass('CTA opens MY squad board'); else fail('CTA landed on "'+ctaLand+'"');
await pg.evaluate(()=>closeSquad());
await pg.waitForSelector('.dept-row', {timeout:8000});
await pg.waitForTimeout(600);
await pg.locator('#view-leaderboard').screenshot({ path: `${SCRATCH}/dept-league-390.png` }).catch(()=>{});

/* ---------- 2 · tap Compliance → its inner board ---------- */
await pg.locator('.dept-row[data-d="Compliance"]').click();
await pg.waitForSelector('.sqb-hd', {timeout:8000}).then(()=>pass('squad board renders on tap')).catch(()=>fail('squad board did not render'));
await pg.waitForTimeout(300);
const compIdx=league.findIndex(x=>x.d==='Compliance');
const sb=await pg.evaluate(()=>({
  name: (document.querySelector('.sqb-hd .sq-name')||{}).textContent,
  rankTag: (document.querySelector('.sqb-hd .sq-rank')||{}).textContent,
  sub: (document.querySelector('.sqb-hd .sq-sub')||{}).textContent,
  rows: Array.from(document.querySelectorAll('.lb-row:not(.dept-row)')).map(el=>({
    rank:(el.querySelector('.rank')||{}).textContent, name:(el.querySelector('.lb-info .n').childNodes[0]||{}).textContent, /* first text node — skips the chip/tag spans */
    sub:(el.querySelector('.lb-info .d')||{}).textContent, pts:(el.querySelector('.lb-pts b')||{}).textContent,
    move:(el.querySelector('.rmove')||{}).className, moveTxt:(el.querySelector('.rmove')||{}).textContent, me:el.classList.contains('me'),
    chip:(el.querySelector('.title-chip')||{}).textContent||null })),
  back: !!document.querySelector('.sqb-back'),
  share: !!document.querySelector('.sqb-hd .sq-share')
}));
if(sb.name==='Compliance') pass('header names the squad'); else fail('header name "'+sb.name+'"');
if(sb.rankTag && sb.rankTag.includes((compIdx===0?'🥇':compIdx===1?'🥈':'🥉'))&&sb.rankTag.includes('of '+league.length+' squads'))
  pass('header league position: '+sb.rankTag); else fail('rankTag "'+sb.rankTag+'" expected medal of '+league.length);
if(sb.sub && sb.sub.includes('8 players') && sb.sub.includes(avgOf(comp)+' avg') && sb.sub.includes('Σ '+sumOf(comp)+' pts'))
  pass('header stats: 8 players · '+avgOf(comp)+' avg · Σ '+sumOf(comp)); else fail('header sub "'+sb.sub+'"');
if(sb.back) pass('back button present'); else fail('back button missing');
if(!sb.share) pass('share button absent on a squad that is not mine'); else fail('share shown on foreign squad');
if(sb.rows.length===comp.length) pass('8 player rows'); else fail('rows='+sb.rows.length);
if(sb.rows.map(r=>r.name).join('|')===comp.map(r=>r.name).join('|')) pass('within-squad order matches cmpSt'); else fail('order '+sb.rows.map(r=>r.name).join(','));
if(sb.rows.map(r=>r.rank).join(',')===compRanks.join(',')) pass('tie-aware ranks: '+sb.rows.map(r=>r.rank).join(',')); else fail('ranks '+sb.rows.map(r=>r.rank)+' expected '+compRanks);
if(sb.rows[0].sub==='#'+officeRk.c1+' in the office') pass('office-rank subline: leader is #'+officeRk.c1); else fail('subline "'+sb.rows[0].sub+'" expected #'+officeRk.c1);
if(/\bup\b/.test(sb.rows[0].move) && sb.rows[0].moveTxt==='▲1') pass('overnight ▲1 on the new squad leader (c1)'); else fail('c1 move "'+sb.rows[0].move+'" "'+sb.rows[0].moveTxt+'"');
if(/\bdown\b/.test(sb.rows[1].move) && sb.rows[1].moveTxt==='▼1') pass('overnight ▼1 on the deposed leader (c2)'); else fail('c2 move "'+sb.rows[1].move+'" "'+sb.rows[1].moveTxt+'"');
if(sb.rows[0].chip && sb.rows[0].chip.includes('Squad Captain')) pass('⭐ Squad Captain chip on the squad leader'); else fail('captain chip missing: '+JSON.stringify(sb.rows[0].chip));

/* ---------- 3 · back button returns to the league ---------- */
await pg.locator('.sqb-back').click();
await pg.waitForSelector('.dept-row', {timeout:8000}).then(()=>pass('back → league')).catch(()=>fail('back did not return to league'));

/* ---------- 4 · small squad opens unranked ---------- */
await pg.locator('.sq-mini[data-d="Executive Office"]').click();
await pg.waitForSelector('.sqb-hd', {timeout:8000});
const xo=await pg.evaluate(()=>({ rankTag:(document.querySelector('.sqb-hd .sq-rank')||{}).textContent,
  rows:document.querySelectorAll('.lb-row:not(.dept-row)').length }));
if(xo.rankTag && /Unranked/.test(xo.rankTag)) pass('small squad shows "'+xo.rankTag+'"'); else fail('unranked tag "'+xo.rankTag+'"');
if(xo.rows===3) pass('3 rows for the 3-player squad'); else fail('rows='+xo.rows);

/* ---------- 5 · my squad: windowing + the you're-here bridge + Show all ---------- */
await pg.evaluate(()=>closeSquad());
await pg.waitForTimeout(200);
await pg.locator('.dept-row[data-d="Group Risk"]').click();
await pg.waitForSelector('.sqb-hd', {timeout:8000});
await pg.waitForTimeout(300);
const my=await pg.evaluate(()=>({
  rows:document.querySelectorAll('.lb-row:not(.dept-row)').length,
  gap:!!document.querySelector('.lb-gap'),
  more:(document.querySelector('.lb-more')||{}).textContent||null,
  meRow:(()=>{const el=document.querySelector('.lb-row.me');return el?{rank:el.querySelector('.rank').textContent,sub:el.querySelector('.lb-info .d').textContent,you:!!el.querySelector('.youtag')}:null;})(),
  share:!!document.querySelector('.sqb-hd .sq-share')
}));
if(my.rows===61 && my.gap) pass('70-strong squad windows to 60 + the you’re-here bridge'); else fail('rows='+my.rows+' gap='+my.gap);
if(my.more==='Show all '+gr.length) pass('expander: "'+my.more+'"'); else fail('expander "'+my.more+'"');
const meIdx=gr.findIndex(r=>r.slug==='khalid-almannai');
if(my.meRow && my.meRow.you && my.meRow.rank===String(ranksOf(gr)[meIdx]) && my.meRow.sub==='#'+officeRk['khalid-almannai']+' in the office')
  pass('my row: YOU, squad rank '+my.meRow.rank+', office #'+officeRk['khalid-almannai']); else fail('meRow '+JSON.stringify(my.meRow));
if(my.share) pass('share button present on MY squad'); else fail('share missing on my squad');
await pg.locator('.lb-more').click();
await pg.waitForTimeout(300);
const myAll=await pg.evaluate(()=>({rows:document.querySelectorAll('.lb-row:not(.dept-row)').length, gap:!!document.querySelector('.lb-gap'), more:!!document.querySelector('.lb-more')}));
if(myAll.rows===gr.length && !myAll.gap && !myAll.more) pass('Show all → '+gr.length+' rows, bridge + expander gone'); else fail('after expand: '+JSON.stringify(myAll));

/* ---------- 6 · mode pill resets a stale inner board ---------- */
await pg.locator('#lbmode button[data-m="people"]').click();
await pg.waitForSelector('.podium', {timeout:8000}).then(()=>pass('People mode still renders')).catch(()=>fail('People mode broke'));
await pg.locator('#lbmode button[data-m="dept"]').click();
await pg.waitForTimeout(400);
const reset=await pg.evaluate(()=>({sqb:!!document.querySelector('.sqb-hd'), league:!!document.querySelector('.dept-row')}));
if(!reset.sqb && reset.league) pass('Departments pill lands on the league, not the stale board'); else fail('mode reset: '+JSON.stringify(reset));

/* ---------- 7 · Me card deep link ---------- */
await pg.evaluate(()=>go('me'));
await pg.waitForSelector('.me-squad .sq-you.tap', {timeout:8000}).then(()=>pass('Me card squad line is tappable')).catch(()=>fail('sq-you tap missing'));
const goTxt=await pg.evaluate(()=>(document.querySelector('.sq-you .sq-go')||{}).textContent);
if(goTxt && goTxt.includes('Squad board')) pass('"Squad board ›" affordance shown'); else fail('sq-go "'+goTxt+'"');
await pg.locator('.me-squad .sq-you.tap').click();
await pg.waitForSelector('.sqb-hd', {timeout:8000});
const deep=await pg.evaluate(()=>({ view:state.view, name:(document.querySelector('.sqb-hd .sq-name')||{}).textContent,
  pill:(document.querySelector('#lbmode button.on')||{}).textContent||'' }));
if(deep.view==='leaderboard' && deep.name==='Group Risk' && /Departments/.test(deep.pill))
  pass('deep link → leaderboard · Departments pill on · Group Risk board open'); else fail('deep link: '+JSON.stringify(deep));

/* screenshot for the eyeball pass */
await pg.screenshot({ path: `${SCRATCH}/squad-board-390.png`, fullPage: true });
console.log('screenshot:', `${SCRATCH}/squad-board-390.png`);

if(errs.length){ fail('page errors: '+errs.join(' || ')); } else pass('zero page errors');

await browser.close();
const bad=results.filter(r=>r[0]==='FAIL').length;
console.log(bad? `\n${bad} FAILURES` : '\nALL GREEN');
process.exit(bad?1:0);
