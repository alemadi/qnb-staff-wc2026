# Handoff — THE LAB · Wave C: 14 new stats cards (2026-07-07)

Implementation brief for a fresh (Opus ultracode) session. The organizer approved all 14
cards from the mockup. **Copy, layout and card order are already decided** — the mockup is
the source of truth: `docs/lab-wave-c-preview.html` on this branch (also published as a
Claude artifact). Build them for real inside `index.html`'s Lab.

## Where things stand
- **Working branch:** `claude/interesting-stats-ideas-7kwsbk` (2 commits ahead of `main`:
  the mockup + this brief). Develop and push HERE.
- **Do NOT push to `main`.** The organizer deploys with an explicit "push to main" — same
  rule as every prior pass. Also: other sessions deploy to `main` frequently — `git fetch
  origin main` and rebase before any deploy conversation.
- **Tournament clock:** today is Jul 7 2026. Groups + R32 + R16 are settled (96/104),
  QFs kick off ~Jul 9. Wave C·1 must land before the QFs to matter.
- Power-ups are LIVE (`state.puLive`); the Lab (`LB_MODE==="nerds"`) already ships 27 cards.

## The 14 cards (mockup order — keep it)
**Wave C·1:** 🔮 futures board · ⏳ time machine · 🎢 your rank journey · 🧗 comeback king ·
🧬 title lifelines · 👯 prediction twin · ❤️ heart vs head · 🦢 golden goose & heartbreaker
**Wave C·2:** 🧊 clutch rating · 🪞 alternate universes · 🌪️ chaos meter · 🥚 fragility index ·
🎭 predictor personality · 🦄 unicorn scores
Ship as ONE pass (both waves) unless the session runs long — then C·1 first, C·2 second commit.

## Architecture — where everything lives

### Insertion point
All 14 cards go into `renderNerds(body)` (starts `index.html:5580`) as one clearly-delimited
block **immediately BEFORE the "Odds & ends" card** (`/* NERD CORNER */` at ~6365). Mark each
card `/* WAVE C — THE FUTURES BOARD */` etc., matching the house comment style. Two section
notes (`.dept-note`-style is NOT used mid-panel — instead give the first card of each wave a
leading `nrd-line`? No: skip section headers entirely; the Lab is one continuous panel).
The **sticky jump chips are automatic**: the IIFE at ~6377 builds one chip per `.aw-card`
from its `.aw-ic` emoji + `.aw-t b` title after `body.innerHTML=html` — new cards need
nothing, but keep every card's emoji unique (the 14 mockup emojis are).

### Data plumbing (all already exists — add NO backend)
- `sbulkJSON("wc:player:")` (`:2764`) → ALL player payloads
  `{slug,name,dept,country,champ,chips,joinedAt,predictions:{id:{o,h,a}|{w,h,a}}}`.
- `consensusFull()`/`consensusCompute()` (`:8299`/`:8306-8400`) already does two passes over
  all payloads and caches `CONS` for 1h keyed on `rk` (results count). **Extend it** with a
  Wave-C pass writing `CONS.wc = {...}` (aggregates + positive-leader names + `mine` only —
  same discipline as `CONS.tops`/`CONS.mine`). Everything cheap lives here.
- `CONS.map[id]` per match: group `{H,D,A,sc:{"h-a":n}}`, KO `{w:{team:n}}`. `CONS.champMap`
  = champion-ticket spread. `CONS.twin` ALREADY exists (`:8391-8396`, rendered at `:6371` and
  in the "Same brain" share card `:7576`) — the twin card upgrades it, see card 6.
- `fetchStandings()` (`:2810`) → slim rows `{slug,name,dept,pts,exact,correct,predicted}`,
  60s cache; sort with `cmpSt`.
- Heavy per-player rescoring (replay/futures/alt-universes/fragility) goes in a NEW
  module-level lazy cache, mirroring the CONS pattern:
  `let WCR={rk:-1,v:null}; function wcReplay(players){ if(WCR.rk===Object.keys(state.results).length) return WCR.v; ... }`
  computed inside the Wave-C pass of `consensusCompute` (players array is in scope there).

### Scoring engine (reuse, don't reinvent)
- `scoreFor(preds,results,champ,chips)` `:2984-3015` → `{pts,exact,correct,scored}`.
  Constants: group outcome **3** + exact **+2**; `KO_PTS={R32:4,R16:5,QF:6,SF:8,third:6,final:10}`
  (`:2306`, via `koPts(m)` `:2307`); `koBonus`/`koScoreHit` (`:2311/:2348`); `koStreakBonus`
  (`:2359`); `CHAMP_PTS=25` (`:2167`); `PU_UPSET=2` (`:2318`); `upsetWin(m,r)` (`:2336`, uses
  `PU_RANK`); armband doubles a KO match's pts when `chips[rnd]===id` (`:3000`).
- Replay trick: `scoreFor(p.predictions, resultsSubset, p.champ, p.chips)` with results
  filtered to `dayKey(f.ko) <= D` gives the standings "as of day D". Fixtures: `FIXTURES`
  (104: 72 group + 16 R32 + 8 R16 + 4 QF + 2 SF + third + final), `FIXBYID`, `BRACKET`
  (feeder map: `BRACKET[koId]=[feeder1,feeder2]`), `fxView(m)` resolves team names,
  `koReady`, `dayKey(iso)` (Doha), `deptKey`, `DEPT_MIN`, `ordinal`, `esc`, `nrdPct`, `nrdN`,
  `nrdVs`, the `tile()` helper (`:5600`).

### Seal rules (cardinal — every card must respect them)
1. Per-match numbers only ride matches past the k-anon floors: **5 calls group / 8 KO**
   (see `consText` `:8401`, and every existing card's `tot<5`/`tot<8` guards).
2. Another player's PICKS are usable only for matches in `ppEligible()` (`:4760`):
   `(m.kn?koReady(m):true) && (lockedM(m) || result in)`. Sealed (unlocked) picks must
   NEVER influence anything rendered. (`CONS.twin` predates this rule by riding raw
   predictions — the Wave-C twin recomputes on eligible matches only; leave the legacy
   field alone for the share card.)
3. Names render ONLY as positive leaders and "you". Personal lines wear `.aw-you`
   (auto-hidden in the ?tv kiosk via `.tv .aw-you{display:none}` `:1697`). The two
   fully-personal cards (🎢 journey, 🎭 persona top half) render only when `state.player`
   exists AND must hide on ?tv: add `.tv .nrd-personal{display:none}` and put
   `nrd-personal` on those whole cards.
4. Demo mode never reaches the Lab (`:3920` guard) — no demo branches needed.

### CSS
Append after the batch-5 block (ends `:1821`, before the `/* ===== PERF ===== */` comment)
one block headed `/* ===== WAVE C — the Lab grows 14 cards ===== */`. Port the mockup's
new classes verbatim (they're already written in the house grammar):
`.reign`,`.reign-ax`,`.spark`,`.alt-grid`,`.alt-slot(.official)`,`.persona`,`.h2h`, plus
`.tv .nrd-personal{display:none}`. Skip the mockup's `.src` data-footnote class — that was
preview scaffolding; production cards use the existing methodology `nrd-line` style instead.
Reuse `.nrd-meter/.nrd-duo/.nrd-tiles/.nrd-quad/.nrd-champ/.nrd-rounds/.aw-row` as-is.

### Code style (match the Lab exactly)
ES5 inside renderNerds/consensusCompute: `function(){}` not arrows, string concat not
template literals, `const/let` fine. Every card: `aw-card` → `aw-hd` (emoji, title, subtitle,
optional `.aw-prz` n-pill) → body → `nrd-line` verdict lines → optional `.aw-you`.
Copy: lift the mockup's card copy verbatim (titles, subtitles, verdict-line templates),
parameterized by real numbers. Each card degrades to the `.aw-pend` "check back" line when
below its floor — never renders a degenerate chart.

## Per-card spec

### C·1-1 🔮 The futures board — `aw-prz`: "N universes"
Remaining matches `R = FIXTURES` with no result, in ko order. Enumerate every winner
outcome (2^|R|; at QF time |R|=8 → 256; cap: if |R|>13 render `.aw-pend` "opens once the
field narrows" — protects a pre-launch render). Propagate winners through `BRACKET` so
SF/final pairings resolve per universe (seed from settled results + `kteams` overrides via
`koAutoTeams()`/existing `pairOf` pattern `:2610`).
- Universe weight = ∏ per-match office share from `CONS.map[id].w` for the two REAL teams
  of that universe's pairing, floored at 8 calls; below floor or unknown pairing → 0.5/0.5.
- Per-player universe score = current `scoreFor` pts + Σ over R of: `koPts(m)` if their
  **eligible** (ppEligible — locked) pick's `w` equals the universe winner, ×2 if their
  locked armband sits on it, + `CHAMP_PTS` if `p.champ` equals the universe's final winner.
  Sealed picks contribute 0 (they'll sharpen as rounds lock). Skip exact bonuses/upset/streak
  — winner-and-champion points only; say so in the method `nrd-line` (mockup has the line).
- Winner of a universe = max pts (ties → shared, count both). Output: title-probability %
  per player (render top 5 as `nrd-champ` bars + "The field · N"), tiles (matches left /
  universes / distinct possible winners), "deepest live ticket" line (worst current rank
  with ≥1 winning universe), method line, `.aw-you` ("You win in X of N futures" + the
  binding condition: find the match whose flip kills all your wins — optional, only if cheap).
- Compute cost ~140 players × 256 × 8 ≈ 0.3M ops — fine; lives in the WCR cache.

### C·1-2 ⏳ The time machine — `aw-prz`: "96 matches replayed"
Replay: for each Doha match-day D (sorted `dayKey`s of settled fixtures), standings =
`scoreFor` per player on results restricted to days ≤ D (one pass accumulates; reuse for
cards 3 & 4 — store `WCR.days[]`, `WCR.ranks[slug][]`, `WCR.leader[]`).
Tiles: lead changes (leader slug changes between consecutive days) / distinct leaders /
longest reign in days. `.reign` strip: one segment per reign, `flex:<days>`, current reign
`.cur`, label inside when ≥3 days (`<b>Name · Nd</b>`), others `.dim`; `reign-ax` from first
match-day to "TODAY". Verdict lines: longest reign + lead-changes (mockup copy). Leaders are
positive names — allowed. (`rankSnap`/`wc:ranksnap` `:8231` is only a 1-day snapshot — the
Climber keeps using it; the replay is what powers history. Ranks use `cmpSt` ordering.)

### C·1-3 🎢 Your rank journey — personal card (`nrd-personal`, joined players only)
SVG sparkline of `WCR.ranks[meSlug]` (rank 1 at top, axis 1..field size, ~11+ day points).
Inline SVG, gold polyline 2px, endpoint dot + "Nth now", peak dot + "Nth · peak", start
label. Mockup has the exact SVG grammar — generate points from data (y = 8+(r-1)*60/(field-1)
in a 0 0 300 86 viewBox). `reign-ax` row of round labels. Verdict: best single-day climb
(max rank delta between consecutive days). `.aw-you`: peak / low / days inside top 10.

### C·1-4 🧗 The comeback king — race card
Per player: `climb = lowestRankEver − currentRank` (from `WCR.ranks`), floor `climb≥10` and
`predicted>0`. Top 3 as `aw-row`s (avatar = same markup the award races use — copy the row
builder from renderAwards' race lists; avatar initials via the existing avatar helper used
there). Verdict line for #1, `.aw-you` with your climb. Positive-only by construction.

### C·1-5 🧬 Title lifelines — `aw-prz`: "top 10 audit"
Cross current top-10 (`fetchStandings` + `cmpSt`) with their `p.champ` (champion picks are
locked & already public in the champion-market card). For each still-alive team T (teams
reachable in ≥1 universe — reuse futures enumeration): `nrd-champ` row (flag via the house
flag mechanism the champion market uses — `FL`/`fl-img`, NOT emoji) + bar + "k of 10".
Verdict 1: the mockup's "one semi-final upset detonates…" template on the modal team.
Verdict 2: "if T lifts it" — among universes where T wins the final, the modal #1 player;
render for the top non-favourite team. Floors: champion market is already public; nothing
personal rendered beyond `.aw-you` ("your ticket rides with T / your ticket is dead").

### C·1-6 👯 The prediction twin — `aw-prz`: "N shared calls"
In the Wave-C pass, over **eligible** matches only (ppEligible set): for ME — agreement %
vs every other player with ≥15 shared calls → twin (max %) and nemesis (max disagreements,
with h2h: on disagreed settled matches, who scored). For the OFFICE — most-alike pair:
pairwise agreement % over players with ≥30 eligible calls (≈140²/2×100 ops, fine; do it in
the same loop, keep only the max pair). Render: meter you↔twin %, meter office-average pair
%, office most-alike pair line (positive, both named), `.h2h` block + nemesis line (`.aw-you`
wrapped — mine only; h2h vs a named colleague has precedent in the me-derby / Rivalry
Receipt). No card if not joined → render only the office pair line + pend note.

### C·1-7 ❤️ Heart vs head — `aw-prz`: "aggregate only"
Wave-C pass: for every player with `country` matching a team name in `FL` (payload field
`country`, set at join `:3144`): over settled matches involving that team where they made a
call — count backing rate (share picking their nation to win/advance) vs the office's
consensus share on the same matches; hit rate of own-nation calls vs office hit rate on the
same matches; net pts delta per call. Tiles: backing multiple (×), pts/call delta. `nrd-duo`
gold=patriot hit rate vs blue=office. Floor: ≥15 own-nation calls office-wide else
`.aw-pend`. Verdict lines from mockup ("patriot tax…"); the positive exception line (best
own-nation call that beat the office) only if an actual case exists (share ≤30% shock hit).
Aggregates only — no names, not even positive ones (nationality is sensitive-ish).

### C·1-8 🦢 Golden goose & heartbreaker — `aw-prz`: "32 teams audited"
From `CONS.map` + results, per team T:
minted += (correct backers of T) × pts that call paid (3 group / `koPts` KO);
torched += (wrong backers of T) × pts the call would have paid, + `CHAMP_PTS` × dead champion
tickets on T (`champMap[T]` where T eliminated — reuse the champion-market's dead logic).
Group draws back neither team (say so in a method line). Top 3 each way as `nrd-champ` bars
(gold minted / blue torched, `nrd-key` labels, flags via `FL`). Verdict: the champion-ticket
burn line (count from `champMap` of the biggest newly-dead team).

### C·2-9 🧊 Clutch rating — race card, `aw-prz`: "min 12 KO calls"
Wave-C pass: per player, hit rate on settled group calls vs settled KO calls (floors: ≥20
group, ≥12 KO). Score = KO% − group%. Top 3 positive as `aw-row`s ("61% groups → 78% KO"
subtitle, `+17 pts` value — percentage points). Office-wide KO drop line (from
`CONS.officeHit` split — compute both halves in the pass). `.aw-you` with your split
(negative allowed — it's you).

### C·2-10 🪞 Alternate universes — `aw-prz`: "4 rulesets"
Rescore everyone under: (a) official (already have), (b) outcome-only (3/`koPts` for
outcome/winner; no exact, no `koBonus`, no streak, no champ, no chips), (c) exact-only
(group exact +2 → count it 1-pt-per? NO — keep points: group exact +2 and KO `koBonus`
only), (d) no-champion-bonus (official minus `CHAMP_PTS` term). Implement as one
parameterized `wcScoreVariant(p,mode)` sharing scoreFor's loop shape — do NOT fork scoreFor
itself (Wave-B parity: `scoreFor` must stay byte-for-byte the SQL twin). `alt-grid` of four
`alt-slot`s (official gets `.official`), each a 🥇🥈🥉 mini-podium; movers get `.moved` +
`▲n/▼n` `<small>`. Verdict: "X leads in k of 4 universes" (mockup template).

### C·2-11 🌪️ The chaos meter — `aw-prz`: "shock units"
Per settled match past floors: surprise = −log2(office share of the actual result) (share
from `CONS.map`, same resolution as the hive-mind card `:5697-5705`). Bucket by round
(MD1/MD2/MD3 via `m.round`, then R32/R16/QF…), average per match. `nrd-rounds` bar chart
(`em` value labels, `.hot` on max), `nrd-rlab` labels. Verdict: max round vs group-average
multiple + method line (mockup copy). Pure CONS — no new data.

### C·2-12 🥚 The fragility index — `aw-prz`: "flip test"
For each settled one-goal-margin match (group: |h−a|=1; KO: flip `w`, keep score shape):
flip the result, rescore ONLY the current top-10 players (`scoreFor` with the mutated
results copy), re-rank the 10, count flips that change the podium set/order. Tiles: one-goal
games / podium-moving flips / min pts gap inside podium. Two verdict lines (mockup). Cost:
~14 flips × 10 players — trivial. (Top-10-only is an approximation; say "podium" not
"board" in copy, which the mockup already does.)

### C·2-13 🎭 Predictor personality — personal top (`nrd-personal`) + office census
Traits for any player from eligible-or-own picks: chalk appetite (% of calls agreeing with
office modal pick — vs `CONS.map`), draw courage (% group calls = D), goal optimism (mean
predicted total goals, normalized to 0-100 over 0..4), fade rate (100−chalk). Archetype
rules (first match wins): fade≥45 → 🐺 Lone Wolf; chalk≥70 → 🐑 Chalk Merchant;
draw≥20 → 🤝 Draw Truther; fade≥30 → 🦊 Calculated Maverick; else ⚖️ Balanced Head.
Top half (mine, `nrd-personal`): `.persona` hero + four `nrd-meter`s. Bottom half (census,
always renders): `nrd-quad` counts of archetypes across all players with ≥20 calls +
verdict line comparing archetype average points (aggregate — no names). Natural follow-up:
a "My predictor personality" share card — OUT OF SCOPE this pass, note it in the changelog.
Own data + aggregates → seal-safe.

### C·2-14 🦄 The unicorn scores — `aw-prz`: "exact-score market"
From `CONS.map[id].sc` (group matches only — same scope as the scoreline lab) summed across
settled matches: tickets per scoreline vs times that scoreline landed. Render the 3 most
telling as `nrd-duo` pairs: most-bought, biggest bought-vs-landed gap, and the pure unicorn
(most-bought never-landed). `nrd-key`: gold tickets / blue landed. Two verdict lines
(mockup: the unicorn + the best-paying humble scoreline = landed count × settled-share).

## Perf & ordering constraints
- ONE extra pass inside `consensusCompute` (players already in memory) + the WCR lazy cache
  for replay/futures/variants. Everything else derives from CONS. No new fetches, no new
  RPC, nothing on the hot boot path — the Lab computes on entry only (`renderNerds`).
- Keep the existing 27 cards byte-identical. The Wave-C block must be pure insertion
  (except the one-line CSS append and the what's-new bump below). `scoreFor` untouched.
- renderNerds is re-entered on refresh — all Wave-C helpers must be idempotent/cached.

## What's-new / banner bump (launch switch)
- `WHATSNEW_VER` `:8577` → `"2026-07-0X-wave-c-lab"` (revives the NEW dots; keys stay
  `lb`/`nerds` — see `:8582` chain).
- Spotlight item `:2105` + banner chip copy `:1859-1862`: refresh the Lab line to sell
  Wave C ("41 cards… the futures board, your rank journey, the chaos meter"). Keep the
  Trophy-Room/power-up lines intact.
- Card count copy: anywhere "27 cards" appears (`:1862` "27 cards of office truth") → 41.

## Test plan (extend, don't replace)
`tests/nerd-stats/run.mjs` (662 lines) boots the REAL page headlessly (Playwright at
`PLAYWRIGHT_DIR` default `/opt/node22/lib/node_modules/playwright`, `CHROMIUM_BIN` default
`/opt/pw-browsers/chromium`), stubs `*.supabase.co`, seeds a QF-week world (~48 players,
5 depts, deterministic varied picks, groups+R32+R16+QF1 settled), clicks the Lab, and
asserts each card against INDEPENDENTLY recomputed numbers. Extend it:
1. Seed additions: give a few players `country` matching seeded teams; ensure ≥1 one-goal
   settled game (SCORES already has {3,1}? one-goal = {1,0},{3,1}? — |h−a| 2,1,2,0 → yes,
   {1,0} and {3,1} qualify); champion picks already varied.
2. Recompute independently in the harness: futures-board winner set + universe count
   (enumerate the same 2^n in the test), lead-changes count + longest reign, comeback top-1,
   lifelines counts per team, twin pair + agreement %, patriot backing multiple, goose/
   heartbreaker top team + champion burn count, clutch top-1 delta, 4 podiums, chaos
   per-round ordering + max round, fragility flip count, archetype census counts, unicorn
   ticket/landed pairs. Assert each card's rendered numbers match (the harness greps
   `body.innerHTML` per card by title — follow its existing per-card assert pattern).
3. Gate checks: ?tv hides `.nrd-personal` + `.aw-you`; signed-out world renders no personal
   cards; below-floor world (strip players to <15) renders `.aw-pend` not NaN; jump chips
   count = card count; zero page errors (harness already tracks).
4. Run: `node tests/nerd-stats/run.mjs` — ALL GREEN required. Also `node --check` on the
   extracted inline script, and re-run `tests/wave-b/run.mjs` (scoring parity — must be
   untouched) + `tests/squad-board/run.mjs` + `tests/share-cards/run.mjs` as regressions.
5. Eyeball: screenshots at 390px (harness OUT_DIR) for every new card + the ?tv kiosk.
   Compare against `docs/lab-wave-c-preview.html` — the mockup is the visual contract.

## Launch checklist
1. Implement (CSS block → consensusCompute Wave-C pass + WCR cache → 14 cards → bump copy).
2. `node --check`; full harness + regressions ALL GREEN; screenshots eyeballed.
3. CHANGELOG entry at the TOP in the house format (see the 2026-07-06 SQUAD BOARD entry:
   date-Doha header, **Commits/What/Verified/Rollback** sections). State: frontend-only,
   zero new backend traffic, `scoreFor` untouched, seal rules per card.
4. Commit to `claude/interesting-stats-ideas-7kwsbk`, push (`git push -u origin …`).
5. STOP. Deployment to `main` is the organizer's call — offer it, don't do it. No SQL
   changes → no sql/rollback file needed; rollback = `git revert` (say so in the entry).
6. sw.js: stale-while-revalidate, no version constant — no SW bump needed; deploys reach
   devices on next-open (note for the organizer).

## Gotchas
- `CONS` cache key is `rk` + 1h TTL — Wave-C data rides the same invalidation; don't add
  a second consensus fetch. `bustStandings()` does NOT bust CONS; that's existing behavior.
- KO fixture ids match `/^k[0-9]+$/` (`:2999`); `puRound(kn)` maps k-index → qf/sf/fin.
- `FIXTURES` group matches have `home.n/away.n`; KO teams come ONLY via `fxView`/`kteams`/
  `koAutoTeams` — never read `m.home` on a KO fixture.
- Draw results in KO can't exist (`r.w` always set); group `o` ∈ H/D/A.
- The mockup's `.src` footers and section headers are preview-only — don't ship them.
- Don't rename the internal mode key `"nerds"` — deep links and seenKey depend on it.
- Watch `main` moving under you (other sessions deploy daily). Rebase before deploy talk.
