# Wave-B launch-day proof

The cross-half parity proof the CHANGELOG referenced. Reconstructed 2026-07-06 (the original
`scratchpad/wave-b-vectors.json` was throwaway and never committed). Run this **before** deploying
the revised `sql/standings.sql` + `sql/protect.sql` and flipping `wc:powerups_live`.

## What it proves

`tests/wave-b/vectors.mjs` — 24 vectors covering the powered math:
- ⚡ **Captain's Armband**: doubles advance+exact only; never creates points on a miss; the +36 Final swing.
- 🦅 **Upset bonus**: flat +2 for a correct lower-ranked winner; direction-correct; **never doubled** by the armband; k31 third-place included.
- 🛡 **Streak Shield**: forgives the first kn≥25 break after an exact, **once**; no retro-rescue.
- **Exact-score streak** 2→+5, 3→+15, 4+→+20 each, and reset.
- **Champion** +25, never doubled; group outcome+exact regression; the "today's math" base path.

`tests/wave-b/run.mjs` scores every vector through **both**:
1. the real SQL `standings()` on a throwaway Postgres, and
2. the real JS `scoreFor()` extracted from `index.html` (run with `puLive=true`, `chips ?? null` — mirroring live `puChips()` post-launch, so the automatic upset/shield fire for everyone),

and asserts **expected === SQL === JS**, plus **`wc_rank` === `PU_RANK`** (the two rank tables must be byte-identical).

## Run it

```bash
sudo tests/wave-b/bootstrap.sh     # throwaway PG16 + loads sql/ (live Supabase untouched)
node tests/wave-b/run.mjs          # expect: SCORING 24/24 · RANK TABLE ===
```

## Zero-drift check (live-data, run at deploy time)

Separately, before applying the revised SQL live: snapshot `select * from standings()`, load the
current `wc:results` + all player blobs into the throwaway PG, run the **revised** `standings()`,
and diff — it must reproduce every current score exactly (no chips + no k≥25 results ⇒ the Wave-B
terms contribute 0). Verified 2026-07-06: **687/687 players identical**.
