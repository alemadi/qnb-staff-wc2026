# Staff Challenge 26 — Changelog

Every push appends an entry here, in the same push. Times are Doha (UTC+3).
Rollback steps are exact and executable: git commands, plus inverse SQL for any live DB change.

---

## 2026-06-12 17:55 (Doha) — PIN prompt: close the deck, keep pre-PIN picks, welcome-back prefill

**Commits:** `26236f0` (app) + this changelog commit.

**What changed** (frontend only, `index.html`; applies atop UX wave 1 `e8f2729`):
- `needPin()` now closes the swipe deck (if open) before `go("join")`. The PIN re-prompt — which every device hits once after Anti-cheat Phase 1 — used to fire behind the overlay, leaving players swiping picks that never saved.
- `needPin()` prefills the handle and dispatches `input` so the welcome-back flow fires (note + "Resume my game"), plus instant name/dept/country prefill from the live session — the forced re-claim is one field, and dept/country aren't blanked or reset to Qatar.
- `joinNow()` merges in-memory predictions (+ champ) over the server copy when re-claiming the active session's own slug, so picks made before entering the PIN are no longer dropped. Never merges when claiming a different handle; kickoff locks remain server-enforced.

**DB:** none. No kv writes, no SQL, `wc:results` untouched.

**Rollback (git):**

    git revert 26236f0
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git main

**Rollback (DB):** n/a.

## 2026-06-12 17:41 — UX wave 1: link cards, slim sticky bar, office consensus, swipe +2 step, welcome-back

**Commits:** `e8f2729` (app + og.png) + this changelog commit.

**What changed** (frontend only, `index.html` + new `og.png`; rebased atop anti-cheat Phase 1 `4f5ed8f`):
- OG/Twitter meta + new `og.png` (1200×630) — shared links now unfurl properly in WhatsApp/Teams.
- Header fits at 390px when signed in (WORLD CUP 26 column hides ≤439px once the user chip shows).
- Sticky progress panel collapses to a slim one-row bar on scroll, seated below the filter chips; the points table auto-closes when it shrinks.
- Swipe mode: each group-match swipe now offers an optional exact-score step that arms the +2 bonus (skippable; arrows skip; KO swipes unchanged). Swipe-card date uses the short format so it no longer wraps.
- Office consensus on locked/finished cards plus a line in the reveal ritual ("Only 23% of the office called this — sharp."). Client-side aggregate of player rows, cached 10 min, displayed for locked matches only, hidden in demo. Future optimisation: robot-written `wc:consensus` key.
- Champion card shows "N colleagues have locked their champion" once N ≥ 10.
- Join: typing an existing handle shows a welcome-back note, prefills dept/country, and the CTA becomes "Resume my game"; department is no longer re-required for returning players (kept from their row). Sign-out copy says "handle", not "email".
- Reveal: the verdict stamp sits below the result text — no more overlap at 390px.
- Leaderboard: viewable signed-out with a join CTA; Matches/Me bounce visitors to join with a toast; the pinned rival is tagged 🎯 in the list.
- Me: new computed badges — 🔥 streak ≥3, 💎 perfect day, 🃏 maverick (won a pick ≤25% of the office shared), 🇶🇦 all-in on Qatar — capped at 5 shown.
- Live-feed guard: ESPN live/finished scores render only once the match is locked by server clock, so picks can never sit open next to a live score.
- A11y: aria-labels on all pick buttons and score inputs; score chips grown to a comfortable tap size.
- MALDIVES departures flaps fit one line at 390px.

**DB:** none. No kv writes, no SQL — consensus is read-only `sbulkJSON` over world-readable rows.

**Rollback:** `git revert e8f2729 && git push origin main` — pure frontend + one static asset.

## 2026-06-12 17:05 (Doha) — Anti-cheat Phase 1: APPLIED to production + promoted

**Pushed:** `25b2d13` fast-forwarded onto `main` (from `a98a477`), plus this addendum commit.

**What happened (all times Doha, 12 Jun 2026):**

- **16:57** — full `kv` snapshot taken via Management API *before* any change
  (376 rows; `wc:results` value md5 `086a066c2c97be71ecda0f586c480d30`). Snapshot
  retained off-repo by the operator (contains pre-migration PIN hashes — must
  never enter this public repo). Satisfies the snapshot-before-overwrite rule.
- **16:57** — `sql/protect.sql` exactly as committed in `4f5ed8f` applied to the
  production database in a single atomic batch (Supabase Management API).
- **Verified in-DB:** `wc_locks` = 105 · `wc_auth` = 374 (= player rows) ·
  player rows still carrying `"pin"` = 0 · kv rows = 376 (unchanged) ·
  `wc:results` byte-identical to snapshot · anon privileges on `kv` reduced to
  SELECT only · robot cron `wc-autoconfirm` (*/10) still active.
- **Verified outside-in (publishable key):** `org_check` → 200 `false` ·
  direct `kv` write → `42501 permission denied` · public reads → 200 ·
  `save_picks` reachable and rejecting bad input (`bad_slug`), no write.
- **17:01** — `main` promoted `a98a477..25b2d13`; hardened client confirmed
  live on staffchallenge26.com (cache-busted) at **17:00:47**. Old-client
  write gap: ≈ 3 minutes. Players mid-session on the old client must reload
  once to regain saving.
- **Observed, pre-existing, left as-is:** `kv` already had RLS enabled with
  legacy wide-open policies `r`/`i`/`u`/`d` (PUBLIC) and full anon table grants
  incl. TRUNCATE. Writes are blocked by the privilege revoke regardless;
  the open `i`/`u`/`d` policies are now dead weight. **Follow-up:** add
  `drop policy if exists` for them to `protect.sql` via the normal
  prove-locally-first flow.

**Rollback:** unchanged — see the 16:27 entry below (`git revert 4f5ed8f` +
`sql/rollback.sql`). The operator-held snapshot can additionally restore
`wc:results` (or any key) verbatim if ever needed.

## 2026-06-12 16:27 — Anti-cheat Phase 1: server-side enforcement (RLS + RPCs)

**Commits:** `4f5ed8f` (app + SQL) + this changelog commit.
_(SHA filled at commit time — see "Deploy order" below; nothing is live until the SQL is run in Supabase.)_

**Why:** every rule (pick locks, result entry, identity) was enforced in the
browser only. With the publishable key, anyone could `curl` the kv table to
edit picks after kickoff, forge results, read/overwrite rivals, or delete
entries. Proven end-to-end in `proof/` (all four work pre-change, all blocked
after).

**What changed**

- **`sql/protect.sql`** (new — run once in Supabase, after `robot.sql`):
  - `wc_locks` (105 rows: m1–m72, k1–k32, `_champ`) — when each pick seals,
    generated from the client's own FIXTURES.
  - `wc_auth` (private) — PIN hashes migrated out of player rows; the `pin`
    key is stripped from every `wc:player:*` row.
  - `wc_org_auth` (private) — seeded with the existing shipped organizer hash,
    so the current access code keeps working. Rotate:
    `update wc_org_auth set code_hash = wc_pin_hash('NEW CODE')`.
  - `save_picks(slug,pin,payload)` — the ONLY player write path. Verifies PIN
    in SQL (wrong PIN → 0.3 s nap), keeps the stored value for any match whose
    kickoff has passed (server clock), sanitizes every field, never stores the
    PIN. Returns the canonical row for the client to reconcile.
  - `org_check` / `org_exec` — organizer reads/writes gated by the code in SQL
    (wrong code → 0.4 s nap); writes limited to `wc:results`, `wc:kteams`,
    `wc:player:*`, plus `clearpin`.
  - **The wall:** RLS on `kv` (world-readable, zero direct writes from
    anon/authenticated); auth/locks/robot tables revoked from the API roles.
  - The ESPN robot is unaffected — it runs as the table owner (SECURITY
    DEFINER), so it still confirms group results and still never overwrites the
    organizer. Verified in `proof/30_robot.sql`.
- **`index.html`** (frontend, 85 ins / 32 del): all shared-state writes now go
  through the RPCs. Removed the shipped organizer hash. Device PIN stored
  locally (`wc:pin`); organizer code held in memory only (relocks on reload).
  `persistPlayer`→`savePicksRPC` + `reconcilePicks`; all organizer writes →
  `orgSet`/`orgDel`. No remaining direct writes to shared keys (grep-verified).
- **`sql/rollback.sql`** (new) — exact inverse (see below).
- **`proof/`** (new) — a local Postgres harness that recreates the live shape,
  runs the four cheats before/after, exercises every legit path, and runs the
  robot's two-tick ESPN cycle. `proof/run_all.sh` reproduces it from a clean DB;
  `proof/PROOF_RUN.log` is the captured run.

**DB:** **YES — live change.** Run `sql/protect.sql` once. It is idempotent and
the PIN migration is one-time. **Before running, snapshot the current value of
`wc:results`** (copy the row out of the SQL editor) per project rule.

**Deploy order:** (1) snapshot `wc:results`; (2) run `sql/protect.sql` in
Supabase; (3) push the `index.html` commit. Running the SQL first means the old
client keeps working in the gap (reads are unaffected; the old client's direct
writes simply start failing, which is the point) — but keep the gap short.

**Rollback (exact, executable):**
1. `git revert 4f5ed8f && git push origin main` — restores the old
   client (which reads the PIN from the player row).
2. Run **`sql/rollback.sql`** in Supabase — it restores PIN hashes into the
   player rows, drops the RLS policy, `disable row level security` on `kv`,
   re-grants insert/update/delete on `kv` to anon/authenticated, drops
   `save_picks`/`org_check`/`org_exec`/`wc_pin_hash` and the `wc_auth`/
   `wc_org_auth`/`wc_locks` tables (keeps `server_time()`, which predates this
   push). Round-trip (protect → rollback → protect) verified clean in the proof.
3. If a manual `wc:results` edit was made after hardening, restore the
   pre-change snapshot from step (1) of Deploy order.

## 2026-06-12 12:04 — Swipe discoverability · honest exits · Matches header decluttered

**Commits:** `a576e35` (app) + this changelog commit.

**What changed** (frontend only, `index.html`):
- Removed the "Where to watch in Doha" row from Matches, plus its 4 orphaned CSS rules. Watch keeps the bottom-nav tab, the live pulsebar, and the footer link.
- Quick-pick entry renamed **"⚡ Swipe to pick · N left"**; dialog aria-label matches.
- First card of every deck open **rocks** (±22px / ±3.4°, 0.4s after deal-in) to show it's draggable; grabbing cancels it; once per open; off under reduced-motion.
- The shared ✕ is now a **42px glass circle, top-right**, in all three overlays (quick-pick, reveal ritual, FAQ); skip moved left; FAQ spacer 34→42px keeps the title centered.
- **Grabber + drag-down-to-close** on all three overlays (`armSheet`): header-scoped, 90px threshold, spring-back under, buttons excluded.

**DB:** none. No kv writes, no SQL, `wc:results` untouched.

**Rollback:** `git revert a576e35 && git push origin main` — pure frontend, nothing else to undo.

## 2026-06-12 18:06 — Uniform-height flags in pick buttons & chips

**Commits:** `cca580c` (app) + this changelog commit.

**What changed** (frontend only, `index.html` — 3 CSS lines):
- `.mini .fl-img` (flags inside pick buttons): was width-scaled to 24px with a `vertical-align:-5px` hack, so flags with extreme official ratios looked mismatched (Qatar 24×10 sliver vs Switzerland 24×24 square) and sat below center. Now `height:17px; width:auto; display:block` — uniform height, true proportions, flex-centered.
- `.fl-img` base (inline flags: Qatar filter chip, locked-champion line): same fix at `height:13px; width:auto`.
- `.flag .fl-img` (big team-card flags): unchanged visually, but gained an explicit `height:auto` so the new height-based base rule cannot squash it. `.sw-t .fl-img` (swipe deck) already had its own `height:auto` — untouched.

**DB:** none. No kv writes, no SQL, `wc:results` untouched.

**Rollback:** `git revert cca580c && git push origin main` — pure frontend, nothing else to undo.


## 2026-06-12 18:17 (Doha) — Pick reward layer: pop+glow, stakes float, completion confetti

**Commits:** `8e16fbb` (app) + this changelog commit.

**What changed** (frontend only, `index.html`; additive, all new JS guarded in try/catch):
- Selected pick pops with a springy scale + expanding gold glow ring (`.pick.pop`). Fires on every choose path: H/D/A taps, knockout winner taps, quick-score chips (`chipPick`), typed scores (`saveScore`).
- A "+N on the line" float rises off the chosen pick showing real stakes: `+3` group outcome, `+5 ⚡` once the exact-score bonus is armed, `koPts(m)` for knockouts (`+4` R32 … `+10` final) via the fixture `kn` flag.
- Completion celebration: confetti burst (gold + tricolor, self-removing canvas) + `#pred-bar` glow + toast "🎉 All picks locked in · N/N". Fires only on the transition `_lastPredC < tot → c === tot` inside `syncProgress()` — no retro-fire on boot for already-complete players; re-arms whenever `predTotal()` grows (new KO round unlocking).
- Haptics deliberately unchanged (`vibrate(8)` as-is — stronger haptics considered and declined). `prefers-reduced-motion` respected: CSS via the existing global override, confetti via a JS matchMedia gate.

**DB:** none. No kv writes, no SQL, `wc:results` untouched. **kv snapshot:** n/a — no kv overwrite.

**Rollback (git):**

    git revert 8e16fbb
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git main

**Rollback (DB):** n/a.
