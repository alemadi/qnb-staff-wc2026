-- ============================================================
-- STAFF CHALLENGE · PROTECT (Phase 1) — server-side anti-cheat
-- Paste this whole file into the Supabase SQL Editor and Run. Once.
-- Safe to re-run (idempotent). Run AFTER sql/robot.sql.
--
-- What it does, in one breath: the browser loses ALL direct write
-- access to the kv table. Players write only through save_picks()
-- (PIN verified in Postgres, kicked-off matches sealed in Postgres);
-- the organizer panel writes only through org_exec() (access code
-- verified in Postgres). PIN hashes move out of the public player
-- rows into a private wc_auth table. The robot is unaffected — it
-- runs as the table owner.
--
-- Rollback: see the matching docs/CHANGELOG.md entry.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1) wc_locks — when every pick seals (kickoff), incl. champion
--    Generated from the FIXTURES array in index.html. Knockout
--    rows use the official schedule; teams don't matter here.
-- ------------------------------------------------------------
create table if not exists wc_locks(id text primary key, ko timestamptz not null);
insert into wc_locks(id,ko) values
('m1','2026-06-11T19:00:00Z'),
('m2','2026-06-12T02:00:00Z'),
('m3','2026-06-12T19:00:00Z'),
('m4','2026-06-13T01:00:00Z'),
('m5','2026-06-13T19:00:00Z'),
('m6','2026-06-13T22:00:00Z'),
('m7','2026-06-14T01:00:00Z'),
('m8','2026-06-14T04:00:00Z'),
('m9','2026-06-14T17:00:00Z'),
('m10','2026-06-14T20:00:00Z'),
('m11','2026-06-14T23:00:00Z'),
('m12','2026-06-15T02:00:00Z'),
('m13','2026-06-15T16:00:00Z'),
('m14','2026-06-15T19:00:00Z'),
('m15','2026-06-15T22:00:00Z'),
('m16','2026-06-16T01:00:00Z'),
('m17','2026-06-16T19:00:00Z'),
('m18','2026-06-16T22:00:00Z'),
('m19','2026-06-17T01:00:00Z'),
('m20','2026-06-17T04:00:00Z'),
('m21','2026-06-17T17:00:00Z'),
('m22','2026-06-17T20:00:00Z'),
('m23','2026-06-17T23:00:00Z'),
('m24','2026-06-18T02:00:00Z'),
('m25','2026-06-18T16:00:00Z'),
('m26','2026-06-18T19:00:00Z'),
('m27','2026-06-18T22:00:00Z'),
('m28','2026-06-19T01:00:00Z'),
('m29','2026-06-19T19:00:00Z'),
('m30','2026-06-19T22:00:00Z'),
('m31','2026-06-20T00:30:00Z'),
('m32','2026-06-20T03:00:00Z'),
('m33','2026-06-20T17:00:00Z'),
('m34','2026-06-20T20:00:00Z'),
('m35','2026-06-21T00:00:00Z'),
('m36','2026-06-21T04:00:00Z'),
('m37','2026-06-21T16:00:00Z'),
('m38','2026-06-21T19:00:00Z'),
('m39','2026-06-21T22:00:00Z'),
('m40','2026-06-22T01:00:00Z'),
('m41','2026-06-22T17:00:00Z'),
('m42','2026-06-22T21:00:00Z'),
('m43','2026-06-23T00:00:00Z'),
('m44','2026-06-23T03:00:00Z'),
('m45','2026-06-23T17:00:00Z'),
('m46','2026-06-23T20:00:00Z'),
('m47','2026-06-23T23:00:00Z'),
('m48','2026-06-24T02:00:00Z'),
('m49','2026-06-24T19:00:00Z'),
('m50','2026-06-24T19:00:00Z'),
('m51','2026-06-24T22:00:00Z'),
('m52','2026-06-24T22:00:00Z'),
('m53','2026-06-25T01:00:00Z'),
('m54','2026-06-25T01:00:00Z'),
('m55','2026-06-25T20:00:00Z'),
('m56','2026-06-25T20:00:00Z'),
('m57','2026-06-25T23:00:00Z'),
('m58','2026-06-25T23:00:00Z'),
('m59','2026-06-26T02:00:00Z'),
('m60','2026-06-26T02:00:00Z'),
('m61','2026-06-26T19:00:00Z'),
('m62','2026-06-26T19:00:00Z'),
('m63','2026-06-27T00:00:00Z'),
('m64','2026-06-27T00:00:00Z'),
('m65','2026-06-27T03:00:00Z'),
('m66','2026-06-27T03:00:00Z'),
('m67','2026-06-27T21:00:00Z'),
('m68','2026-06-27T21:00:00Z'),
('m69','2026-06-27T23:30:00Z'),
('m70','2026-06-27T23:30:00Z'),
('m71','2026-06-28T02:00:00Z'),
('m72','2026-06-28T02:00:00Z'),
('k1','2026-06-28T19:00:00Z'),
('k2','2026-06-29T17:00:00Z'),
('k3','2026-06-29T20:30:00Z'),
('k4','2026-06-30T01:00:00Z'),
('k5','2026-06-30T17:00:00Z'),
('k6','2026-06-30T21:00:00Z'),
('k7','2026-07-01T01:00:00Z'),
('k8','2026-07-01T16:00:00Z'),
('k9','2026-07-01T20:00:00Z'),
('k10','2026-07-02T00:00:00Z'),
('k11','2026-07-02T19:00:00Z'),
('k12','2026-07-02T23:00:00Z'),
('k13','2026-07-03T03:00:00Z'),
('k14','2026-07-03T18:00:00Z'),
('k15','2026-07-03T22:00:00Z'),
('k16','2026-07-04T01:30:00Z'),
('k17','2026-07-04T17:00:00Z'),
('k18','2026-07-04T21:00:00Z'),
('k19','2026-07-05T20:00:00Z'),
('k20','2026-07-06T00:00:00Z'),
('k21','2026-07-06T19:00:00Z'),
('k22','2026-07-07T00:00:00Z'),
('k23','2026-07-07T16:00:00Z'),
('k24','2026-07-07T20:00:00Z'),
('k25','2026-07-09T20:00:00Z'),
('k26','2026-07-10T19:00:00Z'),
('k27','2026-07-11T21:00:00Z'),
('k28','2026-07-12T01:00:00Z'),
('k29','2026-07-14T19:00:00Z'),
('k30','2026-07-15T19:00:00Z'),
('k31','2026-07-18T21:00:00Z'),
('k32','2026-07-19T19:00:00Z'),
('_champ','2026-06-18T16:00:00Z')
on conflict (id) do update set ko = excluded.ko;

-- ------------------------------------------------------------
-- 2) wc_auth — PIN hashes, PRIVATE (never readable via the API).
--    One-time migration lifts existing hashes out of the public
--    wc:player:* rows, then strips them from those rows.
-- ------------------------------------------------------------
create table if not exists wc_auth(
  slug       text primary key,
  pin_hash   text not null,
  created_at timestamptz not null default now()
);

insert into wc_auth(slug, pin_hash)
select substring(key from 11), value::jsonb->>'pin'
  from kv
 where key like 'wc:player:%'
   and (value::jsonb ? 'pin')
   and coalesce(value::jsonb->>'pin','') <> ''
on conflict (slug) do nothing;

update kv
   set value = (value::jsonb - 'pin')::text     -- updated_at left untouched on purpose
 where key like 'wc:player:%'
   and (value::jsonb ? 'pin');

-- ------------------------------------------------------------
-- 3) wc_org_auth — organizer access-code hash, PRIVATE.
--    Seeded with the same hash the client used to ship, so the
--    existing code keeps working. Rotate any time with:
--      update wc_org_auth set code_hash = wc_pin_hash('NEWCODE');
-- ------------------------------------------------------------
create table if not exists wc_org_auth(id int primary key default 1, code_hash text not null);
insert into wc_org_auth(id, code_hash)
values (1, 'b2f167a0d3a56ad1e62e2fbcff2258f3fd5b2548f6c69e8756c169b5893db920')
on conflict (id) do nothing;

-- Same scheme the client always used: sha256('wc26:' || secret), hex
create or replace function public.wc_pin_hash(p text)
returns text language sql immutable
set search_path = public, extensions
as $$ select encode(digest('wc26:' || coalesce(p,''), 'sha256'), 'hex') $$;

-- WAVE B ⚡ Captain's Armband: is this id a legal target for this chip round?
-- qf k25-28 · sf k29-30 · fin k32 ONLY (k31 third place is never armable).
create or replace function public.wc_chip_valid(rn text, id text)
returns boolean language sql immutable as
$$ select case rn when 'qf'  then id in ('k25','k26','k27','k28')
                  when 'sf'  then id in ('k29','k30')
                  when 'fin' then id = 'k32'
                  else false end $$;

-- ------------------------------------------------------------
-- 4) save_picks — the ONLY way a player row gets written.
--    · PIN: first valid save claims the slug; afterwards verified.
--    · Locks: a pick whose match has kicked off keeps its STORED
--      value no matter what the browser sends. Server clock only.
--    · Sanitizes: known prediction ids, o∈{H,D,A}, scores 0–20,
--      winner ≤40 chars, profile fields length-capped, pin never
--      stored, slug forced to match the authenticated slug.
--    · WAVE B chips (⚡ armband targets, {"qf":"k26",...}): ids
--      outside the round's k-range dropped (wc_chip_valid); a
--      chip whose target match has kicked off is SEALED — setting
--      or moving it is rejected (stored value kept), keeping the
--      unchanged value is fine. Same server-clock lock as picks.
--    Returns the canonical stored row so the client can reconcile.
-- ------------------------------------------------------------
create or replace function public.save_picks(p_slug text, p_pin text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $f$
declare
  v_hash text; v_stored text;
  cur jsonb; cur_preds jsonb; new_preds jsonb;
  fin jsonb; fin_preds jsonb := '{}'::jsonb;
  k text; v jsonb; pv jsonb;
  v_o text; v_w text; v_h int; v_a int; v_champ text;
  cur_chips jsonb; new_chips jsonb; fin_chips jsonb := '{}'::jsonb;
  rn text; c_old text; c_new text;
begin
  if p_slug is null or p_slug !~ '^[a-z0-9._]{1,30}$' then
    raise exception 'bad_slug';
  end if;
  if p_pin is null or p_pin !~ '^\d{4}$' then
    raise exception 'bad_pin';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object'
     or length(p_payload::text) > 20000 then
    raise exception 'bad_payload';
  end if;

  v_hash := wc_pin_hash(p_pin);

  -- Claim-or-verify; the row lock also serializes saves per player.
  insert into wc_auth(slug, pin_hash) values (p_slug, v_hash)
  on conflict (slug) do nothing;
  select pin_hash into v_stored from wc_auth where slug = p_slug for update;
  if v_stored <> v_hash and v_stored <> ('plain:' || p_pin) then
    perform pg_sleep(0.3);                          -- brute force runs in treacle
    raise exception 'wrong_pin';
  end if;

  select value::jsonb into cur from kv where key = 'wc:player:' || p_slug;
  cur_preds := coalesce(cur->'predictions', '{}'::jsonb);
  new_preds := coalesce(p_payload->'predictions', '{}'::jsonb);
  if jsonb_typeof(new_preds) <> 'object' then new_preds := '{}'::jsonb; end if;

  -- Per-match merge: kicked-off matches keep the stored pick. Always.
  for k in select distinct u.key from (
             select jsonb_object_keys(cur_preds) as key
             union all
             select jsonb_object_keys(new_preds) as key) u
  loop
    if k !~ '^[mk][0-9]{1,3}$' then continue; end if;          -- unknown ids dropped
    if exists (select 1 from wc_locks l where l.id = k and l.ko <= now()) then
      v := cur_preds->k;                                       -- sealed at kickoff
    else
      v := new_preds->k;
    end if;
    if v is null or jsonb_typeof(v) <> 'object' then continue; end if;
    v_o := v->>'o';  v_w := v->>'w';
    v_h := case when (v->>'h') ~ '^[0-9]{1,2}$' then least((v->>'h')::int, 20) end;
    v_a := case when (v->>'a') ~ '^[0-9]{1,2}$' then least((v->>'a')::int, 20) end;
    pv := '{}'::jsonb;
    if v_o in ('H','D','A')                   then pv := pv || jsonb_build_object('o', v_o); end if;
    if v_w is not null and length(v_w) <= 40  then pv := pv || jsonb_build_object('w', v_w); end if;
    if v_h is not null                        then pv := pv || jsonb_build_object('h', v_h); end if;
    if v_a is not null                        then pv := pv || jsonb_build_object('a', v_a); end if;
    if pv <> '{}'::jsonb then fin_preds := fin_preds || jsonb_build_object(k, pv); end if;
  end loop;

  -- Champion pick seals at its own lock time (wc_locks id '_champ').
  if exists (select 1 from wc_locks l where l.id = '_champ' and l.ko <= now()) then
    v_champ := cur->>'champ';
  else
    v_champ := nullif(left(coalesce(p_payload->>'champ',''), 40), '');
  end if;

  -- WAVE B ⚡ chips (Captain's Armband targets) — {"qf":"k26","sf":null,"fin":"k32"}.
  -- Same lock philosophy as picks: kicked-off = sealed. Per round: an id outside
  -- the round's k-range is dropped (qf k25-28 · sf k29-30 · fin k32 — k31 never
  -- armable); an UNCHANGED value always passes; otherwise setting/moving is
  -- rejected (stored value kept) when EITHER the currently-armed match OR the
  -- new target has already kicked off. Server clock only.
  cur_chips := coalesce(cur->'chips', '{}'::jsonb);
  if jsonb_typeof(cur_chips) <> 'object' then cur_chips := '{}'::jsonb; end if;
  new_chips := coalesce(p_payload->'chips', '{}'::jsonb);
  if jsonb_typeof(new_chips) <> 'object' then new_chips := '{}'::jsonb; end if;
  foreach rn in array array['qf','sf','fin'] loop
    c_old := nullif(cur_chips->>rn, '');
    -- key ABSENT = client didn't speak about this round (stale tab) → keep stored;
    -- key present with null/'' = explicit disarm request (armBand keeps the key on unarm).
    c_new := case when new_chips ? rn then nullif(new_chips->>rn, '') else c_old end;
    if c_old is not null and not public.wc_chip_valid(rn, c_old) then c_old := null; end if;
    if c_new is not null and not public.wc_chip_valid(rn, c_new) then c_new := null; end if;
    if c_new is distinct from c_old then
      if (c_old is not null and exists (select 1 from wc_locks l where l.id = c_old and l.ko <= now()))
      or (c_new is not null and exists (select 1 from wc_locks l where l.id = c_new and l.ko <= now())) then
        c_new := c_old;                          -- locked: chip stays where it is
      end if;
    end if;
    if c_new is not null then fin_chips := fin_chips || jsonb_build_object(rn, c_new); end if;
  end loop;

  fin := jsonb_build_object(
    'slug',     p_slug,
    'ig',       coalesce(nullif(left(coalesce(p_payload->>'ig',''),30),''), p_slug),
    'name',     coalesce(nullif(left(coalesce(p_payload->>'name',''),60),''),
                         nullif(cur->>'name',''), '@' || p_slug),
    'dept',     left(coalesce(p_payload->>'dept',    cur->>'dept',    ''), 60),
    'country',  left(coalesce(p_payload->>'country', cur->>'country', 'Qatar'), 40),
    'joinedAt', coalesce(cur->'joinedAt', p_payload->'joinedAt',
                         to_jsonb((extract(epoch from now())*1000)::bigint)),
    'predictions', fin_preds);
  if v_champ is not null then fin := fin || jsonb_build_object('champ', v_champ); end if;
  if fin_chips <> '{}'::jsonb then fin := fin || jsonb_build_object('chips', fin_chips); end if;

  insert into kv(key, value, updated_at)
  values ('wc:player:' || p_slug, fin::text, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();

  return fin;
end $f$;

-- ------------------------------------------------------------
-- 5) Organizer functions — access code verified in Postgres.
--    org_check gates the panel UI; org_exec performs the writes
--    (set / del on wc:results, wc:kteams, wc:player:* — plus
--    clearpin). Wrong code costs a 0.4 s nap. Nothing else is
--    reachable: ranksnap, fixtures, poll state stay server-only.
-- ------------------------------------------------------------
create or replace function public.org_check(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $f$
declare ok boolean;
begin
  select (code_hash = wc_pin_hash(coalesce(p_code,''))) into ok from wc_org_auth where id = 1;
  ok := coalesce(ok, false);
  if not ok then perform pg_sleep(0.4); end if;
  return ok;
end $f$;

create or replace function public.org_exec(p_code text, p_op text, p_key text, p_value text default null)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $f$
declare v jsonb; v_slug text;
begin
  if not public.org_check(p_code) then
    raise exception 'bad_code';
  end if;

  if p_op = 'set' then
    if p_key is null or p_key !~ '^wc:(results|kteams|powerups_live|player:[a-z0-9._]{1,30})$' then
      raise exception 'bad_key';
    end if;
    if p_value is null or length(p_value) > 100000 then
      raise exception 'bad_value';
    end if;
    v := p_value::jsonb;                       -- must parse, or this raises
    if p_key like 'wc:player:%' then
      v_slug := substring(p_key from 11);
      if (v ? 'pin') then                      -- old backups: pin → wc_auth, never kv
        if coalesce(v->>'pin','') <> '' then
          insert into wc_auth(slug, pin_hash) values (v_slug, v->>'pin')
          on conflict (slug) do nothing;
        end if;
        v := v - 'pin';
      end if;
      v := v || jsonb_build_object('slug', v_slug);
    end if;
    insert into kv(key, value, updated_at) values (p_key, v::text, now())
    on conflict (key) do update set value = excluded.value, updated_at = now();
    return 'ok';

  elsif p_op = 'del' then
    if p_key is null or p_key !~ '^wc:(results|kteams|powerups_live|player:[a-z0-9._]{1,30})$' then
      raise exception 'bad_key';
    end if;
    delete from kv where key = p_key;
    if p_key like 'wc:player:%' then
      delete from wc_auth where slug = substring(p_key from 11);
    end if;
    return 'ok';

  elsif p_op = 'clearpin' then
    if p_key is null or p_key !~ '^[a-z0-9._]{1,30}$' then
      raise exception 'bad_key';
    end if;
    delete from wc_auth where slug = p_key;
    return 'ok';
  end if;

  raise exception 'bad_op';
end $f$;

-- server_time() already exists in production; this makes the repo
-- canonical for it (same behaviour: the database clock).
create or replace function public.server_time()
returns timestamptz language sql stable
as $$ select now() $$;

-- ------------------------------------------------------------
-- 6) The wall: RLS + grants.
--    kv: world-readable, zero direct writes from the API roles.
--    Auth/locks/robot tables: invisible to the API roles.
--    The robot and these definer functions run as the table
--    owner, so none of this touches them.
-- ------------------------------------------------------------
alter table public.kv enable row level security;
drop policy if exists kv_read_all on public.kv;
create policy kv_read_all on public.kv for select to anon, authenticated using (true);
revoke insert, update, delete, truncate, references, trigger
  on table public.kv from anon, authenticated;
grant select on table public.kv to anon, authenticated;

revoke all on table public.wc_auth, public.wc_org_auth, public.wc_locks
  from anon, authenticated;
alter table public.wc_auth     enable row level security;
alter table public.wc_org_auth enable row level security;
alter table public.wc_locks    enable row level security;

revoke all on table public.wc_fixtures, public.wc_alias, public.wc_poll_state
  from anon, authenticated;
alter table public.wc_fixtures   enable row level security;
alter table public.wc_alias      enable row level security;
alter table public.wc_poll_state enable row level security;

-- 'from public' alone is NOT enough on Supabase: ALTER DEFAULT PRIVILEGES grants
-- EXECUTE on every new function directly to anon/authenticated — strip those too
-- (the three player-facing functions get their grants right back below).
revoke all on function public.save_picks(text,text,jsonb)        from public, anon, authenticated;
revoke all on function public.org_check(text)                    from public, anon, authenticated;
revoke all on function public.org_exec(text,text,text,text)      from public, anon, authenticated;
revoke all on function public.wc_pin_hash(text)                  from public, anon, authenticated;
revoke all on function public.wc_chip_valid(text,text)           from public, anon, authenticated;
grant execute on function public.save_picks(text,text,jsonb)     to anon, authenticated;
grant execute on function public.org_check(text)                 to anon, authenticated;
grant execute on function public.org_exec(text,text,text,text)   to anon, authenticated;
grant execute on function public.server_time()                   to anon, authenticated;

-- Sanity checks after running:
--   select count(*) from wc_locks;                          -- 105
--   select count(*) from wc_auth;                           -- ≈ players with PINs
--   select count(*) from kv where value like '%"pin"%'
--     and key like 'wc:player:%';                           -- 0
