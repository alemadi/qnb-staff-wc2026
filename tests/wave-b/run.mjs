// Wave-B launch-day proof: score every vector through the REAL SQL standings() AND the
// REAL JS scoreFor(), asserting expected === SQL === JS, plus wc_rank === PU_RANK.
// Prereq: a throwaway Postgres with sql/robot.sql (part 1) + standings.sql + protect.sql
// loaded — run ./bootstrap.sh first. Connection via env (defaults match bootstrap.sh):
//   PSQL_BIN, PGH (host/socket dir), PGP (port), PGDB, PGU
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import vm from "node:vm";
import { VECTORS } from "./vectors.mjs";

const PSQL = process.env.PSQL_BIN || "/usr/lib/postgresql/16/bin/psql";
const A = ["-h", process.env.PGH || "/tmp/pgv/sock", "-p", process.env.PGP || "5544",
           "-U", process.env.PGU || "pgv", "-d", process.env.PGDB || "wc", "-tA", "-v", "ON_ERROR_STOP=1"];
const TMP = process.env.TMPDIR || "/tmp";
const INDEX = new URL("../../index.html", import.meta.url);

// ---- SQL side: one transaction per vector, rollback between ----
const j = (o) => JSON.stringify(o).replace(/'/g, "''");
let sql = "";
VECTORS.forEach((v, i) => {
  const slug = "v" + String(i + 1).padStart(2, "0");
  const flag = v.flagOff ? "" : `,('wc:powerups_live','true')`;   // powered vectors set the launch flag; flagOff vectors leave it unset
  sql += `begin;\ninsert into kv(key,value) values ('wc:results','${j(v.results)}'),('wc:kteams','${j(v.kteams || {})}'),('wc:player:${slug}','${j(Object.assign({ slug }, v.player))}')${flag};\n`;
  sql += `select 'VEC|${i}|'||pts||'|'||exact||'|'||correct from standings() where slug='${slug}';\nrollback;\n`;
});
writeFileSync(TMP + "/wave-b-vectors.sql", sql);
const out = execFileSync(PSQL, [...A, "-f", TMP + "/wave-b-vectors.sql"], { encoding: "utf8" });
const sqlRes = {};
for (const line of out.split("\n")) { const m = line.match(/^VEC\|(\d+)\|(-?\d+)\|(-?\d+)\|(-?\d+)$/); if (m) sqlRes[+m[1]] = { pts: +m[2], exact: +m[3], correct: +m[4] }; }

// ---- JS side: real scoreFor, puLive=true, chips ?? null (mirrors live puChips post-launch) ----
const html = readFileSync(INDEX, "utf8").split("\n");
const end = html.findIndex(l => l.includes("</script>"));
const start = html.findIndex(l => l.trim() === "<script>"); // located, not hardcoded — markup above the script moves as the app grows
let appSrc = html.slice(start + 1, end).join("\n");
const ii = appSrc.indexOf("(async function init(){"); if (ii > 0) appSrc = appSrc.slice(0, ii);
const chain = new Proxy(function () {}, { get(_t, p) { if (p === "length") return 0; if (p === Symbol.toPrimitive) return () => 0; return chain; }, apply() { return chain; }, set() { return true; }, construct() { return chain; } });
const doc = new Proxy({}, { get() { return chain; }, set() { return true; } });
const ctx = { console, document: doc, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, fetch: async () => { throw 0; }, navigator: {}, location: { search: "", hash: "" }, matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }), setInterval: () => 0, clearInterval() {}, setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0, crypto: { subtle: { digest: async () => new ArrayBuffer(32) } }, URL, TextEncoder, TextDecoder, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Promise, Map, Set, isNaN, parseInt, parseFloat };
appSrc += "\n;globalThis.__scoreFor=scoreFor; globalThis.__PU_RANK=PU_RANK; globalThis.__set=(r,k,pu)=>{state.results=r;state.kteams=k;state.puLive=pu;};";
vm.createContext(ctx); ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
vm.runInContext(appSrc, ctx, { filename: "index-app.js", timeout: 5000 });
const jsRes = {};
VECTORS.forEach((v, i) => {
  const R = JSON.parse(JSON.stringify(v.results));                 // same object seeded into state (for upsetWin's koTeams) and passed as the results arg
  ctx.__set(R, JSON.parse(JSON.stringify(v.kteams || {})), !v.flagOff);   // puLive mirrors the flag
  const chips = ("chips" in v.player) ? v.player.chips : null;     // null (not undefined) => automatic upset/shield fire when live
  const s = ctx.__scoreFor(v.player.predictions || {}, R, v.player.champ || "", chips);
  jsRes[i] = { pts: s.pts, exact: s.exact, correct: s.correct };
});

// ---- rank equality ----
const rankRows = execFileSync(PSQL, [...A, "-c", "select team||'='||r from wc_rank"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
const sqlRank = {}; for (const row of rankRows) { const [t, r] = row.split("="); sqlRank[t] = +r; }
const jsRank = ctx.__PU_RANK;
const ranksMatch = Object.keys(sqlRank).length === Object.keys(jsRank).length && Object.keys(sqlRank).every(t => jsRank[t] === sqlRank[t]);

// ---- report ----
const eq = (a, b) => a && b && a.pts === b.pts && a.exact === b.exact && a.correct === b.correct;
let pass = 0, fail = 0;
console.log("VEC | expect | SQL | JS | name");
VECTORS.forEach((v, i) => {
  const e = v.expect, s = sqlRes[i], js = jsRes[i], ok = eq(e, s) && eq(s, js);
  ok ? pass++ : fail++;
  const f = x => x ? `${x.pts}/${x.exact}/${x.correct}` : "MISSING";
  console.log(`${String(i + 1).padStart(2)} ${ok ? "PASS" : "FAIL"} | ${f(e)} | ${f(s)} | ${f(js)} | ${v.name}`);
});
console.log(`\nSCORING: ${pass}/${pass + fail} vectors (expected === SQL standings() === JS scoreFor())`);
console.log(`RANK TABLE: wc_rank ${ranksMatch ? "===" : "!=="} PU_RANK [${Object.keys(sqlRank).length} teams]`);
process.exit(fail === 0 && ranksMatch ? 0 : 1);
