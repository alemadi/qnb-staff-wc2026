-- ============================================================
-- NIGHTLY SAFETY-NET BACKUP + PERMANENT FINAL ARCHIVE
-- Lives entirely inside Supabase. Paste this whole file into the
-- SQL Editor and press Run. Safe to re-run any time (idempotent:
-- CREATE ... IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / CREATE OR
-- REPLACE; no DROP, no data loss).
--
-- What it does, once a day at 08:05 UTC (11:05 Doha):
--   (1) snapshots every kv row (all 700 player picks + org keys) and
--       every wc_auth PIN-hash into wc_backup / wc_backup_auth,
--   (2) keeps a ROLLING 14 DAYS of those snapshots (older pruned),
--   (3) once the Final (knockout tie k32) has a recorded winner,
--       keeps exactly ONE permanent, retention-exempt archive of the
--       finished tournament — refreshed to the latest state each day
--       so late organizer corrections are captured, and NEVER pruned.
--
-- (3) is the guarantee that nothing gets wiped after the Final on
-- Jul 19: the live kv/wc_auth data was already never auto-deleted,
-- and now the finished-tournament snapshot survives forever even if
-- the live data is ever cleared or corrupted down the line.
--
-- Pause the nightly job anytime:
--   select cron.unschedule('wc-backup-daily');
-- ============================================================

-- Snapshot tables. `pinned` marks the permanent Final archive that
-- retention must never touch (default false = an ordinary rolling snap).
create table if not exists wc_backup(
  taken_at   timestamptz not null,
  key        text        not null,
  value      text        not null,
  updated_at timestamptz
);
create table if not exists wc_backup_auth(
  taken_at timestamptz not null,
  slug     text        not null,
  pin_hash text        not null
);
alter table wc_backup      add column if not exists pinned boolean not null default false;
alter table wc_backup_auth add column if not exists pinned boolean not null default false;

create index if not exists wc_backup_taken_idx      on wc_backup(taken_at);
create index if not exists wc_backup_auth_taken_idx on wc_backup_auth(taken_at);

-- ============================================================
-- the nightly tick
-- ============================================================
create or replace function public.wc_backup_tick()
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  t timestamptz := now();
  n_kv int; n_auth int;
  final_done boolean := false;
begin
  -- 1) daily snapshot of everything
  insert into wc_backup(taken_at, key, value, updated_at)
  select t, key, value, updated_at from kv;
  get diagnostics n_kv = row_count;

  insert into wc_backup_auth(taken_at, slug, pin_hash)
  select t, slug, pin_hash from wc_auth;
  get diagnostics n_auth = row_count;

  -- 2) once the Final (tie k32) has a recorded winner, keep exactly ONE
  --    permanent, retention-exempt archive of the finished tournament,
  --    refreshed to the latest state each day so late organizer
  --    corrections are captured. Wrapped so a bad parse of wc:results
  --    can never block the daily backup itself.
  begin
    select coalesce((value::jsonb -> 'k32' ->> 'w') is not null, false)
      into final_done
      from kv where key = 'wc:results';
    if coalesce(final_done, false) then
      delete from wc_backup      where pinned and taken_at < t;   -- drop the prior archive
      delete from wc_backup_auth where pinned and taken_at < t;
      update wc_backup      set pinned = true where taken_at = t; -- pin today's snapshot
      update wc_backup_auth set pinned = true where taken_at = t;
    end if;
  exception when others then
    final_done := false;   -- archiving must never block the backup/retention
  end;

  -- 3) retention: 14 rolling days — but the permanent archive is NEVER pruned
  delete from wc_backup      where taken_at < now() - interval '14 days' and not pinned;
  delete from wc_backup_auth where taken_at < now() - interval '14 days' and not pinned;

  return 'kv ' || n_kv || ' · auth ' || n_auth || ' @ ' || t
      || case when coalesce(final_done, false) then ' · FINAL archived (permanent)' else '' end;
end
$function$;

-- ============================================================
-- schedule: every day at 08:05 UTC
-- ============================================================
create extension if not exists pg_cron;
select cron.unschedule('wc-backup-daily') where exists (select 1 from cron.job where jobname='wc-backup-daily');
select cron.schedule('wc-backup-daily', '5 8 * * *', $$select public.wc_backup_tick()$$);
