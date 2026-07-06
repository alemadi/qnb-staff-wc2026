# Handoff — Social share cards + entry-point redesign (2026-07-06)

Continuation brief for a fresh session. Full detail is in `docs/CHANGELOG.md` (top ~6 entries).

## Where things stand
- **Working branch:** `claude/social-artifacts-ideas-0ocr94` (3 commits ahead of `main`).
- **`main` (production, staffchallenge26.com):** has the **ten share cards + the share tray + the persistent banner/reveal handoff**, and (from a hotfix) the OLD floating header hub. Tip: `aa45220`.
- **Branch, NOT deployed:** the entry-point redesign + preview. Tip: `5dc032a`.
  - `206c433` row → `9d6f210` **thumb-zone deck FAB** (replaced the ugly header hub; organizer picked it) → `5dc032a` **preview-before-send**.
- **The organizer has NOT authorized deploying the branch to main.** Do not push to main without an explicit "push to main".

## What the feature is (all frontend, `index.html`)
- **Ten share cards** drawn on the house canvas kit (`cardScaffold`/`cardFrame`/…): Lock-In Slip, Match-Night Split, Rivalry Receipt, Title Belts, The Climb, Road to the Final, Chip Cashed (armband), Milestone clubs, Same Brain, The Podium. All seal-safe (settled/sealed/public data, k-floors, no shame cards).
- **Share tray** (`openShareTray`/`shareTiles`): lists every card the player has earned now + a "still to unlock" rack.
- **Deck FAB** (`.deck-fab` / `#share-fab`, `refreshShareFab`): fixed gold squircle, bottom-right above the nav, live count; opens the tray. Header stays clean (wordmark + userchip); bottom nav untouched. `.jumpnext` is lifted via `body.share-fab-on` so they never overlap.
- **Preview-before-send** (`presentCard` → `#cardprev`): every card renders into a preview overlay first (Not now / Save / Share); the actual Web-Share/download + confetti only fire on confirm. ALL five send paths route through it (`cardShip`, `shareCard`, `shareSquad`, `shareBrag`, `shareWrapped`) — `toBlob` now appears once.

## How to verify
- `node tests/share-cards/run.mjs` — headless Chromium over the real page with a mocked Supabase REST layer; ~50 checks (all ten cards build + preview, FAB count/clicks, tray, preview flow: nothing sends on tap / "Not now" cancels / "Share" fires on confirm, 6-width header-integrity sweep 340–1024px, zero page errors). Uses global Playwright at `/opt/node22/lib/node_modules/playwright`. Set `OUT_DIR` for screenshots.
- `node --check` the inline script: extract the one `<script>` block from `index.html` and check it.

## Pending — "a couple more issues" (organizer to specify next session)
The organizer said the FAB + preview are "better but there's a couple more issues" — details not yet given. Get the specifics first, then fix on this branch, re-run the harness, and re-verify at 390px AND the 440–699px band (the header-collision bug that bit us earlier lived there).

## Notes / gotchas
- The **439px** `body.in .mark .wc` hide breakpoint is intentional (restored after the hub was removed). The earlier header collision was from raising it to 699 for the hub — don't reintroduce a 3rd header element without re-checking 320–1024px.
- A **playable demo** (sample data, backend stubbed, fonts inlined, flags hidden) was built via a scratchpad script (`make-demo.mjs`) and published as a Claude artifact for the organizer to tap. Scratchpad is ephemeral — rebuild if needed (scrape FIXTURES/BRACKET/FL, seed the QF-week world from `tests/share-cards/run.mjs`, stub `window.fetch` for `*.supabase.co`, inline Anton/Hanken as data-URIs, `img.fl-img{visibility:hidden}`).
- Watch for `main` moving under you — other sessions have deployed repeatedly today (Trophy Room, power-ups LIVE, a perf pack with a **service worker**, an R16 chip fix). Always `git fetch origin main` and rebase before deploying; resolve changelog + What's-new conflicts by merging both.
