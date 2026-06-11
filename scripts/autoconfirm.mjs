/* Staff Challenge — auto-confirm GROUP-STAGE results.
   Runs on a GitHub Actions schedule. Reads ESPN's public World Cup feed and,
   once a group match has been FINAL for ~30 minutes (grace window for score
   corrections), writes the official result into wc:results exactly as the
   organizer's Save button would. Rules of the robot:
     • group matches only (m1–m72); knockouts stay human
     • BOTH team names must match a fixture at the same kickoff — else skip
     • never overwrites an existing result (organizer always wins)
     • any doubt → do nothing; the next 15-minute tick retries
   The anon key below is the same publishable key every visitor's browser
   already ships with — public by design. */

import { readFileSync } from "node:fs";

const SUPABASE_URL = "https://fzybuasvhzhmkbhxbton.supabase.co";
const ANON = "sb_publishable_j513MlmOZHxhiGpII0uSYA_ijs2PpXV";
const HJ = { apikey: ANON, Authorization: "Bearer " + ANON, "Content-Type": "application/json" };

const ALIAS = {
  unitedstates: "USA", turkey: "T\u00fcrkiye", czechrepublic: "Czechia",
  bosniaandherzegovina: "Bosnia & H.", bosniaherzegovina: "Bosnia & H.",
  cotedivoire: "Ivory Coast", capeverdeislands: "Cape Verde", caboverde: "Cape Verde",
  congodr: "DR Congo", democraticrepublicofthecongo: "DR Congo",
  iriran: "Iran", korearepublic: "South Korea"
};
const tnorm = s => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

const GRACE_MS = 130 * 60e3;        // kickoff + ~90' + stoppage + HT + 30 min calm
const WINDOW_MS = 26 * 36e5;        // how far back we look for finished matches

function cmpSt(a, b) {
  return (b.pts | 0) - (a.pts | 0) || ((b.predicted | 0) - (a.predicted | 0)) ||
         ((b.exact | 0) - (a.exact | 0)) || ((b.correct | 0) - (a.correct | 0));
}

/* Once per Doha-day, snapshot everyone's leaderboard rank into wc:ranksnap.
   The app paints yesterday-vs-now movement arrows against it. Uses the same
   comparator and shared-rank rule as the client so numbers always agree. */
export async function snapshotRanks({ fetchImpl = fetch, now = Date.now(), dry = false, log = console.log } = {}) {
  const g = await fetchImpl(SUPABASE_URL + "/rest/v1/kv?key=eq.wc:ranksnap&select=value", { headers: HJ });
  if (!g.ok) throw new Error("snap read " + g.status);
  const rows = await g.json();
  const cur = rows.length ? JSON.parse(rows[0].value || "{}") : {};
  const dohaDate = new Date(now + 3 * 36e5).toISOString().slice(0, 10);
  if (cur.date === dohaDate) return { snapped: false };
  const st = await fetchImpl(SUPABASE_URL + "/rest/v1/rpc/standings", { method: "POST", headers: HJ, body: "{}" });
  if (!st.ok) throw new Error("standings rpc " + st.status);
  const players = await st.json();
  if (!Array.isArray(players)) throw new Error("standings shape");
  players.sort(cmpSt);
  const ranks = {}; let rank = 0, prev = null;
  players.forEach((p, i) => { if (prev === null || cmpSt(p, prev) !== 0) { rank = i + 1; prev = p; } ranks[p.slug] = rank; });
  log("rank snapshot " + dohaDate + " (" + players.length + " players)");
  if (dry) { log("DRY \u2014 snapshot not written"); return { snapped: false, dry: true }; }
  const w = await fetchImpl(SUPABASE_URL + "/rest/v1/kv", {
    method: "POST",
    headers: Object.assign({ Prefer: "resolution=merge-duplicates,return=minimal" }, HJ),
    body: JSON.stringify({ key: "wc:ranksnap", value: JSON.stringify({ date: dohaDate, ranks }), updated_at: new Date(now).toISOString() })
  });
  if (!w.ok) throw new Error("snap write " + w.status);
  return { snapped: true, players: players.length };
}

export async function run({ fetchImpl = fetch, now = Date.now(), dry = false, log = console.log } = {}) {
  try { await snapshotRanks({ fetchImpl, now, dry, log }); }
  catch (e) { log("snapshot skipped: " + e.message); }
  const FX = JSON.parse(readFileSync(new URL("./fixtures-group.json", import.meta.url), "utf8"));
  const OUR = {};
  FX.forEach(f => { OUR[tnorm(f.home)] = f.home; OUR[tnorm(f.away)] = f.away; });
  const our = n => { const t = tnorm(n); return ALIAS[t] || OUR[t] || null; };

  // fast gate: is any group match inside the confirm window at all?
  const inWindow = FX.some(f => { const ko = Date.parse(f.ko); return now - ko > GRACE_MS && now - ko < WINDOW_MS; });
  if (!inWindow) { log("idle: no group match in the confirm window"); return { written: 0, confirmed: [] }; }

  const f8 = t => new Date(t).toISOString().slice(0, 10).replace(/-/g, "");
  const url = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates="
    + f8(now - WINDOW_MS) + "-" + f8(now) + "&limit=120";
  const es = await fetchImpl(url);
  if (!es.ok) throw new Error("espn fetch " + es.status);
  const feed = await es.json();

  const found = [];
  for (const e of (feed.events || [])) {
    const c = (e.competitions || [])[0] || {};
    const st = (c.status || {}).type || {};
    if (!st.completed) continue;
    const ko = Date.parse(e.date);
    if (!(now - ko > GRACE_MS)) continue;               // not calm yet
    let H = null, A = null;
    (c.competitors || []).forEach(t => {
      const o = { name: our(t.team && (t.team.displayName || t.team.name)), score: Number(t.score) };
      if (t.homeAway === "home") H = o; else A = o;
    });
    if (!H || !A || H.name == null || A.name == null) continue;   // a name we can't place → skip
    const fx = FX.find(f => Math.abs(Date.parse(f.ko) - ko) <= 15 * 60e3 &&
      ((f.home === H.name && f.away === A.name) || (f.home === A.name && f.away === H.name)));
    if (!fx) continue;                                   // both-team strict match or nothing
    const sw = fx.home !== H.name;
    const h = sw ? A.score : H.score, a = sw ? H.score : A.score;
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0 || h > 20 || a > 20) continue;
    found.push({ id: fx.id, h, a, home: fx.home, away: fx.away });
  }
  if (!found.length) { log("no completed group matches past the grace window"); return { written: 0, confirmed: [] }; }

  const g = await fetchImpl(SUPABASE_URL + "/rest/v1/kv?key=eq.wc:results&select=value", { headers: HJ });
  if (!g.ok) throw new Error("kv read " + g.status);
  const rows = await g.json();
  const cur = rows.length ? JSON.parse(rows[0].value || "{}") : {};

  const add = found.filter(d => !(d.id in cur));         // organizer supremacy: existing keys untouched
  if (!add.length) { log("all finished matches are already official"); return { written: 0, confirmed: [] }; }

  const merged = Object.assign({}, cur);
  add.forEach(d => { merged[d.id] = { h: d.h, a: d.a }; });
  add.forEach(d => log("confirm " + d.id + ": " + d.home + " " + d.h + "\u2013" + d.a + " " + d.away));

  if (dry) { log("DRY RUN \u2014 nothing written"); return { written: 0, confirmed: add.map(d => d.id), dry: true }; }

  const w = await fetchImpl(SUPABASE_URL + "/rest/v1/kv", {
    method: "POST",
    headers: Object.assign({ Prefer: "resolution=merge-duplicates,return=minimal" }, HJ),
    body: JSON.stringify({ key: "wc:results", value: JSON.stringify(merged), updated_at: new Date(now).toISOString() })
  });
  if (!w.ok) throw new Error("kv write " + w.status);
  log("wrote " + add.length + " official result(s)");
  return { written: add.length, confirmed: add.map(d => d.id) };
}

if (process.argv[1] && process.argv[1].endsWith("autoconfirm.mjs")) {
  run({ dry: !!process.env.DRY })
    .then(r => log_done(r))
    .catch(e => { console.error("autoconfirm failed:", e.message); process.exit(1); });
  function log_done(r) { console.log("done:", JSON.stringify(r)); }
}
