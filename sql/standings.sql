-- ============================================================================
-- MATCHDAY · standings() RPC — server-side leaderboard (slim payload)
-- Paste this whole file into the Supabase SQL editor and click Run.
-- Safe to re-run any time (CREATE OR REPLACE) — no DROP, signature unchanged,
-- grant re-applied at the bottom.
--
-- Scoring mirrors scoreFor() in index.html exactly (agreed ladder + exact-score streak):
--   Group (UNCHANGED): +3 correct outcome (requires an outcome pick),
--          +2 exact-score bonus (also gated on the outcome pick).
--   Knockout ADVANCE (who goes through):
--          R32 (k1–k16) +4 · R16 (k17–k24) +5 · QF (k25–k28) +6 ·
--          SF (k29–k30) +8 · third (k31) +6 · final (k32) +10.
--   Knockout EXACT FINAL-score bonus (on top of advance; final score = the
--          scoreline when the match ends, after extra time if played, penalties
--          excluded — matches koScoreHit in index.html):
--          R32 +4 · R16 +5 · QF +6 · SF +7 · third +5 · final +8.
--   Knockout EXACT-SCORE STREAK (knockouts only, going forward): nailing the
--          exact FINAL score in CONSECUTIVE knockout matches the player
--          predicted (chronological order = the numeric part of the k-id)
--          earns, per match in the run:
--          1st in a run +0 · 2nd +5 · 3rd +15 · 4th-and-onward +20 each.
--          Any non-exact predicted knockout match resets the run.
--   Champion: +25 when wc:results._champ matches the pick.
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
         -- knockout ADVANCE points (mirrors KO_PTS / koPts() in index.html)
         case
           when e.key !~ '^k[0-9]+$' then 0
           when substring(e.key from 2)::int between 17 and 24 then 5   -- R16
           when substring(e.key from 2)::int between 25 and 28 then 6   -- QF
           when substring(e.key from 2)::int in (29,30)        then 8   -- SF
           when substring(e.key from 2)::int = 31              then 6   -- third
           when substring(e.key from 2)::int = 32              then 10  -- final
           else 4                                                       -- R32 (k1..k16)
         end as kadv,
         -- knockout EXACT final-score bonus (mirrors KO_BONUS / koBonus())
         case
           when e.key !~ '^k[0-9]+$' then 0
           when substring(e.key from 2)::int between 17 and 24 then 5   -- R16
           when substring(e.key from 2)::int between 25 and 28 then 6   -- QF
           when substring(e.key from 2)::int in (29,30)        then 7   -- SF
           when substring(e.key from 2)::int = 31              then 5   -- third
           when substring(e.key from 2)::int = 32              then 8   -- final
           else 4                                                       -- R32
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
-- settled knockout rows per player, in CHRONOLOGICAL order (numeric part of
-- the k-id). A row participates iff the JS guard fires:
--   result has w, AND player has a w-pick or a numeric home score.
ko as (
  select pr.pslug,
         substring(m.id from 2)::int as kn,
         (m.rh is not null and m.ra is not null
            and pr.ph is not null and pr.pa is not null
            and pr.ph = m.rh and pr.pa = m.ra) as exact_hit
  from preds pr
  join matches m on m.id = pr.id
  where m.rw is not null
    and m.id ~ '^k[0-9]+$'                      -- guard: only k<digits> reach substring(...)::int (mirrors JS /^k[0-9]+$/)
    and (pr.pw is not null or pr.ph is not null)
),
-- gaps-and-islands: number each exact hit within its maximal consecutive run.
-- Island id = row_number(over all KO by kn) - row_number(over same exact_hit by kn);
-- constant within a run of identical exact_hit. Keep only the true runs.
ko_streak as (
  select pslug,
         row_number() over (partition by pslug, grp order by kn) as pos_in_run
  from (
    select pslug, kn, exact_hit,
           row_number() over (partition by pslug order by kn)
             - row_number() over (partition by pslug, exact_hit order by kn) as grp
    from ko
  ) z
  where exact_hit
),
streak_bonus as (
  select pslug,
         sum( case
                when pos_in_run = 1 then 0    -- first exact of a run: no bonus
                when pos_in_run = 2 then 5    -- 2-in-a-row
                when pos_in_run = 3 then 15   -- 3-in-a-row
                else 20                       -- 4th and onward, each
              end ) as streak
  from ko_streak
  group by pslug
),
scored as (
  select pr.pslug,
    sum( case
      when m.rw is not null then                       -- knockout
        ( case when pr.pw = m.rw then m.kadv else 0 end )
        +
        ( case when m.rh is not null and m.ra is not null
                and pr.ph = m.rh and pr.pa = m.ra
           then m.kbonus else 0 end )
      when coalesce(pr.po,'') = '' then 0              -- group: outcome pick required
      else
        ( case when pr.po = (case when m.rh > m.ra then 'H'
                                   when m.rh < m.ra then 'A' else 'D' end)
           then 3 else 0 end )
        +
        ( case when pr.ph = m.rh and pr.pa = m.ra then 2 else 0 end )
      end ) as base,
    sum( case
      when m.rw is not null then                       -- knockout exact count
        case when m.rh is not null and m.ra is not null
              and pr.ph = m.rh and pr.pa = m.ra then 1 else 0 end
      when coalesce(pr.po,'') <> '' and pr.ph = m.rh and pr.pa = m.ra
        then 1 else 0 end ) as exact,
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
    + coalesce(sb.streak,0)
    + case when nullif((select c from champ),'') is not null
            and nullif(p.j->>'champ','') = (select c from champ)
       then 25 else 0 end )::int                 as pts,
  coalesce(s.exact,0)::int                       as exact,
  coalesce(s.correct,0)::int                     as correct,
  coalesce(pc.n,0)::int                          as predicted
from players p
left join scored       s  on s.pslug  = p.pslug
left join streak_bonus sb on sb.pslug = p.pslug
left join pred_counts  pc on pc.pslug = p.pslug
$$;

grant execute on function public.standings() to anon;

-- Sanity check after running:
-- select * from standings() order by pts desc limit 10;
