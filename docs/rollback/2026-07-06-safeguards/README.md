# Rollback dossier — safeguards deploy of 2026-07-06 (~07:50 Doha)

Pre-deploy state captured from LIVE immediately before applying the three
safeguards (organizer audit journal · in-DB daily backups · legacy kv
write-policy cleanup) via the Supabase connector on the organizer's
explicit go ("Go ahead with these").

## To roll the deploy back completely

1. **org_exec** — run `org_exec.sql` from this directory (the pre-change
   source; header gives the md5s to re-verify: prosrc `65fb143c…`,
   functiondef `2d102e90…`).
2. **Audit journal** — drop the table the deploy introduced:
   ```sql
   drop table if exists public.wc_org_log;
   ```
   (Do this AFTER step 1 — the new org_exec writes into it.)
3. **Backups** — unschedule and drop:
   ```sql
   select cron.unschedule('wc-backup-daily');
   drop function if exists public.wc_backup_tick();
   drop table if exists public.wc_backup;
   drop table if exists public.wc_backup_auth;
   ```
4. **kv policies** — recreate the three dropped legacy policies with their
   exact pre-drop shapes (captured from `pg_policy` pre-change: all
   PERMISSIVE, to PUBLIC; `u` had USING only, no explicit WITH CHECK):
   ```sql
   create policy i on public.kv as permissive for insert to public with check (true);
   create policy u on public.kv as permissive for update to public using (true);
   create policy d on public.kv as permissive for delete to public using (true);
   ```
   NOTE: recreating these restores dead weight, not access — writes stay
   blocked by the revoked grants either way. Only do this for a true
   byte-exact restore.

## Pre-deploy reference values (2026-07-06 ~04:49Z)

- `standings()` output: md5 `fd07d388148b9c2f395c03c1899cc545`, **688** rows
  (`slug:pts:exact:correct`, ordered by slug) — results through k20; the pool
  grew 687 → 688 players overnight (new joiner via save_picks).
- `org_exec`: md5(prosrc) `65fb143cb8ea004a3ed6b91b8beb05aa` /
  md5(functiondef) `2d102e90e4e9273cc964baabe081cff6` — matched the Wave-B
  step-① deploy values (zero drift since).
- kv policies pre-change: `d`, `i`, `kv_read_all`, `r`, `u`
  (post-change: `kv_read_all`, `r`).
- kv table: RLS enabled, **force-RLS off**, owner `postgres` — proven
  pre-change so definer functions + robot bypass policies; the drops
  cannot affect them.
- No `wc_org_log` / `wc_backup` / `wc_backup_auth` tables, no
  `wc_backup_tick()` function, no `wc-backup-daily` cron job existed.
- Robot `wc-autoconfirm`: active `*/10`, succeeded at 04:40:00Z and
  04:50:00Z — straight through the deploy window.

## Post-deploy verified values (for drift checks later)

- `standings()`: md5 `fd07d388148b9c2f395c03c1899cc545`, 688 rows —
  **identical** to pre-deploy (the change touches no scoring path).
- New `org_exec` md5(prosrc): `87131d3e22ebee0403fd91ccea4ff055`
  (=== throwaway PG loaded from `sql/protect.sql` on this branch).
- `wc_backup_tick()` md5(prosrc): `4a445ff5cea6dd5ece3967667d1e8b80`.
- First snapshot: kv **691** rows · auth **689** hashes @ 04:51:24Z.
- REST as the real anon key: kv read 200 · kv INSERT 401 ·
  `wc_org_log`/`wc_backup`/`wc_backup_auth` reads 401 · `wc_backup_tick`
  401 · `org_check` wrong code → false · `org_exec` wrong code →
  `bad_code` · `save_picks` junk → `bad_slug` · `standings` 200/688.
