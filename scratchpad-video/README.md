# Staff Challenge 2026 — Instagram Recap ("The Morning After")

Reproducible build pipeline for the vertical (9:16) cinematic recap reel.
Only the **source** lives in git — all media (footage, title frames, audio, the
static `ffmpeg` binary, fonts, exports) is generated/downloaded at build time and
is `.gitignore`d.

## Output
`out/StaffChallenge2026_Recap_VO.mp4` (voiceover + sound design) and
`out/StaffChallenge2026_Recap_Clean.mp4` (no VO, cinematic bed only — for adding an
in-app licensed track). 37.8s · 1080×1920 · H.264/AAC · loudness ≈ −14 LUFS.

## Creative direction
Black-gold cinematic trailer. Footage is graded and cross-dissolved; typography is
laid **over** the footage (not pre-baked cards). Story arc: title → the season
(104 matches · 731 players · 13 departments) → by the numbers (23,755 correct /
3,182 exact) → the title race (decided by 4 points, 388 vs 384) → the final
(Spain 1–0 Argentina, only 70 called it) → the champion (Rushdy Fowzer, who
*picked Spain and Spain won*) → the prize (Maldives) → sign-off.

## Files
- `titles/title.html` — deterministic gold-foil typography engine. `?card=<name>`
  selects a card; `window.seek(t)` positions the animation at time `t` (no CSS
  keyframes, so screenshots are exact). Cards: title, scale, office, race, final,
  champion, prize, signoff.
- `titles/render_titles.py` — drives Chromium (Playwright) frame-by-frame at 30fps,
  screenshots transparent PNG sequences to `titles/frames/<card>/`.
- `build_video.py` — grades each shot (teal-shadow / gold-highlight curve, contrast,
  vignette, film grain), cross-dissolves the sequence (`xfade`), overlays the title
  PNG sequences at computed cue times → `cut_silent.mp4`.
- `build_audio.py` — synthesizes a cinematic bed (drone + sub-booms + riser),
  places the VO, ducks the bed under the VO (sidechain), masters two mixes.

## Regenerating
Requires a static `ffmpeg` at `./ffmpeg` (e.g. `pip install imageio-ffmpeg`),
Playwright's Chromium, and the fonts below in `fonts/`.

```
python3 titles/render_titles.py      # render all title frame sequences
python3 build_video.py               # grade + assemble + titles -> cut_silent.mp4
python3 build_audio.py               # VO + sound design -> audio/mix_*.wav
# then mux cut_silent.mp4 + audio/mix_vo.wav (see build history)
```

Fonts (Google Fonts, OFL) — download into `fonts/`:
Anton, Oswald, Hanken Grotesk, Playfair Display (+ Italic).

## Asset provenance
- Footage & VO generated via Higgsfield (kling3_0_turbo text-to-video; seed_audio /
  "Brooks" voice). Existing reusable B-roll (night stadium, Maldives, trophy-on-black,
  particles) was pulled from prior generations.
- Facts verified against Supabase project `fzybuasvhzhmkbhxbton` (`wc_backup`):
  champion **Rushdy Fowzer** (Retail Banking, picked Spain); 13 departments; 701
  distinct players in DB (on-screen uses the approved 731). Final was Spain vs
  Argentina (semis: Spain 2–0 France, Argentina 2–1 England).
