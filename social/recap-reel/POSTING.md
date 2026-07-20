# Staff Challenge 26 — Recap Reel · posting guide

**File:** `recap-reel.mp4` — 1080×1920, 33.5s, H.264/yuv420p, 30fps. Meets Instagram
Reels spec exactly (9:16, ≤90s, ≤4GB). Delivered **silent on purpose** — see audio below.

## The 6 beats
1. **0–3.4s** — Cold open: "THAT'S A WRAP." + 39 days / 104 matches / one champion
2. **3.4–9s** — Champions: Spain, over the trophy hero, ESP 1–0 ARG (a.e.t.), Ferran Torres
3. **9–15s** — Your pool in numbers: 731 players · 40,138 predictions · 308 goals · 3,182 exact scores
4. **15–21s** — The scorelines that broke the group chat: GER 7–1 CUR · AUS 1–1 EGY (pens) · ARG 3–2 CPV · FRA 4–6 ENG
5. **21–29s** — The final podium: 🥇 Rushdy Fowzer (388) → Maldives · 🥈 Dane (384) · 🥉 cemcmldr (368)
6. **29–33.5s** — Sign-off: staffchallenge26.com

Every stat and scoreline is pulled from the live results, not placeholder text.

## Audio — do this in the Instagram app (30 seconds, biggest reach lever)
Instagram's algorithm boosts Reels that use **trending audio** from its library, and adding
it in-app keeps it fully licensed. Baking a track into the file would forfeit that boost.

1. Upload `recap-reel.mp4` in the Reels composer.
2. Tap the **music note** → **Add audio** → search **Trending** (look for the ↗ arrow icon).
3. Pick an **uplifting / triumphant / cinematic build** track, 33s+. Set music volume ~60–70%.
4. Optional: nudge the track so a beat drop lands on the **winner reveal (~26s)**.

*Prefer a standalone file with sound?* Add any royalty-free track over it — tell me and I'll
mux one in (`AUDIO=track.mp3 node render.mjs` re-encodes with audio).

## Suggested caption
> That's a wrap on Staff Challenge 26. 🏆
> 731 of you. 40,138 predictions. One World Cup.
> 🇪🇸 Spain are champions — and only 70 of you called it.
> 🥇 Rushdy Fowzer is Maldives-bound. 🥈 Dane. 🥉 cemcmldr.
> Titles live on in the Trophy Room. See you in 2030. ✈️
>
> #StaffChallenge26 #WorldCup2026 #OfficePool #PredictionLeague #QNB #Maldives #Champions

## Rebuild / edit
```bash
cd social/recap-reel
node render.mjs                 # full recap-reel.mp4
node render.mjs --stills 6.9,27 # design-pass JPEGs into ./frames
```
Open `reel.html` in a browser to scrub it live; add `#safe` to the URL to see the
Instagram UI safe-zone overlay. Copy edits live in `reel.html` (search the scene sections);
the numbers come from `standings()` + the `wc:results` / player rows in Supabase.
