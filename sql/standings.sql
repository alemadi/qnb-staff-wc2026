-- ============================================================================
-- MATCHDAY · standings() RPC — server-side leaderboard (slim payload)
-- Paste this whole file into the Supabase SQL editor and click Run.
-- Safe to re-run any time (CREATE OR REPLACE).
--
-- Scoring mirrors scoreFor() in index.html exactly:
--   Group: +3 correct outcome (requires an outcome pick), +2 exact-score
--          bonus (also gated on the outcome pick, matching the JS guard).
--   Knockout (result has "w"): who-goes-through ladder — k1–k16 +4 · k17–k24 +5 ·
--          k25–k28 +6 · k29–k30 +8 · k31 third place +6 · k32 final +10.
--   Knockout exact-score bonus (full-time scoreline incl. extra time, ADDED 2026-06-28),
--          awarded INDEPENDENTLY of the who-goes-through pick — k1–k16 +4 · k17–k24 +5 ·
--          k25–k28 +6 · k29–k30 +7 · k31 third place +5 · k32 final +8.
--          (Note SF/third/final differ from the advance ladder, matching KO_BONUS.)
--          A KO scoreline hit also counts toward the `exact` column, like a group exact.
--   Champion: +25 when wc:results._champ matches the pick.
-- Verified equivalent to the JS scorer (scoreFor) including the KO exact-score
-- bonus and KO exact counts.
-- ============================================================================

create or replace function public.standings()
returns table(slug text, name text, dept text, pts int, exact int, correct int, predicted int)
language sql
stable
set search_path = public
as $$
with results_row as materialized (
  select value::jsonb as r from kv where key = 'wc:results'
),
matches as materialized (
  select e.key as id,
         e.value->>'w' as rw,
         case when (e.value->>'h') ~ '^[0-9]+$' then (e.value->>'h')::int end as rh,
         case when (e.value->>'a') ~ '^[0-9]+$' then (e.value->>'a')::int end as ra,
         case
           when e.key !~ '^k[0-9]+$' then 0
           when substring(e.key from 2)::int between 17 and 24 then 5
           when substring(e.key from 2)::int between 25 and 28 then 6
           when substring(e.key from 2)::int in (29,30)        then 8
           when substring(e.key from 2)::int = 31              then 6
           when substring(e.key from 2)::int = 32              then 10
           else 4
         end as kpts,
         case  -- KO exact-score bonus (koBonus): SF/third/final differ from kpts
           when e.key !~ '^k[0-9]+$' then 0
           when substring(e.key from 2)::int between 17 and 24 then 5
           when substring(e.key from 2)::int between 25 and 28 then 6
           when substring(e.key from 2)::int in (29,30)        then 7
           when substring(e.key from 2)::int = 31              then 5
           when substring(e.key from 2)::int = 32              then 8
           else 4
         end as kbonus
  from results_row, jsonb_each(results_row.r) e
  where left(e.key,1) <> '_'
    and ( (e.value->>'w') is not null
          or ((e.value->>'h') ~ '^[0-9]+$' and (e.value->>'a') ~ '^[0-9]+$') )
),
champ as materialized (
  select r->>'_champ' as c from results_row
),
players as materialized (
  select substring(key from 11)                       as pslug,   -- after 'wc:player:'
         value::jsonb                                  as j
  from kv where key like 'wc:player:%'
),
-- one row per (player, prediction); each blob parsed exactly once
preds as materialized (
  select p.pslug,
         e.key                as id,
         e.value->>'o'        as po,
         e.value->>'w'        as pw,
         case when (e.value->>'h') ~ '^[0-9]+$' then (e.value->>'h')::int end as ph,
         case when (e.value->>'a') ~ '^[0-9]+$' then (e.value->>'a')::int end as pa
  from players p, jsonb_each(coalesce(p.j->'predictions','{}'::jsonb)) e
),
scored as (
  select pr.pslug,
    sum( case
      when m.rw is not null then                       -- knockout
        ( case when pr.pw = m.rw then m.kpts else 0 end )      -- who-goes-through
        +
        ( case when pr.ph = m.rh and pr.pa = m.ra            -- full-time exact-score bonus,
               then m.kbonus else 0 end )                     -- independent of the winner pick
      when coalesce(pr.po,'') = '' then 0              -- group: outcome pick required
      else
        ( case when pr.po = (case when m.rh > m.ra then 'H'
                                   when m.rh < m.ra then 'A' else 'D' end)
           then 3 else 0 end )
        +
        ( case when pr.ph = m.rh and pr.pa = m.ra then 2 else 0 end )
      end ) as base,
    sum( case
      when m.rw is not null then                       -- knockout exact scoreline
        case when pr.ph = m.rh and pr.pa = m.ra then 1 else 0 end
      when coalesce(pr.po,'') <> '' and pr.ph = m.rh and pr.pa = m.ra
        then 1 else 0                                  -- group exact (outcome pick required)
      end ) as exact,
    sum( case
      when m.rw is not null then
        case when pr.pw = m.rw then 1 else 0 end
      when coalesce(pr.po,'') = '' then 0
      when pr.po = (case when m.rh > m.ra then 'H'
                          when m.rh < m.ra then 'A' else 'D' end)
        then 1 else 0 end ) as correct
  from preds pr
  join matches m on m.id = pr.id
  group by pr.pslug
),
pred_counts as (
  select pslug, count(*) as n
  from preds
  where coalesce(po,'') <> '' or coalesce(pw,'') <> ''
  group by pslug
)
select
  p.j->>'slug'                                   as slug,
  coalesce(nullif(p.j->>'name',''), p.j->>'slug') as name,
  coalesce(p.j->>'dept','')                      as dept,
  ( coalesce(s.base,0)
    + case when (select c from champ) is not null
            and p.j->>'champ' = (select c from champ)
       then 25 else 0 end )::int                 as pts,
  coalesce(s.exact,0)::int                       as exact,
  coalesce(s.correct,0)::int                     as correct,
  coalesce(pc.n,0)::int                          as predicted
from players p
left join scored       s  on s.pslug  = p.pslug
left join pred_counts  pc on pc.pslug = p.pslug
$$;

grant execute on function public.standings() to anon;

-- Sanity check after running:
-- select * from standings() order by pts desc limit 10;
