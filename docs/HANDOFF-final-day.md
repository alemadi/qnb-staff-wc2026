# Final Day runbook — closing out the Staff Challenge

**Baseline captured:** Wed 15 Jul 2026 (evening, Doha), right after the semi-finals settled.
This is the operator's checklist for the last two matches and the wrap-up. The tournament
is essentially run; the finish is hands-on for one weekend and **one action decides the
whole thing** — see TL;DR.

---

## TL;DR — the two writes that end the tournament

After the final whistle on Sunday, in the **Organizer panel** you must do **both**:

1. **Record the k32 result** — winner + exact score (Spain–Argentina).
2. **Set the Champion** — the `Champion` dropdown → whoever actually lifted the cup.

Setting the Champion is the important one: it pays the **+25 champion bonus** *and* flips the
whole app into full-time mode (podium hero, "🏆 Champions" header, auto-open Wrapped, share
podium). The app only goes full-time when **both** the k32 result **and** the champion are set
— `ftOver()` checks for both. Miss the champion and nothing flips.

> ⚠️ Get the final score right the first time. Result propagation to open tabs is
> **additive-only** — a later correction to an already-seen result won't cleanly overwrite
> other players' local copies without a reload/reset.

---

## The two remaining matches

| Match | Fixture | Kickoff (Doha) | Kickoff (UTC) | Notes |
|-------|---------|----------------|----------------|-------|
| Third-place play-off | **k31 · France vs England** | Sun 19 Jul, **12:00 AM** (Sat night) | 2026‑07‑18 21:00Z | Scored match — losers of the two semis |
| **THE FINAL** | **k32 · Spain vs Argentina** | Sun 19 Jul, **10:00 PM** | 2026‑07‑19 19:00Z | Winner = pool champion trigger |

- Picks **lock at kickoff, match by match** (server-clock enforced, anti-cheat — nothing to
  configure). `LOCK_HRS = 0`.
- Champion picks locked long ago (Thu 18 Jun, 7 PM Doha) — that window is closed and frozen.

---

## Standings going into the final (baseline — 15 Jul)

687 players. Top of the board, with champion-pick status. Only **Spain** and **Argentina**
champion picks can still score; everyone else's champion pick is dead.

| # | Player | Dept | Pts | Champion pick | +25 still live? |
|---|--------|------|-----|---------------|-----------------|
| 1 | Dane | Group IT | **359** | Spain | ✅ LIVE |
| 2 | cemcmldr | Group Compliance | 346 | France | ✖ dead |
| 3 | AI | Group Communications | 340 | Portugal | ✖ dead |
| 4 | Ja | Retail Banking | 336 | France | ✖ dead |
| 5 | Abdulaziz Al kuwari | Retail Banking | 329 | Argentina | ✅ LIVE |
| 6 | Rushdy Fowzer | Retail Banking | 325 | Spain | ✅ LIVE |
| 7 | Rupesh Makwana | Corp & Inst. Banking | 325 | Portugal | ✖ dead |
| 8 | Haya Al-Madadi | Group Communications | 323 | France | ✖ dead |
| 9 | Ahmed Khaled | Group Operations | 321 | Spain | ✅ LIVE |
| 10 | majed | Other | 319 | Spain | ✅ LIVE |
| 11 | ShaneOConnor | Group Risk | 318 | Spain | ✅ LIVE |
| 12 | M Gado | Group Compliance | 317 | England | ✖ dead |
| 13 | Andre bayeh | Other | 317 | Argentina | ✅ LIVE |
| 14 | DanN | Other | 315 | France | ✖ dead |
| 15 | Sagar NASEER | Group IT | 314 | France | ✖ dead |

Tiebreak note: #6/#7 both on 325 — Rushdy ranks above Rupesh on exact-score count (19 vs 18),
which is the app's tiebreak.

**Champion-pick distribution (whole pool):** none 235 · France 156 · **Spain 70** ·
**Argentina 53** · Portugal 51 · Brazil 34 · England 30 · Qatar 18 · Germany 12 · Morocco 10 ·
Netherlands 10 · rest ≤6. → **123 players still have a live champion pick**; the 156 France
backers (the plurality) are out — France now plays only the third-place game.

---

## The Maldives race — it hinges on who wins the final

Prizes at the final whistle: **🥇 Maldives trip · 🥈 60,000 pts · 🥉 40,000 pts**, awarded to the
**top three on the leaderboard**. The winner is simply **leaderboard #1** (👑 on the podium);
there's no automated payout — you announce and award it.

The champion bonus (+25, flat — it is **not** doubled by a chip) reshuffles the top depending
on the result. Numbers below are **current points + champion bonus only** — they do **not** yet
include k31 (third place) or the k32 match points themselves (nobody has predicted the final
yet), which land on top for anyone who picked those matches, and **double** for anyone who put
their Final chip on k32.

**If 🇪🇸 Spain win** (Spain-champ backers +25):

- Dane **359 → 384**, Rushdy 325 → 350, Ahmed 321 → 346, majed 319 → 344, Shane 318 → 343…
- Argentina backers get nothing from the champion. **Dane pulls clear and is very hard to
  catch** — the chasers would need a big k32 scoreline swing to close ~35+ pts.

**If 🇦🇷 Argentina win** (Argentina-champ backers +25; Dane's Spain pick dies):

- Abdulaziz **329 → 354**, Andre bayeh 317 → 342… while **Dane stays 359** (+ his k32 match
  points, no champion bonus).
- **Now it's a real fight:** Dane 359 vs Abdulaziz 354 (+ still-to-come final-match points and
  chips). This is the scenario where the Maldives is genuinely up for grabs on the night.

Because the winner depends on the result, **have both endings pre-computed before you announce**
(see "Sunday" below).

---

## Timeline checklist

### Now → Sunday kickoff — drive the predictions
This is the marquee match and **almost nobody has predicted it yet** (teams were only set
tonight — even the leader hasn't entered a k32 scoreline). Get all 687 to:
- [ ] Enter their **Spain–Argentina** final scoreline (k32)
- [ ] Place their **Final chip** (doubler) on k32 if they haven't — power-ups are live
- [ ] Pick the **third-place** game (k31, France–England)

Send the rally message (draft at the bottom of this doc) however you normally reach staff.

### Saturday (00:00 Doha) — third-place result
- [ ] After **France–England** finishes, record **k31** (winner + score) in the Organizer panel.

### Sunday (10:00 PM Doha) — the final
- [ ] Picks lock automatically at kickoff. Nothing to do but watch.
- [ ] **After full time — do the two writes (see TL;DR):** record **k32** result, then set the
      **Champion**. Double-check the score before saving (additive-only propagation).
- [ ] Confirm the app flipped: header shows "🏆 … World Champions", podium hero appears, Wrapped
      auto-opens, +25 banner shows in Matches for champion-callers.

### Sunday — crown the winner
- [ ] Read leaderboard **#1** = Maldives winner; #2/#3 = 60k / 40k. Announce and award.
- [ ] Take a **post-final standings snapshot** for the record (see below).
- [ ] Thank staff — the **Wrapped** recap and **share podium** card are built for exactly this
      moment; encourage people to share theirs.

---

## Scoring cheat-sheet (how the final scores)

- **Correct winner** and **exact score** award points per the knockout rules (later rounds are
  worth more; knockout bonuses apply at kn ≥ 25, which includes the final).
- **Final chip on k32** → that match's points are **doubled**.
- **Champion +25** → flat, **never doubled**, paid the instant you set the Champion.
- Third place (k31) is a normal scored knockout match.

---

## Gotchas / safety

- **Both writes or nothing flips.** `ftOver()` needs `wc:results.k32.w` **and**
  `wc:results._champ`. Setting only the score leaves the app in "tournament underway".
- **Corrections are sticky.** Enter the final score correctly first time; additive-only
  propagation means fixing a wrong value later won't cleanly reach tabs that already saw it.
- **Preview safely on live data first.** Append `?wrapped` to the URL to see the entire
  full-time / podium / Wrapped experience before it's real; `?champlock` and `?powerups` preview
  those states. (House pattern — read-only, affects only your own view.)
- **Power-ups are live** (`wc:powerups_live = true`) — remind players they can still place their
  Final chip until k32 locks.

---

## Automation status (as of 15 Jul)

- **Highlights banner robot** — armed, runs hourly (:07), mints a card after each knockout match
  and **disables itself after the k32 (final) card**. It writes only the banner (`wc:highlight`),
  never results or the champion — no risk of it settling anything. After the final, confirm it
  minted the Final card and then went inactive.
- **DB crons** — `wc-autoconfirm` (every 10 min) and `wc-backup-daily` (08:05Z) are the only
  scheduled jobs. **There is no automated results ingest** — k31, k32, and the champion are all
  entered by hand in the Organizer panel.
- **Backups** exist (daily snapshot to `wc_backup` / `wc_backup_auth`). Consider a manual
  snapshot right after you settle the final, so the final state is frozen for the record.

---

## Post-final decision sheet (fill in Sunday)

Once picks lock at 10:00 PM Sunday, the final scorelines exist and the winner can be computed
exactly. Fill this in the moment k32 settles, before announcing:

```
Final result (k32):        Spain __  –  __ Argentina        Champion: __________
Third place (k31):         France __  –  __ England

Leaderboard #1 (Maldives): ______________________  (pts: ____)
Leaderboard #2 (60k):      ______________________  (pts: ____)
Leaderboard #3 (40k):      ______________________  (pts: ____)

Sanity check: did the champion bonus (+25) and any Final-chip doubling land as expected
for the top 3? Compare against the two scenarios above.
```

---

## Staff rally message (draft — send before Sunday)

> 🏆 **It's the FINAL — and your last picks are open.**
>
> 🇪🇸 **Spain vs Argentina 🇦🇷 — Sunday, 10:00 PM.** This is the one. Three things to do before
> kickoff:
>
> 1️⃣ **Predict the final** — call the Spain–Argentina scoreline.
> 2️⃣ **Play your Final chip** 🎯 — double your points on the biggest match of the tournament.
> 3️⃣ **Don't skip the third-place game** (France vs England, Saturday night) — it still scores.
>
> The **Maldives trip 🏝️** is decided at the final whistle. The board is tight at the top and the
> champion bonus is still in play for everyone who backed Spain or Argentina to win it all —
> this is your moment to climb.
>
> ⏰ Picks lock at kickoff. Get them in. → staffchallenge26.com
