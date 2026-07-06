// PERF pack proof (2026-07-06) — headless, over the REAL page served on localhost
// (the service worker needs a secure context, so unlike the share-cards suite this
// one runs over http://127.0.0.1, not file://). Verifies the four behaviors the
// perf pack introduced, end to end:
//   ① snapshot boot   — 2nd visit paints from wc:bootsnap BEFORE the (deliberately
//                       slowed) network answers;
//   ② delegated picks — a knockout pick tap still selects + persists via save_picks
//                       (one listener on #match-list now, not per-button);
//   ③ reconcile       — the slow server answer folds in without clobbering the tap;
//   ④ offline         — with the network dead, the SW serves the shell and the
//                       snapshot paints it: the installed PWA is no longer a white page.
// No live traffic: every *.supabase.co / ESPN / fonts / flags request is mocked.
// Run: node tests/perf-boot/run.mjs   (env: CHROMIUM_BIN, PLAYWRIGHT_DIR, PORT)
import { spawn } from 'child_process';

const { chromium } = await import(process.env.PLAYWRIGHT_DIR || '/opt/node22/lib/node_modules/playwright/index.mjs');
const PORT = +(process.env.PORT || 8123);
const BASE = `http://127.0.0.1:${PORT}/`;
const results = []; const fail = (m)=>{results.push(['FAIL',m]);console.log('FAIL',m);};
const pass = (m)=>{results.push(['PASS',m]);console.log('PASS',m);};

/* ---- static server over the repo root (repo root = two dirs up) ---- */
const ROOT = new URL('../../', import.meta.url).pathname;
const srv = spawn('http-server', [ROOT, '-p', String(PORT), '--silent', '-c-1'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1200));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext();           // ONE context: localStorage + SW persist across the three phases
const errors = [];
const ME = 'perf-tester';
const PLAYER = { slug: ME, name: 'Perf Tester', dept: 'IT', country: 'qa', predictions: {}, champ: null, chips: {} };
const KTEAMS = { k25: { h: 'France', a: 'Brazil' } };  // one ready, future, unlocked QF → a tappable pick card
let kvDelay = 0, offline = false, savedPayloads = [];
const kvRows = () => JSON.stringify([          // the kv read reflects what save_picks stored — like the real server
  { key: 'wc:results', value: '{}' },
  { key: 'wc:kteams', value: JSON.stringify(KTEAMS) },
  { key: 'wc:powerups_live', value: 'true' },
  { key: 'wc:player:' + ME, value: JSON.stringify(savedPayloads[savedPayloads.length - 1] || PLAYER) },
]);
await ctx.route('**://*.supabase.co/**', async (r) => {
  if (offline) return r.abort();
  const u = r.request().url();
  if (u.includes('/rest/v1/kv')) { if (kvDelay) await new Promise(x=>setTimeout(x,kvDelay)); return r.fulfill({ status: 200, contentType: 'application/json', body: kvRows() }); }
  if (u.includes('/rpc/server_time')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(new Date().toISOString()) });
  if (u.includes('/rpc/standings')) return r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  if (u.includes('/rpc/save_picks')) {                       // canonical echo — the server keeps exactly what was sent
    try { savedPayloads.push(JSON.parse(r.request().postData()).p_payload); } catch (e) {}
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(savedPayloads[savedPayloads.length-1] || {}) });
  }
  return r.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
});
await ctx.route('**://site.api.espn.com/**', r => offline ? r.abort() : r.fulfill({ status: 200, contentType: 'application/json', body: '{"events":[]}' }));
await ctx.route('**://fonts.googleapis.com/**', r => offline ? r.abort() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
await ctx.route('**://fonts.gstatic.com/**', r => r.abort());
await ctx.route('**://flagcdn.com/**', r => r.abort());

const pg = await ctx.newPage();
pg.on('pageerror', e => errors.push('pageerror: ' + e.message));
await pg.addInitScript(([me]) => {                 // signed-in device: slug + PIN already on it
  localStorage.setItem('wc:me', JSON.stringify(me));
  localStorage.setItem('wc:pin', '1234');
}, [ME]);

/* ---------- phase 1: first visit (no snapshot) — classic boot + delegation ---------- */
await pg.goto(BASE, { waitUntil: 'load' });
await pg.waitForSelector('.match-card', { timeout: 8000 });
pass('first visit boots to match cards');
await pg.evaluate(() => navigator.serviceWorker.ready);
pass('service worker active');
await pg.waitForFunction(() => !!localStorage.getItem('wc:bootsnap'), null, { timeout: 5000 });
pass('boot snapshot written');

await pg.evaluate(() => { try { if (document.getElementById('wnov')) dismissWhatsNew(); } catch (e) {} }); // the boot spotlight sits over the list on a first visit
await pg.evaluate(() => setFilter('QF'));
await pg.waitForSelector('.picks[data-mid="k25"] .pick', { timeout: 5000 });
await pg.click('.picks[data-mid="k25"] .pick[data-w="France"]');
const sel = await pg.$eval('.picks[data-mid="k25"] .pick[data-w="France"]', b => b.classList.contains('sel'));
sel ? pass('delegated pick tap selects (France, k25)') : fail('pick tap did not select');
await pg.waitForFunction(() => { try { return (JSON.parse(localStorage.getItem('wc:bootsnap')).player.predictions.k25 || {}).w === 'France'; } catch (e) { return false; } }, null, { timeout: 6000 });
pass('save_picks round-trip + snapshot refreshed with the pick');
const cached = await pg.evaluate(async () => { const c = await caches.open('wc26-sw-v1'); return !!(await c.match('/')); });
cached ? pass('SW cached the shell (/)') : fail('shell not in SW cache');

/* ---------- phase 2: repeat visit on a SLOW network — snapshot must paint first ---------- */
kvDelay = 2500;
const t0 = Date.now();
await pg.goto(BASE, { waitUntil: 'commit' });
await pg.waitForSelector('.match-card', { timeout: 8000 });
const dt = Date.now() - t0;
(dt < kvDelay) ? pass(`snapshot painted in ${dt}ms — before the ${kvDelay}ms network answer`) : fail(`first paint waited for the network (${dt}ms)`);
const pickHeld = await pg.evaluate(() => (state.player.predictions.k25 || {}).w === 'France');
pickHeld ? pass('snapshot boot carries the saved pick') : fail('pick missing from snapshot boot');
await pg.waitForTimeout(3200);                     // let the slow batch land + reconcile
const pickAfter = await pg.evaluate(() => (state.player.predictions.k25 || {}).w === 'France');
pickAfter ? pass('network reconcile kept the pick (no clobber)') : fail('reconcile clobbered the pick');
kvDelay = 0;

/* ---------- phase 3: offline — SW shell + snapshot = a working app ---------- */
offline = true; await ctx.setOffline(true);
await pg.goto(BASE, { waitUntil: 'commit' });
await pg.waitForSelector('.match-card', { timeout: 8000 });
pass('OFFLINE: SW served the shell and the snapshot painted match cards');
await ctx.setOffline(false); offline = false;

errors.length === 0 ? pass('zero page errors') : fail('page errors: ' + errors.join(' | '));

console.log('\n==== SUMMARY ====');
results.forEach(([s, m]) => console.log(s + '  ' + m));
const bad = results.filter(([s]) => s === 'FAIL').length;
console.log(bad ? `${bad} FAILURES` : 'ALL GREEN');
await browser.close(); srv.kill();
process.exit(bad ? 1 : 0);
