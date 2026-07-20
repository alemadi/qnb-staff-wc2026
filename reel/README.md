# Staff Challenge — World Cup 2026 · Recap Reel

A vertical (9:16) cinematic recap reel for Instagram, celebrating the end of the
QNB Staff World Cup 2026 prediction pool.

**Output:** `final_reel.mp4` — 1080×1920, 30 fps, H.264 + AAC, ~33 s, sound on.
**Covers:** `cover_title.png`, `cover_champion.png` (Instagram thumbnail options).

## The story (all real data)
- **Tournament:** Spain are World Champions — Spain 1–0 Argentina (a.e.t.), Ferran Torres in extra time (19 Jul 2026).
- **Pool champion:** Dane (`@dineshsiva6`, Group IT) — backed Spain from day one and topped the field.
- **Podium:** 🥇 @dineshsiva6 · 🥈 @cemcamldr · 🥉 @dave.mccloud.988
- **Scale:** 732 players · 104 matches · 39 days (11 Jun → 19 Jul) · every department.
- **Prize:** the Maldives (1st) · QNB Life Rewards (2nd/3rd).

Facts were sourced from the live pool backend (Supabase `kv` keys `wc:ranksnap`,
`wc:results`, `wc:highlight`, and per-player `wc:player:*` records). No invented numbers.

## Brand fidelity
Rendered in the app's own design system so it reads as "paid for," not generic:
- Fonts: **Anton** (display) + **Hanken Grotesk** (body) — bundled in `fonts/`.
- Palette: ink `#050507`, gold gradient `#e3d3a3 → #8a734a`, cream `#f4eee3`,
  tri-color stripe `#ef3340 / #2ea84f / #2d6fe0`.
- Motifs: split-flap board (MALDIVES / DANE), gold-gradient numerals, broadcast HUD.

## How it was made (hybrid pipeline)
1. **Motion-graphics spine** — `spine.html`: a 1080×1920 page with a deterministic
   `render(t)` clock (every frame is a pure function of time). Real data, split-flap
   reveals, counting stats, podium, champion, Maldives payoff.
2. **Frame capture** — `shoot.mjs`: Playwright drives `render(t)` at 30 fps and
   screenshots transparent PNG frames.
3. **Cinematic B-roll** — 4 clips generated with Higgsfield (Kling 3.0 Turbo, 9:16):
   golden trophy, stadium confetti, Maldives lagoon, gold particles. Placed in three
   "windows" (cold open / tournament / prize) and brand-graded.
4. **Grade + base track** — `build_broll.sh`: scales/crops to fill, deepens blacks,
   warm-gold push, vignette + grain, trophy→stadium crossfade; black elsewhere.
5. **Composite** — the transparent spine is overlaid on the graded base track, so
   footage shows through only inside the windows; motion-graphics scenes stay opaque.
6. **Sound design** — `gen_audio.mjs`: sparse cinematic bed (impacts on reveals,
   ascending "counter" dings on the stats, risers into big beats, confetti sparkle,
   low drone), synthesized and mixed with ffmpeg. Designed to sit *under* a trending
   IG track if you add one in-app.

## Rebuild
Needs Node, Playwright (+ Chromium) and a full ffmpeg (the pipeline used a static
build; Playwright's bundled ffmpeg is too stripped). Paths in the `.mjs`/`.sh` files
are session-absolute — adjust the working-directory constants, then:
```
node shoot.mjs full      # capture spine frames
bash build_broll.sh      # graded B-roll base track
# overlay spine on base, then:
node gen_audio.mjs        # sound bed
# mux video + audio -> final_reel.mp4
```
Open `spine.html` directly in a browser to preview the motion-graphics live.

See `caption.md` for ready-to-post Instagram copy.
