-- Captured from LIVE (project fzybuasvhzhmkbhxbton) 2026-07-06 ~04:0xZ, immediately
-- before the Wave-B SQL deploy. pg_get_functiondef() verbatim. Running this file
-- restores the pre-Wave-B standings(). md5(prosrc) of the restored body must be
-- f241d4b1f9d55d47bd0d44572dcbe08c (md5(pg_get_functiondef) d72059ac5300e39acd53d236348cc9d6).
CREATE OR REPLACE FUNCTION public.standings()
 RETURNS TABLE(slug text, name text, dept text, pts integer, exact integer, correct integer, predicted integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
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
preds as materialized (
  select p.pslug,
         e.key                as id,
         e.value->>'o'        as po,
         e.value->>'w'        as pw,
         case when (e.value->>'h') ~ '^[0-9]+$' then (e.value->>'h')::int end as ph,
         case when (e.value->>'a') ~ '^[0-9]+$' then (e.value->>'a')::int end as pa
  from players p, jsonb_each(coalesce(p.j->'predictions','{}'::jsonb)) e
),
ko as (
  select pr.pslug,
         substring(m.id from 2)::int as kn,
         (m.rh is not null and m.ra is not null
            and pr.ph is not null and pr.pa is not null
            and pr.ph = m.rh and pr.pa = m.ra) as exact_hit
  from preds pr
  join matches m on m.id = pr.id
  where m.rw is not null
    and m.id ~ '^k[0-9]+$'
    and (pr.pw is not null or pr.ph is not null)
),
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
                when pos_in_run = 1 then 0
                when pos_in_run = 2 then 5
                when pos_in_run = 3 then 15
                else 20
              end ) as streak
  from ko_streak
  group by pslug
),
scored as (
  select pr.pslug,
    sum( case
      when m.rw is not null then
        ( case when pr.pw = m.rw then m.kadv else 0 end )
        +
        ( case when m.rh is not null and m.ra is not null
                and pr.ph = m.rh and pr.pa = m.ra
           then m.kbonus else 0 end )
      when coalesce(pr.po,'') = '' then 0
      else
        ( case when pr.po = (case when m.rh > m.ra then 'H'
                                   when m.rh < m.ra then 'A' else 'D' end)
           then 3 else 0 end )
        +
        ( case when pr.ph = m.rh and pr.pa = m.ra then 2 else 0 end )
      end ) as base,
    sum( case
      when m.rw is not null then
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
$function$
