# Winner reel — prompt-writing context (for Codex / any prompt tool)

Context brief for writing **generation prompts** for the Staff Challenge 26
winner-announcement reel. Everything below is locked unless marked open. The
production runbook (concept history, post-production, fill-in tables) lives in
`docs/HANDOFF-winner-reel-higgsfield.md` on branch
`claude/finals-winner-announcement-zf3793`; this doc is only what a prompt
writer needs.

## The deliverable

Instagram Reel, **9:16 vertical, ~20 s**, announcing the tournament podium on
Final night (**19 July, ~21:00 Doha**). All clips are generated **before** the
winner is known; names/points/prize go on as **text overlays in post**. The
reel must therefore stay winner-agnostic: no champion face, no readable
identity, ever.

## Hard rules for every prompt (non-negotiable)

1. **TEXTLESS.** No words, letters, numbers, or logos in any generation —
   video models mangle text, and the reel must be reusable regardless of who
   wins. Every prompt ends with an explicit clause; the one that worked:
   `Completely textless: no words, no letters, no numbers, no logos anywhere.`
   Extend it for context (`blank monitor screen`, `blank locker doors`,
   `the card face is only a silhouette and glare`).
2. **Never name the brand.** Say
   `brick-built toy world, glossy ABS plastic, stop-motion film still` /
   `toy minifigure` — never the trademark. Some models silently degrade or
   refuse trademarked prompts.
3. **House palette in every prompt:** near-black / dark navy base, warm gold
   key light, one red + green + blue accent (the app's tricolor). The repeated
   phrase is what makes separate generations read as one film.
4. **Style phrases** (repeat verbatim in every prompt):
   `macro tilt-shift photography, stop-motion film still, glossy ABS plastic
   brick-built toy world` (stills) /
   `handheld stop-motion cadence, no cuts, no text anywhere` (motion).
5. **`9:16 vertical`** stated in every still prompt.

## Locked creative: “The Pull” (concept K+L)

One continuous location — a brick-built toy football **dressing room at
night**. Three lockers = the podium. Reveals are **trading cards** (bronze →
silver → gold holo pack-rip). Names go on the card faces in post. Outro: the
champion card's artwork is a brick **Maldives island** with the trophy in the
sand (the prize).

Approved still board (all Nano Banana Pro, 9:16, 1k):

| Scene | Beat | Job ID |
|---|---|---|
| 1 | Hook — three lockers, golden one leaking light | `ec769390-703b-4f39-a064-d75ab407f360` |
| 2 | Bronze locker open, bronze card to camera | `4a1fbd67-5819-4946-8bee-bfe830a654d7` |
| 3 | Silver locker bursts, silver card spins out | `2b55486d-8e3a-42cf-83cd-f1af84fadda3` |
| 4 | Golden locker blown open, hands rip gold foil pack | `5654cce3-2fe4-4e71-84b7-cd2218dbb4f5` |
| 5 | Champion card held up, island artwork | `76d06add-d8c2-472d-ae7f-8fd3fec48650` |

Rendered clips (Seedance 2.0, 1080×1920, 5 s, silent, seamless chain — each
clip starts on still N and ends on still N+1):

- 1→2 `d2dc4183-9e59-4549-9dd6-0d03c16ddfc9`
- 2→3 `2db35c50-520b-43f7-a73a-fff6adf4a4a1`
- 3→4 takes: `220884f6-8df9-40a8-9895-c7a37d04b32c`,
  `e5b677c8-2cc0-425d-96e7-ac77d274e5ab`,
  `5a4da1fb-7ce4-471a-9882-4340e32f9257`
- 4→5 `c3f4246e-e9d1-48c3-9ad5-18fddca5ce3a`

4 clips × 5 s = the 20 s reel. Retakes replace one link without touching the
others — that's the point of the still-anchored chain.

## Pipeline mechanics (what prompts are written FOR)

- **Stills:** `generate_image`, model `nano_banana_pro` (2 cr/still; the
  backend logs it as `nano_banana_2` — an aliasing quirk, ignore it). Chain
  consistency by passing the previous approved still as reference
  (`medias: [{role: "image", value: "<prior job_id>"}]`) and opening the
  prompt with `Same … as the reference image`.
- **Video:** `generate_video`, model `seedance_2_0`, `resolution: "1080p"`,
  `duration: 5`, `aspect_ratio: "9:16"`, `generate_audio: false` (45
  cr/clip). Seamless chain = `start_image` still N + `end_image` still N+1.
  Motion prompt must describe one continuous action that plausibly travels
  from the start frame to the end frame in 5 s.
- Multiple takes of one shot: same request with `count: 2-3`.
- The server sometimes interrupts with a **preset recommendation** ("IN THE
  DARK"). Decline and regenerate literally by adding
  `declined_preset_id: "<id from the notice>"` — presets override the
  storyboard's motion design.
- Occasional backend job failures happen; failed jobs are not charged —
  resubmit identical params once before changing anything.

## Prompt anatomy that worked

Still = 6 layers, in order:
1. Continuity opener: `Same <set> as the reference image, same <lighting>`
2. The one new beat, concrete and physical (what opened, what floats, what
   glows) — one beat per scene, never two
3. Persistent props for continuity (cards accumulate on the bench; the golden
   locker glows brighter every scene)
4. Mood + escalation word (`suspenseful`, `faster energy`, `triumphant`)
5. Palette + style phrases (see hard rules 3–4)
6. Textless clause + `9:16 vertical.`

Motion = 5 layers:
1. `Stop-motion toy-brick animation, one continuous shot:`
2. Camera verb first (`slow push-in`, `camera pops back then pushes in`)
3. The action arc start→end, matching the two keyframes
4. Physics garnish (`tiny brick confetti drifts`, `light pulsing through the
   seams`)
5. Cadence + rules: `handheld stop-motion cadence, no cuts, no text anywhere.`

## Known pitfalls (each cost us a retake or nearly did)

- Asking for readable anything (scoreboards, jumbotrons, signage) — the model
  will write gibberish text on it. Design the shot so surfaces are blank.
- Two beats in one scene prompt → the model merges them into mush.
- Hands are the highest-risk element (even brick hands). Keep hand actions
  simple: grab, rip, hold up. QA every hands frame.
- Seamless interpolation (`start_image`+`end_image`) smears when frames
  differ too much; keyframes must come from the chained-reference still set.
- Don't invent new style adjectives per scene — consistency of phrasing IS the
  set consistency.

## Open items a prompt writer might be asked for

- Retake prompts for any clip that fails human QA (esp. the 3→4 pack rip).
- An alternate outro (stadium fireworks) if the island card doesn't read.
- Cover-frame still (scene 4 burst) variants for the IG cover.
- On Final night: nothing — text overlays only, no regeneration.
