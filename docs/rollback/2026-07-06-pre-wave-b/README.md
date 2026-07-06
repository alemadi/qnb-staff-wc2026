# Rollback dossier — Wave-B SQL deploy of 2026-07-06

Pre-deploy state captured from LIVE immediately before pasting `sql/protect.sql` +
`sql/standings.sql` (Wave-B power-ups engine) via the Supabase connector.

## To roll the deploy back completely

1. Run `standings.sql`, `save_picks.sql`, `org_exec.sql` from this directory
   (each is the live `pg_get_functiondef()` captured pre-deploy; header comments
   give the md5s to re-verify).
2. Drop the objects the deploy introduced:
   ```sql
   drop function if exists public.wc_chip_valid(text,text);
   drop table if exists public.wc_rank;
   ```
3. `org_check`, `wc_pin_hash`, `server_time` were replaced with byte-identical
   bodies — nothing to restore.
4. All other statements in the deploy were verified no-ops against live pre-state:
   `wc_locks` upsert (live was already byte-identical: 105 rows,
   md5 `9900d98952ce94634190a7b17e39fdec`), `wc_auth` lift (0 candidate rows),
   kv pin-strip (0 rows), `wc_org_auth` seed (`do nothing`, live hash = file seed),
   RLS/grant walls (already in force; re-asserted idempotently).

## Pre-deploy reference values (2026-07-06 ~04:05Z)

- `standings()` output: md5 `172cdcb4535f7841a52d17f6a2f1ea82`, 687 rows
  (`slug:pts:exact:correct`, ordered by slug) — results through k20.
- `wc:results` value md5: `8fcd87840ee001221f669607b74d22bd`.
- Old function md5s — `md5(prosrc)` / `md5(pg_get_functiondef)`:
  - `standings`: `f241d4b1f9d55d47bd0d44572dcbe08c` / `d72059ac5300e39acd53d236348cc9d6`
  - `save_picks`: `ffa80185167f34b29285226b35947ad0` / `15d42403e56a80bb867d0d6ea5cc9825`
  - `org_exec`: `043f1e8eba8cf6732c0058a9ff3db921` / `4be63e1808d1b5a6f82ff333248e2177`
- `wc_auth`: 688 rows · `wc:powerups_live`: unset · players holding chips: 0.
- Robot `wc-autoconfirm`: active `*/10`, last run 04:00:00Z, succeeded.
