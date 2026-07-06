-- ============================================================================
-- MATCHDAY · standings() RPC — server-side leaderboard (slim payload)
-- Paste this whole file into the Supabase SQL editor and click Run.
-- Safe to re-run any time (CREATE OR REPLACE) — no DROP, signature unchanged,
-- grant re-applied at the bottom. Run AFTER sql/robot.sql (needs wc_ko_teams)
-- and sql/protect.sql (chips are validated + lock-guarded in save_picks there).
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
--          Any non-exact predicted knockout match resets the run (but see 🛡).
--   Champion: +25 when wc:results._champ matches the pick — NEVER doubled.
--
-- WAVE B · QUARTER-FINAL POWER-UPS (live from k25; k31 third place: upset only):
--   ⚡ CAPTAIN'S ARMBAND — the player blob may carry optional
--      chips {"qf":"k26","sf":null,"fin":"k32"} (round-range + lock validated by
--      save_picks in sql/protect.sql). When a round's chip names a match, THAT
--      match's knockout earn becomes (advance + exact-bonus) × 2. The chip only
--      MULTIPLIES, it never creates points — a missed armed match doubles zero.
--      Rounds: qf = k25–k28 · sf = k29–k30 · fin = k32 (k31 excluded). Streak
--      bonuses and the champion +25 are NEVER doubled.
--   🛡 STREAK SHIELD — automatic, at most ONCE per player: the FIRST
--      streak-breaking miss with kn>=25 (a predicted, settled, non-exact KO row
--      that immediately follows >=1 exact hit in the engaged sequence) is
--      IGNORED for streak-run computation — the run continues across it. The
--      missed match itself still scores its normal points (or lack thereof).
--   🦅 UPSET BONUS — flat +2 on top when the player's correct winner pick
--      (kn>=25 only, k31 included) was the LOWER-ranked side per wc_rank
--      (higher r = lower ranked). The tie's loser is resolved via
--      wc_ko_teams(results, wc:kteams override) from sql/robot.sql; an
--      unresolved side or missing rank pays nothing. Never doubled by ⚡.
--   PARITY CONTRACT: constants + math tier-for-tier identical to the JS half —
--   PU_FROM_K=25 / PU_UPSET=2 / puRound() / PU_RANK / scoreFor() /
--   koStreakBonus(…,shield) / upsetWin() in index.html. The wc_rank seed below
--   and the PU_RANK const are generated from ONE list — edit them together.
--   Cross-half test vectors: scratchpad wave-b-vectors.json (launch-day proof).
--
-- NOTE: standings() is now SECURITY DEFINER — the upset join reads wc_fixtures /
-- wc_ko_sched / wc_rank, which are RLS-walled from the anon role by
-- sql/protect.sql. Body is a single read-only SELECT; search_path pinned.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- wc_rank — the official FIFA/Coca-Cola men's ranking, 11 June 2026 release (the
-- one frozen going into the World Cup; next update 20 Jul), backing the 🦅 upset
-- bonus. Published in-app as the PU_RANK const in index.html: SAME 48 teams, SAME
-- numbers. FIFA's own numbers, so ranks skip non-WC teams (12 Italy, 21 Denmark…);
-- only relative order matters to the bonus, so the gaps are harmless.
--
-- >>> ORGANIZER-EDITABLE <<<
-- To correct a rank, edit the value here AND mirror it into PU_RANK in index.html
-- (the two must stay byte-identical). The seed is idempotent (ON CONFLICT DO
-- UPDATE): re-running this file re-applies whatever numbers it holds, so the file
-- is the single source of truth — edit and re-run to update the live ranks.
-- ----------------------------------------------------------------------------
create table if not exists wc_rank(team text primary key, r int not null);
insert into wc_rank(team, r) values
 ('Argentina',1),('Spain',2),('France',3),('England',4),('Portugal',5),('Brazil',6),
 ('Morocco',7),('Netherlands',8),('Belgium',9),('Germany',10),('Croatia',11),('Colombia',13),
 ('Mexico',14),('Senegal',15),('Uruguay',16),('USA',17),('Japan',18),('Switzerland',19),
 ('Iran',20),('Türkiye',22),('Ecuador',23),('Austria',24),('South Korea',25),('Australia',27),
 ('Algeria',28),('Egypt',29),('Canada',30),('Norway',31),('Ivory Coast',33),('Panama',34),
 ('Sweden',38),('Czechia',40),('Paraguay',41),('Scotland',42),('Tunisia',45),('DR Congo',46),
 ('Uzbekistan',50),('Qatar',56),('Iraq',57),('South Africa',60),('Saudi Arabia',61),('Jordan',63),
 ('Bosnia & H.',64),('Cape Verde',67),('Ghana',73),('Curaçao',82),('Haiti',83),('New Zealand',85)
on conflict (team) do update set r=excluded.r;
-- walled like the other engine tables; standings() reads it as definer
alter table public.wc_rank enable row level security;
revoke all on table public.wc_rank from anon, authenticated;

create or replace function public.standings()
returns table(slug text, name text, dept text, pts int, exact int, correct int, predicted int)
language sql
stable
security definer
set search_path = public
as $$
with results_row as materialized (
  select value::jsonb as r from kv where key = 'wc:results'
),
-- resolved knockout tie teams { kID: {h,a} } — robot's resolver; organizer
-- wc:kteams override wins, exactly like koTeams() in index.html
kteams as materialized (
  select wc_ko_teams(
           coalesce((select r from results_row), '{}'::jsonb),
           coalesce((select value::jsonb from kv where key = 'wc:kteams'), '{}'::jsonb)
         ) as t
),
matches as materialized (
  select e.key as id,
         e.value->>'w' as rw,
         case when (e.value->>'h') ~ '^[0-9]+$' then (e.value->>'h')::int end as rh,
         case when (e.value->>'a') ~ '^[0-9]+$' then (e.value->>'a')::int end as ra,
         -- numeric part of the k-id (null for group matches)
         case when e.key ~ '^k[0-9]+$' then substring(e.key from 2)::int end as kn,
         -- ⚡ armband round bucket (k31 third place deliberately excluded)
         case
           when e.key !~ '^k[0-9]+$' then null
           when substring(e.key from 2)::int between 25 and 28 then 'qf'
           when substring(e.key from 2)::int in (29,30)        then 'sf'
           when substring(e.key from 2)::int = 32              then 'fin'
           else null
         end as rnd,
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
-- 🦅 per settled QF+ match: was the recorded winner the LOWER-ranked side?
-- Loser = the other resolved side of the tie; unresolved / unranked ⇒ no row
-- ⇒ no bonus (mirrors upsetWin() in index.html).
upset as materialized (
  select m.id, (wrw.r > wrl.r) as up
  from matches m
  cross join kteams kt
  cross join lateral (
    select case when kt.t->m.id->>'h' = m.rw then kt.t->m.id->>'a'
                when kt.t->m.id->>'a' = m.rw then kt.t->m.id->>'h' end as team
  ) lose
  join wc_rank wrw on wrw.team = m.rw
  join wc_rank wrl on wrl.team = lose.team
  where m.rw is not null and m.kn >= 25
),
champ as materialized (
  select r->>'_champ' as c from results_row
),
players as materialized (
  select substring(key from 11)                       as pslug,   -- after 'wc:player:'
         value::jsonb                                  as j
  from kv where key like 'wc:player:%'
),
-- ⚡ each player's armband targets (optional; absent = no chips). Junk ids are
-- harmless here: the multiplier also requires rnd-bucket + id equality, and
-- save_picks (sql/protect.sql) refuses to store out-of-range / locked values.
chips as materialized (
  select pslug,
         j->'chips'->>'qf'  as c_qf,
         j->'chips'->>'sf'  as c_sf,
         j->'chips'->>'fin' as c_fin
  from players
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
-- 🛡 STREAK SHIELD: drop at most ONE row per player — the FIRST non-exact row
-- with kn>=25 that immediately follows an exact hit (lag over the same engaged
-- sequence). Removing that row makes the run continue across the miss in the
-- islands step below; any later breaking miss then resets as normal. Mirrors
-- the one-skip walk in koStreakBonus(preds,results,shield) in index.html.
ko_shielded as (
  select pslug, kn, exact_hit
  from (
    select pslug, kn, exact_hit, brk,
           sum(case when brk then 1 else 0 end)
             over (partition by pslug order by kn) as nbrk
    from (
      select pslug, kn, exact_hit,
             (not exact_hit and kn >= 25
               and coalesce(lag(exact_hit) over (partition by pslug order by kn), false)) as brk
      from ko
    ) s1
  ) s2
  where not (brk and nbrk = 1)
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
    from ko_shielded
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
        ( ( case when pr.pw = m.rw then m.kadv else 0 end )
          +
          ( case when m.rh is not null and m.ra is not null
                  and pr.ph = m.rh and pr.pa = m.ra
             then m.kbonus else 0 end ) )
        * ( case when (m.rnd = 'qf'  and c.c_qf  = m.id)
                   or (m.rnd = 'sf'  and c.c_sf  = m.id)
                   or (m.rnd = 'fin' and c.c_fin = m.id)
             then 2 else 1 end )                       -- ⚡ armband: multiplies, never creates
        +
        ( case when m.kn >= 25 and pr.pw = m.rw and coalesce(u.up, false)
           then 2 else 0 end )                         -- 🦅 upset: flat +2, never doubled
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
  left join chips c on c.pslug = pr.pslug
  left join upset u on u.id    = m.id
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

revoke all on function public.standings() from public;
grant execute on function public.standings() to anon;

-- Sanity check after running:
-- select * from standings() order by pts desc limit 10;
-- Launch-day proof: re-run the wave-b-vectors.json cases (synthetic kv rows in a
-- transaction → select standings() → assert → rollback) and assert ZERO drift on
-- all real pre-QF rows vs a pre-deploy snapshot of standings().
