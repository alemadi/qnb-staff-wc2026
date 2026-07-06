-- ============================================================================
-- PERF ② · slim reads + standings cache — sql/perf.sql
-- Paste this whole file into the Supabase SQL editor and click Run,
-- AFTER sql/standings.sql (this file's standings() wrapper needs
-- wc_standings_compute() from there) and AFTER sql/protect.sql (room_board's
-- seal reads wc_locks). Safe to re-run any time (CREATE OR REPLACE; no DROP).
--
-- Why this file exists (measured on live, 2026-07-06):
--   · The client pulled EVERY player blob (687 × ~1.9 KB = 1.33 MB raw,
--     ~236 KB gzipped) to compute per-card office-split percentages
--     (consensus) — on the DEFAULT view, every 10 min per device — and again
--     for the Room board (60 s cache: the match-night kiosk alone re-pulled
--     it once a minute). consensus_counts() and room_board() return the same
--     information in a few KB.
--   · standings() cost 241 ms of DB CPU per call and every leaderboard
--     viewer calls it every 60 s. The wrapper below serves a cached copy
--     that self-invalidates on ANY kv write (all engine writers bump
--     kv.updated_at — save_picks / org_exec / the robot), so N viewers/min
--     cost ONE compute per data change instead of N computes.
--
-- Privacy note: both new functions EXPOSE STRICTLY LESS than the status quo
-- (the kv table is openly readable to anon today, full blobs included).
--   · consensus_counts() returns aggregates only — no names, no slugs.
--   · room_board() returns per-player picks for ONE match and ONLY after
--     that match's kickoff on the DATABASE clock (wc_locks — the same wall
--     save_picks enforces). The client's Room seal was convention; this is
--     the first server-enforced version. Neither function ever touches PINs
--     (PINs don't live in blobs — see protect.sql).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) consensus_counts() — the office split, aggregated server-side.
-- PARITY CONTRACT (counting only, no scoring): mirrors the counting passes of
-- consensus() in index.html field-for-field for everything the client reads:
--   map[id]  = {H,D,A,w:{team:n},sc:{"h-a":n}}   (zeros/empties present so a
--              card with picks but no qualifying counts still gets its row,
--              exactly like the JS `map[id]||(map[id]={H:0,D:0,A:0,w:{},sc:{}})`)
--   champMap = {team:n} over truthy blob.champ · champN = its total · n = blobs.
-- JS skips ids not in FIXBYID; here the ^m\d+$/^k\d+$ shape does that job
-- (save_picks whitelists ids against wc_locks, so junk can't persist anyway).
-- JS `if(v.o)` truthiness = non-empty string; only H/D/A are consumed.
-- JS `v.h!=null&&v.a!=null` = key present and not JSON null (0 and "" pass).
-- ----------------------------------------------------------------------------
create or replace function public.consensus_counts()
returns json
language sql
stable
security definer
set search_path = public
as $$
with players as materialized (
  select value::jsonb as j from kv where key like 'wc:player:%'
),
preds as materialized (
  select e.key as id, e.value as v
  from players p, jsonb_each(coalesce(p.j->'predictions','{}'::jsonb)) e
  where jsonb_typeof(e.value) = 'object'          -- JS: if(!v)continue (null pick rows skipped)
    and e.key ~ '^[mk][0-9]+$'                    -- JS: if(!FIXBYID[id])continue
),
ids as (select distinct id from preds),           -- JS creates the zero-skeleton per seen id
grp as (
  select id,
         count(*) filter (where v->>'o' = 'H') as h,
         count(*) filter (where v->>'o' = 'D') as d,
         count(*) filter (where v->>'o' = 'A') as a
  from preds where id like 'm%' group by id
),
scs as (                                          -- exact-score distribution (group cards)
  select id, (v->>'h') || '-' || (v->>'a') as sc, count(*) as n
  from preds
  where id like 'm%'
    and v ? 'h' and jsonb_typeof(v->'h') <> 'null'
    and v ? 'a' and jsonb_typeof(v->'a') <> 'null'
  group by id, (v->>'h') || '-' || (v->>'a')
),
kow as (                                          -- knockout winner counts
  select id, v->>'w' as w, count(*) as n
  from preds
  where id like 'k%' and coalesce(v->>'w','') <> ''
  group by id, v->>'w'
),
ch as (
  select j->>'champ' as c from players where coalesce(j->>'champ','') <> ''
)
select json_build_object(
  'n',        (select count(*) from players),
  'champN',   (select count(*) from ch),
  'champMap', coalesce((select json_object_agg(c, n)
                        from (select c, count(*) as n from ch group by c) cm), '{}'::json),
  'map',      coalesce((select json_object_agg(i.id, json_build_object(
                 'H', coalesce(g.h, 0),
                 'D', coalesce(g.d, 0),
                 'A', coalesce(g.a, 0),
                 'w', coalesce((select json_object_agg(k.w, k.n) from kow k where k.id = i.id), '{}'::json),
                 'sc', coalesce((select json_object_agg(s.sc, s.n) from scs s where s.id = i.id), '{}'::json)))
               from ids i left join grp g on g.id = i.id), '{}'::json))
$$;

revoke all on function public.consensus_counts() from public, anon, authenticated;
grant execute on function public.consensus_counts() to anon;

-- ----------------------------------------------------------------------------
-- 2) room_board(p_match) — one match's Room rows, sealed by Postgres.
-- Returns {slug,name,dept,chips,o,w,h,a} per player who either has a pick on
-- the match (JS Room filter: pk.o||pk.w — but the aggregates also read h/a-only
-- rows, so any pick object qualifies) or has an armband chip naming it (the
-- pre-settle "N armed the band" count iterates chip holders too).
-- ZERO rows before kickoff: `wc_locks.ko <= now()` — the database clock, the
-- same wall save_picks uses. slug mirrors standings(): the blob's own field.
-- ----------------------------------------------------------------------------
create or replace function public.room_board(p_match text)
returns table(slug text, name text, dept text, chips jsonb, o text, w text, h text, a text)
language sql
stable
security definer
set search_path = public
as $$
  select p.j->>'slug'                                   as slug,
         coalesce(nullif(p.j->>'name',''), p.j->>'slug') as name,
         coalesce(p.j->>'dept','')                      as dept,
         case when jsonb_typeof(p.j->'chips') = 'object' then p.j->'chips' end as chips,
         p.j->'predictions'->p_match->>'o'              as o,
         p.j->'predictions'->p_match->>'w'              as w,
         p.j->'predictions'->p_match->>'h'              as h,
         p.j->'predictions'->p_match->>'a'              as a
  from (select value::jsonb as j from kv where key like 'wc:player:%') p
  where exists (select 1 from wc_locks l where l.id = p_match and l.ko <= now())
    and ( jsonb_typeof(p.j->'predictions'->p_match) = 'object'
          or exists (select 1
                     from jsonb_each_text(case when jsonb_typeof(p.j->'chips') = 'object'
                                               then p.j->'chips' else '{}'::jsonb end) c
                     where c.value = p_match) )
  order by 1
$$;

revoke all on function public.room_board(text) from public, anon, authenticated;
grant execute on function public.room_board(text) to anon;

-- ----------------------------------------------------------------------------
-- 3) standings() cache — same rows, ~2 ms instead of ~241 ms per call.
-- sql/standings.sql now defines the engine as wc_standings_compute() (renamed,
-- body untouched); the public standings() below serves a cached copy and
-- recomputes ONLY when the kv fingerprint (max updated_at + row count) moved —
-- every engine writer bumps updated_at, so any result/pick/flag/kteams change
-- invalidates instantly. A 10-min hard TTL backstops out-of-band edits that
-- bypass updated_at (e.g. manual SQL). Advisory xact lock = one compute per
-- change even if a whole office of leaderboards stampedes the expiry together.
-- Output is column-for-column the compute's — the client cannot tell.
-- ----------------------------------------------------------------------------
create table if not exists wc_stand_cache(
  id          int primary key check (id = 1),
  rows        jsonb not null,
  src_max     timestamptz,
  src_n       bigint,
  computed_at timestamptz not null default now()
);
alter table public.wc_stand_cache enable row level security;
revoke all on table public.wc_stand_cache from public, anon, authenticated;

create or replace function public.standings()
returns table(slug text, name text, dept text, pts int, exact int, correct int, predicted int)
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  s_max timestamptz;
  s_n   bigint;
  c     public.wc_stand_cache;
begin
  select max(k.updated_at), count(*) into s_max, s_n from kv k;
  select * into c from wc_stand_cache w where w.id = 1;
  if found and c.src_max is not distinct from s_max and c.src_n is not distinct from s_n
     and c.computed_at > now() - interval '10 minutes' then
    return query
      select r->>'slug', r->>'name', r->>'dept',
             (r->>'pts')::int, (r->>'exact')::int, (r->>'correct')::int, (r->>'predicted')::int
      from jsonb_array_elements(c.rows) r;
    return;
  end if;
  -- stale: take the refresh lock; whoever got here first recomputes, the rest
  -- of the herd waits a moment and serves that fresh copy
  perform pg_advisory_xact_lock(hashtext('wc_stand_cache'));
  select max(k.updated_at), count(*) into s_max, s_n from kv k;
  select * into c from wc_stand_cache w where w.id = 1;
  if found and c.src_max is not distinct from s_max and c.src_n is not distinct from s_n
     and c.computed_at > now() - interval '10 minutes' then
    return query
      select r->>'slug', r->>'name', r->>'dept',
             (r->>'pts')::int, (r->>'exact')::int, (r->>'correct')::int, (r->>'predicted')::int
      from jsonb_array_elements(c.rows) r;
    return;
  end if;
  return query
  with fresh as materialized (
    select * from wc_standings_compute()
  ),
  snap as (
    insert into wc_stand_cache(id, rows, src_max, src_n, computed_at)
    select 1, coalesce((select jsonb_agg(to_jsonb(f)) from fresh f), '[]'::jsonb), s_max, s_n, now()
    on conflict (id) do update
      set rows = excluded.rows, src_max = excluded.src_max,
          src_n = excluded.src_n, computed_at = excluded.computed_at
  )
  select f.slug, f.name, f.dept, f.pts, f.exact, f.correct, f.predicted from fresh f;
end
$fn$;

-- Wrapper carries the exact grants the deployed standings() holds today
-- (anon only — authenticated was revoke-hardened at the Wave-B deploy);
-- the engine compute stays internal, callable only through the wrapper.
revoke all on function public.standings() from public, anon, authenticated;
grant execute on function public.standings() to anon;

-- Sanity checks after running:
--   select count(*) from standings();                 -- 687-ish, twice: 2nd call ~instant
--   select computed_at, src_n from wc_stand_cache;    -- populated by the 1st call
--   select json_typeof(consensus_counts());           -- 'object'
--   select count(*) from room_board('k20');           -- >0 (kicked off) · room_board('k25') = 0 rows until Thu
--
-- ROLLBACK (exact, live-safe): restore the direct engine as the public RPC —
--   create or replace function public.standings()
--   returns table(slug text, name text, dept text, pts int, exact int, correct int, predicted int)
--   language sql stable security definer set search_path = public
--   as $$ select * from wc_standings_compute() $$;
--   revoke all on function public.standings() from public, anon, authenticated;
--   grant execute on function public.standings() to anon;
--   drop function public.consensus_counts();
--   drop function public.room_board(text);
--   drop table public.wc_stand_cache;
-- (the client falls back to bulk pulls by itself when the RPCs 404).
