# CLAUDE.md — Staff Challenge · QNB World Cup 2026

Project memory for Claude Code. This file is **read-only context** — it is never
executed, never imported by the app, and not part of the deployed product. Keep
it free of secrets (this repo is publicly served — see "Public exposure" below).

## ⚠️ This is a LIVE product

`staffchallenge26.com` is in active use **during the 2026 World Cup**. A bad push
breaks a running office pool in front of hundreds of staff. Default to caution:
small changes, prove locally, keep rollbacks ready. Frontend changes go live the
moment they hit `main`.

## What it is

A PWA office prediction pool: staff predict every match, climb a leaderboard, win
a prize. No build step, no framework, no npm — just static files + Supabase.

- `index.html` — the whole app. **Monolithic**, ~3.4k lines, one inline `<script>`.
- `watch.html` — live-match companion page.
- `manifest.json`, `icon-*.png`, `apple-touch-icon.png`, `og.png` — PWA assets.
- `CNAME` → `staffchallenge26.com`.

## Architecture

**Frontend:** vanilla HTML/CSS/JS, edited directly. No bundler.

**Backend:** Supabase (Postgres), project ref `fzybuasvhzhmkbhxbton`. The browser
talks to it with the **publishable anon key** (public by design — it ships in
every visitor's browser). State lives in a single `kv` table (`key` → JSON
`value`): `wc:results`, `wc:player:*`, `wc:kteams`, `wc:ranksnap`, etc.

**Security is server-side, not secrecy.** Anti-cheat is enforced in Postgres, so
the public key and the public SQL files give nothing away:
- `kv` is world-readable, **zero direct writes** for anon/authenticated (RLS +
  privilege revoke).
- All writes go through RPCs: `save_picks(slug,pin,payload)` (the only player
  write path; verifies PIN in SQL, honors kickoff locks, never stores the PIN)
  and `org_check` / `org_exec` (organizer, gated by an access code hashed in SQL).
- Defined in `sql/protect.sql`. Run **once** in Supabase; idempotent.

## The result robot — read before touching automation

The robot **lives entirely inside Supabase**, defined in `sql/robot.sql`:
- `wc_autoconfirm_tick()` — `SECURITY DEFINER` plpgsql (so it writes through the
  RLS wall). Every tick it: (1) confirms finished **group** results (m1–m72)
  ~130 min after kickoff, (2) snapshots daily leaderboard ranks for the ▲▼
  arrows, (3) fires the next ESPN fetch via `pg_net`.
- Scheduled by **`pg_cron`**: job `wc-autoconfirm`, `*/10 * * * *` (every 10 min).
- Rules: group only (knockouts stay human) · both team names must match a fixture
  at the same kickoff or it skips · **never overwrites an existing result**
  (organizer always wins) · any doubt → do nothing, retry next tick.
- Pause it: `select cron.unschedule('wc-autoconfirm');`

**GOTCHA — do not add a GitHub Actions cron.** `scripts/autoconfirm.mjs` is a
standalone Node twin of the same logic, and its header comment claims it "runs on
a GitHub Actions schedule." That is **false** — the repo has no workflows except
the stock GitHub Pages deployer, and `.github/` has never existed here. The only
live robot is the `pg_cron` job above. Scheduling the `.mjs` would create a
**second writer** racing on `wc:results`. Leave it as a manual/backup tool.

## SQL files (`sql/`)

- `protect.sql` — the anti-cheat wall (RLS, RPCs, PIN migration). Run once.
- `robot.sql` — the robot (tables, `wc_autoconfirm_tick()`, cron schedule). Run once.
- `standings.sql` — the `standings()` function the leaderboard reads.
- `rollback.sql` — exact inverse of `protect.sql`.

Nothing in a SQL file is live until it's **run in the Supabase SQL Editor /
Management API**. Code and DB deploy on separate tracks.

## Testing — the proof harness

`proof/run_all.sh` is the test suite. Against a clean local Postgres 16 it proves:
the four known cheats work pre-hardening, all are blocked after `protect.sql`,
every legit player/organizer path still works, and the robot's two-tick ESPN
cycle confirms without overwriting the organizer. `proof/PROOF_RUN.log` is a
captured run. **Run this before any DB change** ("prove locally first").

There is no JS test runner; frontend changes have historically been verified
headless with jsdom and described in the changelog.

## Deploy

- **Frontend:** push to `main` → GitHub Pages auto-deploys (workflow
  `pages-build-deployment`). Live within ~a minute; cache-bust if needed.
- **DB:** manual. Apply the SQL in Supabase yourself. **Deploy order matters** —
  never ship frontend that depends on a DB change before the SQL is applied, or
  live clients break in the gap.

## House rules (follow these)

1. **Changelog on every push.** Append a `docs/CHANGELOG.md` entry *in the same
   push*, in Doha time (UTC+3), with an exact rollback: the `git revert` command
   and, for any live DB change, the inverse SQL.
2. **Small, single-purpose commits/PRs.** See git history for the cadence.
3. **Snapshot before overwrite.** Before changing live `kv` data, snapshot it
   first (operator keeps it off-repo).
4. **No secrets in this repo.** PIN hashes and pre-migration snapshots must never
   land here — it is public.
5. **Don't touch prod blindly.** The production Supabase project is not reachable
   from this environment's tooling; DB changes are applied by the operator.

## Public exposure (known, pre-existing)

GitHub Pages serves the **entire repo root**, so `sql/protect.sql`, the `proof/`
folder, and `scripts/autoconfirm.mjs` are all downloadable from the live domain
(e.g. `staffchallenge26.com/sql/protect.sql`). This is survivable because
security is server-side, but it publishes the design blueprint. Don't make it
worse (no secrets), and treat tightening it (`.nojekyll`, moving the Pages
source, or excluding non-web files) as a careful, deliberate change — not a
drive-by, since it can affect how the site builds.
