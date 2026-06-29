# Staff Challenge 26 — Changelog

Every push appends an entry here, in the same push. Times are Doha (UTC+3).
Rollback steps are exact and executable: git commands, plus inverse SQL for any live DB change.

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
