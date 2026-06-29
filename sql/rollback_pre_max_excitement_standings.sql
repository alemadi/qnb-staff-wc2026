-- ROLLBACK SNAPSHOT — the EXACT live standings() captured from Supabase project
-- fzybuasvhzhmkbhxbton on 2026-06-29 (before deploying the Maximum-Excitement version).
-- Old ladder (advance 4/5/6/8/6/10, bonus 4/5/6/7/5/8), exact bonus, NO streak.
-- To roll back: paste this whole file into the Supabase SQL editor and Run.
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
         case
           when e.key !~ '^k[0-9]+$' then 0
           when substring(e.key from 2)::int between 17 and 24 then 5
           when substring(e.key from 2)::int between 25 and 28 then 6
           when substring(e.key from 2)::int in (29,30)        then 8
           when substring(e.key from 2)::int = 31              then 6
           when substring(e.key from 2)::int = 32              then 10
           else 4
         end as kpts,
         case
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
champ as materialized ( select r->>'_champ' as c from results_row ),
players as materialized (
  select substring(key from 11) as pslug, value::jsonb as j
  from kv where key like 'wc:player:%'
),
preds as materialized (
  select p.pslug, e.key as id, e.value->>'o' as po, e.value->>'w' as pw,
         case when (e.value->>'h') ~ '^[0-9]+$' then (e.value->>'h')::int end as ph,
         case when (e.value->>'a') ~ '^[0-9]+$' then (e.value->>'a')::int end as pa
  from players p, jsonb_each(coalesce(p.j->'predictions','{}'::jsonb)) e
),
scored as (
  select pr.pslug,
    sum( case
      when m.rw is not null then
        ( case when pr.pw = m.rw then m.kpts else 0 end )
        + ( case when pr.ph = m.rh and pr.pa = m.ra then m.kbonus else 0 end )
      when coalesce(pr.po,'') = '' then 0
      else
        ( case when pr.po = (case when m.rh > m.ra then 'H' when m.rh < m.ra then 'A' else 'D' end) then 3 else 0 end )
        + ( case when pr.ph = m.rh and pr.pa = m.ra then 2 else 0 end )
      end ) as base,
    sum( case
      when m.rw is not null then case when pr.ph = m.rh and pr.pa = m.ra then 1 else 0 end
      when coalesce(pr.po,'') <> '' and pr.ph = m.rh and pr.pa = m.ra then 1 else 0
      end ) as exact,
    sum( case
      when m.rw is not null then case when pr.pw = m.rw then 1 else 0 end
      when coalesce(pr.po,'') = '' then 0
      when pr.po = (case when m.rh > m.ra then 'H' when m.rh < m.ra then 'A' else 'D' end) then 1 else 0 end ) as correct
  from preds pr join matches m on m.id = pr.id group by pr.pslug
),
pred_counts as (
  select pslug, count(*) as n from preds
  where coalesce(po,'') <> '' or coalesce(pw,'') <> '' group by pslug
)
select
  p.j->>'slug' as slug,
  coalesce(nullif(p.j->>'name',''), p.j->>'slug') as name,
  coalesce(p.j->>'dept','') as dept,
  ( coalesce(s.base,0) + case when (select c from champ) is not null and p.j->>'champ' = (select c from champ) then 25 else 0 end )::int as pts,
  coalesce(s.exact,0)::int as exact,
  coalesce(s.correct,0)::int as correct,
  coalesce(pc.n,0)::int as predicted
from players p
left join scored s on s.pslug = p.pslug
left join pred_counts pc on pc.pslug = p.pslug
$function$;

grant execute on function public.standings() to anon;
