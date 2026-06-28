# Staff Challenge 26 — Changelog

Every push appends an entry here, in the same push. Times are Doha (UTC+3).
Rollback steps are exact and executable: git commands, plus inverse SQL for any live DB change.

---

## 2026-06-28 09:06 (Doha) — Fix: nothing to predict between rounds — add organizer "Auto-fill R32 from final standings"

**Commits:** this commit (app `index.html` + this changelog).

**Why:** With all 72 group matches kicked off and recorded (`wc:results` had all 72; `wc:kteams` was empty `[]`), the group stage was correctly locked but the Round of 32 had never been seeded. R32 ties (`k1`–`k16`) have no `BRACKET` auto-fill entry — unlike R16→Final, they must be seeded by hand — so all 16 ties showed placeholder slots ("Runners-up A", "Best 3rd · …") and **no one could predict anything**: group stage over, knockouts not open. Reported as "people cannot predict the group stage."

**What changed** (frontend only, `index.html`):
- New organizer action **"✨ Auto-fill R32 from final standings"** at the top of the knockout editor (Organizer tools → round = Round of 32). Disabled until all 12 groups have played their 6 matches each.
- Seeding engine reuses the existing `computeGroupTable()` (the same tables the Groups tab shows):
  - **Group winners & runners-up** resolve directly from the standings into their `Winners X` / `Runners-up X` slots — deterministic, no verification needed.
  - **Eight best third-placed teams** are ranked (Pts, GD, GF, then group letter) and matched into the `Best 3rd · …` slots via a constrained bipartite perfect matching (`matchThirds`, most-constrained-slot-first backtracking) that honours each slot's candidate groups.
- Because a given set of qualifying thirds can satisfy more than one valid matching while FIFA's official allocation table fixes a specific one, **every third-placed tie is flagged `⚠ verify 3rd`** in the editor. The organizer reviews and can change any tie with the existing dropdowns before/after. Winners/runners-up are not flagged.
- On confirm: writes `state.kteams` for all 16 ties, persists via `orgSet("wc:kteams", …)` (organizer-authenticated RPC, unchanged), runs `propagate()`, and re-renders — which opens R32 for predictions for all players.
- No change to lock logic (predictions still lock at kickoff, server-clock enforced), scoring, the robot, results, or any player data. Group matches remain locked — by design.

**New functions:** `R32_FLAGGED`, `grpComplete`, `groupStageComplete`, `standingsByLetter`, `r32Spec`, `bestThirds`, `matchThirds`, `autofillR32`; `renderKnockoutEditor` gains the R32 button + per-tie `⚠` flag.

**Verified:**
- `node --check` on the extracted inline script: clean.
- End-to-end in a VM sandbox driving the *real* `autofillR32()` against the live `wc:results` (660 players' tournament): all 16 ties filled, 32 distinct real-nation qualifiers, 8 ties flagged (`k3,k6,k7,k8,k9,k10,k13,k16`), `wc:kteams` persisted with 16 entries.
- Guard: with one group result missing, `groupStageComplete()` is false and the action refuses to write (toast: "Group stage isn't complete …"); button renders disabled.
- The eight winner-vs-third slots (1A,1B,1D,1E,1G,1I,1K,1L) and their candidate sets were cross-checked against the official 2026 Round-of-32 allocation structure.

**DB:** none by this commit. At runtime the organizer's click writes `wc:kteams` (16 R32 ties) through the existing `orgSet` path — the same write the manual editor already performs, one tie at a time.

**Rollback (git):**

    git revert <this-commit-sha>
    git push -u origin claude/group-stage-prediction-6502w4

**Rollback (DB, only if R32 was auto-filled and you want it cleared):**

    -- via organizer panel: clear each R32 tie's two dropdowns, or
    -- update kv set value='{}', updated_at=now() where key='wc:kteams';
    -- (clears ALL knockout seeding, not just R32 — use the panel for a partial undo)

---


**Commits:** `8d8802f` (sql/robot.sql + changelog) and a follow-up SHA-correction commit (this one).

**What changed:**
- ESPN's scoreboard names last night's m3 opponent **"Bosnia-Herzegovina"** (hyphen, no "and"), which normalizes to `bosniaherzegovina`. The alias table only had `bosniaandherzegovina`, and the fixture name "Bosnia & H." normalizes to `bosniah`, so `wc_ourname()` returned null and the robot's both-names-or-nothing guard skipped the match every tick. Cron, fetches (all 200 OK), and m1/m2 confirms were healthy throughout.
- Added alias row `('bosniaherzegovina','Bosnia & H.')` to `wc_alias` — applied live in Supabase at 04:51 Doha and mirrored into `sql/robot.sql` here.
- Ran `wc_autoconfirm_tick()` once manually after the insert: it confirmed **m3 = Canada 1–1 Bosnia & H.** from the already-fetched payload (`confirmed 1 · snapshot 2026-06-13→2026-06-13 · next fetch: yes`). No manual `wc:results` write — the robot wrote it through its normal path, organizer supremacy untouched.

**DB applied (live):**

    insert into wc_alias(espn, ours) values ('bosniaherzegovina', 'Bosnia & H.')
    on conflict (espn) do nothing;

**Rollback (git):**

    git revert 8d8802f
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git main

**Rollback (DB):**

    delete from wc_alias where espn = 'bosniaherzegovina';
    -- and to undo the m3 confirm itself (only if genuinely wrong):
    -- update kv set value = (value::jsonb - 'm3')::text, updated_at = now() where key = 'wc:results';

**kv snapshot before robot wrote m3** (`wc:results`, updated 2026-06-12 08:00 Doha):

    {"m1": {"a": 0, "h": 2}, "m2": {"a": 1, "h": 2}}

---

## 2026-06-12 19:12 (Doha) — Fix: countdown header jitter (flag imgs rebuilt every second)

**Commits:** `6ceb352` (app) + this changelog commit.

**What changed** (frontend only, `index.html`):
- `tickCountdown()` runs every 1s. It was rebuilding the whole "Next kickoff" label — the two flag `<img>`s included — on every tick, not just the clock digits. Benign until today's `cca580c` set `.fl-img` to `width:auto;height:13px`: a just-recreated `<img>` has zero width until it decodes, so the header snapped narrower→wider once per second (the visible jitter).
- The match label now re-renders only when its text actually changes (next match rolls over, or KO teams resolve); the day/hr/min/sec digits keep updating every tick as before.
- Side benefit: ~86,400 fewer redundant DOM rebuilds per open tab per day.
- Verified headless (jsdom): the flag `<img>` node is the same across four consecutive ticks; clock still renders all four units; swipe deck smoke test unaffected.

**DB:** none. No kv writes, no SQL, `wc:results` untouched.

**Rollback (git):**

    git revert 6ceb352d7283cc086748abf63b6c7f6f52b8d584
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git main

**Rollback (DB):** n/a.

## 2026-06-12 18:43 (Doha) — Swipe deck: score-at-end (removes the blocking +2 interstitial)

**Commits:** `f81f4f4` (app) + this changelog commit. Rebased atop the stats wave (`f54ee51`) after a push race.

**What changed** (frontend only, `index.html`; supersedes the swipe +2 step from `e8f2729`):
- Group-match swipes flow straight to the next card — the full-screen "Exact score? +2" step between every swipe is removed (functions, CSS, keyboard guard, `SW.step`), not bypassed.
- The "All caught up" screen becomes a one-tap fine-tune pass when any of the session's group picks still lack an exact score: one row per match with the same score chips; rows mark green when armed; Done closes. Classic done screen when nothing needs scoring.
- Scores save through the existing `chipPick` → `queueSave` path (main-list chips stay in sync); kickoff-locked matches are excluded from the fine-tune list. KO swipes and skip behaviour unchanged.
- Verified headless (jsdom) post-rebase: 70-card deck swiped end-to-end, zero interstitials; fine-tune rows = group picks; chip tap sets score + outcome, `sel` moves on re-tap. Direction chosen by owner from a three-mode interactive feel test.

**DB:** none. No kv writes, no SQL, `wc:results` untouched.

**Rollback (git):**

    git revert f81f4f44a1ecd59dadd5b9b978d97fbcadf251cb
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git main

**Rollback (DB):** n/a.

## 2026-06-12 18:20 — Stats wave: clearer consensus, exact-score lines, finale office stats, champion map

**Commits:** `f54ee51` (app) + this changelog commit.

**What changed** (frontend only, `index.html`; rebased atop the pick-reward layer `8e16fbb`):
- Consensus line rewritten for clarity — it read like betting odds. Now: "🏟 13 colleagues called it: Mexico 31% (you) · Draw 46% · South Africa 23%" — headcount leads, names before percentages, your pick marked "(you)". Knockout cards match.
- Exact-score line beneath it: finished matches show "🎯 You + 2 others nailed 2–1" / "Only you nailed 2–1" / "N colleagues nailed it" / "Nobody nailed 1–1"; locked-but-unplayed matches show "🎯 Top score pick: 1–0 (3)" (shown from 3 picks).
- Reveal finale now ends with up to two office lines: biggest office miss (shown when ≤45% got it right), longest active streak (≥3), perfect-day count.
- Champion card auto-upgrades at champion lock (Thu 18 Jun, 19:00 Doha): the lock-in count becomes "🏆 Office champions: 🇧🇷 Brazil 42% · 🇦🇷 Argentina 33% · 🇫🇷 France 17%" (top 3, flags). Gated on `locked(CHAMP_LOCK)` via the synced server clock — Thursday needs no deploy.
- Aggregation extended inside the same consensus pass: exact-score counts, champion distribution, per-player streaks and perfect days. Still read-only, cached 10 min, locked-matches-only, hidden in demo.

**DB:** none. No kv writes, no SQL.

**Rollback:** `git revert f54ee51 && git push origin main` — pure frontend.

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

## 2026-06-12 20:13 (Doha)
**Pushed:** 188bed0 (+ this ops commit) — **staging branch only, production main untouched**
**Changed:** Exact-score chips on match cards now follow the result pick (outcome-keyed sets, same as the swipe fine-tune pass) with a 3-chip starter set before a result is chosen. Switching result clears a contradictory stored score (toast shown); complete custom scores always derive the result; `syncChips` removed in favor of `rerenderChips`. No DB/kv change.

**Rollback (git):**
    git push origin --delete staging        # discard the test branch entirely
    # or, to keep the branch but undo the change:
    git revert 188bed0
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git staging

**Rollback (DB), if applicable:** none — frontend only.

**kv snapshot taken before overwrite (if applicable):** n/a.

## 2026-06-12 20:24 (Doha)
**Pushed:** 188bed0, edb82f4, + this ops commit — **to main (production)**
**Changed:** Promoted the staging chip change to production after owner approval and preview testing (rawcdn.githack pinned to edb82f4). Exact-score chips now follow the result pick; contradictory stored scores are cleared on result switch; custom scores derive the result. Frontend only — no DB/kv change, robot untouched.

**Rollback (git):**
    git revert edb82f4 188bed0
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git main

**Rollback (DB), if applicable:** none — frontend only.

**kv snapshot taken before overwrite (if applicable):** n/a.

## 2026-06-12 20:35 (Doha)
**Pushed:** 37352ed (+ this ops commit) — **staging branch only, production main untouched**
**Changed:** Player avatars switched from the uniform beige monogram to deterministic Komposition badges — one circle, one rotated bar, one gold accent dot, generated from the name/slug with the initial overlaid. Applied centrally to all five avatar sites (leaderboard rows, podium, profile, top chip, rival watch) via a new `avatarFill(name)` helper; `.avatar` CSS now hosts the SVG behind a light initial. Derived per-name — no kv/DB field added, `standings()` and the robot untouched. Frontend only.

**Rollback (git):**
    git push origin --delete staging        # discard the test branch entirely
    # or, to keep staging but undo just this change:
    git revert 37352ed
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git staging

**Rollback (DB), if applicable:** none — frontend only.

**kv snapshot taken before overwrite (if applicable):** n/a.

## 2026-06-12 20:45 (Doha)
**Pushed:** 7c8a488 (+ this ops commit) — **staging branch only, production main untouched**
**Changed:** The Departments leaderboard now uses a dedicated department badge (new `deptAvatarFill`) instead of the people Komposition badge — a rounded-square plaque (vs the circular people avatar) with a Bauhaus quarter-disc, a three-dot "group" glyph, and the department initials; new `.avatar.deptbadge` CSS gives it the square corners. Deterministic from the department name, same jewel palette. People avatars (leaderboard rows, podium, profile, chip) unchanged. Frontend only — no kv/DB change, robot untouched. Builds on the 20:35 Komposition entry.

**Rollback (git):**
    git push origin --delete staging        # discard the test branch entirely
    # or, to keep staging but undo just the department badge:
    git revert 7c8a488
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git staging

**Rollback (DB), if applicable:** none — frontend only.

**kv snapshot taken before overwrite (if applicable):** n/a.

## 2026-06-12 20:52 (Doha)
**Pushed:** 1c404df (+ this ops commit) — **staging branch only, production main untouched**
**Changed:** Department badges now show a pictogram of the function each department serves (keyword-matched in new `DEPT_ICONS`/`deptIconKey`): Retail Banking → bank, Group Risk → shield, Group Communications → megaphone, Corporate & Institutional Banking → building, Group Human Capital → people, Group Information Technology → chip, Group Treasury → chart, Group Finance → coins, Group Operations → gear, Asset & Wealth Management → gem, Group Compliance → scales; legacy/demo values mapped (Internal Comms → paper plane, VML/agency → bulb, Executive Office → star); Other/unknown → group-of-people fallback. Rounded-square jewel plaque retained; initials removed from dept badges. Supersedes the 20:45 abstract-plaque visual. Frontend only — no kv/DB change, robot untouched.

**Rollback (git):**
    git push origin --delete staging        # discard the test branch entirely
    # or, to return to the abstract plaque version:
    git revert 1c404df
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git staging

**Rollback (DB), if applicable:** none — frontend only.

**kv snapshot taken before overwrite (if applicable):** n/a.

## 2026-06-12 21:02 (Doha)
**Pushed:** 37352ed, 7c8a488, 1c404df (+ staging ops commits 462078f, eb235df, f96f260, + this ops commit) — **to main (production)**
**Changed:** Promoted the avatar overhaul from staging after owner go-ahead. People avatars (leaderboard rows, podium, profile, top chip) are deterministic Komposition badges (circle + bar + gold dot, jewel palette, initial overlaid). Department rows render rounded-square plaques carrying a pictogram of each department's function (bank/shield/megaphone/building/people/chip/chart/coins/gear/gem/scales; legacy values mapped; group-of-people fallback). Frontend only — no kv/DB change, robot untouched.
**§8 gate:** automated headless walk (Playwright/Chromium against the live backend): fresh boot, returning-player boot (real slug, read-only), People↔Departments both directions, demo on/off, Me view, share fallback, rival picker populate — 11/11 passed, zero console errors both sessions. Pick-save and rival-commit not exercised (would write production kv); those code paths are untouched by these commits.

**Rollback (git):**
    git revert 1c404df 7c8a488 37352ed
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git main

**Rollback (DB), if applicable:** none — frontend only.

**kv snapshot taken before overwrite (if applicable):** n/a.

## 2026-06-12 21:43 (Doha)
**Pushed:** 6bab9cb (app) + the changelog commit that follows it
**Changed:** Fun-stats sprinkle (UX wave 3): rotating fun-stat ticker under the leaderboard podium (biggest climber / exact-score king / sharpest department / hot hand / upset hunter); personal fun stats on the Me tab (signature scoreline, most-backed team, office-agreement/maverick line); "🧨 Upset — only N% saw it coming" on confirmed match cards; reveal finale gains 💔 heartbreak and 🏢 dept-of-the-day lines (cap 2→3). consensus() gains a second pass (CONS.bestUpset, CONS.deptByDay). No new queries; demo mode unaffected; no DB/robot/kv change.

**Rollback (git):**
    git revert 6bab9cb
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git main

**Rollback (DB), if applicable:**
    N/A — frontend only, no SQL or kv writes in this push.

**kv snapshot taken before overwrite (if applicable):**
    N/A — no kv key was written.

## 2026-06-12 22:09 (Doha)
**Pushed:** 8d250a4, 0aa75c4
**Changed:** Live and locked group-match cards now show the player's exact score pick, e.g. "LIVE · Picked: Canada (2–1)". Previously the (h–a) was only shown after full time. One-line change in matchCard() in index.html. No DB change.

**Rollback (git):**
    git revert 8d250a4
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git main

**Rollback (DB), if applicable:**
    none — frontend only

**kv snapshot taken before overwrite (if applicable):**
    n/a

## 2026-06-12 22:45 (Doha)
**Pushed:** 3dad395, fca6dac
**Changed:** (1) Sticky progress panel: fixed the collapse/expand jitter at the scroll boundary (overflow-anchor:none on #view-matches breaks the scroll-anchoring feedback loop) and made the mini transition smooth — Swipe-to-pick button and panel now animate width/padding/font/radius over .18s; observer guarded against redundant toggles. (2) Champion pick lifecycle: full card only while unpicked; collapses to a slim tap-to-change chip once picked; after the 18 Jun lock it leaves the Matches feed (trophy+flag token in the sticky bar links to Me, new champion line on the Me card, +25 nudge for players with no pick); payoff banner returns to Matches after the final. ?champlock URL param previews the locked state. Frontend only — no DB/robot/kv change.

**Rollback (git):**
    git revert fca6dac 3dad395
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git main

**Rollback (DB), if applicable:**
    N/A — frontend only, no SQL or kv writes in this push.

**kv snapshot taken before overwrite (if applicable):**
    N/A — no kv key was written.

## 2026-06-12 22:48 (Doha)
**Pushed:** 0b75da8
**Changed:** Champion card/chip relocated above the sticky Predictions panel at the top of Matches (was below it). Placed above the #prog-sent sentinel so the mini-collapse trigger timing is unchanged; .champ gains 11px bottom margin. Lifecycle from fca6dac unchanged. Frontend only — no DB/robot/kv change.

**Rollback (git):**
    git revert 0b75da8
## 2026-06-12 22:58 (Doha)
**Pushed:** 660a7f4 (app) + the changelog commit that follows it
**Changed:** Fun-stats wave 4: pick twin + hit-rate-vs-office on the Me tab; photo-finish / N-way-tie and still-perfect facts in the leaderboard ticker; top-scorer-of-the-day (👑 when it's you) and office day hit-rate in the reveal finale (line cap 3→4); one gold fun-stat line on the share card (shareFunLine). consensus() gains officeHit, perfectN, dayHit, dayTop, twin. Rebased onto 8d250a4 with the live/locked exact-score hotfix preserved. No new queries; demo mode unaffected; no DB/robot/kv change.

**Rollback (git):**
    git revert 660a7f4
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git main

**Rollback (DB), if applicable:**
    N/A — frontend only, no SQL or kv writes in this push.

**kv snapshot taken before overwrite (if applicable):**
    N/A — no kv key was written.

## 2026-06-12 23:31 (Doha)
**Pushed:** c87f11b, plus this ops commit
**Changed:** Completed-match treatment in the Matches view. Finished matches render as
receipt cards (final score, dashed rule, your call + points); finished matches from
previous days collapse into one-line "Completed · day" rows at the bottom of the round
view, tap-to-expand. Group + knockout supported. Frontend only — no DB/robot change.

**Rollback (git):**
    git revert c87f11b
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git main

**Rollback (DB), if applicable:**
    none — no database or kv change in this push

**kv snapshot taken before overwrite (if applicable):**
    n/a

## 2026-06-13 14:39 (Doha)
**Pushed:** 91e4032, plus this ops commit
**Changed:** Completed-match archive moved from the bottom of the Matches list to the top,
behind a compact foldable "Completed [n]" header (folded by default). Tap to reveal the
day-grouped thin rows; each still expands to a full receipt. Frontend only — no DB/robot change.

**Rollback (git):**
    git revert 91e4032
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git main

**Rollback (DB), if applicable:**
    none — no database or kv change in this push

**kv snapshot taken before overwrite (if applicable):**
    n/a

## 2026-06-13 14:44 (Doha)
**Pushed:** f0fd8c7, plus this ops commit
**Changed:** Removed the foldable "Completed" archive section (introduced in c87f11b and
moved to top in 91e4032). Finished matches now stay inline in their day groups as receipt
cards. Kept the .done receipt treatment; removed archive grouping, fold header, thin rows,
and their CSS/JS. Frontend only — no DB/robot change.

**Rollback (git):**
    git revert f0fd8c7
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git main

**Rollback (DB), if applicable:**
    none — no database or kv change in this push

**kv snapshot taken before overwrite (if applicable):**
    n/a

## 2026-06-13 15:10 (Doha)
**Pushed:** bca0b68, plus this ops commit
**Changed:** Matches filter bar. Added a "✓ Completed N" chip (filters to finished matches,
live count, only shows when >=1 done). Collapsed the 8 per-round chips into a single grouped
"Round" dropdown with per-round match counts — bar drops from 13 chips to 5 + the picker.
Finished matches still render inline as receipts in other views. Frontend only — no DB/robot change.

**Rollback (git):**
    git revert bca0b68
    git push https://x-access-token:<TOKEN>@github.com/alemadi/qnb-staff-wc2026.git main

**Rollback (DB), if applicable:**
    none — no database or kv change in this push

**kv snapshot taken before overwrite (if applicable):**
    n/a
