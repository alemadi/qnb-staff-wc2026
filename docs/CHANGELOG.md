# Staff Challenge 26 — Changelog

Every push appends an entry here, in the same push. Times are Doha (UTC+3).
Rollback steps are exact and executable: git commands, plus inverse SQL for any live DB change.

---

## 2026-07-12 (Doha) — MAIN DEPLOY · MATCH HIGHLIGHTS phone-first clarity pass ships to production

**Commits:** the clarity-pass commit `85afcfd` (rebased onto `main` `158228d` after the Arab-bubble deploy landed) and the runbook commit `520345c`, plus this changelog note, pushed to `main` on the organizer's explicit "push to main" (branch `claude/banner-change-issue-ic57w1`). **Frontend + docs only — no DB / scoring / sync change.** Full what/verified detail in the branch entry directly below; recap: text block carries its own scrim, score promoted to 16.5px white, fluid one-line headline, 38px dismiss hit area, art window recentered for the v2 clarity-first artwork. Re-verified post-rebase at 360/390/430px (one-line headline, dismiss + persistence, zero page errors) with the Arab-bubble removal confirmed intact alongside.

**Context from the same morning (no code):** k27 and k28 cards minted by hand after the old hourly routine silently missed k27 twice; the routine was replaced with the fresh-session-per-run v2 trigger whose prompt bakes in the clarity-first, fill-frame artwork pattern (runbook: `docs/HANDOFF-highlights-banner.md`).

**Rollback:** `git push origin +158228d:main` (client-only; reverts `main` to the Arab-bubble-removal tip, the parent of this pass). Stale-while-revalidate shell: reaches each device on its next open.

---

## 2026-07-12 (Doha) — MATCH HIGHLIGHTS: phone-first clarity pass (branch-only, NOT deployed)

**Commits:** this commit (`index.html` + changelog) on `claude/banner-change-issue-ic57w1`, on the organizer's ask ("fully optimize for phone" after "the image generated is usually not understood"). **Frontend only — no DB / scoring / sync change.** (The artwork-side fix shipped the same morning without code: the mint routine was replaced with the v2 clarity-first trigger — flag-anchored four-figure scenes, no crowd, frame filled edge to edge — see the runbook commit `ff3743f`.)

**What (all `.hlban`-scoped CSS + one markup span):**
- **Text-backed scrim** — `.hl-tx` now carries its own bottom gradient (transparent → .92), so headline/score/sub sit on near-black no matter how bright the minted artwork is; the full-card `.hl-shade` relaxed slightly (.95 → .85 max) to give the art back some light.
- **Score promoted** — 14px cream → 16.5px white with a heavier shadow; it's the one thing people scan for. Headline `clamp(17px,5vw,20px)` (one line on 360–430px, `text-wrap:balance` when a long one wraps); sub 11.5px/.8 → 12px/.95; chip 9 → 10px on a darker pill.
- **Thumb-sized dismiss** — the ✕ hit area grows 26 → 38px (glyph wrapped in a `<span>`, square drawn by `::before`, hover moved to `::before`); visually unchanged.
- **Art window** — `background-position` center 30% → 42% (v2 artwork centers its subjects), image fade + lazy-load untouched.

**Verified:** real-browser (Playwright/Chromium vs live Supabase) at 360/390/430px — one-line headline at all three, card 176–192px tall (was up to 226px mid-pass), flag + dejected-keeper artwork visible, zero page errors; dismiss clicked at the far corner of the enlarged hit area hides the card, sets `wc:hl_seen`, and the card stays hidden after reload. Screenshots eyeballed at every width.

**Rollback:** `git revert <this commit>` — one CSS block and the ✕ span in `index.html`. No DB change.

---

## 2026-07-12 (Doha) — MAIN DEPLOY · MATCHES: drop the "Arab Teams" filter bubble

**Commits:** the bubble-removal commit `8f44548` (`index.html`, cherry-picked onto the latest `main` from branch `claude/remove-arab-teams-bubble-rnhq6r`) plus this changelog note, pushed to `main` on the organizer's explicit "push to main". **Frontend only — no DB / scoring / sync change.**

**What:** removed the "Arab Teams" chip from the Matches filter bar, its `filter==="arab"` branch in `fixturesFor()`, its `lblMap` label, and the now-unused `ARAB` team set. The filter is never persisted (it resets to `defaultRound()` on load), so no device can be stranded on the removed filter. Deliberately untouched: the Arab-themed fun-fact trivia entries (⭐ category) and `watch.html`'s Arab-first team dropdown ordering — different features, not the bubble.

**Verified:** real-browser load at 420px (headless Chromium, local serve — Supabase unreachable from the sandbox, so `renderFilters()`/`fixturesFor()` were exercised directly in the page): chip row renders `Today · Knockouts · SF · All 104` with no Arab Teams chip, `ARAB` is undefined, `fixturesFor('all')` = 104 and `fixturesFor('today')` = 2, zero page errors.

**Rollback:** `git revert 8f44548` — restores the chip, the `fixturesFor` branch, the `lblMap` entry, and the `ARAB` set. Frontend-only; no DB change.

---

## 2026-07-11 (Doha) — MAIN DEPLOY · MATCH HIGHLIGHTS: drop the "minted at full time" chip

**Commits:** the chip-removal commit (`index.html`) plus this changelog note, fast-forwarded to `main` on the organizer's explicit "push to main" (branch `claude/match-highlights-banner-h2lqq5`, restarted from `main` `8df49df` so it carries the later banner work — minimal variant, deepened scrim, strip-first billboard). **Frontend only — no DB / scoring / sync change.**

**What:** removed the second chip in the highlights banner's top row (`🧱 minted at full time`), leaving just the round label (`#hl-round`). The auto-mint provenance read as noise on a card the office only opens for the result; the round chip alone is cleaner. No JS touched — `renderHighlight` never referenced that static span.

**Verified:** real-browser load against live Supabase (current card: k26 Spain 2–1 Belgium with the organizer's uploaded crowd image) — banner renders on mobile at 420px with only the QUARTER-FINAL chip up top, headline/score/sub and image intact, zero page errors; screenshot eyeballed.

**Rollback:** `git revert <this commit>` — restores the static `<span class="hl-chip">🧱 minted at full time</span>` in the `.hl-top` row. Frontend-only; no DB change.

---

## 2026-07-10 (Doha) — MAIN DEPLOY · BILLBOARD STRIP-FIRST ships to production

**Commits:** the strip-first commit (`index.html` + the changelog entry below) plus this changelog note, fast-forwarded to `main` on the organizer's explicit "push to main" (branch `claude/tab-switching-feedback-mfv63l`). **Frontend only — no DB / scoring / sync change.** Full detail in the branch entry directly below; recap: the what's-new billboard opens as the slim strip by default, the full card auto-opens once per announcement (signature of the card's own copy — editing the banner text IS the release step), `?banner` force-link and the chevron choice behave as before. Note for the current announcement: devices that already saw today's copy full will now see the strip; the next copy edit earns its own full showing everywhere.

**Rollback:** `git push origin +ad1bb22:main` (client-only; reverts `main` to the tab-switch-feel tip, the parent of this pass). Stale-while-revalidate shell: reaches each device on its next open.

---

## 2026-07-10 (Doha) — BILLBOARD GOES STRIP-FIRST: full card only for a genuinely new announcement (branch-only, NOT deployed)

**Commits:** this commit (`index.html` + changelog) on `claude/tab-switching-feedback-mfv63l`, on the organizer's ask ("rather it start as the slim strip by default — with the full card only for genuinely new announcements"). **Frontend only — no DB / scoring / sync change.**

**What:** the what's-new billboard (`#xbanner`) now opens as the slim one-line strip by default. The full card auto-opens **exactly once per announcement**: `wc:banner:seen` stores a signature (`bannerSig`, djb2 over the card's normalized `textContent`), so *editing the banner copy is the whole release step* for the next announcement — every device gets one full showing, then strip again. Precedence per visit: `?banner`/`#banner` force-link (full, never consumes the showing) → unseen signature (full once, outranks a remembered shrink) → the user's chevron choice (`wc:banner:min2`) → **strip**. The decision is made once per pageload (`bannerDecided`) so the `joinNow` re-call can't fold a freshly shown card mid-session; blocked-storage devices err to strip; scroll auto-shrink and the chevron behave exactly as before.

**Verified:** real-browser (Playwright/Chromium, 390px, mocked-offline): 11/11 behavior checks — fresh device full + sig stored, second visit strip, chevron expand remembered across reloads, new-signature full-once over a remembered shrink then strip again, `?banner` full without consuming, scroll auto-fold + top unfold. The one probe that failed (boot-time `?banner` paint) fails **identically on the pre-change tree** — an offline-sandbox artifact, and a manual `setupBanner()` under `?banner` renders full correctly. Regressions: `nerd-stats` ALL GREEN, `squad-board` ALL GREEN; `perf-boot` times out on the pre-change tree too (its mocked "future, unlocked" QF is now date-expired — pre-existing).

**Rollback:** `git revert` this commit. Optional cleanup on affected devices: `localStorage.removeItem('wc:banner:seen')`.

---

## 2026-07-10 (Doha) — MAIN DEPLOY · TAB-SWITCH FEEL ships to production

**Commits:** the tab-switch commit (`index.html` + the changelog entry below) plus this changelog note, fast-forwarded to `main` on the organizer's explicit "go ahead and push to main" (branch `claude/tab-switching-feedback-mfv63l`). **Frontend only — no DB / scoring / sync change.** Full what/verified detail in the branch entry directly below; recap: entering view slides from the tapped tab's side, section title draws a dissolving gold hairline, active nav icon pops, 10ms Android haptic — real view changes only, in-place repaints replay nothing, reduced-motion fully respected. Organizer previewed both GIF recordings (full tour + 4x slow-mo) before approving.

**Rollback:** `git push origin +af2983b:main` (client-only; reverts `main` to the highlights-banner minimal-variant tip, the parent of this pass). Stale-while-revalidate shell: the deploy reaches each device on its next open; a stubborn stale shell may need one reopen.

---

## 2026-07-10 (Doha) — TAB-SWITCH FEEL: directional slide + title ink + nav pop + haptic tick (branch-only, NOT deployed)

**Commits:** this commit (`index.html` + changelog) on `claude/tab-switching-feedback-mfv63l`, on the organizer's read: "when pressing on the other tabs, it doesnt feel like i changed the tab". **Frontend only — no DB / scoring / sync change.** Root cause: every view entered with the identical fade-up, the chrome above stays static, and the nav's own feedback sits under the thumb that tapped it — a switch read as a flicker, not a move.

**What:**
- **Directional slide** — the entering view now slides in from the tapped tab's side (nav order matches → bracket → leaderboard → me; `.vx-r`/`.vx-l`, 40px · .38s, house ease). Set by `showView` on a real view change only: boot, the join gate and in-place repaints (`showView(view,true)`) keep the plain rise, and repaints never replay the entrance (classes untouched, no display flip).
- **Title ink stamp** — the entered view's section title draws a 2px gold hairline that dissolves (`titleink`, .85s) — a one-beat "you're here now" up where the eyes are. Direct-child `.sec-title` only, so the Me page's nested "Organizer tools" title doesn't double-fire.
- **Nav icon pop** — the newly active tab's icon springs 1 → 1.3 → 1.08 (`navpop`, .32s, the navin spring curve), stacking on the existing gold bar + glow.
- **Haptic tick** — `navigator.vibrate(10)` in `go()` on a real change; userActivation-gated (boot stays silent), skipped under reduced motion, try/caught. iOS has no vibrate API — Android-only by nature.
- All of it rides the existing reduced-motion global reset (ink ends at opacity:0, so it never shows there).

**Verified:** real-browser (Playwright/Chromium, 390px) — `vx-r` runs bracket→leaderboard, `vx-l` back, `navpop` + `titleink` on change, join→bracket falls through to plain rise, and an in-place repaint restarts **zero** animations; mid-flight screenshots eyeballed. Regressions: `nerd-stats` ALL GREEN, `squad-board` ALL GREEN.

**Rollback:** `git revert` this commit — one CSS block by the `.view` rules, one line in the S5 nav pass, two small guards in `showView`/`go()`.

---

## 2026-07-08 (Doha) — MAIN DEPLOY · MATCH HIGHLIGHTS BANNER: LEGO-style card auto-minted after each big match

**Commits:** the banner commit (`index.html` + `docs/HANDOFF-highlights-banner.md`) plus this changelog note, fast-forwarded to `main` on the organizer's explicit "Push to main" (branch `claude/match-highlights-banner-h2lqq5`). **Frontend + one new `kv` key — no schema, policy, scoring or sync change.**

**What:**
- **`#hlban`** — a card at the very top of the page (between the header and the what's-new billboard): round chip, headline, scoreline and a one-line story over an AI-generated **LEGO-brick diorama** of the latest big result. Pure renderer of `kv('wc:highlight')` (JSON: `id/round/headline/score/sub/ts/img`); optional `wc:highlight_img` data-URI fallback. No key ⇒ no banner.
- **Zero boot cost:** `refreshHighlight(true)` runs after `setupBanner()` and reads its own keys; the image lazy-loads after the card paints and fades in only once decoded. `refreshResults()` re-checks when a new final folds in, so open tabs pick up a fresh card on the normal polling cadence. ✕ dismisses per-card (`wc:hl_seen` = the card's `ts`); a new card shows again.
- **Minting is automated:** an hourly scheduled Claude routine finds newly-final knockout matches in `wc:results`, picks the most highlight-worthy (round > goals > penalty drama > upset), generates the scene with Higgsfield (winner's kit celebrating, loser's dejected, no text in image), and upserts `wc:highlight` server-side (kv stays browser-read-only). It never overwrites a hand-written card for the same match, and disables itself after the final. Runbook: `docs/HANDOFF-highlights-banner.md`.
- **Launch card live now:** k23 Argentina 3–2 Egypt, organizer-directed "That one wasn’t fair" edition (Egypt swarming the LEGO referee).

**Verified:** real-browser load against live Supabase — card renders on mobile (420px) and desktop (900px) with image, correct headline/score, zero page errors; screenshots eyeballed. Regressions: `nerd-stats` ALL GREEN, `squad-board` ALL GREEN; `share-cards` shows only the known pre-existing 340px header-overlap failure (documented in the Wave C entry, fails on prior HEAD too). Higgsfield CDN image URL HEAD-checked (200, `immutable`).

**Rollback:** `git revert <banner commit>` — frontend-only insertion (one CSS block, one markup block, three JS functions, two one-line hooks). DB inverse: `delete from kv where key in ('wc:highlight','wc:highlight_img');` (banner disappears everywhere within a minute). Pause the minting: disable the "WC26 highlights banner — hourly mint check" routine.

---

## 2026-07-07 (Doha) — MAIN DEPLOY · LAB WAYFINDING: five themed sections + labeled jump chips

**Commits:** the wayfinding commit (`index.html` + `tests/nerd-stats/run.mjs`) plus this changelog note, fast-forwarded to `main` on the organizer's explicit "push to main" (branch `claude/interesting-stats-ideas-7kwsbk`). **Frontend only — no DB / scoring / sync change.** Organizer's read after Wave C: 41 cards in one scroll "maybe too cluttery" — this is the agreed Level-1 fix (wayfinding, not walls).

**What:**
- **Five themed sections**, injected post-render so the card CODE keeps its historical order (a title→section map regroups the DOM): 🏆 **The race** (8 — points curve, desk spread, photo finish, stage wins, time machine, rank journey, comeback king, belt races) · 🔮 **The endgame** (8 — futures board, title lifelines, still alive, swing matches, champion market, alternate universes, fragility, armband ledger) · 🐑 **The crowd** (9 — hive mind, herd-o-meter, payoff matrix, overconfidence, raffle-or-racetrack, prediction twin, personality, heart vs head, founding members) · ⚽ **The football** (7 — goals by round, chaos, home-soil, favourite tax, predictability ladder, graveyard shift, golden goose) · 🎯 **The calls** (8 — scoreline lab, markets lab, stock market, unicorns, draw blind spot, form curve, streak spectrum, clutch). "Odds & ends" + the methodology note stay as the footer; unmapped future cards land after the sections (safe default).
- **The sticky jump row shrinks from 41 unlabeled emoji to 5 labeled chips** (🏆 RACE · 🔮 ENDGAME · 🐑 CROWD · ⚽ FOOTBALL · 🎯 CALLS) that scroll to their section; each chip's title carries the section blurb + card count. Section headers reuse the house small-caps grammar (`.nrd-sec`, gold label, hairline rule).
- Kiosk (?tv) and seal rules untouched; sections skip cleanly in degenerate worlds (<2 sections ⇒ no nav row).

**Verified:** `node --check` clean; `tests/nerd-stats/run.mjs` extended to **166 PASS / 0 FAIL** (chip row = 5 labeled chips in order; 5 section wraps in order; 40 of 41 cards grouped with only "Odds & ends" outside; per-section counts 8/8/9/7/8; all prior 163 checks green). Screenshots eyeballed at 390px: chips row, 🎯 THE CALLS header, and regrouped adjacencies (champion market→universes, graveyard→goose) confirmed.

**Rollback:** `git revert <this commit>` — frontend-only; one IIFE + one CSS block + harness assertions.

---

## 2026-07-07 (Doha) — MAIN DEPLOY · THE LAB WAVE C: 14 new stats cards

**Commits:** the Wave C series (mockup → brief → foundation compute layer + CSS → card renderers + `tests/nerd-stats/run.mjs`) plus this changelog commit, fast-forwarded to `main` on the organizer's explicit "push to main" (branch `claude/interesting-stats-ideas-7kwsbk`, 4 commits on top of the Squad-board deploy, 0 behind). **Frontend only — no DB / scoring / sync change, zero new backend traffic.** The Lab grows from 27 cards to 41.

**What:** fourteen new cards in the Lab (`renderNerds`), in the existing card grammar (gold = office data, blue = reality), appended before "Odds & ends". Every number is computed live in the browser from data the app already pulls — the `consensusCompute()` player bulk-load gains one extra pass (`CONS.wc`) and a lazy replay/enumeration cache (`wcHeavy` → `WCR`); **`scoreFor` is untouched (byte-for-byte SQL parity preserved).**
- **Wave C·1** — 🔮 **The futures board** (every remaining bracket outcome enumerated, title-probability per player, consensus-weighted) · ⏳ **The time machine** (the board replayed matchday-by-matchday — reigns, lead changes, longest reign) · 🎢 **Your rank journey** (personal SVG sparkline, peak/low, best climb) · 🧗 **The comeback king** (biggest climb from a tournament low) · 🧬 **Title lifelines** (whose Maldives hopes ride on which surviving team) · 👯 **The prediction twin** (your closest colleague + office's most-alike pair + your nemesis h2h) · ❤️ **Heart vs head** (own-nation backing tax, aggregate only) · 🦢 **Golden goose & heartbreaker** (which teams minted vs torched the office's points).
- **Wave C·2** — 🧊 **Clutch rating** (group vs knockout form) · 🪞 **Alternate universes** (the podium under 4 rulesets) · 🌪️ **The chaos meter** (per-round surprise vs the office's own consensus) · 🥚 **The fragility index** (flip any one-goal game — does the podium survive?) · 🎭 **Predictor personality** (your archetype + office census) · 🦄 **The unicorn scores** (scorelines the office keeps buying that never land).
- **Seal rules held per card:** aggregates only, k-anon floors (5 group / 8 knockout), only locked picks influence output, names render only as positive leaders and "you", personal cards (`nrd-personal`) + `.aw-you` lines hide on the ?tv kiosk. Below-floor cards degrade to the "check back" pending line, never NaN.
- **What's-new:** `WHATSNEW_VER` → `2026-07-07-wave-c-lab`; banner + spotlight copy refreshed (27 → 41 cards); NEW dots revive on the version bump.

**Verified:** `node --check` clean on the inline scripts. `tests/nerd-stats/run.mjs` extended to **163 PASS / 0 FAIL** (64 new assertion sites: every new card's headline numbers independently recomputed from the seed — futures universes re-enumerated, standings replayed day-by-day, fragility flips re-run; plus gate checks: ?tv hides personal cards, signed-out renders no journey/`.aw-you`, jump-chip count = card count, below-floor world shows `.aw-pend` with no NaN, zero page errors). Adversarial review pass fixed a reign-strip label overlap, the journey axis labels, a chaos third-place/final bucket conflation, and the NEW-dot revive; screenshots eyeballed at 390px against the mockup (`docs/lab-wave-c-preview.html`). Regressions: `squad-board` GREEN; `wave-b` needs a live Postgres socket (unavailable in sandbox — unrelated); `share-cards` has one pre-existing 340px header-overlap failure that also fails on committed HEAD (not caused by this pass).

**Rollback:** `git revert <this commit> <foundation commit>` — frontend-only, pure insertion (existing 27 cards untouched, Wave-C compute wrapped in try/catch so a failure degrades to `.aw-pend`). No SQL, no service-worker bump needed.

---

## 2026-07-06 (Doha) — MAIN DEPLOY · SQUAD BOARD, discoverability pass: an obvious front door + button-shaped rows

**Commits:** this commit (`index.html` + `tests/squad-board/run.mjs` + changelog), pushed to `main` on the organizer's standing "Push to main". **Frontend only — no DB / scoring / sync change, zero new backend traffic.** Organizer feedback on the squad board: "it's not clear that it's tappable. And hard to discover."

**What:**
- **The front door (`.sq-cta`)** — a gold-framed card at the top of the Departments board (below the derby cup, above the league): your squad's crest, "**Your squad board — {dept}**", the tease "You're **#4** of 78 — see who's above you" (or "All N players, ranked" if you're not on the board yet) and an explicit "**Open ›**". One obvious tap into your own department's table — the primary ask. Signed-in, non-demo only; hidden when your squad has nobody on the board.
- **Rows now look pressable:** the faint `›` chevron becomes a **bordered circular disclosure button** (the `.sq-share` visual language: glass fill, `--line` border, gold on hover) with an `:active` press-down; the league note now reads "Tap **any squad row** to open that department's own board."

**Verified:** `node --check` clean. `tests/squad-board/run.mjs` extended to 36 checks — the CTA renders with the right dept/crest/position tease, opens MY board, and the league returns on close; ALL GREEN. Regressions: `nerd-stats` ALL GREEN. League + board screenshots eyeballed at 390px.

**Rollback:** `git revert <this commit>` — frontend-only; one CSS block + the `cta` string in `renderDept`.

---

## 2026-07-06 (Doha) — MAIN DEPLOY · RENAME: "Stats for nerds" → 🧪 "The Lab" + corporate-copy sweep (ships the sickos→diehards fix below too)

**Commits:** this commit (`index.html` + `tests/nerd-stats/run.mjs` + `tests/share-cards/run.mjs` + changelog) and the diehards fix below on `claude/stats-for-nerds-3yajyc`, **rebased onto `main` `c0e840c`** (the squad-board + Trophy-pass-2 deploys; one changelog conflict, both sides kept) **then fast-forwarded to `main` on the organizer's explicit "Push"**. **Frontend copy only — no logic, no layout, no data change.** Organizer raised corporate-appropriateness ("Would someone be offended in corporate by this"); the fix is to name the *place*, not the *person*. Also updates the share-cards suite's banner assertion to the new name (it was checking for the literal string "Stats for nerds").

**What changed (user-facing text only — every internal key stays `nerds`/`nrd-*`, so seen-flags, deep links and the mode key are untouched):**
- Leaderboard pill: `🤓 Nerds` → **`🧪 The Lab`**; intro card: "🤓 Stats for nerds" → "🧪 The Lab"; empty state icon 🤓 → 🧪 (its copy already said "The Lab opens…").
- Home-banner hub row + heading and the What's-new spotlight item: "Stats for nerds"/"🤓 nerd stats" → "The Lab"/"🧪 The Lab"; the hub row's stale "21 cards" corrected to **27**.
- Card "Nerd corner" → **"Odds & ends"** (subtitle unchanged — it was already "Loose numbers with nowhere else to live").
- Copy sweep: "🍾 goal-drunk" → "🚀 goal-hungry" (alcohol idiom out, same meaning). Code comments updated to match.

**Verified on the shipped (rebased) tree:** `tests/nerd-stats/run.mjs` ALL GREEN (incl. the Trophy-pass-2 additions another session made to this suite); `tests/squad-board/run.mjs` ALL GREEN; `tests/perf-boot/run.mjs` ALL GREEN; `tests/share-cards/run.mjs` back to green-except-the-pre-existing-340px-header failure once its banner assertion was updated to the new name. `node --check` clean on both inline blocks; zero rendered "nerd"/🤓 strings remain (grep). **Rollback:** `git push origin +c0e840c:main` (client-only; reverts to the squad-board tip — removes both this rename and the diehards fix).

---

## 2026-07-06 (Doha) — Copy fix: "day-one sickos" → "day-one diehards" (branch-only, NOT deployed)

**Commits:** this commit (`index.html` + changelog) on `claude/stats-for-nerds-3yajyc`. One word in the founding-members card subtitle, on the organizer's ask ("change the sickos"). No logic, no layout. **Verified:** `tests/nerd-stats/run.mjs` ALL GREEN; `node --check` clean; zero remaining "sickos" greps. **Rollback:** `git revert` this commit.

---

## 2026-07-06 (Doha) — MAIN DEPLOY · SQUAD BOARD: tap into any department to see its own leaderboard

**Commits:** this commit (`index.html` + `tests/squad-board/run.mjs` + changelog) on `claude/squad-leaderboard-w7p21r`, **rebased onto `main` `50270be`** (Nerds batch five, then Trophy Room pass 2 — both landed in parallel mid-flight; `index.html` auto-merged each time, the changelog conflicts resolved keeping all sides) and **pushed to `main` on the organizer's "Push to main"**. **Frontend only — no DB / scoring / sync change, zero new backend traffic.** Organizer ask: a squad leaderboard, "to see the leaderboard of own department."

**Why:** the Departments board ranks squad vs squad and the Me card says "You're #4 of 78 in Group Risk" — but there was no way to see the 77 other names. The within-squad race (who at YOUR desk is above you) is the most talkable rivalry in the office and it was invisible.

**What (Leaderboard → Departments → tap a squad, or Me → "Squad board ›"):**
- **Every squad row on the Departments board is now a door** (`role="button"`, keyboard-operable, chevron + "Tap a squad to open its board" note); the sub-threshold squads in the "not yet ranked" note become tappable pills (`.sq-mini`). Dept names travel via `data-d` — no inline-string quoting of user-ish text.
- **The squad board (`renderSquad`, state `LB_SQUAD`)** — inside ONE department: a back button ("‹ All squads"), a squad-identity header reusing the Me card's `.me-squad` kit (crest, league position "🥈 of 13 squads" or "Unranked — squads rank at 5+ players", `n players · avg · Σ pts`, the `≥60%` participation chip, and the 📤 `shareSquad` button **only on your own squad**), then every player of that squad as standard `lbRowHTML` rows: **within-squad tie-aware ranks** (same `cmpSt` order as the office), the **office-wide rank as each row's subline** (new `r.sub` override in `lbRowHTML` — the dept name would be redundant here), **within-squad overnight ▲▼** (the People board's `rankSnap` office snapshot re-ordered inside the squad), YOU highlight, streak chip and title chips (`computeHonours` runs on the full standings, so ⭐ Squad Captain sits on the leader; the consensus enrich re-renders in place like People mode).
- **Windowing:** 60 rows + the "⋯ you're here ↓" bridge + "Show all N" (`SQ_SHOWN`) — a 146-strong desk doesn't paint a wall on entry.
- **Navigation contract:** mode pills always land on the LEAGUE (`LB_SQUAD=null` on any pill tap — never a stale inner board); `openSquad`/`closeSquad` scroll to top; `animGate` signature includes the open squad so entering/leaving animates as a view change; the Me card's "You're #N of M" line becomes the deep link (`goSquad` — flips the pill to Departments and opens your squad).
- Data path: the same cached slim `standings()` rows + `rankSnap` every board already reads — **no new pull, no picks read, no `@ig` rendered — seal-safe by construction**. Demo mode untouched (Departments is already non-demo).

**Verified:** `node --check` clean. New headless proof `tests/squad-board/run.mjs` (87 players / 4 departments / a within-squad points tie / an overnight leader swap) — **33/33**: league order + all rows tappable; the board's header (name, medal position, `8 players · 766.3 avg · Σ 6130`), within-squad order = `cmpSt`, tie-aware ranks `1,2,2,4…`, office-rank sublines, ▲1/▼1 on the swapped pair, ⭐ Squad Captain on the leader, no share button on a foreign squad; back → league; the 3-player squad opens "Unranked"; the 70-strong squad windows to 60 + bridge + "Show all 70" (expander verified); mode pills reset a stale inner board; the Me-card deep link lands on the right board with the Departments pill on; zero page errors. Screenshot eyeballed at 390px. Regressions: `nerd-stats` ALL GREEN · `perf-boot` ALL GREEN · `share-cards` 106 PASS + only the **pre-existing** 340px header overlap (identical on base).

**Rollback:** `git revert <this commit>` — frontend-only; isolated additions (`renderSquad`/`openSquad`/`closeSquad`/`goSquad`/`sqMore`, `LB_SQUAD`/`SQ_SHOWN`, one CSS block) plus small touches to `renderDept` rows, `lbRowHTML` (`r.sub`), `meSquad` (tappable line), the mode-pill handler and the `animGate` signature.

---

## 2026-07-06 (Doha) — MAIN DEPLOY: TROPHY ROOM pass 2 — the cabinet + chasing packs + dept ladder + race distance

**Commits:** this commit (`index.html` + `tests/nerd-stats/run.mjs` + changelog) on `claude/trophy-room-improvements-k87hgr`, cut from `1441487` and **rebased onto `main` `9163d81` (Nerds batch five)** after main moved in flight — `index.html` and the nerd suite auto-merged (disjoint regions: this pass lives in `renderAwards`, batch five in `renderNerds`/`consensusCompute`); this changelog was the only conflict, both entries kept. **Fast-forwarded to `main` on the organizer's explicit "Push to main".** **Frontend only — no DB / scoring / sync change, zero new backend traffic.** Organizer ask: make the Trophy Room more interesting.

**The contract stays locked:** no title, floor, or tie-break moved — definitions as announced 6 Jul. Everything below is display over the same two sources the room already reads (slim standings + the `consensusFull()` analytics tier); no new pull, no new CONS field, seal rules unchanged (the only names rendered are race leaders — now a tap deeper — and "you").

**What (all in `renderAwards`, one shared-helper touch below):**
- **The cabinet** (top): six shelves — Podium, the four titles, Dept Cup — each with the current holder's first name and number, as it stands right now. Vacant shelves read "Unclaimed"; consensus-tier shelves show "counting" until the tier lands. Tapping a shelf jumps to its race card (cards now carry ids + `scroll-margin-top`).
- **Chasing packs:** a race deeper than 3 folds ranks #4–#8 behind "The chasing pack — N more in this race" (`.aw-more` toggle; open state survives silent re-renders via `AW_OPEN`); deeper than 8 closes with "…and N more chasing". The Dept Cup gets the same fold for squads #4–#12.
- **Race depth + winning pace** per title (one `.aw-race` line): "🎟️ N colleagues in this race · 📈 winning pace points at X by FT" — pace = the leader's count scaled by matches settled, shown only when ≥20 matches are settled, racing is left, and the projection actually moves. Hot Hand sits out: runs don't scale.
- **Your rank in the race:** the personal line gains "· 10th of 48 in the race" (leader crown line unchanged).
- **Department Cup ladder:** every ranked squad now renders (top 3 up, the rest folded), each with its player count and its average as a bar against the leader's, plus "N smaller squads below the 5-player line".
- **Race distance** (bottom card): matches settled over all 104 as one meter — "N matches of racing left — every belt can still change hands".
- **Leader shine:** the #1 row in every race wears a quiet gold wash (`.aw-row.lead`).
- Shared-helper touch: `awRowHTML` learned plain ranks past the medals (`#4`+) and the lead wash — the Trophy Room is its only caller.
- Kiosk: `.aw-more` hidden under `?tv` (nobody there to tap — packs stay folded); personal lines already hidden.

**Verified on the shipped (rebased) tree:** `nerd-stats` **ALL GREEN (all 27 batch-five cards + this pass together)** — 13 new assertions recomputed independently from the seed (cabinet shelf order + Oracle/Podium/Dept holders and numbers, pack size/ranks/fold toggle, depth n=48 + pace-31-by-FT line, my rank 10th of 48, dept ladder 5 squads all barred + fold button, distance 97/104 · 93%); the existing race-pulse assertion now targets the 🔥 line specifically (a card can carry two `.aw-race` lines). Regression: `perf-boot` ALL GREEN · `share-cards` green except the **pre-existing** 340px header overlap · `node --check` clean on both inline blocks. Awards + Nerds 390px full-page screenshots eyeballed (the test now saves `awards-390.png` too).

**Rollback:** `git push origin +9163d81:main` (client-only — nothing server-side changed; reverts `main` to the batch-five tip, the parent of this deploy). The app ships a service worker: a stale shell may need one hard reload / app reopen.
---

## 2026-07-06 (Doha) — MAIN DEPLOY: STATS FOR NERDS · batch five — six fresh-angle cards + sticky jump chips

**Commits:** this commit (`index.html` + `tests/nerd-stats/run.mjs` + changelog) on `claude/stats-for-nerds-3yajyc`, rebased onto `main` `1441487` (the banner-rework deploy — disjoint), **fast-forwarded to `main` on the organizer's explicit "Push"**. `main` had not moved since the rebase — clean FF. **Frontend only — no DB / scoring / sync change, zero new backend traffic.**

**Shared-code touches (the two to review), both additive in `consensusCompute()`:**
- `CONS.chips` — an aggregate armband ledger `{armed:{qf,sf,fin}, cashed, burned, pending, doubled}`: counts and points only, no identities; computed from data already in the loop.
- `CONS.joinMap` — `{slug: joinedAt-ms}`; the founding-members card aggregates it into join-order terciles and never names a cohort member.
Both verified non-breaking by the full share-cards suite (drives every existing `consensusFull` consumer).

**Six new Nerds cards (panel now 27):**
- **The armband ledger** (⚡, tiles; renders only while power-ups are live) — armbands armed by round, cashed vs burned, bonus points minted by the ×2, plus the office-wide 🦅 upset payout (k-floored) and your own armband book.
- **The graveyard shift** (🌙, meters) — office accuracy by **Doha kickoff hour** (daytime / evening / late / 03–06 graveyard); quantifies whether the 3am calls are worse. ≥20 calls per slot.
- **The scoreline stock market** (🎫, ticket rows) — each popular exact-score "ticket": bought vs paid and the points-per-ticket EV of the +2 market; best value vs biggest bust among liquid (30+) scorelines.
- **Home-soil bias** (🏟, meters + tiles) — office calls on the listed home side vs home sides actually winning, goals/match by host country (MEX/USA/CAN, ≥3 matches each), hottest ground (≥3). Venue part reads public scores only.
- **The draw blind spot** (🙈, meters) — accuracy of draw calls vs win calls, plus 👻 draws that landed with <10% backing.
- **The founding members** (📜, meters) — the playing field split into join-order terciles: average points founding vs middle vs deadline third, and your own join rank (you-line only).

**Sticky jump chips:** the panel is 27 cards long, so `renderNerds` now injects a sticky emoji chip row (one per card, `title`/`aria-label` = card name) under the intro; tap scrolls to the card. Pure display, built post-render from the cards themselves — no per-card markup changes.

**Seal posture unchanged:** settled-only, k-anon floors (5 group / 8 knockout) on every pick-derived number, venue/goals cards read public scores only, names only positive leaders + "you" (`.aw-you`, hidden on `?tv`).

**Verified on this tree:** `node tests/nerd-stats/run.mjs` **ALL GREEN ×2 (73 checks)** — seed upgraded to power-ups LIVE with four armed armbands and join dates spread across 48 days; all 27 cards render and each batch-5 number is **recomputed independently from the seed**: ledger tiles (4 armed / 2 cashed / 0 burned / 2 riding / 12 pts minted / 0 upset-paid — upset payout correctly floor-gated at n<8), graveyard 4 slots with the first at 68%, stock-market 2–0 ticket row (193 bought / 193 paid / 2.00 EV — the seed only buys winning tickets by construction), home bias 53% backed vs 75% delivered, draw accuracy 56% vs win 70%, founding terciles to one decimal, "1st to join" you-line, jump chips = card count with correct first target, and the still-alive ceiling re-derived under live power-ups (134). Regression: `tests/perf-boot/run.mjs` ALL GREEN; `tests/share-cards/run.mjs` green except the **pre-existing** 340px header failure. `node --check` clean on both inline blocks. 390px full-page screenshot of all 27 cards + chip row eyeballed.

**Rollback:** `git push origin +1441487:main` (client-only — nothing server-side changed; reverts `main` to the banner-rework tip, the parent of this commit). The app ships a service worker: a stale shell may need one hard reload / app reopen.

---

## 2026-07-06 (Doha) — MAIN DEPLOY: the banner rework (what's-new billboard with feature rows) ships to production

**Commits:** this commit (changelog), then `main` fast-forwarded `6eb8660` → this tip and pushed **on the organizer's explicit "Go ahead and push"**. Main had moved under the branch twice (the banner-hub deploy `70711fd` and Nerds batch four `6eb8660`) — **rebased onto the batch-four tip first**; the share-cards test auto-merged, three `index.html` banner hunks resolved in this rework's favour (adopting the hub pass's `xbGoMode` helper), the changelog conflict resolved keeping both sides. Ships the one branch commit below. **Frontend only — no DB / scoring / sync change, zero new backend traffic.**

**Player-visible net change:** the persistent banner re-leads with today's launches ("Just dropped: 🤓 nerd stats · 📤 your card deck", ✨ icon); the four icon chips become three feature rows with a name + one-line pitch + deep link (🤓 → Nerds leaderboard · 📤 → share tray · ⚡ armband → power-ups FAQ, with Thursday's QF-lock deadline in the pitch); the CTA becomes "Everything that's new ›" (re-opens the spotlight); and the min-key bump (`wc:banner:min2`) gives every player — including those who shrank the old banner — exactly one full showing of the refreshed card.

**Verified on the shipped (rebased) tree:** `share-cards` 106 PASS + only the **pre-existing** 340px header overlap · `nerd-stats` ALL GREEN (21 cards) · `perf-boot` ALL GREEN · `node --check` clean ×2 · headless click-through of every row + CTA with zero page errors (`wc:whatsnew` untouched by the rows).

**Verify after push:** Pages action green; prod `index.html` (cache-busted) contains `xb-feats` and `wc:banner:min2`.

**Rollback:** `git push origin +6eb8660:main` (client-only — reverts `main` to the batch-four tip, the parent of this deploy; nothing server-side changed). The app ships a service worker: a stale shell may need one hard reload / app reopen. `wc:banner:min2` is orphaned on rollback (harmless); players return to their old `wc:banner:min` choice.

---

## 2026-07-06 (Doha) — BANNER REWORK: the persistent banner becomes a what's-new billboard with feature rows (branch, deploying on organizer's "Go ahead and push")

**Commits:** this commit (`index.html` + `tests/share-cards/run.mjs` + changelog) on `claude/banner-content-display-pzpnff`, cut from `b055b84` and **rebased onto `main` `6eb8660`** (batch four) after main moved twice in flight — the banner-hub deploy (`70711fd`) and Nerds batch four. `tests/share-cards/run.mjs` auto-merged; `index.html` had three banner hunks resolved in this rework's favour; this changelog keeps both sides. **Frontend only — no DB / scoring / sync change, zero new backend traffic.** Organizer ask: the banner's contents and display are stale — "more important and more interesting new features not properly displayed/marketed."

**Why (supersedes the banner-hub layer's copy and chip grid, keeps its plumbing):** even after the hub pass, the banner still *led* with power-ups ("Power-ups are LIVE · share cards are here") — days-old news — and sold today's launches as four cramped icon chips with no pitch. This re-leads the content around what's actually new and gives each feature a name, a one-line pitch, and a door.

**What (same `#xbanner` machinery — sticky, shrink-only, auto-strip on scroll, spacer, kiosk-hidden):**
- **Content re-led:** header → "Just dropped: 🤓 nerd stats · 📤 your card deck"; icon ⚡ → ✨. Power-ups stay as the third, time-sensitive row (armband before Thursday's QF locks), not the headline.
- **Icon chips → feature rows** (`.xb-feats`/`.xb-feat` replace `.xb-chips`/`.xb-chip`: real `<button>`s with name + pitch + chevron; stacked on phones, 3-across ≥600px): 🤓 **Stats for nerds** (NEW tag, "21 cards of office truth…") → the hub pass's `xbGoMode('nerds')` (kept — it deliberately never stamps `wc:whatsnew`; the Nerds pill + leaderboard visit clear both NEW-dot keys) · 📤 **Your card deck** → `openShareTray()` · ⚡ **Captain's armband ×2** → `openFaq('power-up')`. Trophy Room cedes its row to the spotlight/CTA (it's day-old news); the card-body tap still toggles the strip.
- **CTA** "How power-ups work" → "**Everything that's new ›**" (`openWhatsNew()`, the re-openable spotlight); the strip CTA likewise → "What's new ›".
- **One full showing for everyone:** the hub pass flipped the default to expanded but kept `wc:banner:min` — players who'd ever shrunk the old banner would never see the new card in full. `BANNER_MIN_KEY` → **`wc:banner:min2`**, so the refreshed card gets exactly one guaranteed full showing; scroll auto-shrink and the remembered chevron choice behave as before on the new key.
- Test kept in sync: the share-cards banner assertion now checks the nerd-stats + card-deck copy and that the rows carry `xbGoMode` / `openShareTray` / `power-up` handlers (the old assertion pinned the `share cards are here` heading this rework retires).

**Verified on the rebased tree:** `share-cards` **106 PASS** + only the **pre-existing** 340px header overlap (identical on base) · `nerd-stats` ALL GREEN (all 21 cards) · `perf-boot` ALL GREEN · `node --check` clean ×2. One-off headless click-through proof (zero page errors): full card shows by default on a fresh profile; 🤓 row → leaderboard + Nerds pill on + seen-keys set, `wc:whatsnew` untouched; ⚡ row → FAQ opens on power-ups; CTA → spotlight re-opens; body tap → strip. Banner screenshots eyeballed at 390px (full + strip) and 720px (3-across).

**Rollback:** `git push origin +6eb8660:main` (client-only — reverts `main` to the batch-four tip, the parent of this deploy; nothing server-side changed). The app ships a service worker: a stale shell may need one hard reload / app reopen. The min-key bump rolls back gracefully: `wc:banner:min2` is orphaned (harmless) and players return to their old `wc:banner:min` choice.

---

## 2026-07-06 (Doha) — MAIN DEPLOY: STATS FOR NERDS · batch four — raffle-or-racetrack + three bench cards + Trophy Room race pulse

**Commits:** this commit (`index.html` + `tests/nerd-stats/run.mjs` + changelog) on `claude/stats-for-nerds-3yajyc`, **rebased onto `main` `70711fd` (the louder banner-hub deploy; `index.html` auto-merged — disjoint regions; this changelog was the only conflict, both entries kept) then fast-forwarded to `main` on the organizer's explicit "Go ahead"** (in direct reply to "Say push and it ships"). **Frontend only — no DB / scoring / sync change, zero new backend traffic.** One deliberate shared-code touch (below); everything else is additive `renderNerds`/`renderAwards` display.

**The shared-code change (the one to review):** `consensusCompute()` now also keeps `CONS.perP` — an **anonymous** array of `{c: hits, n: settled calls}` per player, values it already computed in its existing loop and previously discarded. No slug, no name, no ordering key; three lines added, no existing field or pass touched. It exists solely to feed the raffle-or-racetrack card. Verified non-breaking by the full share-cards suite (which drives `consensusFull` consumers) and the nerd suite.

**Four new Nerds cards (panel now 21):**
- **Raffle or racetrack?** (🎰) — the variance decomposition: observed spread of per-player hit rates vs the spread pure binomial luck would produce if everyone had equal skill → a skill multiple ("×2.3 wider than luck") and a skill-share meter, with a raffle/racetrack verdict and a plain-words method line. Gates: 15+ colleagues with 10+ settled calls, base rate not 0/1.
- **The predictability ladder** (🪜) — office pick accuracy by structural round (weighted, k-floored), the knockout-cliff read (group vs KO accuracy), easiest/hardest round. Complements the calendar-axis form curve.
- **The photo finish** (🏁) — the shape of the top 10: leader's cushion, points covering the top 5, the gap ladder (#1→#2 … #9→#10) with the natural break highlighted. Standings-only; the only name is the leader's first name.
- **The belt races** (🥊) — all four Trophy Room titles as one tension board: leader + margin, dead-heat flags, challengers-within-one; points at the full races in 🏆 Awards. Reads `rows` + `CONS.tops` only.

**Trophy Room (`renderAwards`) race pulse:** each title card now shows a display-only tension line under its top-3 — "🔥 N-way dead heat at the top" or "🔥 N challenger(s) within one <unit> of the belt". **No race rule, floor, or tie-break changed** — definitions stay locked; this is commentary on the existing numbers. Hidden when the race is unclaimed or nobody is within one.

**Verified on this tree:** `node tests/nerd-stats/run.mjs` **ALL GREEN** — all 21 cards render, batch-4 numbers recomputed independently from the seed and matched to the DOM: raffle multiple ×13.0 / 92% skill / n=48 (the seed assigns true skill 35–95%, so a hard racetrack verdict is the correct read), ladder = 6 rounds with MD1 66%, photo finish 19/22/19 (cushion/top-5/break), belts (Oracle leader + value, Hot Hand record), and the Trophy Room pulse ("2-way dead heat" on Oracle) asserted in Awards mode. Regression: `tests/perf-boot/run.mjs` ALL GREEN; `tests/share-cards/run.mjs` green except the **pre-existing** 340px header failure. `node --check` clean on both inline blocks. 390px full-page screenshot of all 21 cards eyeballed.

**Rollback:** `git push origin +70711fd:main` (client-only — nothing server-side changed; reverts `main` to the banner-hub tip, the parent of this commit). The app ships a service worker: a stale shell may need one hard reload / app reopen.

---

## 2026-07-06 (Doha) — MAIN DEPLOY: the home banner becomes a "what's new" hub for all four launches

**Commits:** this commit (`index.html` + changelog) on `claude/nudge-users-new-features-1xjgw6`, cherry-picked onto the live nudge-pass tip (`b055b84`) and fast-forwarded to `main` **on the organizer's explicit "Go ahead with this solution."** A parallel session shipped the nudge pass below (spotlight refresh + engagement-cleared breadcrumbs + Help re-open) to production while this was in flight; this deploy therefore adds **only** the louder home-banner layer and drops the two commits that duplicated that live work. **Frontend only — no DB / scoring / sync change, zero new backend traffic.** Organizer ask: "slightly louder, and for all the new features I shipped today."

**Why:** the live nudge pass made discovery correct but quiet — a one-time spotlight plus small breadcrumbs. Today's four launches had home surfaces (⚡ power-ups → this banner; 📤 share cards → the deck FAB), but 🏆 Trophy Room and 🤓 Nerds (Leaderboard modes) had only the quiet nav dot, and the banner itself defaulted to a collapsed strip so its chips were never seen. This turns the persistent banner (`#xbanner`) into the one loud, self-retiring hub for all four.

**What:**
- **The four decorative chips are now tappable deep-links** (each a real `<button>`, not `aria-hidden` decoration): ⚡ **Power-ups** → `openFaq('power-up')`, 🏆 **Trophy Room** → new `xbGoMode('awards')`, 🤓 **Nerds Stats** → `xbGoMode('nerds')`, 📤 **Share cards** → `openShareTray()`. `xbGoMode(m)` jumps straight into that Leaderboard mode and `markSeen(m)` (clearing the mode's NEW pill + the nav dot) — and deliberately **does not touch `wc:whatsnew`**, so a chip never suppresses the live one-time spotlight for someone who hasn't seen it. The banner's tap-to-toggle already ignores taps on `a,button`, so a chip navigates instead of collapsing the strip.
- **Banner now greets players expanded** — the default flipped from the shrunk strip to the full card (`BANNER_MIN_KEY` null ⇒ expanded) so the chips are actually seen. It still auto-shrinks on scroll, still remembers an explicit collapse, and still retires itself at `BANNER_UNTIL` (2026-07-15). This is the "slightly louder" knob; a returning player who'd explicitly shrunk it keeps their choice.
- **Copy broadened** — the sub now names the Trophy Room, Stats for Nerds, and the share cards. The `Power-ups are LIVE · share cards are here` heading is unchanged (kept verbatim — the share-cards test pins that substring).
- **`.xb-chip` restyled as a button** (border:0, full-width, pointer, hover/active feedback) — same gold-badge look, now interactive.

**Left deliberately unchanged:** 📤 share discovery still *belongs* to the deck FAB (the banner chip is an extra door, not a competing persistent hub); the live nudge pass's one-time spotlight, engagement-cleared nav dot, and Help-sheet re-open row all stay exactly as deployed. Layered: loud one-time spotlight → always-on home banner (now a 4-feature hub) → quiet self-clearing dots → on-demand re-open from Help.

**Verified on this (rebased) tree:** `node tests/share-cards/run.mjs` — banner shows every visit with the `share cards are here` copy ✓, the FAB (not the banner) still owns the tray ✓, FAB count/clearance ✓ (only the **pre-existing** 340px header-overlap failure remains). `node tests/nerd-stats/run.mjs` **ALL GREEN**. `node tests/perf-boot/run.mjs` **ALL GREEN**. Direct probe on the real page: banner defaults expanded; all four chips are `<button>`s with the right deep-links; tapping 🤓 → `state.view='leaderboard'`, `LB_MODE='nerds'`, `wc:seen:nerds=1`, **`wc:whatsnew` still null**; 🏆 → awards mode. Expanded-banner screenshot at 390px eyeballed (clean 2×2 chip grid).

**Rollback:** `git push origin +b055b84:main` (client-only — reverts `main` to the live nudge-pass tip, the parent of this deploy; nothing server-side changed). The app ships a service worker: a stale shell may need one hard reload / app reopen.
---

## 2026-07-06 (Doha) — MAIN DEPLOY: the nudge pass (spotlight refresh + engagement-cleared breadcrumbs) ships to production

**Commits:** this commit (changelog), then `main` fast-forwarded `27a528e` → this tip and pushed **on the organizer's explicit "Push main"**. Main had moved under the branch (the two Stats-for-nerds card batches `366051b`/`27a528e`) — **rebased onto the new tip first**; `index.html` and `tests/share-cards/run.mjs` auto-merged (disjoint regions), the one changelog conflict resolved keeping both sides. Ships the two branch commits below (nudge pass 1 + 2). **Frontend only — no DB / scoring / sync change, zero new backend traffic.**

**Player-visible net change:**
- The one-time What's-new spotlight re-shows **once** (`WHATSNEW_VER` → `"2026-07-06-nerds-deck"`) with today's top three: ⚡ armband (QF locks Thursday) · 🤓 Stats for nerds (new `wnGoNerds()` deep link) · 📤 the share-card deck (FAB + preview copy). Trophy Room folds into the footer line.
- The Leaderboard nav NEW dot survives dismissing the spotlight and clears only when the 🤓 pill is actually tapped; dismissal refreshes dots immediately.
- A pinned gold "✨ What's new" row at the top of the Help sheet re-opens the spotlight anytime (`openWhatsNew()`).
- Fit fix: the spotlight card scrolls on short phones instead of clipping the "Got it" button.

**Verified on the shipped (rebased) tree:** `share-cards` 106 PASS + only the **pre-existing** 340px header overlap · `nerd-stats` ALL GREEN · `perf-boot` ALL GREEN · the 10-check headless persistence proof ALL PASS · `node --check` clean ×2.

**Verify after push:** Pages action green; prod `index.html` (cache-busted) contains `2026-07-06-nerds-deck` and `faq-wn`.

**Rollback:** `git push origin +27a528e:main` (client-only — nothing server-side changed; reverts `main` to the batch-three tip, the parent of this deploy). The app ships a service worker: a stale shell may need one hard reload / app reopen. Rolling back also un-bumps `WHATSNEW_VER` — players who saw the new card will simply not see it again (their stamp no longer matches either version; harmless).

---

## 2026-07-06 (Doha) — NUDGE PASS 2: the nudge survives dismissal (branch-only, NOT deployed)

**Commits:** this commit (`index.html` + changelog) on `claude/nudge-users-new-features-qubl0y`, on top of the spotlight refresh below. **NOT pushed to main.** **Frontend only.** Organizer follow-up: "if they click on something or dismiss it, it disappears forever."

**What (three small pieces — the spotlight stays one-shot; persistence moves to engagement-cleared breadcrumbs):**
- **Nav dot chained to the newest surface:** `lb-new` (the dot on the Leaderboard nav) now shows while `wc:seen:lb` **or** `wc:seen:nerds` is unset — it survives dismissing the spotlight and even visiting the leaderboard, and only clears when the 🤓 pill is actually tapped (where `nrd-new` continues the trail). Per-launch curated chain — extend the OR when a future launch warrants it, don't wire every mode in permanently.
- **`dismissWhatsNew()` now calls `updateNewDots()`** so the breadcrumb appears the instant the modal closes, not on the next navigation.
- **The spotlight is re-openable on demand:** a pinned gold "✨ What's new — the latest features" row at the top of the Help sheet (`.faq-wn`, above `#faq-list`, reachable from home "How does this work?", Me → FAQ, the rules line, the power-ups banner) calls new `openWhatsNew()` — same `#wnov` card, no version-gate side effects beyond the usual stamp on dismiss.

**Verified on this tree:** one-off headless proof (10 checks): dismiss without tapping → nav dot appears immediately; leaderboard visit marks `lb` but the dot persists; 🤓 pill tap clears both dots; Help shows the ✨ row; row click closes Help and re-opens the spotlight; steady state clean (no boot re-show, no dots, scroll restored); zero page errors. Harness regression: `share-cards` 106 PASS + the **pre-existing** 340px header overlap only · `nerd-stats` ALL GREEN (its `nrd-new` set/clear assertions untouched) · `perf-boot` ALL GREEN. `node --check` clean ×2. Help sheet screenshot at 390px eyeballed.

**Rollback:** branch-only — `git revert` this commit.

---

## 2026-07-06 (Doha) — NUDGE PASS: What's-new spotlight refreshed to today's feature set (branch-only, NOT deployed)

**Commits:** this commit (`index.html` + `tests/share-cards/run.mjs` + changelog) on `claude/nudge-users-new-features-qubl0y`, cut from `main` tip `3cea386`. **NOT pushed to main** — deploying is the organizer's call ("push to main"). **Frontend only — no DB / scoring / sync change, zero new backend traffic.** Organizer ask: "slightly nudge the users to the new features."

**Why:** the live spotlight version (`2026-07-06-powerups-live`) predates two of today's deploys — 🤓 Stats for nerds shipped *after* it (its only awareness is the NEW dot inside the Leaderboard mode row, invisible from the nav for anyone who cleared `wc:seen:lb` back in Wave A), and the 📤 item's copy still described the old brag-row entry, not the deck FAB. The spotlight is the house once-per-player nudge (localStorage-gated, never re-shows) — the "slight" part is built in.

**What (all in the existing `#wnov` card — no new surfaces, no repeat shows, no banners):**
- `WHATSNEW_VER` → `"2026-07-06-nerds-deck"` — the refreshed card shows **once** to everyone (including this morning's dismissers, who'd otherwise never hear of Nerds) and stamps itself seen on dismiss, as always.
- **Items are now today's top three:** ⚡ Captain's Armband (unchanged — still the time-sensitive one, QF locks Thursday) · **🤓 Stats for nerds** (new item, new `wnGoNerds()` deep link: selects the Nerds pill, `markSeen("lb"/"nerds")` so both NEW dots self-clear, lands on Leaderboard) · **📤 Your share-card deck** (copy now points at the gold deck FAB + preview-before-send; deep link unchanged → `openShareTray()`).
- **🏆 Trophy Room** dropped from the item list (announced in the previous version) but kept as a pointer in the `wn-more` footer line ("Title races run live under Leaderboard → Awards; titles never move points"); the `aw-new` pill dot still catches stragglers in-place.
- **Fit fix (pre-existing bug):** `.wn-card` had no scroll guard — on short phones (375×667) the 745px card center-clipped and the "Got it" button was unreachable. Added `max-height:calc(100dvh - 44px);overflow:auto`. Browsers without `dvh` ignore the declaration (status quo, no regression).
- Test kept in sync: `tests/share-cards/run.mjs` whatsnew assertion `'New share cards'` → `'share-card deck'`.

**Verified on this tree:** `node tests/share-cards/run.mjs` — 106 PASS, sole failure is the **pre-existing** "header overlap at 340px" (identical on base `3cea386`; the organizer's known pending header issue, untouched here). `tests/nerd-stats/run.mjs` ALL GREEN · `tests/perf-boot/run.mjs` ALL GREEN. One-off headless proof of the new wiring (spotlight opens for the new version → real click on the 🤓 item → overlay closes, version stamped, `LB_MODE="nerds"`, pill selected, both seen-keys set, NEW dot cleared, leaderboard shown, body scroll restored, no re-show after dismissal, zero page errors). `node --check` clean on both inline script blocks. Card screenshots eyeballed at 390×844 (fits, 728px) and 375×667 (scrolls, "Got it" reachable).

**Deploy note (when the organizer says push main):** fast-forward/rebase onto `main` as usual; the SW may need one hard reload / app reopen to pick up the new shell. Bumping `WHATSNEW_VER` costs each player exactly one modal — don't bump again for minor copy tweaks.

**Rollback:** branch-only — `git revert` this commit, nothing server-side. If deployed: `git push origin +3cea386:main` (or the then-current parent).

---

## 2026-07-06 (Doha) — MAIN DEPLOY: STATS FOR NERDS · batch three — five more cards

**Commits:** this commit (`index.html` + `tests/nerd-stats/run.mjs` + changelog) on `claude/stats-for-nerds-3yajyc`, on top of the deployed batch two (`366051b`), **fast-forwarded to `main`** on the organizer's explicit "Push" (in direct reply to "'push to main' ships all five"). `main` had not moved — clean FF, no rebase. **Frontend only — no DB / scoring / sync change, zero new backend traffic** (same standings + `consensusFull()` caches; `consensusCompute` itself untouched).

**What:** five more cards in `renderNerds()` (panel now 17), drawn from the vetted bench of the earlier 20-idea design panel:
- **The herd-o-meter** (🐑, meter + tiles) — average top-pick share across floored settled matches, landslide (80%+) vs genuine-split (≤55%) counts, and the single most divided match. Pairs with the overconfidence curve: one measures *agreement*, the other whether agreement is *justified*.
- **The markets lab** (🧾, duo bars) — the office's scoreline calls reduced to the classic markets: BTTS, Over 2.5, routs (margin 3+), office-scripted vs full-time reality, with an Under-bettor/goal-drunk verdict. Same floors as the scoreline lab (per-match ≥5, ≥50 total calls).
- **The favourite tax** (🏷️, meters) — the only FIFA-rank lens: office calls backing the higher-ranked side vs how often favourites actually win, plus the biggest humbling (lowest-rank-number team beaten outright) and a your-chalk-appetite line. Delivery reads public results only; backing shares are k-floored.
- **The streak spectrum** (🔥, histogram) — everyone's best-ever run (`CONS.tops.streak`, already computed, previously only the leader shown) as a ×1…×8+ distribution with your bin highlighted, the office median, and the Hot Hand record for scale. ≥10 runs to render.
- **Stage wins** (👑, crown roll) — `CONS.dayTop` played as a stage race: the last 8 matchday winners (names are per-day *winners* — sanctioned positive leaders), distinct crown-holder count as a volatility tell, most-crowns leader, and your crown count.

Seal posture unchanged: settled-only, k-anon floors (5 group / 8 knockout), names only positive leaders + "you"; personal lines wear `.aw-you` (hidden on `?tv`). New CSS is just the `.nrd-crown` row; everything else reuses the existing `nrd-*` idiom.

**Verified on this tree:** `node tests/nerd-stats/run.mjs` **ALL GREEN** — all 17 cards render (none stuck pending), and each new card's numbers are **recomputed independently in the test from the same ~48-player seed**: herd average (66% over 97 floored matches), markets Over 2.5 called/happened (25/25), favourite-tax backing (42%) vs delivery (47% over 97 ranked matches), streak spectrum n=48 + median ×4 (best-run replication in kickoff order, mirroring `consensusCompute`), stage wins 9 distinct holders / 28 matchdays + 8 crown rows (dayTop replicated in slug order with strict-> tie rule and Doha dayKey). Regression: `tests/perf-boot/run.mjs` ALL GREEN; `tests/share-cards/run.mjs` green except the **pre-existing** 340px header failure (identical count on the deployed base). `node --check` clean on both inline blocks. 390px full-page screenshot of all seventeen cards eyeballed.

**Rollback:** `git push origin +366051b:main` (client-only — nothing server-side changed; reverts `main` to the batch-two tip, the parent of this commit). The app ships a service worker (prior perf pack): a stale shell may need one hard reload / app reopen to pick up the new `index.html`.

---

## 2026-07-06 (Doha) — MAIN DEPLOY: STATS FOR NERDS · batch two — six more cards

**Commits:** this commit (`index.html` + `tests/nerd-stats/run.mjs` + changelog) on `claude/stats-for-nerds-3yajyc`, on top of the already-deployed `🤓 Nerds` mode (`a9af420`), **rebased onto `main` (`3cea386`, the knockout round-picker caret fix) then fast-forwarded to `main`** on the organizer's explicit "push to main". Clean rebase — `3cea386` touches only the round-picker caret CSS, disjoint from the Nerds code, no changelog conflict. **Frontend only — no DB / scoring / sync change, zero new backend traffic** (same standings + `consensusFull()` caches).

**What:** six new cards in `renderNerds()`, interleaved with the original six, each design-vetted (5-lens ideation → judged → adversarial feasibility/seal-safety verify) before build:
- **Desk spread** (📦, box plots) — points *dispersion* per department (min · Q1 · median · Q3 · max), the story the Dept Cup's average can't tell. Standings-only, `DEPT_MIN=5` gate, names desks not people.
- **The payoff matrix** (🎲, 2×2 grid) — every settled call bucketed herd-vs-fade × right-vs-wrong (Safe&right / Sharp fade / Herd trap / Brave&wrong), with going-with vs fading-the-crowd success meters and the points a landed fade banks vs a landed ride. Aggregate call counts only; `total<150` shows pending.
- **The overconfidence curve** (🎯, calibration) — bins settled matches by the office's modal-vote *confidence*, plots how-often-right (gold) vs how-sure (blue) per band, a Brier skill-vs-coin-flip score, and an over/under-confidence headline. Sparse bands fold down; `<6` floored matches → pending.
- **Goals by round** (🥅, histogram) — goals/match by structural round (MD1→Final), peak highlighted, group-vs-knockout tightening/blowing-open read. Public final scores only — zero k-anon surface.
- **Still alive** (⏳, meter) — the mathematical points ceiling still on the table and how many of the field can still catch the leader; pure fixture arithmetic over standings, hidden until someone's scored. Your own catchability line subtracts a dead champion ticket.
- **Swing matches** (🎢) — locked-but-unsettled ties ranked by stake × how split the office is (a sealed 50/50 in a big tie tops it). Gated on `lockedM` + the 5/8 floors — the same aggregate consText already shows on match cards.

All settled-only, k-anon-floored (5 group / 8 knockout), names only positive leaders + "you" (personal lines wear `.aw-you`, hidden on `?tv`). New CSS is scoped `.nrd-quad/.nrd-box*/.nrd-rounds/.nrd-swing`; calibration/still-alive reuse the existing `nrd-*` idiom.

**Verified on this tree:** `node tests/nerd-stats/run.mjs` **ALL GREEN** — rebuilt with a richer ~48-player, 5-department seed (deterministic-but-varied picks so splits/confidence/dispersion are non-degenerate); asserts all twelve cards render (none stuck pending) with numbers **recomputed independently in the test from the same seed**: payoff ride/fade success %, goals-by-round wildest round, still-alive points-on-the-table (120) + can-still-win (26/48), desk count (5) + your-desk highlight, crowd meter, dead-ticket share, and the personal points line. Regression: `tests/perf-boot/run.mjs` ALL GREEN; `tests/share-cards/run.mjs` green except the **pre-existing** 340px header failure (identical count on the deployed base). `node --check` clean on both inline blocks. 390px full-page screenshot of all twelve cards eyeballed. (Test note: the seed has favorites always winning, so the payoff card's fade-lands path reads 0% in-test — it's exercised by real results in production; the counting logic is verified against independent recompute.)

**Rollback:** `git push origin +3cea386:main` (client-only — nothing server-side changed; reverts `main` to the round-picker-caret tip, the parent of this commit). The app ships a service worker (prior perf pack): a stale shell may need one hard reload / app reopen to pick up the new `index.html`.

---

## 2026-07-06 (Doha) — MAIN DEPLOY: STATS FOR NERDS — a 🤓 Nerds leaderboard mode

**Commits:** this commit (`index.html` + new `tests/nerd-stats/run.mjs` + changelog) on `claude/stats-for-nerds-3yajyc`, **rebased onto `main` (`ff52d84`, the day-banner pip-glyph fix) then fast-forwarded to `main`** on the organizer's explicit "push to main". Main moved twice mid-session (the power-ups-banner cleanup `f1f07d8`, then the pip fix `ff52d84`); rebased fresh onto each. Clean rebases — `index.html` auto-merged every time (the banner CSS, the pip glyphs, and the Nerds code are disjoint regions); the one changelog conflict (vs the banner entry) was resolved keeping both. **Frontend only — no DB / scoring / sync change, zero new backend traffic** (reads the standings + `consensusFull()` analytics caches already in hand).

**What:** a fifth Leaderboard mode pill, **🤓 Nerds** (with the standard `tnew` NEW badge, `markSeen("nerds")`), rendering `renderNerds()` — the tournament as one dataset:
- **KPI tiles** — matches settled, calls settled, office hit rate, exact scores nailed, goals/match, players still perfect.
- **The points curve** — office points histogram (auto-sized bins, players with ≥1 pick), your bin highlighted + a "top X%"/median gap line.
- **The hive mind** — a follow-the-office-majority robot's hit rate vs the average colleague (meters), plus chalkiest result / biggest shock and your own hit rate vs the office.
- **The scoreline lab** — 5×5 predicted-scoreline heatmap (settled group matches only), top-4 called scorelines + "Any draw" as predicted-vs-reality bars (gold = office calls, blue = full-time reality, legend on), predicted vs actual goals/match.
- **The form curve** — office hit rate by matchday (≥20-call days), sharpest day highlighted.
- **The champion market** — champion-bet spread (top 6 + "the field"), 💀 dead-ticket detection (team beaten in a settled KO tie, or outside the 32-team KO field once all slots are known) + dead-ticket share, your own ticket line.
- **Nerd corner** — goals total, draw share, biggest scoreline, exact-score strike rate, hottest current hand, your pick-twin.

**Seal/anon rules as everywhere:** aggregates over settled matches only; per-match numbers ride consText's k-anon floors (5 group / 8 knockout); the only names rendered are positive leaders and "you"; personal lines wear `.aw-you` so the `?tv` kiosk hides them (the kiosk rotation itself is untouched — nerds is not in the tv seq). Demo mode can't reach it (lbmode row hidden, dispatch gated `!state.demo`). Sections needing the analytics tier show the standard pending pulse until `consensusFull()` resolves, then re-render.

**Verified on the shipped (rebased) tree:** `node tests/nerd-stats/run.mjs` **ALL GREEN** — headless Chromium over the real page with a mocked Supabase layer and a seeded QF-week world; the panel's numbers are **recomputed independently in the test from the same seed** and must match the DOM: crowd meter (94% over 47 calls, incl. the three seeded KO upsets the majority missed), draw share, goals/match, settled count, heatmap cell coordinates for the four seeded scorelines, dead-ticket share (67%), NEW-badge set/clear, People mode still renders, zero page errors. Regression on the rebased tree: `tests/perf-boot/run.mjs` ALL GREEN; `tests/share-cards/run.mjs` green except the **pre-existing** "header overlap at 340px" failure (identical count on the base tree — the organizer's known pending header issue, untouched here). `node --check` clean on both inline script blocks. 390px full-page screenshot eyeballed.

**Rollback:** `git push origin +ff52d84:main` (client-only — nothing server-side changed; reverts `main` to the pip-glyph-fix tip, the parent of this commit). The app ships a service worker (prior perf pack): a stale shell may need one hard reload / app reopen to pick up the new `index.html`.

---

## 2026-07-06 (Doha) — MAIN DEPLOY: power-ups banner (`#xbanner`) layout cleanup

**Commits:** this commit (`index.html` + changelog) on `claude/banner-styling-e5hazp`, **fast-forwarded to `main`** on the organizer's explicit "push to main" — main was at `286d482` and had not moved, so a clean FF (no rebase). **Frontend only — CSS + one copy string; no JS / DB / scoring change.** Organizer ask: "fix this banner, it doesn't look good."

**What (expanded card only; the collapsed `.mini` strip is untouched):**
- **Dropped the duplicate ⚡ (and the redundant 📤) from the heading.** The animated ⚡ badge already anchors the left edge, so `.xb-h` was rendering a *second* lightning bolt right next to it. Heading is now the clean "Power-ups are LIVE · share cards are here" (was "⚡ Power-ups are LIVE · 📤 share cards are here"). Copy still contains "share cards are here", so the share-cards test assertion holds.
- **Chips now sit on an even grid** (`.xb-chips`): `flex-wrap` — which stranded a lonely "SHARE CARDS" on its own row at ~440–470px and gave four ragged widths on desktop — becomes a 2-column grid that reads as a clean 2×2 on phones and switches to a 4-across row at ≥600px. Equal column widths, equal row heights; added the missing `nth-child(4)` cascade delay so all four badges stagger in.
- **Chip + heading finish:** chips centred with a soft `box-shadow` + inset highlight (tactile gold-badge look), slightly rounder; heading `line-height` 1.08→1.15 and `text-wrap:balance` so it no longer orphans a word when it wraps on narrow phones.

**Verified:** headless Chromium render of the expanded banner at 390 / 470 / 720px — single ⚡, balanced heading, even 2×2 (390/470) and 1×4 (720) chips, no 3+1 wrap; the collapsed `.mini` strip still renders as a 52px one-liner (⚡ · heading · "How power-ups work ›" · ▾). Full page boots with zero console errors. Before/after screenshots reviewed. Pages deploy action runs on the push to `main`.

**Rollback:** `git push origin +286d482:main` (client-only — nothing server-side changed). A stale shell may need one hard reload / app reopen to pick up the new `index.html` (the app ships a service worker from the prior perf pack).

**Follow-up (organizer, same session):** "I don't like the mailbox — give me other options." The 📤 outbox-tray glyph is the app-wide share/brag icon (~14 rendered spots + the generated share cards); a replacement is being chosen and will ship as its own deploy.
---

## 2026-07-06 (Doha) — MAIN DEPLOY: share-entry redesign (deck FAB) + preview-before-send ship to production

**Commits:** this commit (changelog), then `main` fast-forwarded `aa45220` → this tip and pushed **on the organizer's explicit "push to main this one"**. **Clean fast-forward — main had not moved; no rebase.** Ships the three branch commits below: the header hub → home-feed row (`206c433`), row → **thumb-zone deck FAB** (`9d6f210`), and **preview-before-send** (`5dc032a`), plus the handoff note. **Frontend only — no DB / scoring / sync change.**

**Player-visible net change vs the previously-deployed hub build:**
- The floating 📤 header hub (emoji + "9+" pill) is **gone**; the header is back to the clean wordmark + userchip (439px wc-hide breakpoint restored).
- Share discovery is now a **gold "deck" FAB** (`.deck-fab`, bottom-right above the nav, live count) that opens the share tray. Bottom nav unchanged; `.jumpnext` lifts clear of the FAB.
- Every share card now **previews before sending**: tap a card → it renders into the `#cardprev` overlay (Not now / Save / Share); Web-Share/download + confetti fire only on confirm. All five send paths route through `presentCard()`.

**Verified on the shipped tree:** `node tests/share-cards/run.mjs` ALL GREEN (ten cards build + preview, FAB count/click→tray, preview flow sends nothing until confirm, 6-width header sweep 340–1024px, zero page errors); `node --check` clean.

**Verify after push:** Pages action green; prod `index.html` (cache-busted) contains `deck-fab` and `presentCard`, and no longer contains `class="sharehub"`.

**Rollback:** `git push origin +aa45220:main` (client-only — nothing server-side changed). Note the app now ships a service worker (prior perf pack): a stale header may need one hard reload / app reopen to pick up the new shell.

---

## 2026-07-06 (Doha) — PREVIEW-BEFORE-SEND: every share card lands in a preview overlay first (branch-only, not deployed)

**Commits:** this commit (`index.html` + `tests/share-cards/run.mjs` + changelog) on `claude/social-artifacts-ideas-0ocr94`. **NOT pushed to main.** **Frontend only.** Organizer ask: "see whatever is going to be sent … before we decide if we want to send it."

**What:** a single preview choke point — `presentCard(canvas,file,text)` renders the built 1080×1350 card into a new `#cardprev` overlay (`.cpv`, z-365, above the tray) as an `<img>` from the blob, with actions **Not now · Save · Share ›**. The actual Web-Share / download fires ONLY on an explicit choice; the confetti + haptic moved from build-time to send-time (`cardCelebrate`). Browsers without file Web-Share get the primary relabelled "Save card ›" and the duplicate Save hidden.
- **All five send paths now route through it** (previously each had its own inline `toBlob`+share tail): `cardShip` (the 8 new-pack cards), `shareCard`, `shareSquad`, `shareBrag` (the ~8 brag cards), `shareWrapped`. Grep confirms `toBlob` now appears once, inside `presentCard`. Share text/filenames preserved per card; the "— staffchallenge26.com" suffix is appended centrally for `cardShip`/`shareBrag` callers exactly as before.
- Tray sub-copy: "tap one to **preview** it" (was "build it").

**Verified:** `tests/share-cards/run.mjs` ALL GREEN ×3 (was flaky once on preview-mount timing → now polls for the overlay): every one of the ten cards builds AND opens the preview; a real tray-tile tap opens the preview with a `blob:` image and **sends nothing** until confirm; "Not now" closes with zero sends (navigator.share stubbed to count); "Share" fires exactly once on confirm; FAB/header/nav checks still green; zero page errors; `node --check` clean (single `<script>` inline). 430px screenshot of the preview reviewed.

**Rollback:** `git revert` this commit (branch-only; nothing deployed).

---

## 2026-07-06 (Doha) — REDESIGN v2: share entry is now a thumb-zone "deck" FAB (organizer picked it from the gallery; branch-only, not deployed)

**Commits:** this commit (`index.html` + `tests/share-cards/run.mjs` + changelog) on `claude/social-artifacts-ideas-0ocr94`. **NOT pushed to main** — awaiting the organizer's go. **Frontend only, CSS + small JS.** Supersedes the home-feed row from the entry below (the organizer chose the Share-Deck-FAB tile from the redesign gallery).

**What changed vs the row:**
- **Removed** the `.cardscta` in-feed row (markup + CSS).
- **Added** `.deck-fab` — a fixed 60px gold squircle in the bottom-right thumb zone, above the nav (`bottom:calc(var(--nav-h) + 16px + safe-area)`), z-index 45 (below the tray sheet z-355 and all overlays, above content). Crafted SVG card-stack + sparkle icon, a tricolor micro-bar (the wordmark's identity thread), and a quiet gold count jewel. `refreshShareFab()` (renamed from `refreshShareCta`) shows it only when signed-in / non-demo / non-`?tv` and ≥1 card is available, sets the count (99+ cap) and the aria-label, and toggles `body.share-fab-on`; refreshed on boot (+1.2s), `renderMatches`, reveal close, and `updateNewDots`. Tap → `openShareTray()` (unchanged).
- **Collision handling:** `.jumpnext` ("Next unpicked") is also bottom-right; `body.share-fab-on .jumpnext` lifts it +72px. Verified there's no overlap in any state — and because `.jumpnext`'s containing block is the animated `.view` section (not the viewport), it actually rides in the content flow near the list bottom, so even at MAX SCROLL it sits ~200px clear of the viewport-fixed FAB.
- **Header + bottom nav unchanged** (organizer constraint): header stays the clean wordmark + userchip (439px wc-hide breakpoint kept); every nav icon/label is exactly as before.
- The power-ups banner still owns power-ups (its CTA was already pointed back there).

**Verified:** `tests/share-cards/run.mjs` ALL GREEN — hub confirmed removed; FAB shows its count; **FAB click** (real DOM click, not a direct call) opens the tray; FAB clears the bottom nav and the "next unpicked" button; 6-width header-integrity sweep clean 340–1024px; all ten cards + prior surfaces still build; zero page errors; `node --check` clean. 430px screenshots of the FAB home, the max-scroll coexist case, and the pressed (tray-open) state reviewed.

**Rollback:** `git revert` this commit (branch-only; nothing deployed).

---

## 2026-07-06 (Doha) — REDESIGN: share entry moves from the header hub to a home-feed row (branch-only, not deployed)

**Commits:** this commit (`index.html` + `tests/share-cards/run.mjs` + changelog) on `claude/social-artifacts-ideas-0ocr94`. **NOT pushed to main** — awaiting organizer review of the visual. **Frontend only, CSS + small JS.**

**Why:** the floating 📤 header hub (emoji-in-a-box + a "9+" pill) read as bolted-on and cluttered the brand row — the organizer rejected it twice ("ugly"). A 6-way design panel (rendered + critique-scored) unanimously moved the entry OUT of the header; the chosen direction is a slim self-explaining row in the content flow.

**What:**
- **Removed** the `.sharehub` button, its `.hubcnt` badge, all its responsive rules, and the seen-set/badge JS. The signed-in wordmark-hide breakpoint reverts 699→**439px** (its pre-hub value) — the header is once again just wordmark + userchip, byte-for-byte the pre-hub behaviour.
- **Added** `.cardscta` — a gold-hairline row ("Your share cards · N ready →", crafted SVG icon, no emoji) at the TOP of the home (Matches) view, in the scroll flow so it scrolls away. `refreshShareCta()` (renamed from the badge fn) shows it only when signed-in / non-demo / non-`?tv` and ≥1 card is available, with a live count from the shared `shareTiles()` composer; refreshed on boot (+1.2s), on `renderMatches`, on reveal close, and via `updateNewDots`. Tap → `openShareTray()` (unchanged tray).
- **De-dup:** the temporary power-ups banner's strip CTA reverts from "Open the share tray" back to "How power-ups work" — the banner owns power-ups, the row owns share, no stacked duplicate CTAs.
- **Bottom nav untouched** (organizer constraint): every nav icon/label is exactly as before.

**Verified:** `tests/share-cards/run.mjs` ALL GREEN — 6-width header-integrity sweep (clean 340–1024px), hub confirmed removed, row shows its count, tap opens the tray, banner shows with share-copy while the row owns the tray; all ten cards + prior surfaces still build; zero page errors; `node --check` clean. 430px screenshots of the row + pressed (tray-open) state reviewed.

**Rollback:** `git revert` this commit (branch-only; nothing deployed).

---

## 2026-07-06 (Doha) — HOTFIX: header collision — the 📤 hub broke the brand row on 440–699px phones

**Commits:** this commit (`index.html` + `tests/share-cards/run.mjs` + changelog), deployed to `main` immediately — **live regression, reported by the organizer with a player screenshot** (~460px viewport: the hub sat on top of "WORLD CUP 26", wordmark wrapped vertically). **CSS-only.**

**Why it escaped:** the signed-in wordmark hides below **440px** (`@media(max-width:439px)`); the share-hub verification ran at 390px (inside the safe zone) and desktop. The 440–699px band — Pro-Max-class phones, small tablets, split-screens — kept the wordmark visible with 58px less row to give.

**What:** the wordmark-hide breakpoint for signed-in players rises 439→**699px** (signed-out untouched — no hub there); at ≤379px the hub compacts to 34px; at ≤349px the brand yields a font step (signed-in only); at ≤329px the hub hides outright with `!important` (boot sets inline `display:flex`) — the banner and reveal handoff still carry discovery on relic devices.

**Verified:** 13-width sweep (320→1024) over the seeded boot — zero hub/wordmark/chip intersections, zero horizontal overflow, brand row ≤120px tall at every width; the failing 460px case reproduced BEFORE the fix and clean after. The harness now carries a permanent 6-width header-integrity check (fails on any future collision); full suite ALL GREEN, zero page errors.

**Rollback:** `git revert` this commit — though that restores the broken 440–699 band; the alternative is reverting the hub itself (`d446f12` + tray commits).
## 2026-07-06 (Doha) — PERF PACK: instant boot + offline shell + buttery lists (frontend & test-infra only)

**Commits:** this commit (`index.html` + `watch.html` + NEW `sw.js` + NEW `tests/perf-boot/run.mjs` + wave-b harness fixes + changelog), on `claude/app-responsiveness-performance-hwsqee`, **rebased onto the awareness-pass tip (`3e7c14c`)** — one conflict in `init()` (the share-hub boot lines vs the restructured snapshot boot), resolved by folding the hub display + badge refresh into the shared `paint()` path, so the hub shows on the instant snapshot paint too. **Frontend + test infra only — no DB change, no scoring-math change, no sync-protocol change: every Supabase read and write is byte-identical to before** (same endpoints, same payloads; boot even reuses the exact `key=in.(…)` batch read, just started earlier).

**What (loading — the network is no longer in front of first paint):**
- **Service worker (`sw.js`, NEW):** app shell (`/`, `watch.html`, manifest, icons) served stale-while-revalidate — repeat opens paint from cache and refresh in the background; a deploy reaches a device on its **second** open (same order of staleness GitHub Pages' 10-min HTML cache already allowed). Font files / flag PNGs / versioned cdnjs libs are cache-first. **Supabase, ESPN and Carto tiles are never intercepted** — live data stays live. The installed PWA now opens offline instead of a white page.
- **Boot snapshot (`wc:bootsnap`):** init() paints immediately from the last payload this device saw, then reconciles when the real batch read lands — re-rendering in place only if something changed. Identity-guarded (`snap.me` must match `wc:me`), and a pick tapped while the read was in flight is never clobbered (`PLAYER_TOUCHED` — the queued save carries it up; `reconcilePicks` remains the seal authority). Snapshot refreshed after boot reconcile, results fold-in (`refreshResults`) and every successful `save_picks`. First-ever visits have no snapshot and boot exactly as before.
- **Early boot fetch:** a tiny head snippet starts the existing batch read while the browser is still parsing the ~600 KB page; `sbatchJSON` adopts the in-flight promise (key-matched, one-shot) instead of fetching again. Any error leaves `window.__BOOT` unset and boot proceeds unchanged.
- **Preconnects** for the Supabase origin (it gated first render and was never preconnected) and flagcdn; **fonts** collapsed to one variable file (was five static weights) and moved off the critical path (`media=print` → `all` on load, `<noscript>` fallback) — text paints immediately in the fallback stack.

**What (rendering — steadier frames on mid-range phones):**
- `content-visibility:auto` + `contain-intrinsic-size` on `.match-card` / `.lb-row` / `.gcard` — offscreen cards in the 104-match list and 100-row board skip layout+paint entirely.
- **ONE delegated listener set on `#match-list`** (`bindMatchEvents`) replaces the ~1k per-button bindings a full render used to attach and re-attach. Scoped to the list host on purpose: swipe deck, fine-tune sheet and organizer editors keep their own wiring (fine-tune chips carry `data-cid` too — document-level delegation would double-fire them). Sanitize-first / home→away auto-advance / select-on-focus / Enter-walk / 450 ms save-while-typing all preserved; `wireScorePair` stays for the organizer editors.
- **animGate():** entrance animations (rise/stagger/badge pop) play when a view is ENTERED or its mode/filter switches — never on the 30 s lock-flip re-render, the consensus enrich, the live-board heartbeat, a results fold-in or a knockout pick re-render. Re-entering a tab still animates fresh.
- Tab switches scroll instantly (the smooth scroll used to fight the incoming view's rise animation); sticky/fixed backdrop blurs trimmed (14/12/16 → 10/8/10 px over ~.9-opaque bases — GPU cost per scrolled frame, invisible difference); flag `<img>`s decode async; `renderPulse`/`liveTick` skip pocketed tabs (visibilitychange already refreshes on return, now including the pulse bar).

**What (watch.html):** Leaflet + markercluster load `defer`red (they blocked parse/paint of the whole list); the map builds in `initMap()` at DOMContentLoaded with a pin re-sync if someone filtered before it landed, and degrades exactly as before if the CDN is unreachable (map hidden, list fine). Same font treatment + SW registration + pocketed-tab guard on its 60 s refresh.

**Test infra (pre-existing breakage fixed + new proof):**
- `tests/wave-b/run.mjs`: the script-block extractor took the FIRST `</script>` in the file — the new head snippet closes earlier, so it now finds the first close AFTER the app block opens (head one-liners open as `<script>/*…` so `start` never matches them).
- `tests/wave-b/bootstrap.sh`: loads `sql/perf.sql` — since PERF ② the public `standings()` RPC is the cached wrapper defined THERE; the throwaway PG had no `standings()` at all and the suite died on vector 0 (pre-existing, unrelated to this push).
- NEW `tests/perf-boot/run.mjs`: serves the repo on localhost (SW needs a secure context) and proves, fully mocked: snapshot paint beats a 2.5 s-throttled network (~100 ms), delegated pick tap selects + persists via `save_picks`, the reconcile keeps that pick, and an OFFLINE reload still boots to match cards (SW shell + snapshot).

**Verified (on the REBASED tree, share-tray + awareness code included):** `node --check` clean on every script block (app, head snippet, both watch.html blocks, sw.js) · share-cards suite (42 checks incl. tray + hub badge) **ALL GREEN, zero page errors** · wave-b **27/27 vectors, `wc_rank === PU_RANK`** (SQL === JS on the modified extraction) · perf-boot **ALL GREEN** · watch.html headless: deferred map builds (44 markers clustered, zero errors) and CDN-dead fallback intact.

**Rollback (git):** `git revert <this commit>`. Two operational notes: (1) devices that already installed the service worker keep serving the LAST cached shell until their next successful revalidation — after a revert they self-heal on the second open, same as any deploy; (2) to actively unregister deployed workers instead, don't just delete `sw.js` — ship a kill-switch in its place:
```js
self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k)))).then(()=>self.registration.unregister()))});
```

**Rollback (DB), if applicable:**
    none — no database or kv change in this push

---

## 2026-07-06 (Doha) — AWARENESS PASS: the one-shot spotlight gets three persistent companions

**Commits:** this commit (`index.html` + `tests/share-cards/run.mjs` + changelog), on `claude/social-artifacts-ideas-0ocr94`. **Frontend only — no DB change.** Organizer's feedback: the What's-new spotlight "shows once then disappears" — one dismissal and the share cards are invisible again.

**What (three surfaces, all riding existing machinery):**
- **① Persistent banner repointed** (`xbanner` — shows every visit until 15 Jul, shrink-only by design): copy was still pre-launch power-ups; now "⚡ Power-ups are LIVE · 📤 share cards are here", a fourth 📤 chip, and the CTAs split by mode — the **shrunk strip (the default most players see) opens the share tray**; the expanded card keeps the power-ups FAQ link.
- **② Reveal earn-moment handoff:** the results-reveal summary (the app's highest-attention beat) gains a "📤 Cards earned" button beside Continue — only on nights the player actually scored (celebration-only, house rule). One tap: reveal closes, tray opens.
- **③ Hub count badge:** the 📤 hub's one-shot NEW dot becomes a live count of cards this player hasn't seen (`.hubcnt`, gold pill, "9+" cap). Tray composition refactored into one `shareTiles(light)` composer shared by tray + badge (badge path skips the receipt's two-blob read); opening the tray writes the seen-set (`wc:shareseen`, overwrite-on-open so a card that lapses and returns re-lights the hub). Badge refreshes at boot (+1.2s, warm cache), on `updateNewDots`, and on reveal close — so Thursday's settled QFs re-light every scorer's hub by themselves.
- Fix caught by the harness mid-pass: `openShareTray` must await the counts tier **before** kicking `consensusFull()`, or `consensus()` piggybacks the in-flight full compute (ordering regression from the refactor; also the correct/cheaper source in prod).

**Verified (`tests/share-cards/run.mjs`, now 42 checks, ALL GREEN ×3 runs):** banner visible every boot with tray CTA + new copy; hub badge shows a numeric count pre-open ("9+" in the seeded world), clears on open, seen-set written (17 keys); reveal summary on a scoring night shows "📤 Cards earned" → tap closes reveal and opens the tray; all ten cards + tray + every prior surface still green; zero page errors; `node --check` clean. Header screenshot in the run output (`live-header.png`).

**Rollback:** `git revert` this commit — frontend-only. Local state: `wc:shareseen` only.

---

## 2026-07-06 (Doha) — MAIN DEPLOY: 📤 Share Tray — the always-visible door to every card

**Commits:** this commit (changelog) on top of the tray commit, then `main` fast-forwarded and pushed — the immediate follow-up to today's share-card-pack deploy, on the organizer's feedback that the cards **"aren't visible and they wouldn't know of it"**. Rebased onto the ⚡ power-ups-LIVE spotlight tip (`0a35119`; clean — the spotlight card had already kept the 📤 item, and the cons-bar removal didn't touch the split chip). **Frontend only — no DB change.**

**Why:** every card in the pack is moment-gated by design, but its only always-on entry was the brag row buried at the bottom of the Me card, plus a one-shot What's-new item. Gating the cards is right; gating the *discovery* was not.

**What:**
- **📤 Share hub** — a header button next to the userchip, visible on every view (signed-in, non-demo; hidden on `?tv`), wearing the house NEW dot until first open (`wc:seen:share`, via the existing `updateNewDots` family).
- **The tray** (`openShareTray`) — a sheet listing every card the player qualifies for **right now** as tappable tiles (slip · office split for the next counted fixture · standing card · streak · perfect day · milestone club · climb · title belts · Squad MVP · squad card · catch-me · Maldives · champion · road to the final · receipt · same-brain · brag-my-last-call · podium at FT), each a thin caller of the existing share functions — zero new data paths (cached standings + counts-tier consensus, the same reads every view uses). Below them, a short **"still to unlock"** rack (max 4, greyed: tap → toast the unlock hint) so the gates read as goals, not absences.
- The What's-new 📤 item's `wnGoBrags()` now opens the tray instead of scrolling to the brag row.

**Verified (rebased tree, `tests/share-cards/run.mjs` now 39 checks, ALL GREEN):** hub visible after boot with the NEW dot; dot clears on first open; tray lists the nine expected tiles in the seeded QF world + the locked podium; tapping a tile closes the tray and builds the 1080×1350 card; all ten cards + every prior surface re-green over the merged spotlight/cons-bar code; zero page errors; `node --check` clean.

**Rollback:** `git push origin +0a35119:main` (client-only). Local state: `wc:seen:share` marker only.

---

## 2026-07-06 (Doha) — ⚡ POWER-UPS LIVE (launch step ④ complete) + combined launch spotlight

**Commits:** this commit (`index.html` + changelog), rebased onto the share-card deploy tip (`1d5c866`; conflicts = changelog ordering + the What's-new card, resolved by merging the three announcements into ONE launch card), then `main` fast-forwarded and pushed — the whole sequence **on the organizer's explicit instruction** ("you flip it please" for the flag, then "push to main" for the spotlight). **The live DB change below is APPLIED (2026-07-06 evening Doha, via the connector).**

**What (DB, applied live — the launch runbook's exact line):**
```sql
insert into kv(key,value) values('wc:powerups_live','true') on conflict (key) do update set value=excluded.value;
```
Wave-B power-ups are now ON for both halves at once: client `puLive()` (arm UI + chip-aware scoring paths) and server `standings()` (armband ×2 / upset +2 / shield, all still k≥25-gated). With **0 QF results**, the flip is inert on scoring **by proof, not just design**: `standings()` md5 `fd07d388148b9c2f395c03c1899cc545` / 688 rows — **byte-identical before and after** the insert.

**Pre-flip battery (read-only, minutes before):** flag unset · robot `wc-autoconfirm` active `*/10` · standings 200/688 · R16 half done (k17–k20 in, k21–k24 pending — QF cards go armable as each settles) · **one pre-flip armband existed**: player `ang` holds `chips.qf="k27"`, stored by the chips-aware `save_picks` from a stale pre-gate tab this morning — legitimate under the announced mechanics (pre-lock arming, movable until k27 locks, scored 0 while the flag was off; flipping today gives everyone else the same window). **Post-flip:** flag `"true"` read back via the anon REST boot path (`key=in.("wc:powerups_live")` → 200, one row) — every player's next open loads the kit.

**What (client, this push):** `WHATSNEW_VER` → `2026-07-06-powerups-live` with the spotlight as the single combined launch card — ⚡ **Armband "arm it now"** (FAQ deep link) · 🏆 **Trophy Room** (`wnGoAwards()`) · 📤 **share cards** (`wnGoBrags()`, the share-card pack's item kept) — with the 🛡+🦅 automatic pair and the fairness note in the footer line ("same kit for every player… titles never move points"). Players who consumed today's trophy-room or sharecards spotlight see the launch card once; nothing else changes.

**Verified (client, on the rebased tree):** `node --check` clean; the Trophy-Room 50-assert headless suite green with the combined card (spotlight shows once → 🏆 item deep-links to Awards → version consumed → never re-shows; all Trophy Room / honours / FT-roll / kiosk / demo asserts unchanged; 0 page errors); the share-card suite (`tests/share-cards/run.mjs`) re-run green. After the main push: prod serves `2026-07-06-powerups-live`, `"Argentina":1` still in `PU_RANK` (client and server rank tables consistent at launch).

**Rollback:** pause power-ups: `delete from kv where key='wc:powerups_live';` (or the Organizer-tools toggle) — client and server drop to the base ladder on the same flag; ang's stored armband simply scores 0 again. Spotlight: `git revert <this commit>` (players who consumed `2026-07-06-powerups-live` would re-see the sharecards card once — harmless).

---

## 2026-07-06 (Doha) — MAIN DEPLOY: the share-card pack ships to production

**Commits:** this commit, then `main` fast-forwarded to it and pushed **on the organizer's explicit "push to main"**. The two share-card commits were rebased onto the Trophy Room deploy tip (`bac9e9c`); conflicts were changelog ordering plus the What's-new card, resolved by **merging the two announcements** — the Trophy Room card keeps its 🏆/🔮 items and gains the 📤 share-cards item (`WHATSNEW_VER="2026-07-06-sharecards"`, so players who dismissed today's trophy-room card see the combined card once — intended). **Re-verified on the rebased tree:** `tests/share-cards/run.mjs` 26/26 (all ten cards build over the merged code, incl. the belts on the Trophy-Room-extended `computeHonours`), zero page errors, `node --check` clean. Frontend-only — the live DB is untouched by this push. Also ships `docs/social-artifacts-preview.html` (the branch's design-preview gallery; noindex, demo data only).

**Verify after push:** Pages action green; prod `index.html` (cache-busted) contains `shareSlip` + `cardShip` (this pack) alongside `renderAwards` (Trophy Room).

**Rollback:** `git push origin +bac9e9c:main` (client-only — nothing server-side changed with this push).

---

## 2026-07-06 (Doha) — SHARE-CARD PACK: the ten social artifacts ship (frontend-only, all surfaces gated)

**Commits:** this commit (`index.html` + `tests/share-cards/run.mjs` + changelog), on `claude/social-artifacts-ideas-0ocr94`. **Frontend only — no DB, no scoring-math, no sync-protocol change, no new server reads beyond existing classes.** Implements all ten cards from the design preview below, on the existing canvas kit.

**Why:** all ten existing artifacts are post-hoc; nothing shareable exists before a whistle, nothing uses the rival H2H / honours / Wave-B chips / trajectory data, and the room has no collective full-time artifact. QF nights (Thu) are the tournament's peak share moments; the Podium has a hard 19-Jul deadline.

**What (new shared kit + ten cards, inserted after `meBrags()`):**
- **Kit:** `cardScaffold/cardSub/cardGold/cardBadge/cardFoot/cardPill/cardBoxes/cardBig` mirror `shareCard()/shareBrag()` geometry; `cardShip()` is shareBrag's exact web-share/download tail, shared; `cardFlagImgs()/cardFlag()` draw flagcdn PNGs on canvas (`crossOrigin=anonymous`, ACAO:\* verified — canvas never taints) with a lettered-tile fallback so every card builds offline. Existing cards untouched.
- **🎟️ Lock-In Slip** (`shareSlip`, chip in brag row + Room pre-settle): tonight's calls as a slip. **Row rule = seal rule:** a pick renders only once its match is `lockedM()` (nobody can edit theirs either); unlocked fixtures in the ±(-8h,+14h) window show masked 🔒. Armband line + "up to +N" haul from the scoring constants.
- **🏟️ Match-Night Split** (`shareSplit`, chip on unsettled match-card consensus lines + Room pre-settle): aggregate split poster from the counts tier (`CONS.map`), k-floor 8, no names; settled matches route to the existing `bragOffice()`.
- **🧾 Rivalry Receipt** (`bragReceipt`, button in the rival panel): `rivalH2H()` refactored into `rivalH2HData()` (numbers) + renderer; card offered **only while ahead** (diff>0), same winner-shares framing as `bragChase()`.
- **🏅 Title Belts** (`shareBelt`, one brag-row chip per held title via `myTitles()`): medallion card for the six office-wide honours from `HONOURS_FULL` (captains keep Squad MVP).
- **🚀 The Climb** (`shareClimb`): rank after each finished phase + today — Wrapped's exact recompute (REAL `scoreFor` over growing results subsets, REAL `cmpSt`), one user-initiated analytics-class bulk pull (same cost class as Wrapped). Offered only when net rank improved; chip gated on `climbCps()`.
- **🛣️ Road to the Final** (`shareRoad`): champion's path via the bracket's own `teamChain()` — settled legs solid ✓ with score + my banked points, live front pending, my projected calls dashed (the bracket view's real/proj grammar). `roadState()` returns null (no card, no chip) the moment the champion is out or my own bracket turns on them — never a shame card.
- **⚡ Armband Cashed** (branch inside `bragCall()`): when `puLive()` and my chip armed this settled match, the card becomes the doubling story ("8 became 16 at the whistle", base = chips-less `rvVerdict`). Zero new buttons; dormant while the flag is off.
- **💯 Milestone clubs** (`bragMilestone`, chip via `meMilestone()`): 100/150/200-point clubs, count from the public board.
- **🤝 Same Brain** (`shareTwin`, chip when `CONS.full` has a twin ≥5): duo plates card, both parties flattered; analytics-tier data.
- **🏆 The Podium** (`sharePodium`, third CTA in `ftHero`): FT-gated (`ftOver()`; `?wrapped` previews) collective poster — champion flag, top-3 by the board's exact order, Department Cup (self-omits below `DEPT_MIN`), players+calls stat. Kiosk CTAs stay hidden as before.
- **Entry points:** brag row grows the gated chips above; Room pre-settle gains slip+split buttons; rival panel gains the receipt; unsettled match cards gain a small `.cons-share` chip (one CSS rule). **What's-new** bumped to `2026-07-06-sharecards`: rebased onto the Trophy Room pass, the 📤 share-cards item joins the Trophy Room card (`wnGoBrags()` deep-links to the brag row); anyone who already dismissed today's card sees the combined one once more — intended.

**Seal-safety:** every card reads settled results, public standings, aggregates over the k-floors, or the player's OWN post-lock picks; collective cards carry no names; loser-side cards don't exist (receipt/road/armband/belts all gate on winning/holding/alive).

**Verified (headless Chromium over the REAL page, fully mocked Supabase REST, zero live traffic — `tests/share-cards/run.mjs`, 26/26):** signed-in boot into a seeded QF-week world (France path through k3→k18→k25, armed armband, settled QF, in-play QF, rival, twin, honours); all TEN cards build 1080×1350 with real engine numbers (armband card shows 12→24 = the chips-aware `rvVerdict` doubling; climb recomputes #12→#1 per phase over the seeded blobs; receipt sums 27 shared settled matches; road shows +24 banked & "2 wins from the +25"); every gate chip renders in the brag row; receipt button appears in the rival panel; Room pre-settle shows slip+split; `.cons-share` chip on upcoming match cards; what's-new shows the new item; podium builds after simulating FT in-page; **zero page errors**; `node --check` clean. Card PNGs eyeballed. `sql/` untouched.

**Rollback:** `git revert` this commit — frontend-only. Player-visible state: the what's-new marker (`wc:whatsnew`) advances to `2026-07-06-sharecards`; reverting just means the power-ups card shows once more. Nothing else persists.

---

## 2026-07-06 (Doha) — MAIN DEPLOY: Trophy Room ships to production

**Commits:** this commit, then `main` fast-forwarded `f148d7a` → this tip and pushed **on the organizer's explicit "push main"**. Ships the TROPHY ROOM pass (entry below) to staffchallenge26.com via the Pages action: the 🏆 Awards leaderboard mode with live award races, the award contract in the FAQ, the rewritten What's-new spotlight (`WHATSNEW_VER` → `2026-07-06-trophy-room` — every player sees it once on next open), the Hot-Hand-is-the-record-run title change, and the FT ceremony roll aligned to the four announced titles. **Frontend only — the live DB is untouched by this push**; scoring proven unchanged (27/27 Wave-B vectors, entry below).

**Verify after push:** Pages action green; prod `index.html` (cache-busted) contains `renderAwards` and `2026-07-06-trophy-room`.

**Rollback:** `git push origin +f148d7a:main` (client-only — nothing server-side changed with this push).

---

## 2026-07-06 (Doha) — TROPHY ROOM: end-of-tournament awards announced + every race live (Leaderboard → 🏆 Awards)

**Commits:** this commit (`index.html` + changelog), on branch `claude/intelligent-maxwell-nza6n6` — **NOT yet merged to main.** **Frontend only — no DB / scoring-math / sync-protocol / lock-logic change.** Seal-safe: reads only the slim standings, settled results, and the consensus analytics tier already in hand — zero new data pulls. New state: one localStorage key (`wc:seen:awards`, the NEW-dot marker) + the `wc:whatsnew` version bump.

**Why (endgame engagement, fairness-first):** ~680 of 687 players can't reach the podium, so the final two weeks lose personal stakes exactly when the tournament peaks. The chosen design: **announce award categories now, crown them at full time, and make every race permanently visible** — Mario-Party-style variety of prizes WITHOUT Mario Party's sin (late rules that swing the main outcome). Anything that moves leaderboard points was deliberately rejected: the podium prizes stay decided by the untouched main ladder, per the published fairness commitments. Prize amounts for the titles are intentionally NOT stated in-app — organizer's call; the copy sells the crown, not a sum.

**The award contract (now published in-app, definitions locked 6 Jul):** crowned at the final whistle — 🔮 **Oracle** (most exact scores), 🧭 **Trailblazer** (most correct calls where the office majority went the other way; ≥8-pick matches, ≤30% called it), 🔥 **Hot Hand** (longest run of correct calls at ANY point; floor ×3), 💎 **Perfectionist** (most perfect matchdays: 2+ settled picks that day, all right), plus ⭐ **Department Cup** (best avg points/player, squads of 5+, the existing deptLeague ranking). Ties: higher total points, then a dead heat shares the title. 👑 Frontrunner / ⭐ Squad Captain / 🚀 Climber stay live-only honours — never awards.

**What changed — `index.html`:**
- **🏆 Trophy Room** (`renderAwards` + `AW_RACES` + `.aw-*` CSS + fourth `lbmode` pill with NEW dot; `.lbmode` now wraps): live top-3 per race with medals/avatars/value chips, a "you" line with the exact gap in each race ("You: ×2 · ×5 behind Elle"), the podium card (main prizes, main board), the Department Cup card, and the tie-rule/definitions-locked footer with FAQ deep link. Races needing the analytics tier show "Counting every call…" and self-fill when `consensusFull` resolves. Kiosk (`?tv`) hides the personal lines and the TV loop now cycles people → dept → **awards** → room (88s lap; Room pull cadence unchanged, ≤1/min).
- **Race data** (`consensusCompute`): now also collects full sorted lists `CONS.tops={streak,upset,perfect}` ({slug,name,v}, v>0) + `CONS.mine` (my three numbers) in the same single pass — and tracks the **best-EVER run** (chronological max), not just the run still alive.
- **Hot Hand = the record run** (was: current run). `computeHonours` crowns all three consensus titles from `CONS.tops` with the published pts tie-break, so the board chip, the Trophy Room race and the FT roll always name the same winner. The ticker's current-run line is relabelled "🔥 In form: … right now"; the reveal-finale "Longest run" line now reads the true record.
- **FT ceremony roll** (`ftFill`): restricted to the four announced titles in announced order (Frontrunner = the podium above it; Climber is a daily stat; captains are per-dept).
- **Announcement:** `WHATSNEW_VER` → `2026-07-06-trophy-room`; spotlight rewritten (Trophy Room deep link via new `wnGoAwards()`, the four titles → FAQ, Department Cup) with the fairness note ("titles never move points…"); the titles FAQ item rewritten into the full award contract; prize-strip note gains "🏆 office titles crowned in the Trophy Room".

**Verified:** `node --check` clean (script extracted the run.mjs way). **50-assert headless-Chromium suite** driving the REAL page over a fully mocked Supabase REST layer (zero live traffic; 13 crafted players over 3 real matchdays with hand-computed expectations): per-race ordering AND pts tie-breaks (Oracle 7/7 split, Trailblazer 2/2 split, Perfectionist 2/2 split), the best-ever-vs-current distinction (a broken ×7 outranks a live ×6 — and `CONS.best` still holds the live ×6 for the pulse line), every "you" gap line, `CONS.mine`, honours === race winners === FT roll (and no Frontrunner/Climber in the roll), spotlight shows once → deep-links to Awards → never re-shows, NEW-dot lifecycle, FAQ contract text, signed-out (no personal lines) / kiosk (`.tv` hides them, spotlight suppressed) / demo (pills hidden, no leakage) all clean, **0 page errors** across five boots; 390px@2× screenshots of the Trophy Room + spotlight. **Wave-B parity re-run** on the throwaway PG (bootstrap + `sql/perf.sql`, per the PERF-② procedure): **27/27 vectors** expected === SQL `standings()` === JS `scoreFor()`, `wc_rank === PU_RANK` (48) — scoring paths untouched by this pass, proven not assumed.

**Rollback:** `git revert <this commit>` — frontend-only, no DB change to reverse. Optional local-state cleanup: `localStorage.removeItem('wc:seen:awards')`. Note: a revert restores `WHATSNEW_VER="2026-07-02-powerups"`, so players who consumed the trophy-room spotlight would see the power-ups spotlight once — harmless.
## 2026-07-06 (Doha) — DESIGN PREVIEW: 10 proposed social artifacts (branch-only, nothing wired in)

**Commits:** this commit (`docs/social-artifacts-preview.html` + changelog), on `claude/social-artifacts-ideas-0ocr94` only — **NOT for main**. Zero app change: `index.html` untouched, no DB, no scoring, no new state.

**What:** a self-contained mock-up gallery of ten proposed share cards, drawn with faithful copies of the house canvas kit (`cardFrame`/`drawCardTrophy`/`shareBrag` geometry, Anton + Hanken Grotesk embedded as data URIs, 1080×1350) over invented demo data: ① Lock-In Slip (pre-match, own sealed picks) ② Match-Night Split (pre-match collective, consensus aggregate) ③ Rivalry Receipt (rivalH2H record, offered only while ahead) ④ Title Belts (one per honour) ⑤ The Climb (per-phase rank line) ⑥ Road to the Final (sealed bracket path) ⑦ Chip Cashed (Wave-B armband payoff) ⑧ 100 Club (milestones) ⑨ Same Brain (pick twins) ⑩ The Podium (full-time collective), plus a 9:16 story-format demo. Every design keeps the house seal rules (settled/sealed/public-standings data only, k-floors, never a shame card). Open the file directly in a browser to review; PNG download per card.

**Verified:** headless Chromium — 11/11 canvases render, 0 page errors; per-card screenshots eyeballed; inline JS `node --check` clean.

**Rollback:** `git revert <this commit>` (or simply never merge — the branch is the preview).

---

## 2026-07-06 (Doha) — MAIN DEPLOY: PERF ① + ② client ships to production (SQL apply still pending)

**Commits:** this commit, then `main` fast-forwarded to it and pushed **on the organizer's explicit "merge to main"**. The two PERF commits were rebased onto the FULL TIME pass tip (`130c92e`; changelog-only conflict) and **all three suites re-ran green on the rebased tree**: 27/27 Wave-B vectors through the new standings wrapper chain, 23/23 live-snapshot parity + cache checks, 27/27 boot/refresh checks, `node --check` clean. Ships PERF ① (batched one-round-trip boot + live results refresh for kiosk/long-open tabs) and PERF ②'s client half (RPC-first consensus/Room/rival reads) plus the SQL sources. **The live DB is untouched by this push**: `consensus_counts()`/`room_board()` 404 today, so every player runs the classic fallback paths byte-identically; `standings()` stays the direct engine until `sql/standings.sql` + `sql/perf.sql` are applied (deploy order + verify battery in the PERF ② entry below — target before Thursday's QF lock).

**Verify after push:** Pages action green; prod `index.html` (cache-busted) contains `sbatchJSON` (PERF ①), `roomPlayers` (PERF ②) and `ftHero` (FULL TIME pass) together.

**Rollback:** `git push origin +130c92e:main` (client-only — nothing server-side changed with this push).

---

## 2026-07-06 (Doha) — PERF ②: slim RPCs kill the 236 KB bulk pulls + standings() served from cache

**Commits:** this commit (`index.html` + new `sql/perf.sql` + `sql/standings.sql` rename + changelog). Second slice of the app-optimization pass. **NOT yet applied to the live DB** — the client is deploy-safe FIRST (every new path falls back to today's behaviour when an RPC 404s); apply `sql/standings.sql` then `sql/perf.sql` when ready, ideally before Thursday's QF crowd.

**Why (measured live, 2026-07-06):** the client pulled EVERY player blob — 688 × ~1.9 KB = 1.33 MB raw, **236 KB gzipped, ~2 s** — to draw the per-card "office split" lines (DEFAULT view, every 10 min per device), the Room board (60 s cache: the match-night kiosk re-pulled it **once a minute**), the rival H2H card and the brag cards. Separately, `standings()` costs **241 ms of DB CPU per call** and every leaderboard viewer calls it every 60 s — on a QF night with ~200 boards open that's ~80% of a core, continuously, at the exact peak moment (the Wave-B launch).

**What (client — all RPC-first with the classic bulk pull kept verbatim as fallback):**
- `consensus()` split into two tiers. **Counts tier** (`consensus()`): per-card split + champ aggregates now come from the new `consensus_counts()` RPC (~a few KB) — this is all the Matches view ever needed. **Analytics tier** (`consensusFull()`): streak/upset/perfect leaders, day tops, pick twin, office hit rate stay client-computed over the bulk pull — porting that scoring logic to SQL mid-tournament is pure parity risk — but re-keyed on the settled-results count (+1 h cap) instead of a flat 10 min, so it re-pulls when a result lands, not 6×/hour forever. Consumers re-routed: `fillConsensus` → counts; honours / facts ticker / Me extras / reveal lines → analytics. Field readers untouched (both tiers fill the one `CONS`).
- **Room family** (`renderRoomBody`, `bragCall`, `bragOffice`): new `roomPlayers(m)` calls `room_board(match)` — {slug,name,dept,chips,o,w,h,a} for ONE match (~15 KB gz) instead of every blob, re-shaped into pseudo-player blobs so `roomConsensus`/`roomAsIs`/`roomHero`/`roomTable`/brag counters run **byte-identical**. 60 s per-match cache (kiosk cadence unchanged, ~6% of the bytes). Demo previews keep today's path.
- **`rivalH2H`**: fetches exactly the two blobs it needs via the PERF-① `sbatchJSON` (in.()) — not all 688.
- Organizer picks viewer keeps the bulk pull (org-only, rare).

**What (DB — `sql/perf.sql`, run AFTER `sql/standings.sql`):**
- `consensus_counts()` — pure counting (no scoring): per-match {H,D,A,w,sc} + champMap/champN/n, mirroring consensus()'s counting passes field-for-field. Aggregates only — **no names/slugs**; exposes strictly less than the openly-readable blobs it replaces.
- `room_board(p_match)` — per-player picks for ONE match, **zero rows before kickoff on the DATABASE clock** (`wc_locks`, the same wall save_picks uses). The Room's seal was client-side convention; it is now server-enforced. Never touches PINs (they don't live in blobs).
- `standings()` becomes a caching wrapper: `sql/standings.sql`'s engine is renamed `wc_standings_compute()` (body untouched — the deployed Wave-B engine), revoked from the API roles; the public `standings()` serves a `wc_stand_cache` copy that self-invalidates on ANY kv change (fingerprint = max(updated_at)+count — every engine writer bumps updated_at) with a 10-min TTL backstop and an advisory-lock stampede guard. N viewers/min now cost ONE compute per data change. Grants preserved exactly (anon only, per the Wave-B revoke-hardening).

**Verified (throwaway PG 16 + headless Chromium; live DB untouched, one read-only snapshot pull):**
- `sudo tests/wave-b/bootstrap.sh` + `sql/perf.sql` + `node tests/wave-b/run.mjs` → **27/27 vectors** `expected === SQL standings() === JS scoreFor()` **through the new wrapper+cache+engine chain**, `wc_rank === PU_RANK` (48).
- Live-snapshot proof (688 real blobs seeded locally): wrapper === engine **both EXCEPT directions empty**; cache hit path (computed_at stable), kv-write and kv-delete invalidation, **222 ms cold → 17 ms cached** (incl. psql round-trip).
- `consensus_counts()` vs the REAL page computing classic consensus over the same snapshot: **n, champN, champMap exact; map identical across all 98 match ids** (H/D/A + winner + exact-score distributions).
- `room_board()` vs the client's selection over the same blobs: k20 **318/318** rows field-identical, m1 **269/269**; **k21 and k25 return 0 rows pre-kickoff** (server seal, real wc_locks times).
- Client wiring: Matches view fed by the RPC with **zero bulk pulls** (sample line rendered: "🏟 309 colleagues called it: Canada 7% · Morocco 93%"); Room renders from RPC rows, zero bulk; RPC 404 → classic fallback boots identically; PERF-① boot suite re-run **27/27**; `node --check` clean; zero page errors throughout.

**Deploy order (when instructed):** ① paste `sql/standings.sql` (engine rename — the public standings() keeps working through it… momentarily as the raw function until ②), ② paste `sql/perf.sql` (wrapper + the two new RPCs + grants), ③ verify: `select count(*) from standings()` twice (2nd ~instant), `select json_typeof(consensus_counts())`, `select count(*) from room_board('k20')` > 0 and `room_board('k25')` = 0 until Thu, standings md5 vs pre-paste snapshot identical. Client needs no redeploy coordination — it falls back per-call either way.

**Rollback:** `git revert` this commit (client falls back by itself). Live-DB inverse (also at the bottom of `sql/perf.sql`): recreate `standings()` as `select * from wc_standings_compute()` (sql, stable, definer, anon grant), `drop function consensus_counts()`, `drop function room_board(text)`, `drop table wc_stand_cache`.

---

## 2026-07-06 (Doha) — PERF ①: boot in one round trip + results freshness for long-open tabs

**Commits:** this commit (`index.html` + changelog). **Frontend-only — no DB, scoring, sync-protocol or lock-logic change.** First slice of the app-optimization pass on `claude/app-optimization-dh4i0e`; the slim-RPC + standings-cache slice (server side) follows as its own commit with its own SQL.

**What:**
- **Batched boot** — new `sbatchJSON(keys)`: one PostgREST `key=in.("…")` read replaces `init()`'s four serial awaits (`wc:results` → `wc:kteams` → `wc:powerups_live` → own `wc:player:` blob). Keys are double-quoted + escaped, so dotted slugs are safe. Returns `null` on ANY failure and `init()` then runs the old serial path **kept verbatim** — a flaky network can never boot worse than before.
- **`refreshResults()`** — re-reads the single `wc:results` row (~0.6 KB gzipped) inside the same live window that already gates the ESPN poll, plus on tab-return (`visibilitychange`), ≥55 s apart. **Additive-only, the `orgSyncResults` rule:** folds in keys this tab has never seen; never overwrites or deletes a local entry — an organizer's unsaved edits/deletions and the demo stay intact. On fold-in: `bustStandings()` + re-render the current view (matches/bracket/leaderboard/me).

**Why:** the DB lives in `ap-southeast-2` and the players in Doha — each REST round trip costs ~0.3–0.8 s, so the serial boot burned ~1–2 s of pure latency before anything rendered, on every open, for 687 players. And `state.results` was loaded once at boot and never again for players: a tab left open through a match night — worst case the office TV kiosk — never saw robot-confirmed results (cards, groups, bracket and the Room stayed pre-settle until a manual reload) even as the leaderboard's RPC numbers moved.

**Verified:** `node --check` clean. Headless Chromium, fully mocked network (zero live traffic, zero writes) — **27/27**: signed-out and signed-in boots issue exactly ONE kv request (batch names exactly the right keys; per-key boot reads = 0); `state.results`/`resultsSeen`/`meSlug`/`puLive` land correctly; join/matches views render with no page errors; batch forced to 500 → serial fallback issues the classic 4 reads and boots identically; refresh merge folds a new key, refuses to overwrite an existing one, refuses a seen-but-locally-deleted one, costs one single-row read, throttles a second call inside 55 s, never polls in demo, and fires on `visibilitychange`. The exact client-built `in.()` URL was also run against **live** PostgREST: HTTP 200, 3 rows, 1.5 KB gzipped, one round trip (the unset flag row is simply absent — handled).

**Rollback:** `git revert` this commit — frontend-only, no state or DB coupling.

---

## 2026-07-06 (Doha) — FULL TIME pass: podium home takeover + per-player "Wrapped" recap (dormant until the champion settles)

**Commits:** `aa21fa9` (`index.html` + changelog) + its merge with the Wave-B launch tip `a4c4180` (concurrent session; changelog-only conflict). The merge also makes `tests/wave-b/run.mjs` locate the `<script>` tag instead of hardcoding line 1784 — this pass's overlay markup shifted the script start, which broke that extraction; both suites re-run green on the merged file (**27/27 Wave-B vectors, `wc_rank` === `PU_RANK`**; this pass's 50-assert harness). **Frontend only — no DB / scoring-math / sync-protocol change.** Seal-safe: every read is settled results, public standings, or post-lock blobs (the same access class as the Room). New state: one localStorage key (`wc:wrapped:auto`, the one-shot auto-open marker). **Fully dormant today** — every surface below is gated on `ftOver()` = champion set (`_champ`) **AND** the Final result (`k32.w`) recorded, i.e. the standings are final and the +25 has paid. `?wrapped` / `#wrapped` previews the UI on current data for review (house pattern, like `?powerups`).

**Why:** the app had no terminal state. After the Final it would boot into `defaultRound()`'s "MD1" fallback — the finished group-stage list — with the header stuck on "Tournament underway", and 687 players' closure moment (final rank, best call, the office story) existed nowhere. The endgame IS the product's peak; this pass gives it a landing.

**What changed — `index.html`:**
- **🏆 Podium home takeover (`ftHero`/`ftFill` + `#ft-hero-host`).** At full time the Matches view leads with the celebration: champion banner (flag + name), the players' podium (top 3 by the board's exact `cmpSt`+name order — silver·gold·bronze layout with medals, avatars, dept, points), the department-cup winner line (`deptLeague` #1), the office-honours roll (the six office-wide titles; per-dept captains omitted to keep it a roll, not a list), and two CTAs — **🎁 Your Wrapped** and **Final standings**. Renders into a dedicated host *above* the champion card and progress panel; shell is synchronous, standings fill async (same pattern as `fillConsensus`). Kiosk (`?tv`) shows the celebration but hides the CTAs.
- **🎁 Wrapped (`openWrapped` + `#wrapped` overlay).** A story-style tap-through recap (tap advances, left-edge steps back, progress bars on top): title → the final count (points odometer, rank pill, "finished ahead of N · top X%", correct/exact/scored) → **your road** (rank after each phase — GRP/R32/R16/QF/SF/FT — as an SVG line, recomputed per checkpoint with the REAL `scoreFor` over a growing results subset and ranked with the REAL `cmpSt`, so it matches the board by construction; peak + best-surge caption) → **call of the tournament** (highest single-match haul via `rvVerdict` + that match's streak bonus, ties to the later match) → **sniper page** (exacts + longest run via a max-tracking `koStreakCurrent` walk + streak-bonus total) → **the shock you saw coming** (biggest correct-upset by `PU_RANK` gap across ALL knockouts — a recap stat, so scoring's k≥25 gate deliberately doesn't apply — with rarity: "Only N of T called it"; chalk-merchant fallback) → **the squad** (dept final rank + your contribution rank) → **the big one** (champion verdict: `+25` hit with backer count / near-miss / never-named) → finale (titles, confetti + `sndFinale`, **📤 Share it** + Done). Slides with nothing to say self-omit. Heavy numbers compute once per open and cache (`WR.data`); ~690 players × 6 checkpoints is a one-time sub-second pass.
- **Share card (`shareWrapped`).** Same 1080×1350 canvas kit (`cardFrame`/`drawCardTrophy`/palette): TOURNAMENT WRAPPED header, FULL TIME pill, giant final rank, points/exact/correct boxes, one signature line (title → champion call → upset → streak, first that applies), Web-Share with download fallback.
- **Entry points.** Boot chain becomes `openReveal() → maybeWrapped() → maybeWhatsNew() → welcomeDelta()` — the recap auto-opens ONCE (marker key), never over a pending reveal, never in TV/demo. The reveal finale gains a **🎁 Your Wrapped** handoff button at FT (the natural moment: right after revealing the Final). The Me card's brag row leads with a Wrapped chip at FT.
- **Terminal-state fixes.** `defaultRound()` now lands on **FINAL** (not "MD1") once nothing is left to kick off; the header countdown at FT swaps "Next kickoff · Tournament underway" for **"Full time · 🏆 <champion> — World Champions"**.

**Verified:** `node --check` clean. A 50-assertion headless-Chromium harness drives the REAL page over a mocked Supabase REST layer (standings RPC 500s so the app exercises its real client-scoring fallback over 24 seeded blobs), six separate boots, **0 page errors**: DORMANT (today's exact shape — results→k20, no champion) renders nothing new and keeps today's filter/boot behaviour; ACTIVE (settled tournament, clock 2026-07-20) walks every slide asserting engine parity (odometer === `scoreFor` === board fallback pts; journey endpoint === board rank; dept slide === `deptLeague`; podium === board top-3 order; upset rarity/champion backer counts against the seeded population), auto-open once + no re-open on later visits, reveal→Wrapped handoff, share-card build, left-edge back-step, reduced-motion walk, `?wrapped` preview (champion slide self-omits pre-champion), `?tv` CTA hiding. 390px @2× screenshots on the podium home and all nine slides.

**Rollback:** `git revert <this commit>` — frontend-only; removes the overlay markup, the FULL TIME JS/CSS blocks and the five hooks (boot chain, `renderMatches` host, `meBrags` chip, reveal-finale button, `defaultRound`/`tickCountdown` terminal fixes). If it was ever live: players lose the recap/podium; nothing else changes. Optional local-state cleanup: `localStorage.removeItem('wc:wrapped:auto')`.

---

## 2026-07-06 (Doha) — MAIN DEPLOY (launch step ③): Wave-B client ships to production

**Commits:** this commit, then `main` fast-forwarded `c550879` → this tip and pushed **on the organizer's explicit "push main"**. Ships to staffchallenge26.com via the Pages action: the corrected **11-Jun-2026 FIFA `PU_RANK`** (client upset math now matches the deployed server `wc_rank` byte-for-byte), the committed `tests/wave-b/` parity harness, the server-side flag-gate SQL sources, the step-①/② deploy documentation + rollback dossier, and the revoke-hardened `sql/*.sql`. **No scoring or visual change for players**: `wc:powerups_live` is still unset, so client (`puLive()`) and server (`standings()`) both keep serving the pure base ladder — power-ups appear only at step ④.

**Verified after push:** Pages action green; prod `index.html` (cache-busted) contains `"Argentina":1` in `PU_RANK`.

**Rollback:** `git push origin +c550879:main` (client-only revert; the DB stays on the step-① state documented in the previous entry — the two are independently safe: flag-off keeps either combination byte-identical on output).

---

## 2026-07-06 (Doha) — WAVE B SQL DEPLOYED LIVE (launch step ① + ②): engine + walls on production, verified inert

**Commits:** this commit (`docs/rollback/2026-07-06-pre-wave-b/*` + `sql/protect.sql` + `sql/standings.sql` revoke-hardening + changelog + handoff addendum). **The live DB change below is APPLIED (2026-07-06 ~07:00–07:30 Doha) — on the organizer's explicit instruction ("i want you to do it. the SQL"), via the Supabase connector instead of the SQL-editor paste.** Power-ups remain **OFF**: `wc:powerups_live` unset, 0 chips held, leaderboard byte-identical before/after.

**What (DB, applied live):** `sql/protect.sql` then `sql/standings.sql`, emitted byte-exact from this branch (`ab3f6f8` content). Net live changes: `save_picks` → chips-aware (validate + kickoff-seal), `org_exec` → `wc:powerups_live` whitelisted (enables the ④ toggle), NEW `wc_chip_valid()` + `wc_rank` (48 teams, 11-Jun-2026 FIFA release), `standings()` → Wave-B engine (armband/upset/shield/streak-shield **all gated on the unset flag**). `org_check`/`wc_pin_hash`/`server_time` replaced with identical bodies. All DML in the files verified no-op against pre-state (`wc_locks` already byte-identical: 105 rows md5 `9900d989…`; 0 blobs with pins; org hash = file seed; `wc_auth` 688 before and after).

**Plus 3 ACL revokes beyond the files** (found during verify): Supabase `ALTER DEFAULT PRIVILEGES` grants EXECUTE on every new function to `anon`/`authenticated` directly, so the files' `revoke … from public` alone left anon holding EXECUTE on the two internal helpers. Applied live:
```sql
revoke execute on function public.wc_pin_hash(text) from anon, authenticated;
revoke execute on function public.wc_chip_valid(text,text) from anon, authenticated;
revoke execute on function public.standings() from authenticated;  -- anon keeps its explicit grant
```
`sql/protect.sql` + `sql/standings.sql` revoke lines extended to name `anon, authenticated` so future re-runs are self-sufficient (repo-only edit; end-state unchanged).

**Verified live (the full step-② battery):**
- **Transcription byte-exact:** `md5(prosrc)` of all 7 deployed functions === the same files loaded from disk into the throwaway PG (`standings` `d35c05fb…` · `save_picks` `f9758ed1…` · `org_exec` `65fb143c…` · `org_check` `d80d5978…` · `wc_pin_hash` `025fd447…` · `wc_chip_valid` `c9175c3b…` · `server_time` `c6cc5aed…`).
- **Zero drift:** `standings()` md5 `172cdcb4535f7841a52d17f6a2f1ea82` / 687 rows — identical before protect.sql, between the two files, and after standings.sql. (Also proven pre-deploy by running the revised body read-only on live in the same statement as the old function: identical md5, same snapshot, k20 included.)
- **27/27 vectors against the DEPLOYED `standings()` on live PG 17.6** — zero-mutation method: session-local `pg_temp.kv` shadows the real `kv` (temp schema resolves first), probe row confirmed the shadow (0 players seen) before any vector counted; every got === want, including the 3 flag-OFF vectors.
- **`wc_rank`:** 48 rows, md5 `db5db9d59a5cebc3020cd0f16bbb1880` (collate "C") === `PU_RANK` from `index.html` (run.mjs 27/27 + rank === on the throwaway).
- **21-check privilege battery** all green (kv read-only for anon, all engine tables + `wc_ko_sched` walled, tick revoked, the five player-facing RPC grants intact).
- **As the real anon key via REST:** `standings` 200/687 · `kv` flag read 200 `[]` · `wc_rank`/`wc_auth`/`wc_locks`/`wc_org_auth`/`wc_ko_sched` reads **401** · kv INSERT/PATCH **401** · `wc_autoconfirm_tick` **401** · `wc_pin_hash`/`wc_chip_valid` **404** (hidden) · `save_picks` junk probe → 400 `bad_slug` (alive, validating, nothing written) · `org_check` wrong code → `false`.
- Robot green through it all (ticks 04:00/04:10Z succeeded); flag unset; 0 chips.

**Remaining (gated):** ③ merge branch → `main` + push **on the organizer's explicit "push main"** (ships corrected `PU_RANK` to the client so upset math matches server the moment the flag flips) → ④ organizer flips ⚡ Power-ups in Organizer tools. Then optional `WHATSNEW_VER` bump.

**Rollback (exact):** run the three files in `docs/rollback/2026-07-06-pre-wave-b/` (live `pg_get_functiondef()` captures, md5-verified against pre-deploy `prosrc`), then:
```sql
drop function if exists public.wc_chip_valid(text,text);
drop table if exists public.wc_rank;
-- inverse of the 3 ACL revokes, only if truly needed:
grant execute on function public.wc_pin_hash(text) to anon, authenticated;
grant execute on function public.wc_chip_valid(text,text) to anon, authenticated;  -- (if not dropped)
grant execute on function public.standings() to authenticated;
```
`org_check`/`wc_pin_hash`/`server_time` need no restore (identical bodies). Repo edits: `git revert <this commit>`.

---

## 2026-07-06 (Doha) — Session handoff brief for the Wave-B launch

**Commits:** this commit (`docs/HANDOFF-wave-b-launch.md` + changelog). **Docs only — no app or DB change.**

Continuation brief for a fresh working session: current state (what's live on prod vs on this branch), the proofs (27/27 parity vectors · zero-drift 687/687 · rank tables identical), the four remaining launch steps with live-DB reference hashes for verification/rollback, and the ground rules (pushes to `main` and live SQL deploys happen only on the organizer's explicit go).

**Rollback:** `git revert <this commit>`.

---

## 2026-07-06 (Doha) — WAVE B: server-side flag gate (deploy becomes truly inert until launch)

**Commits:** this commit (`sql/standings.sql` + `tests/wave-b/*` + changelog). **Repo-only SQL + tests. No live change.**

**Why (found while prepping the deploy):** `wc:powerups_live` was a **client-only** flag — the revised `standings()` computed the 🦅 upset +2 and 🛡 shield **automatically** for any k≥25 result (no chip needed). So merely *deploying* the SQL would have silently launched upset+shield on the server leaderboard at the first quarter-final, diverging from the flag-off client and committing an undecided organizer to the mechanics. "Deploy is safe, the toggle launches" was not actually true.

**What changed — `sql/standings.sql`:** a `pu` CTE reads `wc:powerups_live` and **gates all three Wave-B terms server-side** — armband ×2, upset +2, and the shield's break-forgiveness. Flag off ⇒ the function returns the pure pre-power-up ladder for ANY results (not just pre-QF). Now the flag is the single switch for power-ups on **both** client (`puLive()`) and server (`standings()`), so deploying the SQL changes nothing until the organizer flips it.

**What changed — `tests/wave-b/`:** 3 flag-OFF vectors added (armband ignored, upset ignored, shield does-not-forgive) asserting the gate yields base. Harness now sets `wc:powerups_live` per vector and mirrors it into the client `puLive`.

**Verified (throwaway PG16, real sql/):** **27/27 vectors** expected === SQL === JS; `wc_rank` === `PU_RANK`; **zero-drift 687/687** with the flag unset — and now guaranteed for future k≥25 results too, not only pre-QF.

**Rollback:** `git revert <this commit>` (repo/test only).

---

## 2026-07-06 (Doha) — WAVE B launch prep: parity proof rebuilt, real FIFA ranks, ready to deploy

**Commits:** this commit (`index.html` PU_RANK + `sql/standings.sql` wc_rank/comments + `tests/wave-b/*` + changelog). **Frontend const + repo-only SQL + a test harness. No live scoring change in this commit** — the SQL deploy + toggle are separate, gated steps.

**Why:** clearing the two blockers to launching the dormant Wave-B power-ups. (1) The changelog's parity guarantee rested on a `scratchpad/wave-b-vectors.json` that was throwaway and **never committed** — the launch-day proof couldn't be run. (2) The `wc_rank`/`PU_RANK` table was an admitted *plausible* placeholder, not the real ranking, and had **real order errors**.

**What changed:**
- **`tests/wave-b/`** — the parity proof, rebuilt and committed: `vectors.mjs` (24 vectors: armband double/never-create/+36-final, upset direction/never-doubled/k31, shield forgive-once/no-retro, streak 2·3·4·reset, champion never-doubled, group + today's-math base), `run.mjs` (scores each through the **real SQL `standings()` on a throwaway PG16 AND the real JS `scoreFor()`**, asserting expected === SQL === JS, plus `wc_rank === PU_RANK`), `bootstrap.sh`, `README.md`. **Result: 24/24, ranks match.**
- **Real ranks** — `PU_RANK` (index.html) and `wc_rank` (standings.sql) both replaced with the **official FIFA/Coca-Cola men's ranking, 11 June 2026 release** (frozen going into the WC; next update 20 Jul), all 48 finalists, byte-identical. Notable corrections vs placeholder: **Argentina 1 / Spain 2** (were flipped), **Portugal 5 / Brazil 6** (were flipped), **Morocco 7** (was 11), USA 17 / Mexico 14 (order reversed), Türkiye 22, Ivory Coast 33, DR Congo 46. FIFA's own numbers, so ranks skip non-WC teams (12 Italy…) — only relative order feeds the +2 bonus, so gaps are harmless.

**Verified (throwaway Postgres 16 loading the REAL sql/):** 24/24 vectors expected === SQL === JS with real ranks; `wc_rank` === `PU_RANK` (48). **Zero-drift on live data:** all `wc:results` + 687 player blobs scored by the **revised** `standings()` → **687/687 identical** to the live leaderboard (no chips + no k≥25 ⇒ Wave-B terms = 0). `node --check` clean.

**Next (separate gated steps):** deploy revised `sql/protect.sql` + `sql/standings.sql` live with a before/after `standings()` snapshot diff (must be zero); then the organizer flips `wc:powerups_live`. `wc_rank` and `PU_RANK` must be live-consistent before the flag is on.

**Rollback:** `git revert <this commit>` restores placeholder ranks and removes the harness (frontend/test only; no DB change in this commit).

---

## 2026-07-06 (Doha) — Live DB walls: wc_ko_sched (was anon-writable) + robot tick · branch ready → main

**Commits:** this changelog commit on `claude/code-readiness-updates-zofscq`, which — with `84dc9ec` (launch gate) · `8bb85a4` (knockout hardening) · `ebcc341` (review hardening) — fast-forwards cleanly into `main` on merge (base `07773c5`). **The live DB change below is ALREADY APPLIED (2026-07-06 ~05:30 Doha, via SQL) and is documented here per the changelog contract.**

**Why (DB):** the Supabase security advisor flagged `wc_ko_sched` at ERROR level — inspection showed it was **worse than flagged**: the `anon` role held **full DML (SELECT/INSERT/UPDATE/DELETE/TRUNCATE) on the robot's knockout schedule, with RLS disabled** (Supabase default-privilege grants; the table was added by robot.sql after protect.sql's walls were written). Anyone with the page's public anon key could rewrite bracket feeders/kickoff times and the robot would then place real results on the wrong ties. `wc_autoconfirm_tick()` was likewise executable by `anon` via `/rest/v1/rpc/`.

**What (DB, applied live):**
```sql
alter table public.wc_ko_sched enable row level security;
revoke all on table public.wc_ko_sched from anon, authenticated;
revoke execute on function public.wc_autoconfirm_tick() from public, anon, authenticated;
```
The robot (`SECURITY DEFINER`, run by pg_cron as owner) and the Wave-B `standings()` (definer) are unaffected — this matches how every other engine table (`wc_fixtures`, `wc_locks`, …) is walled.

**Verified live, as the real anon role via REST:** `standings` RPC → 200, 687 rows · `kv` `wc:results` read → 200 · `wc_ko_sched` select → **401 permission denied** · `wc_autoconfirm_tick` → **401 permission denied**. Same night, full-population parity re-verified: **687/687 players** — JS `scoreFor()` recomputed from every prediction blob === live `standings()` (pts, exact, correct), across all 91 recorded results including 3 penalty-decided ties.

**What (merging this branch ships):** the three branch commits — the Wave-B **launch gate** (power-ups organizer-switched via `wc:powerups_live`, dormant by default; the un-gated ⚡ arm row that had gone live on the QF1 card disappears), the **stale-tab result-merge guard** (fail-closed), **score-only bracket advance**, and the **ET/penalties live layer** (also fixes the k20 card that showed no live score after its real kickoff drifted 00:00→01:00 UTC — the widened knockout match window absorbs such drift).

**Rollback:** app: `git revert` the three commits on main (or reset to `07773c5` pre-merge). DB — exact inverse of the walls:
```sql
alter table public.wc_ko_sched disable row level security;
grant all on table public.wc_ko_sched to anon, authenticated;
grant execute on function public.wc_autoconfirm_tick() to public, anon, authenticated;
```

---

## 2026-07-05 (Doha) — Knockout hardening: no stale-tab result wipes, score-only entries advance the bracket, live layer survives ET/penalties

**Commits:** this commit (`index.html` + changelog). **Frontend only — no DB / scoring-math / sync-protocol change.** Seal-safe.

**Why (readiness audit follow-ups, verified against the live project):** three concrete knockout-stage risks. (A) The client loads `wc:results` once at boot and every organizer save posts the whole blob back with no server-side merge — so a long-open organizer tab (worst case: the champion-set after the Final, when the most results exist and the robot has stopped polling) could silently DELETE results the pg_cron robot confirmed after the tab loaded. (B) `orgSetKScore` wrote `h/a` but not the winner, so entering a knockout final score without also touching the Winner dropdown produced a scored-but-not-advanced tie. (C) The live-score layer never read ESPN's `winner` flag and capped its live window at 150 min, so a penalty-decided tie showed a bare level score with no indication who advanced, and the pulse/Room/card froze mid-shootout on the marquee matches.

**What changed — `index.html`:**
- **(A) Merge-before-write.** New `orgSyncResults()` refetches `wc:results` and folds in any result this tab has never seen (tracked in `state.resultsSeen`), then `orgSaveResults()` writes; every organizer `wc:results` write now routes through it (winner, score, team change, champion, propagate, group save). Only *unseen* keys are added, so the organizer's own edits **and deletions** still win — matching the robot's "organizer supremacy" rule. Also syncs on organizer unlock. Net: a stale tab can no longer wipe robot-confirmed QF/SF/Final results.
- **(B) Winner from a decisive score.** `orgSetKScore` now derives the winner from a decisive final score (`h≠a`, no draws in a knockout) using the tie's teams, then propagates the bracket — so a score-only entry still advances. A level score (penalties) still needs the explicit Winner dropdown; a later dropdown change still overrides.
- **(C) Live layer for ET/penalties.** `fetchLive` reads `competitor.winner`; a level FT knockout now shows "· <team> won" on the card mid-tile and the pulse bar. The live/poll window widens to 210 min and the kickoff-match window to 180 min for knockouts (the fuzzy single-name fallback stays at 15 min so it can't mis-attach), and the live layer auto-recovers ~5 min after a run of ESPN errors instead of staying dark for the session.

**Review-hardened (adversarial pass):** the merge now **fails closed** — if the pre-write refetch can't read the server (after 3 tries) it refuses to overwrite it and toasts "not saved · retry" rather than blind-writing a stale blob; and after each successful write `state.resultsSeen` is reset to the keys the server now holds, so if the organizer removes a tie and the robot **later re-confirms** it, that new result folds back in instead of being permanently barred. Score entry advances the bracket on a retry-after-failure and updates the winner dropdown in place (no full editor re-render that could discard in-progress typing).

**Verified:** `node --check` clean; a VM harness running the real functions confirms — (A) the merge adds robot-confirmed keys, never resurrects an organizer deletion, preserves local edits, adopts unseen results on a fresh session, **fails closed on an unreadable server (no wipe, no write)**, and **re-folds a robot re-confirmation after a removal**; (C) knockouts match across the wide window while group games stay tight, and the ESPN winner name flows through. The Wave-B launch gate from the prior commit still holds (OFF scores the base ladder, ON doubles). No player currently holds power-up chips; group + R32 + partial R16 results already recorded, robot cron active.

**Rollback:** `git revert <this commit>` — restores the single boot-load of `state.results` with whole-blob organizer writes, the winner-only-via-dropdown entry, and the 150-min group-era live window. Frontend-only; no DB change to reverse.

---

## 2026-07-05 (Doha) — WAVE B launch gate: a master switch so the power-up UI/scoring can't get ahead of the SQL deploy

**Commits:** this commit (`index.html` + `sql/protect.sql` + `sql/standings.sql` + changelog). **Frontend behaviour gate + two repo-only SQL edits (NOT yet deployed).** Seal-safe: no live DB scoring change; the live `standings()` / `save_picks` are untouched by this commit.

**Why (readiness audit + live-DB check):** the Wave-B power-up surfaces were wired to self-activate at **QF-pairing time** — the ⚡ arm row, the "Power-up kit", and the chip-aware paths in `scoreFor()`/`rvVerdict()` all turn on the moment a QF card becomes `koReady` (i.e. once the robot confirms the R16 winners), with **no launch flag**. A live read of the production project confirmed the exposure is real and imminent: the `wc-autoconfirm` cron robot is **active**, R16 is in progress (results through `k18`; `k19–k24` pending), **686 players**, and the Wave-B SQL is **not deployed** (`wc_rank` absent; `standings()` / `save_picks` carry no chip/upset logic; `wc:powerups_live` unset). So as soon as R16 finished, arm rows would appear, `save_picks` would silently strip the chip (a visible "won't stick" dud), and — worse — the **automatic** 🦅 upset +2 and 🛡 streak-shield in the client scorer would fire for *every* player at k≥25 (they apply whenever `scoreFor`/`rvVerdict` get any chips arg, armed or not), doubling/shifting the Me-card / reveal / brag figures while the server leaderboard (old `standings()`) ignored them — a visible per-player points-vs-rank mismatch across the knockouts. (0 players currently hold chips, so this gate is a pure no-op today.)

**What changed — `index.html` (frontend master switch):**
- New `puLive()` reading a `state.puLive` loaded once at boot from **`wc:powerups_live`** (public kv read; default **OFF**). One dormant switch the organizer controls.
- **Scoring gated at the source:** `scoreFor()` and `rvVerdict()` each begin with `if(!puLive())chips=undefined;`. Because both already treat `chips===undefined` as the pre-power-up ladder, this makes the armband/upset/shield **inert until launch across every caller at once** (leaderboard fallback, export, Room, H2H, reveal, brag, Me) without touching ~15 call sites. When live, the powered math is unchanged.
- **UI gated:** the ⚡ arm row (`puArmRow`) and the "Power-up kit" (`mePowerKit`) are hidden until live; `armBand()` refuses to arm and explains why. `?powerups` still previews the UI for screenshots.
- **Organizer LIVE toggle:** a new switch in Organizer tools (`togglePowerups()`) flips `wc:powerups_live` with a confirm that spells out the prerequisite (deploy the Wave-B SQL first). It surfaces a clear error if the write is rejected (i.e. the new `protect.sql` isn't deployed yet).

**What changed — SQL (repo-only; applied as part of the launch runbook, NOT by this commit):**
- `sql/protect.sql`: `org_exec`'s key allowlist now also permits **`wc:powerups_live`** (so the toggle can write it). Additive; ignored by the currently-deployed function.
- `sql/standings.sql`: the `wc_rank` seed is now **idempotent** (`on conflict (team) do update set r=excluded.r`, was `do nothing`) — re-running the file re-applies whatever ranks it holds, so the file is the single source of truth and an edit-then-re-run can't leave stale ranks. No effect pre-QF (the upset CTE is `k≥25`-gated).

**Launch runbook (revised — the switch replaces "hope the timing lines up"):** ① deploy `sql/protect.sql` then `sql/standings.sql` (finalise the real FIFA numbers in **both** `wc_rank` *and* `PU_RANK` first); snapshot-diff `standings()` — must be byte-identical pre-QF. ② **before R16 finishes**, flip **Organizer tools → ⚡ Power-ups → go LIVE** (or `insert into kv(key,value) values('wc:powerups_live','true') on conflict (key) do update set value=excluded.value;`). Players pick it up on their next load. To pause: flip it off (or `delete from kv where key='wc:powerups_live'`).

**Verified:** `node --check` clean; a VM harness that loads the real `index.html` script and calls the actual `scoreFor()`/`rvVerdict()` confirms — OFF ignores chips (QF pick scores 12 with and without chips, byte-for-byte the base ladder), ON doubles (24), and `rvVerdict` ON is exactly 2× OFF; the full script also boots against a stubbed DOM with no error. Live check: `wc:powerups_live` unset and 0 players hold chips, so shipping this changes nothing visible until the organizer launches.

**Rollback:** `git revert <this commit>` — frontend returns to the always-on-at-`koReady` arm UI; the two SQL edits are repo-only/undeployed. If `wc:powerups_live` was ever set: `delete from kv where key='wc:powerups_live';` (and, if the new `protect.sql` was deployed, re-run the prior `protect.sql`/`standings.sql` from `git show <prev>:sql/...`).

---

## 2026-07-02 (Doha) — Live match-card no longer collapses; Me-card derby de-duplicated

**Commits:** this commit (`index.html` + changelog). **Frontend only — one CSS scope fix + one CSS guard + a small `meNeighbours` guard; no DB / scoring / sync / lock-logic / state change.** Seal-safe.

**Why (visual bug — the live card):** on the Matches list a *live* knockout card rendered as a broken horizontal jumble — the big `0–0` score sat on top of the flags and team names, and every line was force-uppercased with wide letter-spacing. Root cause: the generic badge rule `.live{display:inline-flex;text-transform:uppercase;letter-spacing:1.5px;…}` (written for the small "Live" tag in the leaderboard header) *also* matched `.match-card.live`. Since `.match-card` never declared its own `display`, the whole card became an `inline-flex` **row** — its stacked children (round pill, teams grid, venue, result line, consensus) collapsed side-by-side to min-content and overlapped — while the inherited `text-transform`/`letter-spacing` shouted every descendant.

**What changed:**
- Scoped the badge rule to **`.live:not(.match-card)`** — it still styles the leaderboard "Live" tag, the pulsebar and the sealed room-result banner (none are match-cards, so their look is unchanged), but it no longer leaks into the live match-card, which owns its own block layout. Fixes both the overlap and the stray uppercasing in one line.
- Added an explicit **`display:block`** to `.match-card` as a guard, so no generic single-class rule can ever hijack a card's layout again.
- Verified in headless Chromium at 393px: the live card now stacks correctly (score centred with clock, teams either side, normal-case venue / `Picked:` / consensus) — matching the settled-card styling directly below it.

**Why (redundancy — the Me card):** the colleague directly above you was surfaced twice, back-to-back — the **⚔️ Tonight's derby** panel (`You vs <name> · 1 pt between you`) and then the **Around you ▲** row (`<name> … is 1 pt ahead — reel them in`) — always the same person and gap, since both read `standings[i-1]`.

**What changed:** `meNeighbours` now skips whichever neighbour the derby card already spotlights (`derbyInfo(st).opp`). Mid-table you now see only the person *below* under "Around you"; at #1 / last the lone neighbour is the derby opponent, so "Around you" cleanly omits itself rather than echoing the panel. No information is lost — only the duplicate. The higher "Road to the Maldives" prize line is a distinct narrative and is left as-is.

**Rollback:** `git revert <this commit>` — restores the bare `.live` rule, drops the `.match-card{display:block}` guard, and removes the `meNeighbours` skip.

---

## 2026-07-02 (Doha) — Pages deploys migrated to the GitHub-Actions pipeline (infra only)

**Commits:** this commit (`.github/workflows/pages.yml` + changelog). **No app change.**

**Why:** the legacy "deploy from a branch" Pages pipeline wedged — three consecutive deploys sat at `deployment_queued` for the full 10-minute timeout while the build job succeeded in seconds (runs 28602430907 / 28604145054 / 28605141864; the deploy-step log polls `Current status: deployment_queued` every 5s until `##[error] The operation was canceled`). The legacy queue exposes no re-run lever to our token (403 on GitHub's dynamic `pages-build-deployment` workflow), so the site kept serving the pre-#29 build.

**What:** a standard `actions/deploy-pages` workflow — checkout → `upload-pages-artifact` (repo as-is; the site is plain static HTML and Jekyll added nothing) → `deploy-pages`; triggers on push-to-main plus manual `workflow_dispatch`; `concurrency: pages` with cancel-in-progress. **Activation requires one organizer click: Settings → Pages → Source → "GitHub Actions"** — which simultaneously abandons the wedged legacy queue. The custom domain persists in Pages settings.

**Rollback:** flip Source back to "Deploy from a branch"; `git revert <this commit>`.

---

## 2026-07-02 (Doha) — Score chips: lift them off the black

**Commits:** this commit (`index.html` + changelog). **Frontend only — CSS only; no DB / scoring / sync / lock-logic / state / markup change.** Seal-safe.

**Why:** on real OLED phones the chips read as flat black holes. Root cause: the chip fill was `var(--glass)` (`rgba(255,255,255,.06)`) sitting on a `.match-card` that is *also* `--glass` .06 — so the chip surface barely lifted off the card and collapsed into a near-black pill with only a faint outline.

**What changed — `index.html`** (the visual-pass CSS sub-block only):
- **Raised-pill surface:** unselected `.chipb` now uses a top-lit gradient (`rgba(255,255,255,.15)→.055`) — clearly brighter than the .06 card — a crisper edge (`rgba(244,238,227,.22)`), and a 1px inner top highlight (`inset 0 1px 0 rgba(255,255,255,.09)`), so each chip reads as a raised, tappable surface instead of a black outline. Hover lifts brighter.
- **Selected = unmistakably gold:** `.chipb.sel` now explicitly carries the gold gradient (`--gold-deep→--gold`, `#181106` text) + the glow + an inset top highlight, matching the winner-pick buttons — consistent across group and knockout chips.
- **`custom…` stays quiet:** transparent with the standard hairline, a soft glass wash on hover — so it never competes with the score chips.

**Verified:** `node --check` clean; full 34-assertion headless smoke re-run green (zero page errors); 390px @2× screenshot confirms the lifted pills, crisp edges, and solid-gold selected chip against the dark card.

**Rollback:** `git revert <this commit>` — restores the flat `--glass` chip fill.

---

## 2026-07-02 (Doha) — WAVE B "Quarter-final Power-Ups" — FULLY BUILT, DORMANT, AWAITING ORGANIZER LAUNCH

**Commits:** this commit (`index.html` + `sql/standings.sql` + `sql/protect.sql` + changelog). **⚠️ NOT LIVE:** repo-only — the live Supabase functions are UNCHANGED. Mechanics are double-gated: (1) they only score on k≥25 results (none exist pre-QF — every scoring path verified bit-identical to today's math), and (2) the revised SQL isn't applied until the launch runbook below is executed on organizer sign-off. Merging this branch publishes only the ANNOUNCEMENT layer (banner, spotlight, points-table section, display-only kit panel, arm rows that stay hidden until QF pairings exist via `koReady`).

**The mechanics (evidence-led, no-gambling):** ⚡ **Captain's Armband** — one per round (QF/SF/Final; third-place excluded), arm before that match locks, its advance+exact points double (streak/champion never doubled), unused expires with the round. 🛡 **Streak Shield** — automatic, once per player, QF-onward only: the first streak-breaking miss is forgiven (run survives; no retro-rescue of R32/R16 misses). 🦅 **Upset Bonus** — flat +2 for a correct lower-ranked winner (k≥25), from a published FIFA-ranking table (`wc_rank` in SQL ↔ `PU_RANK` in JS, cross-referenced, organizer-editable before launch; full table published in the FAQ).

**Parity is the contract:** one agent wrote BOTH scoring halves; a 25-case vector file (`scratchpad/wave-b-vectors.json`) covering armband hit/miss/exact/expiry/k31-hack, shield once-only/no-retro/run-continues, upset both directions/tie/never-doubled, combos, and 3 today's-math regression cases passes against **the real extracted `scoreFor`** AND against **the revised `standings()` on a local Postgres 16** (throwaway cluster; live DB untouched). An adversarial line-by-line JS↔SQL walk found parity CLEAN; its three findings are **fixed in this commit**: `reconcilePicks` now adopts server-canonical chips (a lock-rejected arm can't survive locally), `save_picks` treats an absent chips key as "keep stored" (a stale tab can no longer silently wipe an armband) while explicit disarm still works, and brag cards are chips-aware so they match the Room's powered figures. Vectors re-run green after the fixes.

**Storage/guard:** player blob gains optional `chips:{qf,sf,fin}` through the existing `save_picks`; new `wc_chip_valid` + per-round merge in `protect.sql` (locked set/move/removal all revert to stored; out-of-range ids dropped; k31 never armable). `standings()` is now SECURITY DEFINER (read-only, pinned search_path) so anon can read the RLS-walled rank/schedule tables at launch.

**UI (all preview-verified, 0 page errors, `?powerups` demo flag for review):** arm row + ⚡ tag on QF/SF/Final cards; Me "Power-up Kit" panel (slots + shield status); "From the Quarter-finals" points-table tier + five fairness commitments; banner/spotlight announcement (`WHATSNEW_VER` bump); Room pre-settle "⚡ N armed the band" (≥8 floor) + post-settle ⚡ rows with doubled points; "⚡ DOUBLED" / "🦅 +2 upset" / "🛡 shield spent — streak alive" on settle surfaces; TV mode hides arm controls.

**LAUNCH RUNBOOK (execute only on organizer go; target: announce ≥48h before first QF lock Thu 9 Jul):**
1. Merge branch → main (announcement live; mechanics still dormant — no k≥25 results exist).
2. Snapshot `select * from standings()` → file. Paste revised `sql/protect.sql` then `sql/standings.sql` into the Supabase SQL editor; re-run the 25 vectors via the SQL harness (synthetic rows in a rolled-back transaction); diff live standings vs the snapshot — **must be byte-identical** (zero drift pre-QF).
3. Confirm/adjust the `wc_rank` seed (marked ORGANIZER-EDITABLE) before QF kickoff.
**Rollback:** `git revert <this commit>`; DB: re-run previous `standings.sql`/`protect.sql` (`git show <prev>:sql/...`) — chips fields are additive and simply ignored by the old functions.

---

## 2026-07-02 (Doha) — "MATCHNIGHT" social pass: the Room goes LIVE, a derby for everyone, the office story card, TV mode

**Commits:** this commit + two WIP checkpoints (`index.html` + changelog). **Frontend only — no DB / scoring / sync / lock-logic change.** Seal-safe; all new styling static (no new animation). New state: none (localStorage untouched; `?tv` is a URL flag).

**Why:** the engagement research's social follow-through — shared *moments*, not just personal stats. Four features: (1) the Room becomes a live second screen during matches, (2) every player gets an automatic rivalry, (3) a group-identity share card anyone can post without self-promotion, (4) a kiosk board for office screens.

**What changed — `index.html`** (two `MATCHNIGHT pass` CSS blocks + render edits):
- **🔴 The Room · LIVE (`roomAsIs` + live header + selector default).** During a live tie (picks locked = seal-safe) the Room shows the live score + clock, the office split, an **"as it stands"** tally — "13 colleagues cashing +4 · 8 sweating · 3 would land the exact score" (same ≥8 k-anon floor) — and YOUR line (cashing / need-a-turnaround / exact-watch). **Names stay sealed until full time — aggregates only.** `liveTick` patches only the score/clock text from the LIVE cache (never a blob pull on the timer); one PP_CACHE-backed re-render fires on the SEALED→LIVE transition; a tap-to-refresh button re-renders on demand. Selector defaults to the live match.
- **⚔️ Derby of the Day (`derbyInfo`/`meDerby` + board tag).** Standings-only auto-rivalry: you vs the colleague directly above (below for #1) — Me-card panel with the gap, tonight's first whistle, and a tie-aware overnight status line; the opponent's row wears a ⚔️ DERBY tag on the board (chosen rival wins if both apply).
- **🏟️ Office story card (`bragOffice`).** A collective share card with **no individual named** — "NOBODY SAW IT COMING · 5/20" / "RARE AIR" / "THE OFFICE CALLED IT" — offered on settled Room matches (≥8 pickers) to *everyone*, including the zero-point crowd who'd never self-brag. `shareBrag` gained `foot`/`cta` overrides for nameless cards.
- **📺 TV mode (`?tv` + `tvLoop`).** A kiosk board for office screens: hides personal chrome, scales up, cycles People → Departments → Room every 22s (Room = live match else latest settled; blob pull rides the 60s PP_CACHE ⇒ ≤1 pull/min per kiosk), suppresses boot popups, pauses 90s on touch, **self-heals if a passer-by taps anything** (join CTA hidden; view drift auto-returns to the board).

**Review fixes folded in (adversarial pass findings):** kiosk stranding (join CTA hidden + tvLoop self-heal — re-verified headless: back on board within one cycle after a forced `go('join')`); `meDerby` overnight deltas now use tie-aware ranks like the board (no contradictory arrows around point ties); the Room upgrades itself once when its match kicks off mid-view; brag exact-counts use `Number()` coercion matching every scoring path.

**Verified:** `node --check` clean; headless Chromium **34/34 asserts, 0 page errors** across live-Room (counts exact vs stub math; **seal assert: 0 of 20 stub names in the pre-settle DOM**; liveTick patched score with zero extra blob pulls), derby (correct opponent + single board tag), WE card (offered at 0 points; download fallback clean with `navigator.share` absent), TV mode (cycles, popups suppressed, reduced-motion clean), plus the fix re-check. Screenshots on all surfaces.

**Rollback:** `git revert` of this commit + the two WIP checkpoints — frontend-only; removes the two MATCHNIGHT CSS blocks, `roomAsIs`/`derbyInfo`/`meDerby`/`bragOffice`/`tvMode`/`tvLoop`, and the isolated hooks in `renderRoom(Body)`/`liveTick`/`renderMe`/`lbRowHTML`/`renderLeaderboard`/`init`/`shareBrag`.

---

## 2026-07-02 (Doha) — Score chips dressed in the house style

**Commits:** this commit (`index.html` + changelog). **Frontend only — CSS + one render reorder in `koMatchCard`; no DB / scoring / sync / lock-logic / state change.** Seal-safe.

**Why:** the new score chips carry the knockout score path but wore the old muted-outline look — 12px body-font text on a bare border, visually flat next to the app's gold display language, and the knockout `chips-lab` line wrapped to two lines at 390px.

**What changed — `index.html`:**
- **Chips restyled in the appended CSS block:** Anton (`--font-d`) scoreline digits at 14.5px on a glass surface (`--glass`), gold border + brighter glass on hover, and a soft gold glow + one-shot pop on the selected chip (`chip-in`, reduced-motion-gated). The `custom…` chip drops back to the body font as a quiet text affordance. Shared by group cards and the swipe fine-tune pass (same `.chipb`).
- **Action-first order on knockout cards:** the chip row now sits directly under the `Final score` label; the ⓘ help pill moved below the chips (it lines up beside the lock countdown), so the primary tap target is first.
- **Label fits one line:** dropped `· optional` from the knockout `chips-lab` (optionality is already covered by the help body and the fine-tune copy).

**Verified:** `node --check` clean; full 34-assertion headless smoke re-run green (zero page errors); before/after screenshots at 390px confirm the one-line label, chip row, and selected-chip glow in fresh / winner-picked / custom states.

**Rollback:** `git revert <this commit>` — removes the visual CSS sub-block and restores the previous element order and label.

---

## 2026-07-02 (Doha) — Score input made one-tap: knockout exact-score chips + hardened score fields

**Commits:** this commit (`index.html` + changelog). **Frontend only — no DB / scoring / sync / lock-logic change.** Seal-safe; no new state keys (predictions still store the same `{w,h,a}` / results the same `{h,a,w}`).

**Why:** mid-knockout, the highest-value input in the game — the knockout exact score (+4..+8 bonus + the streak) — was the only score surface with **no one-tap path**: two bare 46px `type="number"` boxes and the OS keyboard. A code audit also surfaced three data-integrity holes in score entry (below), all reachable from normal typing.

**What changed — `index.html`:**
- **Knockout cards get exact-score chips** (`koChipRowHTML`/`koChipPick`, rendered in `koMatchCard`): keyed off the picked winner (`P.w`, not H/D/A) — winner set `1–0 / 2–0 / 2–1 / 3–1` (mirrored for the away side) **plus level scores `1–1 / 2–2`** since a tie can end level and be decided on penalties; the neutral `CHIP_START` trio shows before a winner is picked. A decisive chip also **sets the winner** (one tap = complete prediction, mirroring how group `saveScore` derives `P.o`); level chips leave the winner pick alone. The raw inputs now hide behind `custom…` exactly like group cards.
- **Winner/score contradictions resolved like the group flow:** `pickWinner` clears a decisive predicted score that names the other team (toast explains; level scores survive); a decisive typed score sets/updates the winner with a toast.
- **`koSaveScore` fixed:** each field parses independently (`''`→null, clamp 0–20) and h/a persist only when **both** boxes are filled — the debounced save used to coerce the untouched box to `0`, silently storing a `2–0` the player never entered. Completing a score now gives the same feedback as group entry (toast + stake pop).
- **All 8 score fields hardened:** `type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" enterkeyhint` + a shared digits-only sanitizer (`wireScorePair`) — kills desktop spinner arrows, scroll-wheel silently mutating a focused score, and typeable `e`/`+`/`-`; values >20 clamp in the field itself.
- **Typing flow on every pair (player cards + both organizer editors):** select-on-focus (a prefilled `2` is replaced, not appended into `23`), home→away auto-advance after the first digit (only while the away box is empty — two-digit scores stay typeable), Enter walks home→away→commit (organizer: →next row), and `custom…` now focuses the first box as it opens.
- **Organizer editors:** results save now **clamps 0–20** (`saveResult`/`orgSetKScore` — a fat-fingered `31` used to save as 31 and skew standings) and **ignores mid-entry** (one box filled) instead of transiently deleting/writing an official result on the auto-advance blur.
- **Touch targets:** appended CSS block — `.chipb` min-height 44px, `.scorein` 54×44px, organizer `.si` 46×44px (chips are now also the knockout score path; they were ~34px tall next to scores that differ by one goal).

**Verified:** `node --check` clean on the inline script. Headless Chromium (390×740) drove the real page over 34 assertions, all passing with **zero page errors**: starter→winner-keyed chip reorientation, decisive chip setting `{h,a,w}` in one tap, winner flip clearing a contradicting 1–0 but keeping a level 1–1, custom… open+focus+auto-advance, **no phantom 3–0 on the mid-entry debounce**, `e5`→`5` / `99`→`20` sanitization with two-digit `10` still typeable, group-card chip/custom flow intact (4–2 saves with `o:'H'`), and the organizer editor (24 rows): mid-entry guard, Enter row-hop, `31`→20 clamp. Re-verified after rebasing onto the CROWD pass (#26): both appended CSS blocks coexist; full smoke re-run green.

**Rollback:** `git revert <this commit>` — frontend-only; removes the chip machinery, `wireScorePair`, the input-attribute changes and the appended CSS block, restoring the previous inputs and save semantics intact.

---

## 2026-07-02 (Doha) — "CROWD" engagement pass (Wave A — frontend-only, evidence-led)

**Commits:** this commit (`index.html` + changelog). **Frontend only — no DB / scoring / sync / lock-logic change.** Seal-safe throughout; every new element is static (no new animation) so reduced-motion is unaffected. New state: none.

**Why:** a cited deep-research pass (FPL, Duolingo, Superbru, Kicktipp + behavioral science; 25 claims verified under a 3-vote adversarial panel) ranked the highest-leverage ways to make the pool more exciting/engaging/social in the finite July 2–19 knockout window. This ships **Wave A — the six mechanics that need no scoring change** (the five point-affecting ones — round-expiring boosts, streak shield, round escalation, upset bonus, bonus questions — are held for a separate, loudly-announced `sql/standings.sql` deploy). Every mechanic respects sealed-until-kickoff picks and carries no gambling framing.

**What changed — `index.html`** (one appended `CROWD pass` CSS block + targeted render edits):
- **C1 · Visible exact-score streak** (research: Duolingo +1.7% D7, JCR superordinate-goal). A prominent gold **streak tile** on the Me card (`meStreak()`) showing the current run and the next-milestone gap, with a *neutral* prompt at run 0 (never shames a broken streak — the JCR boundary condition); a `🔥×N` chip on the viewer's own leaderboard row; and a "🔥 that's ×N in a row" note in The Room when your call was exact. Milestone flourish already fires via `streakMoment` in the reveal. Removed the now-duplicate streak *badge*.
- **C2 · Exact-score rarity callouts** (research: Superbru publishes these; exact rates as low as 0.08%). In The Room (post-settlement only), "🎯 Only **N** of **M** called **h–a** (X%)", or "You were the **ONLY** one" when you alone nailed it; and the same rarity is stamped into the **CALLED IT** brag card.
- **C3 · Department derby cup** (research: Duolingo leagues +17% time). A head-to-head **derby spotlight** atop the Departments board (`deptCup()`) — your squad vs its nearest rival (or the title race), with crests, a gold-vs-maroon avg bar and the stakes line. Derived purely from the existing `deptLeague` avg ranking; changes no scoring and invents no second ladder.
- **C4 · Participation social proof** (research: Berger observability; *high numbers only*). Office-wide "🔒 **N** of M colleagues are in the game" on the people board, and per-department "**X%** playing" on the Departments board — both from the slim standings already fetched (no heavy pull, no timer), shown only when high (≥50% office / ≥60% dept) so it's never negative social proof.
- **C5 · Peak-timed brag** (research: high-arousal sharing). The reveal finale now offers a "🔥 Share ×N streak" button when the session left you on a run — the brag lands at the emotional peak, not on a static screen.
- **C6 · Live lock countdowns.** Added the ticking `.lockin` pill (driven by the existing `[data-lockts]` loop — no new timer) to the Match-of-the-Day hero; open group/knockout cards already had it.

**Seal-safety:** every cross-player number rides an existing floor — The Room rarity is strictly post-settlement (after the `if(!settled)` gate) and aggregate + your own pick; participation is counts-only from public slim standings; the derby cup is department aggregates. No pre-settle pick, no `@ig`, no new bulk pull on a timer.

**Verified:** `node --check` clean. Headless Chromium (390×840) drove a signed-in fixture with a settled exact-score run — **zero page errors** in both standard and reduced-motion contexts. Confirmed: the Me streak tile ("Exact-score streak · ×3"), the own-row `🔥×3` chip, office participation ("35 of 40 colleagues are in the game"), the derby cup ("Defending #1", crests + bar + stakes), per-dept "% playing", and the Room rarity ("Only 2 of 32 called 2–1 (6%)") + streak note. Screenshots confirm layout on all surfaces.

**Rollback:** `git revert <this commit>` — frontend-only; removes the `CROWD pass` CSS block, the `meStreak`/`deptCup` helpers, and the isolated render hooks in `renderMe`/`lbRowHTML`/`renderLeaderboard`/`renderDept`/`renderRoomBody`/`bragCall`/`revealFinale`/`modHero`.

---

## 2026-07-02 (Doha) — "SHOWTIME" visual & excitement polish pass (every surface)

**Commits:** this commit (`index.html` + `watch.html` + changelog). **Frontend only — no DB / scoring / sync / lock-logic change.** Seal-safe throughout; every new animation is one-shot or single-element and reduced-motion-gated (watch.html rules each carry their own `@media(prefers-reduced-motion:reduce)` guard since it has no global kill-switch). New state: none.

**Why:** a full-app polish brief ("make it the best prediction app ever — visuals, excitement, entertainment"). Ran a six-lens audit swarm (one deep agent per surface: shell/join, matches, bracket/groups, leaderboard/Room, Me/reveal/share, watch.html), curated ~55 findings into one cohesive plan, then implemented it as a staged relay (one agent per surface, sequential on `index.html` so no two touch the file at once) and verified with a syntax gate, two headless-Chromium smokes (0 page errors), and an adversarial diff review. Mid-knockouts, so live-match drama was weighted heavily.

**What changed — `index.html`** (six appended, commented `SHOWTIME pass` CSS blocks + targeted render-function edits; every new class listed in the block headers):
- **Shell & join:** header countdown rebuilt to update in place and split-flap only the digit that changed (`tickCountdown`), with a maroon `imminent` state under 1h to kickoff; the userchip now shows your live rank + medal (🥇🥈🥉) and a rank-1 halo (cache-only, never fetches); join CTA gets a pending/`aria-busy` state (try/finally) + a gold sheen; legible bottom-nav tabs + active-tab snap; toast intent accents (warning vs info now distinct); departures-board gold hairline + legibility lift; banner-chip cascade; rogue off-palette gold in the select chevron fixed.
- **Matches & live:** live matches finally get a red glowing `.match-card.live` frame, a pinned **🔴 Live now** group at the top of the list, and a beating in-play score (`.livescore`) visually distinct from a settled full-time score; a **Match of the Day** hero card for the next marquee tie; office-consensus **split bars** (same k-floored numbers as the text); a locked-card "kicks off … · +N on the line" anticipation line; an **✨ EXACT** celebration frame on settled exact-score cards; pulsebar shows a big display score + a "where to watch" link and no longer stays red after full time; swipe-picker threshold haptic + edge tint; day-banner scorecard pips.
- **Bracket:** decided paths now glow gold by default (base connectors made visible); **scorelines on settled ties**; a champion **🏆 crown crescendo** on the Final card; your traced route distinguishes **solid = played vs dashed = your call**; readable default zoom (fit floor .34→.52) that auto-centres on the live front; a single live/next **beacon**; a persistent gold "your pick" rail; TBD slots now say what feeds them; the orphaned "→ winner meets X next" narrative wired in; group cards cascade.
- **Leaderboard & Room:** a **crowned throne** for #1 (crown + spotlight + honour chip + YOU on the podium); **The Room** gets a pre-result suspense **split bar** and a staged settled reveal (FT stamp → hero → cascading rows); a real **live heartbeat** (people board re-renders only while a match is live, so the odometer count-up fires) and an honest Live/Standings tag; rank-move pop for climbers; a find-me gold spine + "⋯ you're here ↓" marker; department **tribal frame** (leader banner + gap subline + larger crest); frontrunner-chip and prize-strip one-shot gleam; the **Road-to-the-Maldives runway** (plane on a dashed track) now rendered on the board; broadcast-style ticker (label chip + tap-to-advance, index preserved across re-render); podium skeleton so the board doesn't jump on load.
- **Me card & reveal:** the Me card is now a **rank-tiered collectible** (gold/silver/bronze/elite framing + corner tier pill, metals drawn only from the locked palette) with a one-shot **foil sheen**; the reveal flip gained a **depth lunge** toward the camera, a **charge-up** glow + a **tap-to-reveal drain fuse**, **streak-tier heat** (the gold flash scales with the run), fixture flags on the front, **near-miss warmth** on misses, magnitude-scaled `welcomeDelta` drama, richer confetti, and a "sealed pack" reveal chip with a reduced-motion fallback ring.

**What changed — `watch.html`:** the page finally delivers its promise — a **"Tonight in Doha"** live schedule strip (LIVE-now / next-up, on the existing 60s tick, no new timers) + a hero live-status line and gold-shimmer wordmark; host-nation **maroon** treatment for Qatar's fixtures; a "screening tonight" pulse on the Fanzone; venue-card type dots + hover lift; `-webkit-tap-highlight-color`/`::selection` parity with the app; reduced-motion-gated smooth scroll; and several leftover off-brand color literals fixed (a stray teal hover, mismatched green/red on the live/next cards, an off-palette map ring).

**Verified:** `node --check` clean on both files' inline scripts. Headless Chromium (390×740) drove both pages with **zero page errors** across every view — join, matches (with a forced-live fixture: the live frame, Live-now group, beating score and pulsebar all render), bracket trace, leaderboard/podium/Room, the Me card and the reveal ritual, plus the watch page and its Tonight strip — and a reduced-motion pass confirmed the new focal animations go inert. An adversarial diff review found two issues, **both fixed in this commit**: the leaderboard heartbeat now only fires while a match is live (was re-rendering every 60s on quiet weeks), and the Me-card tier pill no longer overlaps the reveal chip; plus two cosmetic score-wrap nits (`white-space:nowrap`). Seal-safety re-audited: the Room split bar and consensus bars use only the existing floored aggregates (tot<5 group / tot<8 knockout → nothing), the per-player Room board stays gated on settled, and the reveal near-miss line uses only your own pick + the official result.

**Rollback:** `git revert <this commit>` — frontend-only; removes the six `SHOWTIME pass` CSS blocks in `index.html`, the one in `watch.html`, and the isolated render-function edits, leaving all prior behaviour intact.

---

## 2026-06-30 (Doha) — Predictions legend: lead with knockouts, drop the finished group-stage scoring

**Commits:** this commit (`index.html` + changelog). **Frontend only — no DB / scoring / sync / lock-logic change.** Seal-safe; copy only.

**Why:** the one-line scoring legend under the Predictions progress bar still led with **"+3 right result · +2 exact score"** — group-stage scoring that no longer applies now that the group stage is finished (11–27 June) and the Round of 32 is underway. It was the first thing a player read, and it described a phase that's over.

**What changed — `index.html`:** the `.rules` legend now leads with the live phase — **"+4 to +10 who goes through · more each round · + exact score on top · 🔥 streak +5 to +20 · 🏆 champion +25"**. The streak link (`openFaq('streak')`) and champion +25 are unchanged. The full **"How do points work?"** table directly below is untouched — it still documents the group stage (now finished) and every knockout round, so nothing is lost, only re-ordered for the current phase.

**Rollback:** `git revert <this commit>` — frontend-only, one line.

---

## 2026-06-30 (Doha) — Show your predicted score on LIVE knockout cards

**Commits:** this commit (`index.html` + changelog). **Frontend only — no DB / scoring / sync / lock-logic change.** Seal-safe; display only.

**Why:** on a live knockout match the card showed only "Picked: Brazil" — your optional final-score prediction was hidden until full time, even though group cards already show it live and the settled knockout card shows it (e.g. "Picked: Canada (1–2)"). The score was always saved; it just wasn't rendered. This closes a display inconsistency.

**What changed — `index.html`:** the knockout card's locked/LIVE branch now appends your predicted scoreline `(h–a)` after the winner pick when you entered one — mirroring the group-card behaviour exactly (`p.w && p.h!=null && p.a!=null`). One line in the knockout `matchCard` render; same faint styling as elsewhere.

**Rollback:** `git revert <this commit>` — frontend-only, one line.

---

## 2026-06-30 (Doha) — Robot now auto-confirms KNOCKOUT results (not just groups)

**Commits:** this commit (`sql/robot.sql` + `index.html` org-note copy + changelog). **Live DB change** (functions + one new table redeployed to Supabase). Scoring untouched — `standings()` already scored knockouts; this only fills in the results that feed it.

**Why:** once the group stage ended, scores stopped moving. The auto-confirm robot was hard-wired to the 72 group fixtures only ("Knockouts stay human"), and — second cause — its ESPN poll only fired while a *group* match was in range, so after the groups it went silent entirely. With 670 players and the Round of 32 already underway (only k1 had been entered, by hand), the leaderboard had been frozen since 29 Jun. This makes the robot carry the knockouts too.

**What changed — `sql/robot.sql`:**
- **`wc_ko_sched`** (new table) — the 32-tie schedule. R32 rows carry group-position specs (`1A` = Winners A, `2B` = Runners-up B, `3` = best-third → away only); R16→final rows carry their two feeder ties + take (`W` winners advance, `L` losers → 3rd-place match). Mirrors `RAW`/`BRACKET` in `index.html`.
- **`wc_ko_teams(res, ovr)`** (new) — resolves every tie's HOME/AWAY teams in the app's orientation, exactly like `koTeams()`: organizer `wc:kteams` override wins per slot, else auto-derive. R32 home is always a deterministic group Winner/Runner-up (group order = Pts, GD, GF, name — no head-to-head, matching `computeGroupTable`), so the gnarly best-8-thirds allocation is **never reimplemented** — the away best-third is read straight from ESPN. R16→final teams come from feeder winners/losers via a forward pass. **`wc_ko_feed`** helper resolves a feeder's winner (or loser, for 3rd place).
- **`wc_autoconfirm_tick()`** — added a knockout-confirm pass over the same ESPN payload, after the group pass: for each tie that's past full-time + ~30 min and not already recorded, find the completed ESPN game by its resolved HOME team, then record `{w, h, a}` where **w** = the `winner`-flagged competitor (so penalty-shootout winners are correct even when the score is level), and **h/a** = each side's score *excluding penalties*, oriented to the app's home/away (ESPN's neutral-site home/away is ignored). Organizer entries always win; champion (+25) stays a deliberate organizer action. The ESPN poll now also fires when a **knockout** match is in range, so the robot no longer goes silent after the groups.

**What changed — `index.html`:** organizer note copy only — knockouts now auto-confirm like the groups (winner + after-ET score, penalties excluded), still organizer-overridable. No scoring / sync / lock / state change; seal-safe.

**Verified (against the live DB + real ESPN feed):** `wc_ko_teams` reproduces the bracket exactly — k1 South Africa v Canada, k2 Brazil v Japan, k3 Germany v Paraguay, k4 Netherlands v Morocco — matching `wc:kteams` and ESPN. Replaying the stored k1 payload reproduces the hand-entered `{h:0,a:1,w:Canada}` byte-for-byte. A live cycle auto-confirmed **k2 = `{h:2,a:1,w:Brazil}`** (Brazil 2–1 Japan); `standings()` moved accordingly and the k1→k2 exact-score **streak** bonus paid out (rushdy.fowzer +13 = +4 advance +4 exact +5 streak). In-progress k3 (STATUS_SECOND_HALF) was correctly **skipped**. Synthetic tests pass for a penalty shootout with ESPN orientation flipped (records the 1–1, winner from the flag, our home orientation) and a flipped regulation game; ESPN aliases (`Cote d'Ivoire`→Ivory Coast, `Cape Verde Islands`→Cape Verde) resolve; re-running the tick is idempotent.

**Rollback:**
- Code: `git revert <this commit>`.
- Live DB (restore the previous group-only brain):
  - `drop function if exists wc_ko_teams(jsonb, jsonb); drop function if exists wc_ko_feed(text, text, jsonb, jsonb, jsonb); drop table if exists wc_ko_sched;`
  - re-run the **previous** `sql/robot.sql` (`git show <prev>:sql/robot.sql`) to restore the prior `wc_autoconfirm_tick()`.
  - Any knockout result already auto-confirmed stays in `wc:results`; remove a specific one with the organizer screen, or `update kv set value = (value::jsonb - 'k2')::text where key='wc:results';`.

---

## 2026-06-29 (Doha) — Office Honours: earned titles beside every name

**Commits:** this commit (`index.html` + changelog). **Frontend only — no DB / scoring / sync / lock-logic change.** Seal-safe; no new state.

**Why:** persistent, visible status is what makes the social loop compound — and several of the brag cards become the *trophies* for these titles. Each title is earned from data the app already computes; most players hold none, which is what makes one worth chasing.

**What changed — `index.html`:**
- **Honours engine (`computeHonours` + `TITLE_DEFS` + `titleChip`)** — assigns the current holder of each title and renders a gold chip next to their name. Seven titles:
  - 👑 **Frontrunner** (rank 1) · 🔮 **Oracle** (most exact scores) · 🚀 **Climber** (biggest rank jump) · ⭐ **Squad Captain** (top of each ≥3-player department) — from the slim standings.
  - 🧭 **Trailblazer** (most upsets called — the renamed, gambling-free "Gambler") · 🔥 **Hot Hand** (longest current correct streak) · 💎 **Perfectionist** (most perfect match-nights) — from the existing `consensus()` leaders.
- **`consensus()` now carries `slug`** on its `best`/`bestUpset` leaders and computes a per-player **`bestPerfect`** (perfect-day count) — small additive change so titles can be attributed to the right player.
- **Leaderboard rows** show the holder's top title (priority order; one chip per name; label collapses to emoji-only on ≤430px). **Me card** gets an "Office honours" panel with your title(s) + a **title-race line** ("4 exact scores behind Bilal for the Oracle").
- Titles from `consensus()` fill in once it warms (a one-shot re-render on first load); the slim-standings titles show immediately. CSS: `.title-chip` / `.me-honours` / `.me-race`.

**Seal-safety:** titles derive only from the slim standings aggregate and the already-settled `consensus()` leaders — no raw picks, no `@ig`. The renamed Trailblazer removes the gambling connotation (fitting the QNB/Qatar context).

**Verified:** `node --check` clean. Headless Chromium — **15/15** checks: each title assigned to the correct holder (Frontrunner/Oracle/Trailblazer/Hot Hand/Climber/Squad Captain/Perfectionist), an untitled player gets no chip, the chip renders in `lbRowHTML`, the leaderboard list shows chips (crown on #1), and the Me card shows your title + the correct title-race gap; zero page errors. Screenshot confirms.

**Rollback:** `git revert <this commit>` — frontend-only; the honours helpers, the small `consensus()` slug/`bestPerfect` additions, two render hooks (`lbRowHTML` + `renderMe`), and one CSS block.

---

## 2026-06-29 (Doha) — Five more brag cards: a "Brag-worthy" strip on the Me card

**Commits:** this commit (`index.html` + changelog). **Frontend only — no DB / scoring / sync / lock-logic change.** Seal-safe.

**Why:** extend the shipped card engine with five more shareables, surfaced where players see their own achievements — a dynamic strip on the Me card that shows **only the cards you've actually earned**.

**What changed — `index.html`:**
- **`meBrags(st)` — an earned-card strip** on the Me card ("Brag-worthy 📤"), rendering a chip only when the player qualifies:
  - **🔥 On Fire** — exact-score streak ≥2 (`koStreakCurrent`).
  - **💎 Perfect Day** — every pick scored on one match-night (`mePerfectDay()` over settled picks).
  - **⭐ Squad MVP** — you're #1 in your department (from the slim standings, dept size ≥3).
  - **🏆 My Champion** — gated on `champLocked()`; your winner pick + how many back it (`CONS.champMap`).
  - **✈️ Road to the Maldives** — your rank + points from 1st (`roadGap()`), or "Top of the board" if you lead.
- Each chip is a thin caller of the existing **`shareBrag()`** builder; all derive from data already in hand and refuse gracefully (a toast) if you tap one you don't qualify for.
- **`shareBrag` big-text auto-fit** — the focal value now shrinks to fit (84–250px), so a champion team name or any long value never overflows the card.
- CSS: `.me-brags` / `.brag-chip` — appended to the social-pack block.

**Seal-safety:** all five read only your own picks/results or the public standings aggregate. No other player's pick or `@ig` is rendered. My Champion stays blocked until `champLocked()`.

**Verified:** `node --check` clean. Headless Chromium — **13/13** checks: the auto-fit builds a long-name card without throwing; the strip shows all five when earned and is empty for a fresh unranked player; each card emits the right badge/value (On Fire ×N, Perfect Day, Squad MVP #1, My Champion = team, Road to the Maldives #rank, Top of the Board when leading); Squad MVP refuses when you're not #1; zero page errors. Screenshot confirms the strip.

**Rollback:** `git revert <this commit>` — frontend-only; the `brag*`/`mePerfectDay`/`meBrags` helpers, one `renderMe` mount line, the `shareBrag` auto-fit tweak, and one CSS block.

---

## 2026-06-29 (Doha) — Brag / callout cards (CALLED IT · Lone Wolf · Catch Me)

**Commits:** this commit (`index.html` + changelog). **Frontend only — no DB / scoring / sync / lock-logic change.** Seal-safe.

**Why:** the social layer needed a way to *leave the app* and land in the group chats — the virality multiplier across 670 players for the knockouts (R16 this weekend → Final). These one-tap share cards turn the dramatic moments The Room and the leaderboard already surface into screenshot-bait.

**What changed — `index.html`:**
- **One parameterized canvas builder `shareBrag(o)`** (same kit/palette as `shareCard`/`shareSquad`: radial glow, host tricolor, gold Anton type). Drives all card variants from one tested code path; shares via `navigator.share` with a download fallback; confetti/vibrate gated behind the reduced-motion check.
- **From The Room — `bragCall()`** on a **settled** match where you scored (button only renders when `rvVerdict(...).pts > 0` — never a shame card). Auto-selects:
  - **🐺 Lone Wolf** when you were a rare-correct caller (≥8 pickers, ≤30% backed the actual outcome): *"The ONLY one in the office who called it · Brazil 2–1 Argentina"*.
  - **🎯 CALLED IT** otherwise: the exact scoreline or "+pts", with the office hit-rate (*"Only 18% of the office got it"*).
- **From "Around you" — `bragChase()`** (📤 on the chaser row): a friendly **👀 Catch Me If You Can** card naming the colleague directly behind you (or **🏝️ Top of the Office** if you lead). Public standings only.
- CSS: `.room-brag` / `.nb-brag` triggers — appended to the social-pack block.

**Seal-safety:** every card is built from already-**settled** results (`bragCall` refuses pre-result and only fires on a win) or public **standings** (`bragChase`). The office hit-rate uses the same `ppPlayers()` aggregate as The Room (no new read). The card renders your own name/dept; it never lists another player's pick or `@ig` (only the public name + point gap of the colleague directly below you).

**Verified:** `node --check` clean. Headless Chromium — **11/11** checks: `shareBrag` builds a card end-to-end (toBlob → share/download) without throwing; `bragCall` picks CALLED IT (+3) on a normal win, Lone Wolf (+5, "ONLY one") on a rare-correct contrarian, and **refuses to brag a miss**; `bragChase` names the chaser ("Cara is 10 behind") and gives the leader "Top of the Office"; The Room button shows only when you scored and is hidden on a miss; reduced-motion (no throw, no errors); zero page errors. Screenshot confirms the Lone Wolf card.

**Rollback:** `git revert <this commit>` — frontend-only; `shareBrag`/`bragCall`/`bragChase` helpers, two small mount edits (`renderRoomBody` button + the "Around you" row button), one CSS block.

---

## 2026-06-29 (Doha) — In-app announcement: one-time "What's new" spotlight + NEW breadcrumb

**Commits:** this commit (`index.html` + changelog). **Frontend only — no DB / scoring / sync / lock-logic change.** New state is localStorage-only.

**Why:** the recent additions (The Room, Department leagues, rival H2H, "you passed…") need to reach 670 players **in-app** — there's no all-staff WhatsApp. So this announces them the lightest effective way: a one-time spotlight that drops players straight into each feature, plus a persistent breadcrumb for anyone who opens the app later.

**What changed — `index.html`:**
- **One-time "What's new" spotlight (`#wnov` + `maybeWhatsNew`/`dismissWhatsNew`/`wnGoRoom`/`wnGoSquad`)** — a centered modal that appears **once per player** (gated on `localStorage 'wc:whatsnew' === WHATSNEW_VER`, so it can be re-shown for a future release by bumping the version). It lists 🏟️ The Room and 🏢 Department leagues, each as a button that **deep-links into the feature** (The Room → leaderboard in room mode; Your Squad → Me card, scrolled to the squad block), plus a one-line note on rival H2H / "you passed…". Dismissed by "Got it" or backdrop tap; never nags again. Priority on boot: results **reveal** > what's-new > the rank-delta pop (`init` now does `if(!openReveal()){if(!maybeWhatsNew())welcomeDelta();}`), so it never stacks on the reveal.
- **Persistent NEW breadcrumb (`updateNewDots`/`markSeen`/`seenKey`)** — a gold dot on the **Leaderboard** nav button (clears once the leaderboard is opened, via `showView`) and a maroon **"NEW"** pill on the **🏟 The Room** toggle (clears once the toggle is clicked). Self-clearing, `localStorage`-remembered (`wc:seen:lb` / `wc:seen:room`), so late openers still discover the features and nothing lingers as clutter.
- CSS: `.wnov`/`.wn-*` (modal), `.navnew` (nav dot), `.tnew` (toggle pill) — appended to the social-pack block, palette-locked (gold / cream / Qatar-maroon), no infinite motion.

**Verified:** `node --check` clean. Headless Chromium — **16/16** checks: spotlight shows once and **never again after dismissal** (version recorded), lists both features, both deep-links land on the right view/mode and clear their breadcrumbs, the NEW dots toggle on-when-unseen / off-when-seen and the Room pill is independent of the nav dot, reduced-motion (no throw, no page errors), and zero page errors. Screenshot confirms the spotlight.

**Rollback:** `git revert <this commit>` — frontend-only; removes the `#wnov` markup, the `whatsnew`/`seen` helpers, the two small `showView`/`init`/`lbmode` wiring edits, the two nav/toggle markers, and one CSS block.

---

## 2026-06-29 (Doha) — Department leagues (tribal competition) + The Room scaled for 670 players

**Commits:** this commit (`index.html` + changelog). **Frontend only — no DB / scoring / sync / lock-logic change.** Seal-safe throughout. New state: none (all derived from the existing standings/blobs).

**Why:** the pool has grown to **~670 players across 12 real departments** (Retail Banking 146, Group Risk 78, Group Operations 74, Group IT 73, … down to Asset & Wealth 10). That flips two earlier calls: (1) department leagues — cut by the original swarm only because at ~12 players each "department" was one person — are now a genuine tribal lever, and (2) "The Room" (shipped earlier today) now pulls every player's blob, so a settled knockout would render 600+ rows and it was making a second ~1.15 MB aggregate pull. This commit turns the passive Departments tab into an active league and hardens The Room for scale.

**What changed — `index.html`:**
- **Department leagues (`deptLeague` + reworked `renderDept`)** — a shared aggregator ranks departments by **average points per player** (fair across 10-vs-146-strong squads; ties by total). A `DEPT_MIN=5` floor keeps a stray 1-player "department" from topping the table (and is the small-N floor). The Departments leaderboard now medals the top 3, **highlights your own squad**, and lists sub-threshold squads separately. Built on the slim `standings()` RPC (~60 B/player) — no blob pull, scales to thousands.
- **"Your Squad" block on the Me card (`meSquad`)** — your department's rank of N, **your contribution rank inside it** ("You're #4 of 78 in Group Risk · top 5%"), and the **derby**: the avg-points gap to the squad directly above ("3.1 avg behind Group IT — overtake them for 2nd") and below. Reuses the slim standings already fetched by `renderMe`.
- **Dept-pride share card (`shareSquad` + `wrapText`)** — a one-tap canvas card (same kit/palette as `shareCard`) crowning your department's rank/avg/size for the desk's WhatsApp group. **Aggregate-only — no individual is named**, so it's inherently seal-safe; confetti/vibrate gated behind the reduced-motion check.
- **The Room scaled for 670 (`renderRoomBody` rewrite + `roomConsensus`/`roomTable`/`ROOM_SHOWALL`)** — (a) the office split is now computed **locally from the single `ppPlayers()` pull** via `roomConsensus()` (preserving the exact tot<5 group / tot<8 knockout k-anon floors and the upset note), **removing the second ~1.15 MB `consensus()` fetch**; (b) the settled per-player board is **windowed** — top ~20 by points + your row + your immediate neighbours, with a "Show all N players" expander — instead of dumping 600+ rows. Rank prefix added; `ROOM_SHOWALL` resets when you change match.
- CSS: `.me-squad`/`.sq-*`, dept-row highlight, windowed-table rank prefix — appended to the existing social-pack block, palette-locked, no new motion.

**Seal-safety:** department leagues read only the slim `standings()` aggregate (no picks). The Room's per-player NAME table is still gated strictly on `roomSettled`; `roomConsensus` shows only floored aggregates pre-result (never names); no other player's `@ig` is rendered on the dept board, squad block, share card, or Room table.

**Verified:** `node --check` clean. Headless Chromium with a **671-player / 13-department fixture** — **29/29** checks: dept ranking (avg-desc, ≥5 floor excludes the 1-player bucket, my squad highlighted, medals, sub-threshold note), the squad block (rank-of-12, contribution rank, derby), `shareSquad` builds a card without throwing, and The Room at scale — **exactly one `ppPlayers` pull, zero second `consensus()` pull**, the table windowed to ~22 rows with a working "Show all 671" expander, the BLOCKER seal test (locked-but-unsettled match shows the aggregate split but **zero names**), no `@ig` anywhere, and no page errors. Screenshot confirms the league board.

**Rollback:** `git revert <this commit>` — frontend-only; isolated helpers (`deptLeague`/`meSquad`/`shareSquad`/`roomConsensus`/`roomTable`) plus a reworked `renderDept`/`renderRoomBody` and one appended CSS block.

---

## 2026-06-29 (Doha) — Social pack: "The Room", rival head-to-head, "you passed X", the room's title bets

**Commits:** this commit (`index.html` + changelog). **Frontend only — no DB / scoring / sync / lock-logic change.** Every new surface reads only data the app already has and is strictly seal-safe (no pick is shown before its match seals; the champ aggregate is gated on `champLocked()`). All new state is localStorage-only.

**Why:** a multi-agent design swarm (1 grounding pass → 8 social-design lenses → 3 perspective-diverse judges scoring 49 ideas → synthesis → adversarial seal/privacy critique → finalize) was run to make the game markedly more addictive by leaning hard into the *social* loop — peer rivalry, shared match-night moments, bragging, and FOMO tied to other people. The four highest-leverage, frontend-only, seal-safe wins were folded in. The biggest unlock: who-picked-what existed only inside the *organizer* panel — players never saw it — so the swarm's headline feature exposes it (seal-safely) to everyone.

**What changed — `index.html`:**
- **🏟 "The Room"** (new) — a third Leaderboard mode (`lbmode` gains a `data-m="room"` button; `renderLeaderboard` branches to `renderRoom`). New `renderRoom`/`renderRoomBody`/`roomMatches`/`roomSettled`/`roomHero`. Pick any **kicked-off** match (selector = `ppEligible()`); see the office split pre-result (via the existing `consText()` ≥5/≥8 floor — pure suspense, no names), then once **settled** the full per-player board (name · dept badge · pick · predicted exact · points), scored with the canonical `rvVerdict()`, sorted top-scorer-first, your row flagged **YOU**. A **🦸 Hero of the match** line spotlights the lone correct contrarian (≤30% of the room, winners only — never names who got it wrong), plus a "N of M scored · K nailed the exact score" tally.
- **🎯 Rival head-to-head** — `rivalHTML` now appends `rivalH2H(rivalSlug)`: a *you edged / level / they edged* record over your **shared settled** matches plus the overall points delta. Opt-in (only the rival you chose), settled-only, framed as deltas — never "you lost".
- **🏆 The room's title bets** — `champBetsLine()` mounts on the Me card after your own champion line. Aggregates `CONS.champMap` ("Brazil ×5 · Spain ×3 …"), **hard-gated on `champLocked()`** and suppressing any pick with fewer than 3 backers (k-anonymity).
- **🫡 "You passed X"** — `welcomeDelta` now stores a compact `ranks` map in `wc:lastSeen` and adds a social line naming a colleague you overtook since your last visit. Standings-only (never raw picks); positive framing only (who *you* passed, never who passed you).
- One consolidated CSS block at the end of `<style>` (`.room-*`, `.rv-h2h`, `.champ-bets`, `.delta-pop .dx`) — palette-locked (gold / cream / Qatar-maroon / host-green), no new hue, no infinite motion (the global reduced-motion reset covers the few transitions); reuses the existing `.pp-head`/`.pp-row` board styling.

**Seal-safety (the cardinal rule):** every read of another player's `predictions[id]` goes through `ppEligible()`/`roomMatches()`; the per-player **name** table is strictly post-`roomSettled`; champ aggregation is blocked until `champLocked()`; no `@ig` on any cross-player surface; no `sbulkJSON`/`ppPlayers(true)` on a timer.

**Verified:** `node --check` clean on the extracted inline script. Headless Chromium (Playwright) drove the real render functions with controlled fixtures — **25/25** checks pass, including the load-bearing BLOCKER test (a locked-but-unsettled match shows the aggregate split but leaks **zero** player names), no `@ig` on any cross-player surface, hero/tally correctness, rival H2H tallies, champ-bets ≥3 k-anon suppression, reduced-motion (no throw, no page errors), and zero page errors overall. An independent adversarial seal/privacy audit traced all seven seal rules: **no blocker, no major** (two minors, both pre-existing/cosmetic). Screenshot of The Room confirms the suspense→payoff layout.

**Rollback:** `git revert <this commit>` — frontend-only; the additions are one isolated CSS block, a block of `room*`/`rivalH2H`/`champBetsLine` helpers, and small wiring edits in `renderLeaderboard`/`rivalHTML`/`renderMe`/`welcomeDelta` plus one `lbmode` button.

---

## 2026-06-29 (Doha) — Banner: default to the slim strip + make the shrink obvious

**Commits:** this commit (`index.html` + changelog). **Frontend only — no DB, no scoring change.**

**Why:** the shrink affordance wasn't discoverable — a faint chevron didn't read as "you can collapse this," so the big card just felt intrusive. Two changes make shrinkability obvious:
- **Defaults to the collapsed strip.** `setupBanner()` now starts `bannerMin=true` when there's no stored choice (`BANNER_MIN_KEY===null`), so the banner opens as the slim one-line strip with an expand chevron — which teaches the toggle and keeps it unobtrusive. An explicit expand/collapse is still remembered and respected.
- **Obvious toggle.** The chevron is now a visible gold pill button (bordered, `--gold-bright`) instead of a faint glyph, the whole banner has `cursor:pointer`, and **tapping anywhere on it toggles** (`onclick` ignores clicks on `a`/`button`, so "How it works ›" and the chevron still do their own thing). Auto-shrink on scroll, persistence, and the `?banner` flag are unchanged.

**Verify:** `node --check` clean; headless Chromium — default-collapsed + tap-body expand/collapse with persistence confirmed deterministically (3/3), plus chevron-toggle, link-does-not-toggle, auto-shrink-on-scroll, `?banner` force-show, and the not-joined gate all pass; screenshot confirms the default strip with the bordered gold chevron.

**Rollback:** `git revert <this-commit-sha>` (frontend-only).

---

## 2026-06-29 (Doha) — Banner: no more ✕ — it's shrinkable instead (+ `?banner` verify flag)

**Commits:** this commit (`index.html` + changelog). **Frontend only — no DB, no scoring change.**

**Why:** the dismiss ✕ snoozed the banner for ~8h, so it kept *vanishing* — the organiser couldn't find it. Replaced "dismiss" with "shrink": the announcement is now **persistent and can only be collapsed, never closed**.
- **Removed the ✕ / `dismissBanner` / 8h-snooze entirely.** The banner shows on every visit (to joined players) until `BANNER_UNTIL` (2026-07-15). Players previously snoozed now see it again.
- **Added a shrink/expand chevron** (`toggleBanner()`) where the ✕ was: ▴ collapses the full card to the slim one-line strip, ▾ expands it back. The choice is remembered in `localStorage` (`wc:banner:min`) across visits.
- **Auto-shrink on scroll still applies** — displayed-as-strip = `bannerMin || stuck`. The jump-compensating spacer now only kicks in while the banner is *pinned* (scroll-collapse); a manual shrink at the top reclaims its space normally (no phantom gap), and a manual-shrink-then-scroll adds no spurious spacer.
- **`?banner` / `#banner` URL flag** (`bannerForced()`) force-shows it regardless of the joined gate, so it can be verified signed-out on any device.

**Verify:** `https://staffchallenge26.com/?banner` shows it immediately. `node --check` clean; headless Chromium **20/20** — no ✕/`dismissBanner` anywhere; manual shrink↔expand with glyph swap + persistence; auto-shrink on scroll with spacer; manual-mini-then-scroll has no phantom jump; remembered-shrink starts collapsed; `?banner` force-shows signed-out; not-joined+no-flag still hidden.

**Rollback:** `git revert <this-commit-sha>` (frontend-only).

---

## 2026-06-29 (Doha) — "Me" page facelift + daily-engagement modules (frontend only)

**Commits:** this commit (`index.html` + changelog). Frontend only — **no DB / scoring / sync / lock-logic change**. Nothing here reads or writes another player's sealed picks; every settled/reveal gate is strictly post-full-time, and all new state is localStorage-only (`wc:rivalnudge`, reuse of `wc:revealed`).

**Why:** a multi-agent ideation swarm (1 grounding pass → 7 specialist lenses → 7 judges → synthesis → adversarial retention critique → finalize; 41 ideas vetted) was run to make the profile page both look better *and* give players a fresh, time-sensitive reason to open it every match-night of the remaining knockouts. The finalized plan's highest-leverage, no-new-infra wins were folded in. The card was also restyled into a premium collectible-style player card within the existing black/gold/host-tricolor system.

**What changed — `index.html`:**
- **Reveal nudge chip** (JS+CSS) — when `revealQueue()` has settled-but-unopened results, a pulsing gold chip is pinned to the top of `#mecard` that opens the existing animated reveal overlay (`openReveal()`); it vanishes when the queue empties. A matching count **badge on the bottom-nav "Me" button** (`updateMeBadge()` from `showView`/`updateChip`/`closeReveal`) surfaces the unopened reward from any tab. Strictly post-full-time → zero seal-leak.
- **Finite-schedule scarcity header** (JS) — "🏆 Final in N days · X of your picks still live · Y match-nights this week", derived from `FIXTURES` + the player's own unsettled picks; the calendar itself becomes the urgency engine as the bracket narrows to 19 Jul.
- **"Your next live pick" line** (JS) — names the soonest unsettled fixture you hold a pick on with a lock countdown and a one-tap **add-to-calendar** `.ics` data-URI; the rest-day return hook so the page is never a dead end.
- **"Around you" neighbour alerts** (JS) — the single player directly above and below you with the exact point gap ("…is 4 pts behind — one result and they're past you"), manufacturing a rivalry for the majority who never set one. Gated on `scored>0`.
- **Rival head-to-head meter** (JS+CSS) — the rival watch gains a gold-vs-grey proportional bar, plus a **one-time dismissible "pick someone to chase" nudge** when no rival is set (`wc:rivalnudge`) to seed the social loop while weeks of fixtures remain.
- **Best / worst call tiles** (JS) — "Masterstroke" (highest-scoring pick) + "The one that got away" (a 0-pt miss), share-fuel storytelling computed from settled picks via `rvVerdict()`. Gated on ≥3 settled.
- **Visual facelift** (CSS) — `#mecard` gets a host-tricolor top strip + gold-ringed avatar + deeper shadow; the three stats become defined tiles (Points as the gold hero tile); a podium **rank-medal pill** (🥇🥈🥉) for top-3; light "Achievements / Around you" section labels.

**Verified:** `node --check` clean (extracted inline script); headless renders of the **scored** state (reveal chip, scarcity header, next-pick, neighbours, best/worst, rival meter, nav badge) and the **new-player/awaiting** state (graceful empty states, rival nudge, no errors) — no page errors in either.

**Rollback:** `git revert <this commit>` — frontend-only; the additions are one isolated CSS block, a block of `me*` helper functions, and small wiring edits in `renderMe`/`rivalHTML`/`showView`/`updateChip`/`closeReveal`.

---

## 2026-06-29 (Doha) — Streak banner now STICKS (pins to the top, collapses to a slim strip)

**Commits:** this commit (`index.html` + changelog). **Frontend only — no DB, no scoring change.**

**Why:** the streak announcement banner scrolled away as soon as you moved down the page. Make it *stick* so it stays in view. But the full card is **~241px tall** (a third of a phone screen), so pinning it whole would permanently bury the match list and collide with the existing two-tier sticky headers (filter chips + progress panel). So it pins **and collapses**.

**What changed (display only):**
- **`.xbanner` is now `position:sticky`** (`top: safe-area + 4px`, `z-index:35`, gained a `backdrop-filter:blur` + a near-opaque base so content scrolls cleanly beneath it).
- **Collapses to a slim one-line strip on scroll** — a new `.xbanner.mini` state shows just `🔥 · heading · "How it works ›" · ✕` (~34px). Driven by an `IntersectionObserver` on a 1px `#xb-sent` sentinel, mirroring the existing progress-panel pattern. A `#xb-spacer` below the banner grows by exactly the height it sheds so the views underneath **don't lurch upward** when it snaps (same spacer trick the progress panel uses).
- **The in-view sticky bars tuck below the pinned strip** — `setupBanner()` measures the collapsed height into `--xb-h`; `body.xb-on .filters` / `.progress` add it to their `top` so the three tiers (strip → filters → progress) stack without overlap. When the banner is hidden/dismissed/snoozed (`hideBanner()`), `xb-on` is removed and the bars revert to their original offsets — non-banner behaviour is byte-for-byte unchanged.
- A short `.xb-cta2` ("How it works ›") was added for the collapsed strip; the long CTA, chips, sub and quiet line are hidden when mini.

**Verified:** extracted inline script `node --check` clean; loaded in headless Chromium (390×740) with **zero page errors**; scroll-tested — banner pins at `top:4` and collapses to a 34px strip, spacer grows to 207px (no list jump), filters/progress retuck to 41px/96px below it and revert on scroll-back; rendered the full card, the collapsed strip, and the full strip→filters→progress stack over a populated list (no overlap). Reduced-motion already covered by the global transition kill-switch.

**Rollback:** `git revert <this-commit-sha>` (frontend-only).

---

## 2026-06-29 (Doha) — Restore the agreed knockout ladder (PR #19), keep the 🔥 streak

**Commits:** this commit (`index.html` + `sql/standings.sql` + changelog). **Staged on branch only — NOT yet deployed live.** Going live needs both halves to ship together (see below).

**Why:** an organiser-reported discrepancy — "the player only gained 3 points, not 4" for a correct Round-of-32 pick (k1, Canada 0–1). Investigation: the agreed knockout ladder is **PR #19** ("knockout exact-score bonus, scaled by round", merged 28 Jun 08:26 — R32 +4/+4, R16 +5/+5, QF +6/+6, SF +8/+7, third +6/+5, Final +10/+8). Later that day the *"Maximum Excitement"* commit (`3a37ced`) overwrote it with a steeper ladder (R32 dropped to +3/+3; later rounds inflated to R16 +6 / QF +9 / SF +14 / Final +22) **and** added the exact-score streak. That steeper ladder is what went live on the site and in the Supabase `standings()` function — so a correct R32 pick really did score +3, not the agreed +4. This restores the agreed ladder while **keeping the streak** the organiser wanted.

**Restored ladder (agreed):**
- **Advance (`KO_PTS`):** R32 +4 · R16 +5 · QF +6 · SF +8 · third +6 · Final +10
- **Exact bonus (`KO_BONUS`):** R32 +4 · R16 +5 · QF +6 · SF +7 · third +5 · Final +8
- **🔥 streak (unchanged):** 2nd +5 · 3rd +15 · 4th-and-on +20 each
- Group (+3/+2) and Champion (+25) untouched.

**What changed:**
- `index.html` — `KO_PTS` / `KO_BONUS` constants back to the agreed values; the points-table rows, rules one-liners, the long rules paragraph, the two FAQ entries, and the ladder code-comment updated to match. `RND_HEAD` derives from `KO_PTS`, so the bracket headers follow automatically. The streak (`koStreakBonus`) is untouched.
- `sql/standings.sql` — the `kadv` / `kbonus` CASE ladders and the header comment restored to the agreed values; the streak CTEs (`ko` / `ko_streak` / `streak_bonus`) are untouched.

**Verified:** `node --check` clean on the inline script; app `KO_PTS`/`KO_BONUS` and the SQL `kadv`/`kbonus` ladders match tier-for-tier. Only **k1** is settled, so the live re-score is small (every correct-Canada pick +1 on advance; every nailed 0–1 +1 on the bonus).

**Go-live (both required, close together — or cards and leaderboard disagree):**
1. Merge this branch to `main` (GitHub Pages serves the agreed-ladder app).
2. Paste `sql/standings.sql` into the Supabase SQL editor on project `fzybuasvhzhmkbhxbton` and Run (`CREATE OR REPLACE`, signature unchanged, grant re-applied).

**Rollback:** `git revert <this commit>` restores the steeper "Maximum Excitement" app ladder; to revert the DB, re-run the previous `standings()` (the steeper version: kadv R16 6/QF 9/SF 14/third 8/final 22/R32 3, kbonus R16 4/QF 6/SF 9/third 5/final 14/R32 3, streak unchanged).

---

## 2026-06-29 (Doha) — Two features: "Road to the Maldives" progression + cinematic reveal

**Commits:** this commit (`index.html` + changelog). Frontend only — no DB/scoring/sync/lock change. Both features are read-only/presentational on top of existing data.

**Why:** two depth features (vs the earlier breadth polish) to add a genuine progression hook and upgrade the daily dopamine moment.

**1 — "Road to the Maldives" progression meta.** Ties every point to the grand prize (the Maldives = 1st). New read-only helpers `roadGap(rows)` / `rtmPanel()` / `rtmStrip()` derive rank + points gaps from the already-sorted standings:
- **Me card** — a gold-framed panel with an airline-style flight path: a ✈️ plane positioned by rank-percentile travelling toward the 🏝️ island, plus *"You're 3rd of 12 · 14 pts from the Maldives ✈️ / Just 3 pts behind Layla M. — pass them next ↑."*
- **Leaderboard** — a compact strip (`✈️ N pts from the Maldives · ↑ M to pass <name>`), shown for the signed-in, non-demo viewer.
- States handled: leader ("the Maldives is yours to lose — defend it"), level-board (early tournament), and points-tie ("level — break the tie to climb"). Hidden gracefully when there are no standings. The plane/fill transitions are reduced-motion-gated by the global reset.

**2 — Cinematic reveal ritual.** The per-match reveal card now performs a **true 3D flip** instead of a static fade:
- `renderRevealCard()` restructured into a two-face flip card (`.rv-flip` with `.rv-front` = YOUR PICK / `.rv-back` = RESULT). The `#rv-stamp` / `#rv-cons` IDs are unchanged, so `revealFlip()`'s logic is untouched. The verdict stamp now **slams in** (`stampIn` — scale-down impact) as the card lands.
- **Layered audio** (all gated by the existing Sounds toggle): `sndFlip()` whoosh as the card turns, a new `sndMiss()` soft tone for a wrong call (previously silent), and `sndFinale()` (C–E–G–C flourish) on the summary screen.
- **Finale flourish:** the "THIS REVEAL +N" total now **counts up** (odometer) with a pop, and confetti fires on any positive reveal (not only on a rank climb).
- **Reduced-motion:** RM users already bypass the card entirely (they get `revealSummary()`), and the flip/stamp/pop are additionally guarded — they get the result with no motion.

**Verified:** `node --check` clean. Headless Chromium drove the real flows — the Me-card Road panel (plane near the island for a 3rd-place mock), the reveal front→flip (back face shows "Mexico 2–0 South Africa · ◎ EXACT! +5", odometer +5), and the finale (count-up + confetti) — plus a unit-check of `roadGap()`/`rtmStrip()`. No page errors.

**Rollback:** `git revert <this commit>` — frontend-only. The reveal change is structural (two-face card) but self-contained to `renderRevealCard` + the appended CSS; reverting restores the prior single-card fade.

---

## 2026-06-29 (Doha) — Progress panel collapse no longer jumps the match list (frontend only)

**Commits:** this commit (`index.html` + changelog). Frontend only — no DB/scoring/sync/lock change.

**Why:** the previous entry fixed the *expandable* points table but the real "unnatural movement when scrolling down" was the **progress panel itself**. The panel is `position:sticky` and, once you scroll past it, an `IntersectionObserver` collapses it to the slim `.mini` bar — which yanks ~112px out of the layout in a single frame (the `.rules` line + "How do points work?" button go `display:none`). Because scroll anchoring is deliberately off (`overflow-anchor:none`, to avoid an older jitter loop), the browser doesn't compensate, so the whole match list lurched upward the instant the bar shrank, and the points info "closed suddenly." Measured: a 120px scroll moved a reference row 232px at the collapse point — a 112px jump on top of the scroll.

**What changed (`index.html`):**
- **Compensating spacer.** Added an empty `#prog-spacer` immediately after `.progress`. When the observer collapses (or re-expands) the panel, `window.__progSync()` now measures the panel's height before/after the toggle and sets the spacer to exactly the reclaimed height, so the document's total height — and therefore everything below the panel — stays put. The match list no longer moves at all when the bar collapses or expands.
- **Exact measurement.** The before/after `offsetHeight` read is taken with the panel's CSS transition momentarily disabled (then restored without animating the snap), so the spacer reserves the *settled* height rather than a mid-ease frame — bringing residual drift from ~9px to 0.
- Kept the prior fixes: the panel never collapses while the points table is open, and an open table scrolls naturally (`.progress.pts-open` → `position:relative`).

**Verified:** headless Chromium (390×740). Table-closed scroll: `document.scrollHeight` holds constant across the collapse and a reference row tracks the scroll 1:1 (was −112px extra). Round-trip down→up→down: returning to any scroll position lands the reference row on the identical pixel every time (no net drift). Table-open scroll: table stays open, panel scrolls away naturally, no collapse. No page errors.

**Rollback:** `git revert <this commit>` — frontend-only; removes the `#prog-spacer` element + its compensation logic, leaving the prior (table-open) fix intact.

---

## 2026-06-29 (Doha) — Points table no longer slams shut while you scroll it (frontend only)

**Commits:** this commit (`index.html` + changelog). Frontend only — no DB/scoring/sync/lock change.

**Why:** opening "How do points work?" on the Matches screen and scrolling down to read it felt broken — the panel jerked, the table snapped shut mid-scroll, and the page jumped. Root cause: the points table (`#ptable`) lives *inside* the sticky `.progress` panel. As you scrolled, the `IntersectionObserver` on `#prog-sent` flipped the panel to `.mini`, and both `.progress.mini .ptable{display:none}` **and** an explicit JS line force-closed the open table. Combined with the panel being `position:sticky` (so the tall open table first pinned to the top), you got the "unnatural movement + closes suddenly" behaviour. Reading a long table requires scrolling, which is exactly what triggered the collapse — so the feature fought the user.

**What changed (`index.html`):**
- **Observer no longer collapses or force-closes while the table is open.** Refactored the sticky-collapse IIFE: it now tracks `stuck` and calls a shared `window.__progSync()` that applies `.mini` only when `stuck && !pointsTableOpen`. Removed the JS block that yanked `.show` off `#ptable` and reset the button text on stick.
- **Open table scrolls naturally instead of pinning.** New CSS `.progress.pts-open{position:relative;top:auto}` — while the table is open the panel drops out of sticky so it scrolls away with the page like normal content (you can only open the table when the panel is full/at rest, since `.ptbtn` is hidden in `.mini`, so there's no jump on open).
- **`togglePts()`** now toggles `pts-open` on `.progress` alongside `#ptable.show` and calls `__progSync()` so the mini state re-resolves cleanly on close.

**Verified:** headless Chromium (390×740) — opening the table sets `#ptable.show` + `.progress.pts-open` with computed `position:relative`; closing restores `position:sticky`; no page errors from the change.

**Rollback:** `git revert <this commit>` — frontend-only; an isolated CSS rule plus two small JS edits (observer IIFE + `togglePts`).

---

## 2026-06-29 (Doha) — Departures-board deepening (the 40 UX + 40 gaming expert-lens fold-in)

**Commits:** this commit (`index.html` + changelog). Frontend only — no DB/scoring/sync/lock change.

**Why:** the second audit workflow (40 UX/UI + 40 gaming-engineer "expert lens" personas) finished after the first pass shipped; its agents read the already-shipped layer and produced a cohesive set of *complementary* moves (with explicit guardrails: one accent family — gold for prestige, Qatar maroon for Qatar matches + lock-urgency only; one focal glow per screen; no emoji baked into the split-flap typography; WCAG contrast preserved; every animation reduced-motion-gated). This commit folds in the low-risk, high-impact, non-duplicative items. (One guardrail applied with judgment: the optional infinite lock-countdown pulse was dropped to avoid stacking infinite animations on a scrolling list — the static maroon pill already signals urgency.)

**What changed (all CSS unless noted):**
- **Join hero ball** — depth drop-shadow + a single slow breathing focal ring; it now anchors the sign-in screen.
- **Maldives "Departures" prize board** — promoted to a gold-framed showcase (gold-deep frame, faint inset wash, soft outer glow); split-flap MALDIVES letters kept emoji-free.
- **Kickoff time** — rendered as a luxury "departures display" (Anton, scaled, gold) with the day demoted to a quiet caption.
- **Lock countdown** — calm gold pill by default; switches to Qatar-maroon urgency styling when locking is imminent.
- **Bracket** — lit (traced) connector paths get a brighter gold stroke + glow; the **Final card** wears a gold gradient + inset gold ring as the "road to glory" crown.
- **Your own leaderboard row** — recessed into layered glass (inset+outer shadow) so "this is YOU" reads instantly (depth on the me-row only, not all rows).
- **Focus states** — premium gold focus halo on inputs/score fields + `:focus-visible` rings on the primary CTA, FAQ link, swipe buttons, points & share buttons (keyboard-a11y finish).
- **Escalating streak audio** (JS) — `sndStreak(run)` climbs with the run length (a 4-streak audibly out-rewards a 2-streak); replaces the single tone in `streakMoment` (no double-fire).
- **Join celebration** (JS) — successful join/resume now fires confetti + chime + a welcome haptic (reduced-motion-gated visual).
- **Fun facts** (JS) — the same engine now also appears at the **bottom of the leaderboard** and the **top of the bracket**, and every mounted fact is **tap-to-flip** to the next one.

**Verified:** `node --check` clean; headless render of the deepened join screen (gold-framed prize board + hero glow) and the bracket (top trivia + gold Final card) — no page errors.

**Rollback:** `git revert <this commit>` — frontend-only; the additions are an isolated CSS block plus small wiring edits.

---

## 2026-06-29 (Doha) — "Sexier + more fun" polish pass + WC2026 fun facts (frontend only)

**Commits:** this commit (`index.html`, `watch.html`, changelog). **No DB / scoring / sync / lock-logic change** — every change is presentational or additive UI feedback.

**Why:** an audit was run with two large multi-agent sweeps — (1) 40 UX/UI + 40 gaming-engineer "expert lens" personas, and (2) an exhaustive per-component sweep that put one deep agent on every surface and state of both pages (header, join, matches, bracket, leaderboard, me, overlays, systems, and the whole Watch page), each checking it through *both* "make it sexier" and "make it more fun" lenses plus a completeness critic. Findings were de-duplicated into a single cohesive, low-risk, premium-tasteful pass. A load-bearing safety catch from the audit: `index.html` has a global reduced-motion kill-switch but `watch.html` does **not**, so every new `watch.html` animation ships its own `@media(prefers-reduced-motion:reduce)` guard.

**What changed — `index.html`:**
- One consolidated, commented CSS block at the end of `<style>` (all new rules last, so they layer cleanly; all motion auto-gated by the existing reduced-motion reset, infinite loops also carry an explicit fallback).
- **Toasts** now colour by intent (success/warning/error/info) from an emoji/`type` hint, and the element gained `role="status"` + `aria-live="polite"` (screen-reader feedback). `toast(msg)` is unchanged for existing callers — the `type` arg is optional.
- **Bottom nav**: keyboard `:focus-visible` gold ring, `aria-current="page"` on the active tab (set in `showView`), active-tab glow, hover-lift on inactive tabs, press-scale.
- **User chip**: gold hover wash + lift + press, light haptic on press.
- **Header points** (`#chip-pts`) pop on a live change (compared to prior value; never on first paint).
- **Matches**: a pulsing live beacon on the section count tag when any fixture is live; settled-match result lines slide in with win/lose colour glow and a points-pill pop; live pulse-bar dot escalates in the final 10 minutes.
- **Leaderboard**: gentle gold champion halo on the #1 podium avatar; me-card badge shelf cascades in (rows & podium already staggered, left as-is).
- **Game feel**: mid-journey milestone toasts + haptic at 25 / 50 / 75 % of picks (the 100 % celebration already existed); reduced-motion users now get a static glow payoff on completion instead of nothing; generating the share card now fires confetti + a pride haptic.
- **Join form a11y**: real `<label for=…>` associations + `aria-required` on the required fields.
- **Demo mode**: a persistent dashed-gold `DEMO` chip (fixed, top-right) so organizer demo data is never mistaken for the live board.
- **Footer**: reframed as a glass panel with the signature gold hairline.
- **Fun facts** 🌍: a new rotating "Did you know?" engine — 30 curated, accurate World Cup 2026 / host-venue / history / Arab-Gulf / app facts — sprinkled on the join screen, the bottom of the matches list ("Tournament trivia"), the matches & leaderboard empty states, and the results-reveal summary. It complements (does not duplicate) the existing data-driven leaderboard ticker; reduced-motion shows a static fact.

**What changed — `watch.html`:**
- Its own scoped `@media(prefers-reduced-motion:reduce)` guards for all new motion (no global reset on this page).
- Hero stat chips and fan-zone rows cascade in; the map "Near me" button has a finite 3-cycle attention glow and the located-you marker pops on success.
- "Remind me" now shows a 2-second "✓ Added to calendar" confirmation (the ICS download is otherwise silent/invisible on mobile).
- Footer reframed to match the app (glass panel + gold hairline) for cross-page cohesion.

**Verified:** `node --check` clean on the extracted inline JS of both pages; headless Chromium render of join, matches (incl. the trivia card), and the Watch page — no page errors, layout intact, fun facts and footer render as designed. All facts are real-world-accurate or clearly playful (no false factual claim on a bank's app).

**Rollback:** `git revert <this commit>` — frontend-only, no DB/state change. Each feature is an isolated, additive block (the consolidated CSS section, the `WC_FACTS`/`mountFact` block, and small wiring edits) and can also be removed individually.

---

## 2026-06-29 (Doha) — Fix: points-table streak rows were squashed by a CSS class collision

**Commits:** this commit (`index.html` + changelog). Frontend/CSS only.

**What:** the new streak rows used `class="prow sk …"`, but `.sk` is the pre-existing **skeleton-loader** class (shimmer animation + `height:14px`) — so the three streak rows were squeezed to 14px with a shimmer band (caught in a screenshot). Removed the colliding `sk`/`sk1`/`sk2`/`sk3` classes (the bold numbers are already gold via the base `.ptable .prow b` rule) and bumped `.ptable .prow` padding 3px→5px with `line-height:1.35` for comfortable, uniform spacing. The streak rows now render like every other row. `node --check` clean.

**Rollback:** `git revert <this-commit-sha>` (frontend-only).

---

## 2026-06-29 (Doha) — Clarity & declutter pass (11-lens reader swarm + synthesis + critic)

**Commits:** this commit (`index.html` + changelog). Frontend/copy only — no scoring or DB change; `node --check` clean and 4000/4000 JS↔SQL fuzz parity unchanged.

**Why:** a swarm of 11 reader/expert lenses (newcomer, non-native English, 3-sec skimmer, plain-language, information architect, confusion-hunter, density, UX writer, football-literacy, consistency, critic) audited every explanation surface; synthesis + an adversarial critic produced a reconciled spec. Goal: say each rule once, in plain words, with one name per concept — clearer **and** less cluttered.

**What changed (copy/structure only):**
- **Points table** = single source of truth. Group header → "(now finished)"; knockouts header trimmed (caveats moved to the card pill); added a **column legend** ("faint = exact-score bonus / bold = go through") so the two numbers per row aren't distinguished by weight alone; every knockout row now reads uniformly "· +N exact score"; streak rows say per-game vs one-time consistently with a **reset footer**; champion row past-tense "locked". (Reverted an ascending-font "ladder" on the streak rows that overflowed/overlapped.)
- **Rules line** (always visible): plainer ("right result", "exact score", "+3 to +22 (more each round)"), dropped the edge-case tie-break, kept the 🔥 streak tease linking to the FAQ.
- **Per-card pill**: plain "full time / after extra time" (not 90/120), added the 1–1-won-on-penalties case, kept the worked example, trimmed to a one-line streak teaser + link; second note → just "Predict the final score".
- **FAQ**: rewrote "How do points work?", "score bonus work", the streak entry, and "does this change…" as scannable, plain-language answers (enabled `white-space:pre-line` so line breaks/bullets render); **merged 3 near-identical contact entries into 1** (14 → 12 entries).
- **Terms paragraph**: collapsed the 4th full restatement of every point value into a one-line summary that points to the table (kills the worst drift risk); legal/operational text kept.
- **Banner**: plain heading "New: the exact-score streak", literal sub, chips relabelled "ON YOUR 2ND / ON YOUR 3RD / 4TH ON, EACH" (one-time vs each), quiet line confirms champion (+25) unchanged.
- **Reveal label**: knockout exact-score-only result keeps the ◎ glyph and now reads "exact score" (critic fix — preserves ◎ = any exact hit).
- **Me badges**: generic correct-pick streak → ✅; the prize-relevant one → "🔥 Exact-score streak ×N".
- **Consistency**: one name per concept across all surfaces ("exact score", "exact-score streak", "pick who goes through", round names spelled out, "+N" notation, ranges use "to" not "→"); retired snowball/back-to-back/going forward/nail/90-min/120-min from user-facing copy (only dev code-comments retain a couple).

**Verified:** `node --check` clean; 4000/4000 fuzz parity unchanged; rendered the banner, rules line, points table and a FAQ answer in headless Chromium (caught + fixed the streak-row overlap before shipping).

**Rollback:** `git revert <this-commit-sha>` (frontend-only).

---

## 2026-06-29 (Doha) — Banner now STAYS for a while (persistent through the knockouts)

**Commits:** this commit (`index.html` + changelog). Frontend only.

**Why:** the streak banner was one-time (✕ snoozed 48h; opening the explainer marked it permanently seen), so it vanished and felt lost. Now it **persists**: it shows on every visit (to joined players) until **`BANNER_UNTIL` = 2026-07-15** (through the knockouts), the **✕ only hides it ~8h** (it returns next visit), and the "See how streaks work ›" CTA **no longer dismisses it**. `BANNER_KEY` bumped `streak-v1`→`streak-v2` so it re-appears for everyone who'd already dismissed v1. To change how long it stays, edit `BANNER_UNTIL`; to change the close duration, edit `BANNER_SNOOZE`. `node --check` clean.

**Rollback:** `git revert <this-commit-sha>` (frontend-only).

---

## 2026-06-29 (Doha) — Discoverability: the always-visible rules line now links to the streak explainer

**Commits:** this commit (`index.html` + changelog). Frontend only.

**Why:** the streak announcement banner is intentionally one-time (snoozes on ✕, marked seen once the explainer is opened), so after it's gone a user asked "where did the snowball explanation go?" The explanation still lived in the points table, the FAQ, and the rules line — but none were an obvious tap. **Fix:** the "🔥 exact-score streak +5→+20" item in the always-visible rules line (above the match list) is now a tappable link that opens the streak FAQ entry (`openFaq('streak')`), styled with a dotted gold underline so it reads as interactive. The streak explainer is now permanently one tap away, regardless of banner state. `node --check` clean.

---

## 2026-06-29 (Doha) — 🚀 DEPLOYED to production (app → main/Pages + standings() → Supabase)

**What:** the Maximum-Excitement feature is now LIVE. App pushed to `main` (GitHub Pages, staffchallenge26.com) and the new `standings()` applied to Supabase project `fzybuasvhzhmkbhxbton` via `CREATE OR REPLACE` (migration `max_excitement_standings`).

**Deploy order (to minimise any window, since k1 was already settled):** pushed the app first, polled the live site until the new build served (~30s), then applied the SQL immediately.

**Post-deploy verification (real production data):**
- Live `standings()` now has the streak + new ladder (verified via `pg_get_functiondef`); returns all 667 players, max 176 pts (sane — only k1 played).
- **End-to-end parity on REAL data:** top 30 players' live `standings()` pts/exact/correct === the app's `scoreFor()` recomputed from their actual prediction blobs (30/30 match). Plus the pre-deploy 400-player Postgres gold test + 4000-fuzz parity.
- k1 (Canada, 0–1) is now scored under the new ladder (R32 advance +3, exact +3) on both cards and leaderboard.

**Rollback (captured BEFORE deploy):** the exact prior live function is saved at `sql/rollback_pre_max_excitement_standings.sql` — paste it into Supabase to restore the old scoring; and `git revert` the app on `main`. (The live pre-deploy version was a custom one: old ladder 4/5/6/8/6/10, old bonus 4/5/6/7/5/8, exact bonus, no streak — NOT identical to any git blob, which is why it was snapshotted.)

---

## 2026-06-29 — Fix: "Next kickoff" was shown twice (header countdown + pulse bar)

**Commits:** this commit (app `index.html` + this changelog).

**Why:** the upcoming match was rendered by two independent widgets that both labelled it **"Next kickoff"**, so when signed in on the **Matches** tab with no live game, the same fixture appeared twice — once in the header countdown and again in the pulse bar directly below it:

- **`tickCountdown()`** → header `#countdown` (persistent across views): *"Next kickoff"* + teams + a live ticking clock (days/hrs/min/sec).
- **`renderPulse()`** → `#pulsebar` (Matches view only): in its no-live branch it printed *"Next kickoff · A v B · in 3h 20m"*.

Both computed the identical target — the first fixture with `ko > now` — so the label and match always matched.

**What changed** (frontend only, `index.html`):
- `renderPulse()` no-live branch now **hides the pulse bar** (`el.style.display="none"`) and returns, instead of rendering its own "Next kickoff" line. The header countdown is the single source of truth for the pre-match countdown.
- The pulse bar still renders its **LIVE/FT scoreboard** when a match is in progress (that state is distinct from the header and is unchanged).

**Why this is safe:** the pulse bar lives inside `#view-matches`, and `go("matches")` redirects to the join screen unless `state.player` is set. The header countdown is made visible (`display:flex`) on sign-in and on load whenever signed in. So the pulse bar's no-live branch can only run when the user is signed in — exactly the state in which the header countdown is already on screen showing the same fixture. Hiding it removes no information the user can't see in the header.

**Verified:** the no-live branch now sets `display:none` and returns before any "Next kickoff" markup; the LIVE/FT branch returns earlier and is untouched. `node --check` clean on the extracted script.

**DB:** none (frontend-only).

**Rollback:** `git revert <this commit>` restores the pulse bar's "Next kickoff · A v B · in …" idle line. Frontend-only; no DB/state change.

---

## 2026-06-29 (Doha) — Pre-deploy fix: reveal "THIS REVEAL" total now includes the streak bonus

**Commits:** this commit (`index.html` + this changelog). Frontend display only — no scoring/DB change.

**What:** the 7-agent deploy-readiness verifier caught it: `rvVerdict` returns only advance + final-score bonus, so the reveal odometer / "+N · THIS REVEAL" headline (and the reduced-motion summary) summed those but **omitted the exact-score streak bonus** that `scoreFor` and `standings()` award. A player hitting a 2+ exact streak would see the "🔥 STREAK ×N +M" flash and a bigger rank-climb than the headline number explained. Leaderboard/prizes were never affected (JS and SQL still agreed) — purely a reveal-total display mismatch.

**Fix:** `revealFlip` and `revealSummary` now add `streakBonusAt(koStreakRunAt(...))` to the running total for each exact knockout, so the headline is definitionally identical to the engine. Verified: per-match (`rvVerdict.pts` + streak) summed over a 5-match scenario (3-in-a-row, reset, restart) equals `scoreFor().pts` (47 = 47); 4000/4000 fuzz parity unchanged; `node --check` clean.

**Rollback:** `git revert <this-commit-sha>` (frontend-only).

---

## 2026-06-29 03:14 (Doha) — Design pass: streak announcement + celebratory moment (from the 10 UX/UI designer panel)

**Commits:** this commit (`index.html` + this changelog). **Frontend only — no DB, no scoring change** (display surfaces only; `scoreFor`/`standings()` untouched; 4000/4000 parity re-verified).

**What:** implemented the design panel's solutions (they scored the prior version 6.0/10, punchiness 4.6). All additive.
- **Redesigned banner** — Anton hook headline "Knockout scores now SNOWBALL", the bonuses as gold **chips** (+5 / +15 / +20 with "2/3/4+ in a row" labels), tightened copy, demoted reassurance to a quiet line, a deep-link CTA, a **rise** entrance + a flame **flicker** (both `prefers-reduced-motion` safe), and a larger 30×30 ✕ with `role="status"`.
- **Banner reach fixes** — `setupBanner()` now only shows to **joined players** (no longer burns the one-time exposure on the sign-in screen) and re-runs after join; a reflexive ✕ now **snoozes 48h** instead of silencing forever; opening the explainer marks it permanently seen (`bannerSeen()`).
- **Deep-link FAQ** — `openFaq('streak')` opens the FAQ scrolled to and expanding the streak answer.
- **Celebratory streak MOMENT** — when an exact-score run extends to 2/3/4+ during the reveal, a full-screen "🔥 STREAK ×N · +N" flash fires with escalating confetti/haptics (reduced-motion safe, `role="status"`). New display helpers `koStreakRunAt` / `koStreakCurrent` / `streakBonusAt` / `streakMoment` (mirror the engine; unit-tested).
- **Me-tab badge** — "🔥 Exact-streak ×N" when a player is on a live run.
- **Shareable streak** — the share card's feature line leads with "On a N-game exact streak 🔥" when applicable.
- **Naming clash resolved** — the pre-existing correct-results streak is relabelled ("N correct in a row" / "Hot hand … correct in a row" / "Longest run") so it doesn't collide with the new exact-score streak.
- **Points table** — the 🔥 streak rows render as an ascending ladder (numbers grow) to show the snowball; the rules one-liner now quantifies it (**+5→+20**); the per-knockout-card "How the bonus works" pill gains a streak line.

**Verified:** `node --check` clean; 4000/4000 JS↔SQL fuzz parity unchanged (display-only); streak display helpers unit-tested (3-in-a-row, miss-reset, gap, tier bonuses); banner re-rendered in headless Chromium.

**Rollback:** `git revert <this-commit-sha>` (frontend-only; no DB/state change).

---

## 2026-06-28 22:15 (Doha) — Review fixes: leaderboard-crash guard, FAQ numbers, empty-champion guard (from a 25-reviewer panel)

**Commits:** this commit (`index.html` + `sql/standings.sql` + this changelog). **Re-deploy the SQL** (see DB).

**Context:** a three-panel review (10 engineers, 10 UX/UI designers, 5 football fans) of the Maximum-Excitement feature. Verdict: **ship-with-fixes** (coders avg 8.1/10, fans excitement 8.2/10, no blocker). Two objective bugs + one safe guard fixed here; design polish and the streak-policy question are tracked as follow-ups.

**Fixed:**
- **`standings()` leaderboard-crash guard (HIGH):** the `ko` CTE int-cast `substring(m.id from 2)::int` had no `^k[0-9]+$` guard, so a single malformed knockout key in `wc:results` (+ any player's pred for it) would throw and abort the leaderboard for **all 660**. Added `and m.id ~ '^k[0-9]+$'` to the `ko` CTE WHERE (mirrors the JS `/^k[0-9]+$/` filter). Verified: with the guard, a planted `kx` key no longer crashes `standings()`.
- **Stale FAQ numbers (HIGH):** the main-authored FAQ "Knockouts — how does the score bonus work?" still said the old "+4 … rising to +8" and contradicted the live points table / per-card label. Corrected to **"+3 … rising to +14"** (matches `KO_BONUS`).
- **Empty-string champion guard:** `standings()` champion predicate now uses `nullif(...)` both sides, so an empty `_champ` awards 0 (matches JS). Prevents a 25-pt card-vs-leaderboard split from a hand-edited backup.
- **Bracket-header drift (RND_HEAD):** the bracket-tree column headers showed the OLD advance ladder (+4/+5/+6/+8/+10); now **derived from `KO_PTS`** (renders +3/+6/+9/+14/+22) so they can never drift from the engine again. (Caught by the push committee's devil's-advocate.)
- **FAQ tie-break:** "How are ties broken?" still said rules were "announced before the knockouts begin" — but they've started and the tie-break is already published. Now states the live rule (most predictions → most exact → most correct → earliest sign-up), matching the rules block and the `cmpSt` ranking code.

**Decision process:** a 7-member push committee (+ chair) voted **GO-WITH-CONDITIONS** (3 GO / 0 NO-GO / 3 conditional). The two display fixes above were its assistant-owned pre-push conditions; the streak skip-to-bridge fix is a sanctioned **fast-follow** (not a blocker — both engines agree so cards==leaderboard, and it can't fire until ~3 settled KO results with a gap); the streak tail stays **uncapped** per the organiser's max-excitement mandate.

**Verified:** re-extract + `node --check` clean; 4000/4000 JS fuzz parity; real Postgres `standings()` == `scoreFor()` over 400 players (full parity, no regression); edge test — malformed key + empty champ no longer crash and score correctly (pts 6); full disclosure-parity read — every user-facing number (banner, rules line, terms, points table, FAQ, bracket headers) matches the engine constants.

**Follow-ups (not blockers, tracked):** streak skip-to-bridge exploit + runaway-tail cap (a scoring-policy decision), `restoreBackup()` input sanitization, a committed JS↔SQL parity CI harness, a celebratory in-app streak moment, and banner reach/punchiness polish.

**DB (organiser action required):** re-paste `sql/standings.sql` into the Supabase SQL editor and Run (safe, `CREATE OR REPLACE`).

**Rollback (git + SQL):**

    git revert <this-commit-sha>
    git push -u origin claude/group-stage-prediction-6502w4
    git show <this-commit-sha>^:sql/standings.sql   # re-paste this previous version into Supabase

---

## 2026-06-28 18:00 (Doha) — Feature: "Maximum Excitement" knockout scoring (steeper ladder + exact-score bonus + exact-score STREAK + announcement banner)

**Commits:** merge of `origin/main` (adopting its final-score bonus model, bracket tree, "Road to the Final", clarity pill, watch live-knockouts) **plus** this re-application of the Max-Excitement scoring on top. Touches `index.html`, `sql/standings.sql`, this changelog. **Requires an organiser SQL deploy** (see DB).

**What:** Knockouts get much more dramatic. All changes are **knockouts only, going forward** — group-stage and the locked champion pick are untouched. Exact-score is judged on the **final score** (after extra time if played; penalties excluded), consistent with `koScoreHit`.

| Round | Advance (was→now) | Exact final-score bonus (was→now) |
|---|---|---|
| R32 | 4 → **3** | 4 → **3** |
| R16 | 5 → **6** | 5 → **4** |
| QF | 6 → **9** | 6 → **6** |
| SF | 8 → **14** | 7 → **9** |
| Third | 6 → **8** | 5 → **5** |
| Final | 10 → **22** | 8 → **14** |

Plus a NEW **exact-score STREAK** (knockouts only): nail the exact final score in **consecutive knockout matches you predicted** (chronological by k-id) and the per-match bonus snowballs — **1st in a run +0 · 2nd +5 · 3rd +15 · 4th-and-onward +20 each**. Any non-exact predicted knockout match resets the run. No knockout has kicked off yet, so the streak window is the whole bracket — automatically "only going forward."

**Decision:** Group (**+3 / +2**) and **Champion +25** are **unchanged** (purely additive rollout; nothing already locked is devalued).

**What changed** (`index.html`, on top of main):
- `KO_PTS` → `{R32:3,R16:6,QF:9,SF:14,third:8,final:22}`, `koPts` fallback `||3`; `KO_BONUS` → `{R32:3,R16:4,QF:6,SF:9,third:5,final:14}`.
- New `koStreakBonus(preds,results)` — chronological gaps-and-islands over settled knockout matches the player engaged with; uses main's `koScoreHit` so "exact" matches the bonus exactly; awards 0/5/15/20 by position in each consecutive run. Wired into `scoreFor` before champion.
- Copy synced to the new numbers **and to "final score" wording**: points table (`#ptable`, with a streak group), rules one-liner (`.rules`), the long terms paragraph, and the FAQ ("How do points work?" + new "🔥 exact-score streak" + "does this change my group/champion?" → no). Main's final-score explainer FAQ + "How the bonus works" pill kept as-is.
- **Dismissible announcement banner** (`.xbanner` under the header): one-time "New for the knockouts — Exact-Score Streaks" notice with a "How it works ›" link to the FAQ; `setupBanner()`/`dismissBanner()` persist dismissal in `localStorage` (`wc:banner:streak-v1`).

**What changed** (`sql/standings.sql`): advance/bonus CASE ladders updated; new `ko`/`ko_streak`/`streak_bonus` CTEs implement the streak via window-function gaps-and-islands; champion stays +25; comments say "final score." `CREATE OR REPLACE`, signature unchanged, grant re-applied.

**Verified:**
- **app ↔ SQL parity:** all 32 advance+bonus tiers match; canonical streaks (2/3/4/5-in-a-row, resets, isolated hits) correct in the real merged `scoreFor`; **4000/4000 random tournaments** agree between `scoreFor` and an independent translation of the SQL.
- **real Postgres:** loaded `sql/standings.sql` into a throwaway PG 16 cluster, ran `standings()` over **400 synthetic players** (29 knockouts settled, streak-heavy) — **identical points to the merged `scoreFor()` for every player** (max 294).
- `node --check` on the extracted inline script: clean.
- **10-judge panel** on the design: mean **7.6/10**, all 10 in 6–9, unanimous "ship the +20" (4th-and-onward tier).

**DB (organiser action required):** paste `sql/standings.sql` into the Supabase SQL editor and Run (safe, `CREATE OR REPLACE`, no DROP). Do it **before the first knockout result is entered** so leaderboard and cards agree from match 1. Until then it returns identical points to the old function (group + champion only).

**Rollback (git + SQL):**

    git revert <this-merge-commit-sha> -m 1
    git push -u origin claude/group-stage-prediction-6502w4
    # then re-paste the PREVIOUS sql/standings.sql into Supabase:
    git show <this-merge-commit-sha>^1:sql/standings.sql   # copy output into the Supabase SQL editor and Run

---

## 2026-06-28 — Scoring audit + fix: KO bonus was missing from 5 secondary point displays

**Commits:** this commit (app `index.html` + this changelog).

**What:** ran a full scoring audit — extracted the real functions from `index.html` and ran a **61-test suite** covering group (+3 result / +2 exact, 5 max), knockout (winner ladder + independent final-score bonus), the extra-time rule, champion (+25), tiebreakers, and every helper. The **authoritative scorer `scoreFor` (which drives the leaderboard) was correct.** But the knockout exact-score bonus had never been propagated to five *secondary* displays that compute points on their own, so each under-reported KO bonus points versus the leaderboard:

- **`rvVerdict`** (reveal ritual + the day banner *"Today: +N — all settled"*) — counted winner points only; a nailed knockout scoreline didn't show, and the daily total disagreed with the leaderboard. Also made the streak / "perfect day" / "maverick" badges treat a bonus-only KO hit as a miss.
- **`renderDayBanner` potential** (*"up to +N"*) — the KO ceiling omitted the bonus even when a score was entered (group already added its +2).
- **`stakeText`** (the *"+N on the line"* float when you tap a pick) — KO ignored the bonus when a score was armed (group shows *+5 ⚡*).
- **`ppPtsHTML`** (settled per-match points in the head-to-head / profile view) — KO showed *+winner* only; group included the exact bonus.
- **`provFor`** (live provisional pulse) — KO didn't provisionally count the bonus when the live score matched the prediction (group did).

All five now mirror `scoreFor` / the group logic: ladder/winner points **plus** the independent final-score bonus.

**Verified:** 61/61 tests pass against the **extracted real functions** (not reimplementations), including `rvVerdict().pts === scoreFor().pts` and `ppPtsHTML` totals across R32/R16/QF/SF/third/Final, and that the extra-time interim (the 1–1 of a tie that ends 2–1 a.e.t.) scores **0 bonus everywhere**. `node --check` clean.

**DB:** none. Leaderboard standings were already correct (`scoreFor` unchanged) — this aligns the reveal, day banner, stakes float, profile view, and live pulse with them.

**Rollback:** `git revert <this commit>` (frontend-only; no DB/state change).

---

## 2026-06-28 — Correction: knockout bonus is judged on the **final score** (not "90 or 120, either")

**Commits:** this commit (app `index.html` + this changelog).

**Why:** the previous two entries implemented "the bonus hits if your score matches at 90 min **or** after extra time (either one wins)." That was a misread of the intent. The correct rule: there is **one** scoreline that counts per tie — the **final score**. If the tie is decided inside 90 minutes, that's the 90-minute score; if it's **level at 90 and goes to extra time, the after-extra-time score is the one that counts** (the 90-minute draw is just an interim and does **not** win the bonus). Penalties never change the recorded scoreline.

**Net effect on players:** they predict a single **final score**. Example: a tie is 1–1 after 90 min and ends 2–1 after extra time — predicting **2–1 wins**, predicting **1–1 does not** (previously both won — too generous).

**What changed** (frontend only, `index.html`):
- `koScoreHit(p,r)` simplified to a single-scoreline match against the result's `h/a` (the final score). The "or `h2/a2`" branch is gone. All four call sites (`scoreFor`, `koMatchCard`, `brkTie`, `renderBracket`) were already routed through `koScoreHit`, so they pick up the fix unchanged.
- Organizer editor reverted to **one "Final score" row** per tie (the separate "After ET (120)" row is removed). Note under it: *"Score after extra time if the tie went there · penalties don’t count."* `orgSetKScore` writes only `h/a` and deletes any legacy `h2/a2`.
- New **tiny ⓘ tooltip** (`koInfo()` + `.infodot` CSS): on the knockout pick card it explains *"Final score = the score when the match ends — after extra time if it’s played. Penalties don’t change it,"* with the 1–1→2–1 example. Hover title on desktop, tap-to-toast on mobile.
- Winner pick clarified: *"Pick who goes through — **extra time & penalties decide it**."*
- Copy aligned everywhere: pick-card label is now **"Final score"**; rules/points panel, terms paragraph, and the two FAQ entries all describe the **final score (after extra time; penalties excluded)** with the worked example. Removed all "90 or 120, either wins" wording.

**Data model:** knockout result reverts to a single scoreline `h/a` (now meaning the **final** score, after ET, excl. penalties) alongside `w`. The short-lived `h2/a2` keys are no longer read or written, and `orgSetKScore` strips them on save. No KO results had been entered yet, so there's nothing to migrate.

**Verified:** `koScoreHit` truth table (node) — decided-in-90 and after-ET both match the recorded final score; the 90-min interim of an ET tie now **misses**; pens tie keeps its level final; string scores coerce; winner-only result misses. `node --check` clean. Tooltip HTML well-formed.

**Rollback:** `git revert <this commit>` restores the "either 90 or 120" behavior and the two-field organizer entry. Frontend-only; no DB/state migration.

**Reconciliation:** a parallel session independently landed the same scoring correction (`fde663b`) with a different design — a two-field organizer where `h2/a2` *supersedes* `h/a`, and no tooltip or winner clarification. This commit merges over it and consolidates to the single **"Final score"** field, the **ⓘ tooltip**, and the **"extra time & penalties decide it"** winner note (the approach approved for this session), while **preserving that session's unrelated `watch.html`** live-knockout-fixtures feature. The superseded entry is kept below for history.

**Clarity pass (10-judge layman panel + clickable ⓘ):** ran the player-facing copy past ten roleplayed layman personas (avg 4.3/5, 9/10 understood which score to enter). Two consensus fixes applied: (1) the FAQ now covers the **penalties-only case** — a match still level after extra time and settled on penalties keeps that level score (1–1 on pens → predict 1–1); (2) "if the **tie** is level" → "if the **score** is level" in the FAQ (the word "tie" collided with "draw" for non-native readers). Card sub-line tightened to *"after extra time if it's played; penalties don't count."* Separately, the **ⓘ** was restyled from a faint gray outline (didn't read as tappable) to a **solid gold button with a dark "i"** + press/scale feedback.

**Affordance redesign (10 UX-designer panel):** the solid gold "i" dot still tested as a decorative badge, not a control (panel avg ~1.6/5; 8/10 recommended a labeled pill). Replaced it with a proper **labeled pill button on its own line — "ⓘ How the bonus works ›"** — `<button aria-expanded>` with a chevron that rotates and the pill filling solid gold when open. It now **expands the explanation inline** (a bordered `.help-body` panel — persistent and readable) instead of firing a transient toast. This fixes the figure/ground problem (the dot was lost in the gold-on-gold label row), the touch-tooltip failure, and discoverability in one move. Removed `koInfo`/`.infodot`; added `toggleHelp()` + `.help-chip`/`.help-body` styles.

**Wording — make 90 / 120 min explicit:** the "How the bonus works" panel and the FAQ now spell out the times — *"Final score = where the match ends: **90 min**, or **120 min** if it went to extra time. Penalties don't count."* — so it's unambiguous when the score is read.

**Clearer example:** the panel example was circular ("…the final score is 2–1, so you'd predict 2–1"). Replaced with a scannable ✓/✗ contrast in its own block — *"a match is 1–1 at 90 min, then 2–1 after extra time: ✓ predict 2–1 wins · ✗ 1–1 doesn't (only the 90-min score)"* — so it shows the actual point (the 90-min draw loses). FAQ example: "tie" → "match".

---

## 2026-06-28 — Fix: knockout score bonus is the **final** score, not 90 **or** 120

**Commits:** this commit (app `index.html` + this changelog).

**What:** the previous entry made the knockout exact-score bonus hit on the **90-minute score OR the after-extra-time (120-minute) score** — both counted. That was wrong. The bonus is judged on a **single final scoreline**:
- Tie settled inside 90 minutes → the **90-minute** score counts.
- Tie level at 90 and decided in extra time → the **after-ET (120-minute)** score counts, and the 90-minute line **no longer** does.

So for a tie that's 1–1 at 90 and finishes 2–1 in extra time, only **2–1** wins the bonus; 1–1 does not (it stopped being the result the moment the game went to ET).

**What changed** (frontend only, `index.html`):
- `koScoreHit(p,r)`: was `match(90) || match(120)`. Now it picks one target — if an after-ET score (`h2/a2`) is recorded, the prediction must equal **that**; otherwise it must equal the 90-min score (`h/a`). Still number-coerces both sides so string inputs match. All four call sites (`scoreFor`, `koMatchCard`, `brkTie`, `renderBracket`) inherit the fix unchanged.
- Player pick card: rule line now reads *"Predict the **final** scoreline — the **90-min** score, or the score **after extra time** if the tie is level at 90"*; worked example now reads *"…then 2–1 in extra time → you need **2–1** to win the bonus"*.
- Organizer editor: the "After ET (120)" hint now reads *"only if ET — replaces 90-min for the bonus"*.
- Rules/points panel + both FAQ answers ("How do points work?", "Knockouts — how does the score bonus work?") reworded from "matches at 90 **or** after extra time" to the final-score rule, with the example spelling out that 1–1 stops counting once the tie goes to ET.

**Data model:** unchanged. Knockout results still carry `h/a` (90 min), optional `h2/a2` (after ET), and `w` (winner). Only the interpretation changed: `h2/a2`, when present, now *supersedes* `h/a` for the bonus instead of being an additional way to win.

**Verified:** `koScoreHit` truth table re-checked — for `{h:1,a:1,h2:2,a2:1}` only pred 2–1 hits (1–1 and 0–0 miss); for a 90-only result `{h:2,a:0}` pred 2–0 hits; empty/partial preds miss; string scores coerce. `node --check` on the extracted script clean. Group scoring paths untouched.

**DB:** none.

**Rollback:** `git revert <this commit>` (frontend-only; no DB/state migration).

---

## 2026-06-28 — Feature: knockout exact-score bonus hits on 90 **or** 120 min

**Commits:** this commit (app `index.html` + this changelog).

**What:** the knockout exact-score bonus was judged on the **90-minute scoreline only**. It now hits if a player's predicted score matches the **90-minute score OR the after-extra-time (120-minute) score**. Players still enter a single predicted score; matching either recorded scoreline wins the round's bonus. This is fairer for ties that go to extra time: someone who nailed the 90-min result keeps the bonus even if the ET scoreline differs, and someone who predicted the ET result also earns it.

**What changed** (frontend only, `index.html`):
- New `koScoreHit(p,r)` helper: true when the prediction equals the result's `h/a` (90 min) **or** its `h2/a2` (120 min, present only when recorded). Number-coerces the player's score, so string inputs match.
- Routed all four knockout scoreline checks through it: `scoreFor` (leaderboard points + exact count), `koMatchCard` finished card, `brkTie` status line, and `renderBracket` KO tally. Group-match exact checks (`gScorePts`, consensus, reveal) are unchanged.
- Organizer editor (`renderResultsEditor`): added an **"After ET (120)"** score row per tie beside the existing "90-min score" row, writing `h2/a2`. `orgSetKScore` now persists both pairs and clears `h2/a2` when blank; the result record is dropped only when winner and both score pairs are empty.
- Labels: player score field now reads **"90 or 120-min score"**; rules/points panel notes the bonus hits on 90 or 120 min.

**Clarity follow-up (player-facing copy):** the on-card label "90 or 120-min score" read like a choice ("which one do I enter?"). Reworded so players understand they predict **one** scoreline that wins on either:
- Knockout pick card: header is now **"Exact score · +N bonus · optional"** with a plain sub-line — *"Predict one scoreline — it wins the bonus if it matches at **90 min** or **after extra time**"* (the two times highlighted in gold).
- Rules/points panel: knockout header now spells out *"+ optional exact score (matches at 90 min or after extra time)"*; the Round-of-32 row reads *"+4 exact score"* (the per-round detail lives in the header, matching the other rows).
- Terms paragraph already updated to *"the 90-minute or after-extra-time (120-minute) score"*.

**Clarity follow-up #2 (worked example + FAQ):** added a concrete example everywhere the rule is explained, since an example communicates "one guess, two chances" faster than a rule statement:
- Knockout pick card: added a small example line under the rule — *"e.g. 1–1 at 90 min, then 2–1 in extra time → guessing either 1–1 or 2–1 wins"*.
- FAQ (merged in from `main`): the "How do points work?" answer omitted the knockout score bonus entirely — added a sentence covering it. Added a dedicated entry **"Knockouts — how does the score bonus work?"** that walks the 1–1-then-2–1 example and notes the bonus is judged separately from the who-goes-through pick.

**Data model:** knockout results may now carry an optional second scoreline `h2/a2` (after extra time) alongside `h/a` (90 min) and `w` (winner), via the existing `orgSet`/`wc:results` path. Ties decided in 90 leave `h2/a2` empty and behave exactly as before. Predictions are unchanged (still a single `h/a`).

**Verified:** extracted `koScoreHit` truth table (node) — 90-only pred matches/misses; ET result matches on 90 (1–1) and on 120 (2–1) but not 0–0; partial/empty preds miss; string scores coerce. `node --check` on the full extracted script clean. Group scoring paths untouched.

**DB:** none. New `h2/a2` keys ride the existing results JSON.

**Rollback:** `git revert <this commit>` (frontend-only; no DB/state migration). Any `h2/a2` already saved is simply ignored after revert.

---

## 2026-06-28 11:22 (Doha) — Feature: knockout exact-score bonus (scaled by round)

**Commits:** this commit (app `index.html` + this changelog).

**What:** knockouts were winner-only. Added an **optional exact-score bonus** for nailing the **90-minute scoreline**, scaled by round, on top of the who-goes-through points:

| Round | Advance | + Score bonus |
|---|---|---|
| R32 | +4 | +4 |
| R16 | +5 | +5 |
| QF | +6 | +6 |
| SF | +8 | +7 |
| Final | +10 | +8 |
| Third place | +6 | +5 |

The bonus is judged on the **90-minute score** (extra time & penalties ignored) and is **awarded independent of the who-goes-through pick**, so a tie decided on penalties still scores the scoreline cleanly. It's optional — pick who advances as before, then optionally tap a score.

**What changed** (frontend only, `index.html`):
- `KO_BONUS` + `koBonus(m)` constants/helper.
- `scoreFor`: knockout branch adds `koBonus(f)` when predicted `h/a` equals the result's `h/a` (winner points unchanged; the two are independent). Group scoring untouched.
- `koMatchCard`: optional 90-min score input (reusing the group `.scorein`/`.bonus-fields` styling); finished cards show the predicted score and fold the bonus into the points line.
- `bindMatchEvents` + new `koSaveScore(id)`: saves the score to the prediction's `h/a` (winner pick `w` untouched); the group `.scorein` handler guards against the knockout inputs.
- Organizer entry (`renderKnockoutEditor`): a 90-min score row per tie; new `orgSetKScore(id)`; `orgSetKWinner` now **merges** (preserves any score; previously it replaced the result with `{w}`).
- Bracket view tally/status and the rules intro + points table updated.

**Score basis:** 90-minute scoreline (label only; switching to full-time incl. ET is a text change). Robot stays group-only; knockout scores are organizer-entered.

**Verified (VM-sandbox, real functions):** `scoreFor` R32 winner+score 8 / winner-only 4 / score-only 4 / both-wrong 0 / Final 18 / QF 12; group still +3/+2=5. KO card renders `data-ksh/ksa` + bonus label; `koSaveScore` writes `h/a`; `orgSetKWinner` preserves an existing score. `node --check` clean.

**DB:** none. Knockout results may now carry `h/a` alongside `w` via the existing `orgSet` path.

**Rollback (git):**

    git revert <this-commit-sha>
    git push -u origin claude/group-stage-prediction-6502w4

---

## 2026-06-28 11:09 (Doha) — Knockouts filter: one tap jumps to the current round (▾ still picks any other)

**Commits:** this commit (app `index.html` + this changelog).

**Why:** The **Knockouts** filter was a bare `<select>` — tapping it only opened a native picker, so reaching the live round (R32 right now) took two interactions and a scroll. Reported as "knockouts bubble should immediately go to the round."

**What changed** (frontend only, `index.html`):
- New `curKO()` — the current knockout round = the earliest of R32→Final still holding an unplayed match (falls back to the last KO round once everything's done). Auto-advances to R16/QF/SF/Final as each round completes; no deploy needed.
- `renderFilters` replaces the dropdown-only chip with a **button + caret picker**: the chip reads `Knockouts · R32` and a **single tap jumps straight to that round** (`setFilter`). A small **▾** on the right is a transparent native `<select>` overlay (`.kopick`) covering only the caret zone — tap it to pick any other round. When you're already on a KO round the chip shows that round (e.g. `Knockouts · QF`), highlights gold, and the picker switches you elsewhere.
- New CSS: `.kochip .komain` (caret padding), `.kochip .kopick` (invisible 32px overlay, `font-size:16px` to stop iOS focus-zoom), and the active-state caret colour. Reuses the existing `.rounddd`/`.ddcar` positioning. The old `.chip.ddsel` rules are now unused but left in place (harmless).

**Verified (VM-sandbox, real `curKO` + the rebuilt `renderFilters` KO block copied verbatim):**
- R32 in progress, filter not on a round → chip reads `Knockouts · R32`, button wired to `setFilter('R32')`, not highlighted.
- All 16 R32 finished → `curKO()` advances to **R16**; all rounds finished → **FINAL**.
- Viewing QF → chip reads `Knockouts · QF`, highlighted, tap re-applies QF; the ▾ picker lists all five rounds with live counts.
- `node --check` on the extracted inline script: clean.

**DB:** none. No kv writes, no SQL, `wc:results` untouched.

**Rollback (git):**

    git revert <this-commit-sha>
    git push -u origin claude/arab-teams-finished-matches-cjpji8

---

## 2026-06-28 10:51 (Doha) — Arab Teams filter: hide finished matches (live + upcoming only)

**Commits:** this commit (app `index.html` + this changelog).

**Why:** With the group stage over, the **Arab Teams** quick-filter was dominated by dead weight — every finished Arab group match (Morocco, Egypt, Saudi Arabia, Algeria, …) still rendered as a receipt card, burying the only thing that view is for: the Arab teams *still in it*. Reported as "remove all the finished matches for the Arab Teams bubbles."

**What changed** (frontend only, `index.html`): one predicate in `fixturesFor`. The `arab` branch now excludes finished matches:

    if(filter==="arab")return (ARAB.has(v.home.n)||ARAB.has(v.away.n))&&!isFinished(m);

Live and not-yet-kicked-off matches still show (a live match isn't `isFinished`). `isFinished` already covers both group (`!!result`) and knockout (`result.w && koReady`), so finished R32+ Arab ties drop too. No other filter is touched — finished Arab matches remain reachable via **✓ Completed** and **All 104**.

**Verified (VM-sandbox, real functions copied verbatim):** `fixturesFor("arab")` over a mixed set — finished Arab group games (Morocco, Saudi Arabia, Egypt), a finished non-Arab game, a finished Arab R32 tie (Australia–Egypt), an upcoming Arab R32 tie (Netherlands–Morocco), and an upcoming non-Arab tie — returns only the upcoming Arab tie. The `completed` filter still returns all five finished matches (unchanged). `node --check` on the extracted inline script: clean.

**DB:** none. No kv writes, no SQL, `wc:results` untouched.

**Rollback (git):**

    git revert <this-commit-sha>
    git push -u origin claude/arab-teams-finished-matches-cjpji8

---

## 2026-06-28 10:35 (Doha) — Fix: swipe-to-pick showed blank teams (and saved a placeholder) for knockout ties

**Commits:** this commit (app `index.html` + this changelog).

**Why:** the swipe deck rendered straight from the raw fixture (`m.home`/`m.away`), which for knockout ties are placeholder labels ("Runners-up A", "Best 3rd · …") with no flags. Once the Round of 32 opened, swipe cards showed blank/placeholder teams, and `swipeCommit` saved `pickWinner(id, m.home.n)` = a placeholder string that could never match a result. (The Matches feed was unaffected — it already resolves via `fxView`.)

**What changed** (frontend only, `index.html`): `renderSwipeCard` and `swipeCommit` now resolve teams through `fxView(m)` (→ `koTeams`, the seeded `kteams`) before display and before saving the pick. Group cards are unaffected (`fxView` returns the fixture unchanged). One added `const v=fxView(m)` in each, with `m.home/m.away` → `v.home/v.away`.

**Verified (VM-sandbox, real functions):**
- Swipe card for a seeded R32 tie renders the real teams ("South Africa v Canada"), no placeholder text; `swipeCommit('H')` saves the real team ("South Africa"), not a placeholder.
- Separately confirmed `propagate()` correctly fills R16 from R32 winners (k17 = W(k1) v W(k4), k18 = W(k3) v W(k6)) and preserves the feeder results — no change needed there.
- `node --check` clean.

**DB:** none.

**Rollback (git):**

    git revert <this-commit-sha>
    git push -u origin claude/group-stage-prediction-6502w4

---

**Commits:** this commit (app `index.html` + this changelog).

**Why (organizer-reported "wrong team matches"):** `GROUPS` lettered each group by **order of appearance in the fixtures** (kickoff order) via `String.fromCharCode(65+i)`. FIFA's official A–L draw labelling is **not** in kickoff order, so two groups were mislabelled:
- the group {USA, Australia, Paraguay, Türkiye} is official **D**, but the app called it **C**;
- {Brazil, Morocco, Scotland, Haiti} is official **C**, but the app called it **D**;
- {Spain, Cape Verde, Uruguay, Saudi Arabia} is official **H**, called **G**;
- {Belgium, Egypt, Iran, New Zealand} is official **G**, called **H**.
(A, B, E, F, I, J, K, L were already correct.) Confirmed against the official draw — e.g. FIFA placed the hosts Mexico=A, Canada=B, **USA=D**, but the app showed USA in C.

Because the knockout template (`Winners C`, `1D vs 3rd`, `2D v 2G`, `3rd[A/B/C/D/F]`, …) and the third-place allocation table both use **official** letters, applying them to the mislabelled groups fed the **wrong teams** into every tie touching C/D/G/H — both in the Groups tab and the auto-filled bracket.

**What changed** (frontend only, `index.html`): group letters are now derived from each group's **pot-1 seed** (Mexico→A, Canada→B, Brazil→C, USA→D, Germany→E, Netherlands→F, Belgium→G, Spain→H, France→I, Argentina→J, Colombia→K, England→L) instead of appearance order, and `GROUPS` is sorted A→L. One-line construction change in the `GROUPS` IIFE; nothing else touched. `computeGroupTable`, `standingsByLetter`, `autofillR32`, the Bracket view, and the Groups tab all consume the corrected letters automatically.

**Effect on the bracket (now matches the real 2026 R32):** with C/D/G/H corrected, the qualifying-thirds key becomes `BDEFIJKL` (Paraguay's group is now correctly D), and the full R32 resolves to the official matchups — e.g. k2 Brazil–Japan (was USA–Japan), k4 Netherlands–Morocco (was Netherlands–Australia), k9 Belgium–Senegal, k10 USA–Bosnia & H., k11 Spain–Austria (was Belgium–Austria), k14 Australia–Egypt, k15 Argentina–Cape Verde.

**Verified:**
- VM-sandbox: `standingsByLetter()` winners now A=Mexico, B=Switzerland, C=Brazil, D=USA, E=Germany, F=Netherlands, G=Belgium, H=Spain, I=France, J=Argentina, K=Colombia, L=England — matches the official draw fetched from the regulations/draw pages.
- `autofillR32()` against the live standings now yields all 16 R32 ties equal to the **real** 2026 bracket, including the eight third-place ties exactly as published (1A Mexico–3E Ecuador, 1D USA–3B Bosnia, 1E Germany–3D Paraguay, 1G Belgium–3I Senegal, 1I France–3F Sweden, 1B Switzerland–3J Algeria, 1K Colombia–3L Ghana, 1L England–3K DR Congo).
- `node --check` clean.

**Action required after deploy:** the live `wc:kteams` still holds the mislabelled seeding. The organizer must **re-run Auto-fill** once (Me → Organizer tools → Round of 32 → ✨ Auto-fill) to overwrite it with the corrected bracket. No knockout results recorded yet.

**DB:** none by this commit. Corrective `wc:kteams` write happens on the organizer's re-run.

**Rollback (git):**

    git revert <this-commit-sha>
    git push -u origin claude/group-stage-prediction-6502w4

---

**Commits:** this commit (app `index.html` + this changelog).

**Why (real bug, organizer-reported):** The first cut of `autofillR32` placed the eight best third-placed teams with a constrained bipartite *matching* — any assignment that respected each slot's candidate groups. But the official allocation is a fixed 495-row lookup (Annex C of the regulations) that picks **one specific** assignment among the several that are combinatorially valid. For this tournament's qualifying thirds (groups **B, C, E, F, I, J, K, L** — option #95) the heuristic matched a valid-but-wrong permutation: **6 of the 8** third-place ties had the wrong opponent (k8 and k16 happened to coincide with official). Winners, runners-up, the bracket template, and the whole advancement tree were already correct (re-verified below).

**Wrong → right (third-place side):**
- k3 Germany: Bosnia & H. → **Paraguay** (3C)
- k6 France: Paraguay → **Sweden** (3F)
- k7 Mexico: Sweden → **Ecuador** (3E)
- k9 Spain: Ecuador → **Senegal** (3I)
- k10 Brazil: Algeria → **Bosnia & H.** (3B)
- k13 Switzerland: Senegal → **Algeria** (3J)
- k8 England → DR Congo (3K) and k16 Colombia → Ghana (3L) were already right.

**What changed** (frontend only, `index.html`):
- Embedded the **official FIFA 2026 third-place allocation table** — all 495 combinations — as `R3RD` (key = the eight qualifying third-place groups sorted; value = the third drawn by each of slots 1A,1B,1D,1E,1G,1I,1K,1L in order). Parsed directly from the published regulations table (`Template:2026 FIFA World Cup third-place table`); validated that all 495 rows are permutations respecting the candidate sets, and that the table reproduces the page's stated real-tournament row.
- `autofillR32` now looks up `R3RD[qKey]` and maps each slot to its app tie (1A→k7, 1B→k13, 1D→k10, 1E→k3, 1G→k9, 1I→k6, 1K→k16, 1L→k8). The old `matchThirds` heuristic remains only as a defensive fallback (flags ties ⚠) if a key were ever missing — it never is for a valid 8-group set.
- Editor note updated: thirds now placed "per the official FIFA allocation" (no routine ⚠ verify step).

**Caveat:** which eight thirds *qualify* still ranks by Pts, GD, GF, then group letter; FIFA's true final tie-breaks (disciplinary, drawing of lots) aren't modelled, so a dead-heat at the 8th/9th boundary should be confirmed by the organizer.

**Verified:**
- Re-mapped every app knockout id to its official FIFA match number: R32 templates (k1=M73 … k16=M87) and the full `BRACKET` tree (R16/QF/SF/3rd/Final, k17=M90 … k32=M104) match the official structure exactly.
- VM-sandbox run of the real `autofillR32()` against the live standings → all 16 R32 ties now equal the official allocation (k3 Germany–Paraguay, k6 France–Sweden, k7 Mexico–Ecuador, k9 Spain–Senegal, k10 Brazil–Bosnia & H., k13 Switzerland–Algeria, plus the 10 already-correct ties).
- `node --check` clean.

**Action required after deploy:** the live `wc:kteams` still holds the earlier (wrong) seeding from 06:28 UTC. The organizer must **re-run Auto-fill** (Me → Organizer tools → Round of 32 → ✨ Auto-fill) to overwrite it with the corrected bracket — one click. No knockout results were recorded yet, so nothing else is affected.

**DB:** none by this commit. The corrective `wc:kteams` write happens when the organizer re-runs Auto-fill (existing `orgSet` path).

**Rollback (git):**

    git revert <this-commit-sha>
    git push -u origin claude/group-stage-prediction-6502w4

---

**Commits:** this commit (app `index.html` + `watch.html` + this changelog).

**Why:** The group stage is over, so the filter bar and bottom nav were carrying dead weight (a Qatar quick-filter, a Rounds dropdown still listing the finished group rounds, and a Groups standings tab). Shifted the UI to the knockout phase.

**What changed** (frontend only):
1. **Removed the Qatar filter chip** from the Matches filter bar (`renderFilters`). Arab Teams chip kept; Qatar's matches remain reachable via All/Completed. The `qatar` branch in `fixturesFor` is now unused but left in place (harmless).
2. **Rounds dropdown → knockouts only**, relabelled **"Knockouts"** — the *Group stage* optgroup (MD1/MD2/MD3) is dropped from the dropdown. Group matches still reachable via **All 104** and **Completed**.
3. **Bottom-nav "Groups" → "Bracket"** (both `index.html` and `watch.html`, plus the `#bracket` hash route and `showView` wiring). New **`renderBracket()`** view: a read-only knockout tree R32 → Final built from `koTeams()` (seeded `kteams`), `state.results` winners, and each player's `predictions`. Per tie it shows both teams (winner highlighted + ✓, loser struck through), the player's pick (gold bar + status: "you called it · +N", "you picked X", or "+N on the line" while undecided), and a per-round points header. A summary line tallies the player's knockout points. The **final group tables are preserved** behind a "Final group tables ▾" toggle (`toggleGroupTables` → existing `renderGroups`).

**New functions:** `brkTie`, `renderBracket`, `toggleGroupTables`; new `.brk-*` CSS block. `renderGroups` unchanged (now invoked from the Bracket view's collapsible).

**Verified:**
- `node --check` on the extracted inline script: clean. CSS variables used (`--gold`, `--gold-deep`, `--glass`, `--line`, `--faint`, `--muted`, `--cream`, `--ok`, `--bad`, `--font-d`) all defined.
- VM-sandbox render test of the real `renderBracket()`: empty/no-player state renders all 32 knockout ties (R32 16 · R16 8 · QF 4 · SF 2 · Final 2) with "Awaiting teams"; seeded state (R32 via `autofillR32`, one result, two picks) shows the summary, winner ✓, gold pick marker, "on the line" stake, correct `brk-tag`, and populated group tables.
- Filter bar: Qatar chip gone, dropdown placeholder reads "Knockouts", no "Group stage" optgroup.

**DB:** none. No kv/results/robot changes.

**Rollback (git):**

    git revert <this-commit-sha>
    git push -u origin claude/group-stage-prediction-6502w4

---

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
