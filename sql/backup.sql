-- ============================================================
-- STAFF CHALLENGE · BACKUP — daily in-database snapshots of kv
-- (every player's pick blob + results) and wc_auth (PIN hashes).
-- Paste this whole file into the Supabase SQL Editor and Run. Once.
-- Safe to re-run (idempotent). Run AFTER sql/protect.sql.
--
-- Why: the kv table IS the pool — 687 player pick blobs that exist
-- nowhere else. Results are reconstructible from ESPN; picks are not.
-- This snapshots everything daily inside Postgres, so a fat-fingered
-- organizer delete/overwrite or a bad SQL deploy is recoverable to
-- yesterday at worst (and to the minute via wc_org_log for organizer
-- writes). The off-site copy — surviving even loss of the Supabase
-- project — is the nightly GitHub Action (.github/workflows/backup.yml),
-- which dumps the world-readable kv via REST to the `backups` branch.
--
-- Snapshots run daily at 08:05 UTC (11:05 Doha — overnight matches
-- long settled, robot idle) via pg_cron job 'wc-backup-daily'.
-- Retention: 14 days.
--   Take one anytime:  select wc_backup_tick();
--   Pause anytime:     select cron.unschedule('wc-backup-daily');
--
-- Restore one player from the latest snapshot:
--   insert into kv(key, value, updated_at)
--   select key, value, now() from wc_backup
--    where taken_at = (select max(taken_at) from wc_backup)
--      and key = 'wc:player:SLUG'
--   on conflict (key) do update set value = excluded.value, updated_at = now();
-- Restore that player's PIN hash (only if it was deleted):
--   insert into wc_auth(slug, pin_hash)
--   select slug, pin_hash from wc_backup_auth
--    where taken_at = (select max(taken_at) from wc_backup_auth)
--      and slug = 'SLUG'
--   on conflict (slug) do nothing;
--
-- Rollback: see the matching docs/CHANGELOG.md entry.
-- ============================================================

create table if not exists wc_backup(
  taken_at   timestamptz not null,
  key        text        not null,
  value      text        not null,
  updated_at timestamptz,
  primary key (taken_at, key)
);

create table if not exists wc_backup_auth(
  taken_at timestamptz not null,
  slug     text        not null,
  pin_hash text        not null,
  primary key (taken_at, slug)
);

create or replace function public.wc_backup_tick() returns text
language plpgsql security definer set search_path = public as $f$
declare t timestamptz := now(); n_kv int; n_auth int;
begin
  insert into wc_backup(taken_at, key, value, updated_at)
  select t, key, value, updated_at from kv;
  get diagnostics n_kv = row_count;
  insert into wc_backup_auth(taken_at, slug, pin_hash)
  select t, slug, pin_hash from wc_auth;
  get diagnostics n_auth = row_count;
  delete from wc_backup      where taken_at < now() - interval '14 days';
  delete from wc_backup_auth where taken_at < now() - interval '14 days';
  return 'kv ' || n_kv || ' · auth ' || n_auth || ' @ ' || t;
end $f$;

-- The wall: snapshots hold pick blobs and PIN hashes — API roles see
-- nothing, call nothing. ('from public' alone is not enough on Supabase:
-- ALTER DEFAULT PRIVILEGES grants EXECUTE on new functions directly to
-- anon/authenticated — strip those too.)
alter table public.wc_backup      enable row level security;
alter table public.wc_backup_auth enable row level security;
revoke all on table public.wc_backup, public.wc_backup_auth from anon, authenticated;
revoke all on function public.wc_backup_tick() from public, anon, authenticated;

-- Schedule daily 08:05 UTC. Guarded so this file also loads cleanly in a
-- vanilla Postgres without pg_cron (the throwaway parity PG); on live,
-- pg_cron is already installed by sql/robot.sql.
do $do$
begin
  if to_regprocedure('cron.schedule(text,text,text)') is not null then
    if exists (select 1 from cron.job where jobname = 'wc-backup-daily') then
      perform cron.unschedule('wc-backup-daily');
    end if;
    perform cron.schedule('wc-backup-daily', '5 8 * * *', 'select public.wc_backup_tick()');
  end if;
end $do$;

-- First snapshot lands NOW (don't wait a day to be protected).
select public.wc_backup_tick();

-- Sanity checks after running:
--   select taken_at, count(*) from wc_backup group by 1 order by 1 desc;  -- ≈ kv row count per day
--   select taken_at, count(*) from wc_backup_auth group by 1 order by 1 desc;
--   select jobname, schedule, active from cron.job where jobname = 'wc-backup-daily';
