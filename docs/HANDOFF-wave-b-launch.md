# HANDOFF — Wave-B power-ups launch (continue in a fresh session)

> **ADDENDUM 2026-07-06 ~07:30 Doha (continuation session):** Steps **1–2 are COMPLETE** —
> both SQL files deployed to live via the connector on the organizer's explicit instruction
> and verified hard (zero drift `172cdcb4…`/687 · 27/27 vectors vs the DEPLOYED `standings()`
> on live · prosrc md5s byte-exact · walls + REST battery green · flag still unset · 0 chips).
> See the top CHANGELOG entry for the full battery + rollback dossier
> (`docs/rollback/2026-07-06-pre-wave-b/`). Remaining: **③ push main (organizer's explicit
> word) → ④ organizer flips ⚡ Power-ups.**

**Written 2026-07-06 ~06:00 Doha by the previous Claude session.** Everything below is verified fact as of writing; re-verify live state before acting — matches settle continuously.

## Where things stand

**Shipped & live on production (staffchallenge26.com = main `c550879`):**
- Wave-B **client** launch gate: `puLive()` reads kv `wc:powerups_live` (default OFF). Arm UI/kit hidden, `scoreFor()`/`rvVerdict()` drop chips when off. Organizer toggle in Organizer tools (`togglePowerups()`).
- Knockout hardening: stale-org-tab result-merge guard (fail-closed `orgSyncResults`/`orgSaveResults`), score-only bracket advance (`orgSetKScore` derives decisive winners), ET/penalties live layer (winner flag, 210/180-min knockout windows, ESPN auto-recover).
- Live DB (applied directly, documented in CHANGELOG): RLS+revoke on `wc_ko_sched` (anon had FULL DML — closed), revoke API execute on `wc_autoconfirm_tick()`. Verified as anon: standings RPC 200/687, kv read 200, both walls 401.

**On branch `claude/code-readiness-updates-zofscq`, 2 commits ahead of main — NOT yet deployed:**
- `9d04f8b` — `tests/wave-b/` parity harness (rebuilt; the changelog's vector proof that never shipped) + **real official 11-June-2026 FIFA ranks** in BOTH `PU_RANK` (index.html) and `wc_rank` (sql/standings.sql). Placeholder had real order errors (Argentina/Spain flipped, Portugal/Brazil flipped, Morocco 11→7).
- `365a43a` — **server-side flag gate**: `standings()` now gates armband ×2 / upset +2 / shield on `wc:powerups_live` (a `pu` CTE). Without this the flag was client-only and merely deploying the SQL would have silently launched upset+shield at the first QF. Deploy is now inert until the flag flips.

**Proofs (re-runnable):**
- `sudo tests/wave-b/bootstrap.sh && node tests/wave-b/run.mjs` → **27/27 vectors** `expected === SQL standings() === JS scoreFor()` + `wc_rank === PU_RANK` (48). Includes 3 flag-OFF vectors proving base ladder when unset.
- Zero-drift: revised `standings()` over all live results + **687/687 player blobs → identical** to live leaderboard (flag off ⇒ Wave-B terms are 0).

**Live Supabase (project `fzybuasvhzhmkbhxbton`) at handoff time:**
- OLD (pre-Wave-B) functions deployed. Source md5s (rollback refs): `standings()` `d72059ac5300e39acd53d236348cc9d6` · `save_picks` `15d42403e56a80bb867d0d6ea5cc9825` · `org_exec` `4be63e1808d1b5a6f82ff333248e2177`. No `wc_chip_valid`, no chips handling, no `wc_rank` table.
- Before-snapshot: `select md5(string_agg(slug||':'||pts||':'||exact||':'||correct, ',' order by slug)), count(*) from standings()` → `5a15c6faa17c8072947dc772cb0171e6`, 687 rows (pre-k20-confirm; recompute after any new result lands — compare drift only across the deploy itself, seconds apart, not against this stale value).
- `wc:powerups_live` unset · 0 players hold chips · robot cron `wc-autoconfirm` active/green (`*/10`).
- Tournament: results through k19 at handoff (k20 England–Mexico finishes overnight; robot auto-confirms ~2h10m after FT). QF pairings: k25 France v Morocco (set), k27 Norway v k20-winner. **First QF lock: Thu 9 Jul 20:00Z (23:00 Doha).**

## Remaining steps (in order)

1. **Deploy the two SQL files to live Supabase.** Organizer pastes `sql/protect.sql` then `sql/standings.sql` (from THIS branch) into the SQL editor — byte-exact, zero transcription risk. (Previous session deliberately did NOT hand-transcribe ~370 lines through the MCP connector; if the user explicitly says "deploy it via the connector", reproduce the files exactly and verify hard afterward.)
2. **Verify live immediately after** (MCP `execute_sql`, read-only):
   - standings md5 snapshot before vs after the paste → must be identical (flag off).
   - `select prosrc like '%powerups_live%' from pg_proc where proname='standings'` → true; same check `'%chips%'` on `save_picks` → true; `to_regprocedure('public.wc_chip_valid(text,text)') is not null` → true.
   - `select count(*), md5(string_agg(team||'='||r, ',' order by team)) from wc_rank` → 48 and equal to PU_RANK's md5 (compute from index.html on the branch).
   - Run the 27 vectors against LIVE `standings()` in rolled-back transactions (adapt `tests/wave-b/run.mjs` SQL block — `begin; insert synthetic kv rows; select; rollback;` per vector). All 27 must pass.
   - Anon REST check: standings RPC 200 + 687 rows; save an unlocked pick via `save_picks` for a test... do NOT create test players on live; instead verify `save_picks` src md5 changed and rely on vectors.
3. **Merge branch → main and deploy** (gets corrected `PU_RANK` + rank-provenance comments to production). ⚠️ `git push origin main` requires the user to explicitly say so (the auto-mode classifier blocks it otherwise — this is correct behavior; ask). Local `main` may be stale/unrelated-history: `git checkout main && git reset --hard origin/main && git merge --ff-only claude/code-readiness-updates-zofscq && git push -u origin main`. Then verify prod picked it up (curl with cache-buster; check for `"Argentina":1` in PU_RANK).
4. **User flips the toggle** — Organizer tools → "⚡ Power-ups — go LIVE" (writes `wc:powerups_live` via org_exec; requires step 1's protect.sql). Do this ONLY after 1–3, ideally by Tue/Wed 7–8 Jul evening so players can arm before Thu's lock.
5. Optional post-flip: bump `WHATSNEW_VER` (currently `"2026-07-02-powerups"`, already consumed by users) to re-show the spotlight announcing power-ups are live; needs a small commit + main deploy.

## Ground rules learned this session
- Pushes to `main` = live deploy to 687 players: **only with the user's explicit instruction** ("push main").
- Never blind-overwrite live state; snapshot before/after and diff. All scoring claims must be proven by the harness, not the changelog.
- The user auto-approves aggressive work but wants results reported when COMPLETE, not narrated.
- CHANGELOG contract: every push appends an entry (with exact rollback, incl. inverse SQL for live DB changes).

## Quick context
Office WC2026 prediction pool, 687 players, Maldives prize. Frontend = single `index.html` (~6500 lines) on GitHub Pages (Actions deploy on push to main). Backend = Supabase kv + RPCs (`standings`, `save_picks`, `org_exec`) + pg_cron robot (`sql/robot.sql`) auto-confirming results from ESPN. `docs/CHANGELOG.md` top entries cover everything above in detail.
