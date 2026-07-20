-- PART 1 · core (tables + brain)
-- ============================================================
-- STAFF CHALLENGE ROBOT — lives entirely inside Supabase.
-- Paste this whole file into the SQL Editor and press Run. Once.
-- Every 10 minutes it: (1) confirms finished GROUP-stage results
-- ~30 minutes after full time, never overwriting the organizer,
-- (2) confirms finished KNOCKOUT results the same way — winner +
-- final score (after extra time, penalties excluded) — deriving
-- each tie's teams from the live bracket, and (3) snapshots daily
-- leaderboard ranks for the ▲▼ arrows.
-- The champion pick (+25) stays a deliberate organizer action.
-- Pause anytime:
--   select cron.unschedule('wc-autoconfirm');
-- ============================================================

create table if not exists wc_fixtures(id text primary key, ko timestamptz not null, home text not null, away text not null);
insert into wc_fixtures(id,ko,home,away) values
('m1','2026-06-11T19:00:00Z','Mexico','South Africa'),
('m2','2026-06-12T02:00:00Z','South Korea','Czechia'),
('m3','2026-06-12T19:00:00Z','Canada','Bosnia & H.'),
('m4','2026-06-13T01:00:00Z','USA','Paraguay'),
('m5','2026-06-13T19:00:00Z','Qatar','Switzerland'),
('m6','2026-06-13T22:00:00Z','Brazil','Morocco'),
('m7','2026-06-14T01:00:00Z','Haiti','Scotland'),
('m8','2026-06-14T04:00:00Z','Australia','Türkiye'),
('m9','2026-06-14T17:00:00Z','Germany','Curaçao'),
('m10','2026-06-14T20:00:00Z','Netherlands','Japan'),
('m11','2026-06-14T23:00:00Z','Ivory Coast','Ecuador'),
('m12','2026-06-15T02:00:00Z','Sweden','Tunisia'),
('m13','2026-06-15T16:00:00Z','Spain','Cape Verde'),
('m14','2026-06-15T19:00:00Z','Belgium','Egypt'),
('m15','2026-06-15T22:00:00Z','Saudi Arabia','Uruguay'),
('m16','2026-06-16T01:00:00Z','Iran','New Zealand'),
('m17','2026-06-16T19:00:00Z','France','Senegal'),
('m18','2026-06-16T22:00:00Z','Iraq','Norway'),
('m19','2026-06-17T01:00:00Z','Argentina','Algeria'),
('m20','2026-06-17T04:00:00Z','Austria','Jordan'),
('m21','2026-06-17T17:00:00Z','Portugal','DR Congo'),
('m22','2026-06-17T20:00:00Z','England','Croatia'),
('m23','2026-06-17T23:00:00Z','Ghana','Panama'),
('m24','2026-06-18T02:00:00Z','Uzbekistan','Colombia'),
('m25','2026-06-18T16:00:00Z','Czechia','South Africa'),
('m26','2026-06-18T19:00:00Z','Switzerland','Bosnia & H.'),
('m27','2026-06-18T22:00:00Z','Canada','Qatar'),
('m28','2026-06-19T01:00:00Z','Mexico','South Korea'),
('m29','2026-06-19T19:00:00Z','USA','Australia'),
('m30','2026-06-19T22:00:00Z','Scotland','Morocco'),
('m31','2026-06-20T00:30:00Z','Brazil','Haiti'),
('m32','2026-06-20T03:00:00Z','Türkiye','Paraguay'),
('m33','2026-06-20T17:00:00Z','Netherlands','Sweden'),
('m34','2026-06-20T20:00:00Z','Germany','Ivory Coast'),
('m35','2026-06-21T00:00:00Z','Ecuador','Curaçao'),
('m36','2026-06-21T04:00:00Z','Tunisia','Japan'),
('m37','2026-06-21T16:00:00Z','Spain','Saudi Arabia'),
('m38','2026-06-21T19:00:00Z','Belgium','Iran'),
('m39','2026-06-21T22:00:00Z','Uruguay','Cape Verde'),
('m40','2026-06-22T01:00:00Z','New Zealand','Egypt'),
('m41','2026-06-22T17:00:00Z','Argentina','Austria'),
('m42','2026-06-22T21:00:00Z','France','Iraq'),
('m43','2026-06-23T00:00:00Z','Norway','Senegal'),
('m44','2026-06-23T03:00:00Z','Jordan','Algeria'),
('m45','2026-06-23T17:00:00Z','Portugal','Uzbekistan'),
('m46','2026-06-23T20:00:00Z','England','Ghana'),
('m47','2026-06-23T23:00:00Z','Panama','Croatia'),
('m48','2026-06-24T02:00:00Z','Colombia','DR Congo'),
('m49','2026-06-24T19:00:00Z','Switzerland','Canada'),
('m50','2026-06-24T19:00:00Z','Bosnia & H.','Qatar'),
('m51','2026-06-24T22:00:00Z','Scotland','Brazil'),
('m52','2026-06-24T22:00:00Z','Morocco','Haiti'),
('m53','2026-06-25T01:00:00Z','Czechia','Mexico'),
('m54','2026-06-25T01:00:00Z','South Africa','South Korea'),
('m55','2026-06-25T20:00:00Z','Ecuador','Germany'),
('m56','2026-06-25T20:00:00Z','Curaçao','Ivory Coast'),
('m57','2026-06-25T23:00:00Z','Japan','Sweden'),
('m58','2026-06-25T23:00:00Z','Tunisia','Netherlands'),
('m59','2026-06-26T02:00:00Z','Türkiye','USA'),
('m60','2026-06-26T02:00:00Z','Paraguay','Australia'),
('m61','2026-06-26T19:00:00Z','Norway','France'),
('m62','2026-06-26T19:00:00Z','Senegal','Iraq'),
('m63','2026-06-27T00:00:00Z','Cape Verde','Saudi Arabia'),
('m64','2026-06-27T00:00:00Z','Uruguay','Spain'),
('m65','2026-06-27T03:00:00Z','Egypt','Iran'),
('m66','2026-06-27T03:00:00Z','New Zealand','Belgium'),
('m67','2026-06-27T21:00:00Z','Panama','England'),
('m68','2026-06-27T21:00:00Z','Croatia','Ghana'),
('m69','2026-06-27T23:30:00Z','Colombia','Portugal'),
('m70','2026-06-27T23:30:00Z','DR Congo','Uzbekistan'),
('m71','2026-06-28T02:00:00Z','Algeria','Austria'),
('m72','2026-06-28T02:00:00Z','Jordan','Argentina')
on conflict (id) do nothing;

create table if not exists wc_alias(espn text primary key, ours text not null);
insert into wc_alias(espn,ours) values
 ('unitedstates','USA'),('turkey','Türkiye'),('czechrepublic','Czechia'),
 ('bosniaandherzegovina','Bosnia & H.'),('bosniaherzegovina','Bosnia & H.'),
 ('cotedivoire','Ivory Coast'),
 ('capeverdeislands','Cape Verde'),('caboverde','Cape Verde'),
 ('congodr','DR Congo'),('democraticrepublicofthecongo','DR Congo'),
 ('iriran','Iran'),('korearepublic','South Korea')
on conflict (espn) do nothing;

create table if not exists wc_poll_state(id int primary key default 1, request_id bigint);
insert into wc_poll_state(id) values (1) on conflict do nothing;

create or replace function wc_norm(s text) returns text language sql immutable as
$f$ select regexp_replace(translate(lower(coalesce(s,'')),
  'üçáàâãéèêíìîóòôõúùûñ','ucaaaaeeeiiioooouuun'),
  '[^a-z0-9]','','g') $f$;

create or replace function wc_ourname(espn_name text) returns text language sql stable as
$f$ select coalesce(
  (select ours from wc_alias where espn=wc_norm(espn_name)),
  (select home from wc_fixtures where wc_norm(home)=wc_norm(espn_name) limit 1),
  (select away from wc_fixtures where wc_norm(away)=wc_norm(espn_name) limit 1)) $f$;

-- ============================================================
-- PART 1b · knockout schedule + bracket resolver
-- Mirrors the FIXTURES/BRACKET/koTeams logic in index.html so the
-- robot can place each ESPN knockout game on the right tie with the
-- same HOME/AWAY orientation players saw (koScoreHit is orientation-
-- sensitive). R32 home is always a group Winner/Runner-up (a
-- deterministic seed), so the gnarly "best 8 thirds" allocation is
-- never needed — the away best-third team is read straight from ESPN.
-- ============================================================

-- Per-tie schedule. R32 rows carry group-position specs ('1A' = Winners A,
-- '2B' = Runners-up B, '3' = best-third → away only). R16→final rows carry
-- their two feeder ties + take ('W' winners advance, 'L' losers → 3rd place).
create table if not exists wc_ko_sched(
  id text primary key,
  ko timestamptz not null,
  round text not null,
  home_spec text,
  away_spec text,
  home_feeder text,
  away_feeder text,
  take text
);
insert into wc_ko_sched(id,ko,round,home_spec,away_spec,home_feeder,away_feeder,take) values
 ('k1','2026-06-28T19:00:00Z','R32','2A','2B',null,null,null),
 ('k2','2026-06-29T17:00:00Z','R32','1C','2F',null,null,null),
 ('k3','2026-06-29T20:30:00Z','R32','1E','3',null,null,null),
 ('k4','2026-06-30T01:00:00Z','R32','1F','2C',null,null,null),
 ('k5','2026-06-30T17:00:00Z','R32','2E','2I',null,null,null),
 ('k6','2026-06-30T21:00:00Z','R32','1I','3',null,null,null),
 ('k7','2026-07-01T01:00:00Z','R32','1A','3',null,null,null),
 ('k8','2026-07-01T16:00:00Z','R32','1L','3',null,null,null),
 ('k9','2026-07-01T20:00:00Z','R32','1G','3',null,null,null),
 ('k10','2026-07-02T00:00:00Z','R32','1D','3',null,null,null),
 ('k11','2026-07-02T19:00:00Z','R32','1H','2J',null,null,null),
 ('k12','2026-07-02T23:00:00Z','R32','2K','2L',null,null,null),
 ('k13','2026-07-03T03:00:00Z','R32','1B','3',null,null,null),
 ('k14','2026-07-03T18:00:00Z','R32','2D','2G',null,null,null),
 ('k15','2026-07-03T22:00:00Z','R32','1J','2H',null,null,null),
 ('k16','2026-07-04T01:30:00Z','R32','1K','3',null,null,null),
 ('k17','2026-07-04T17:00:00Z','R16',null,null,'k1','k4','W'),
 ('k18','2026-07-04T21:00:00Z','R16',null,null,'k3','k6','W'),
 ('k19','2026-07-05T20:00:00Z','R16',null,null,'k2','k5','W'),
 ('k20','2026-07-06T00:00:00Z','R16',null,null,'k7','k8','W'),
 ('k21','2026-07-06T19:00:00Z','R16',null,null,'k12','k11','W'),
 ('k22','2026-07-07T00:00:00Z','R16',null,null,'k10','k9','W'),
 ('k23','2026-07-07T16:00:00Z','R16',null,null,'k15','k14','W'),
 ('k24','2026-07-07T20:00:00Z','R16',null,null,'k13','k16','W'),
 ('k25','2026-07-09T20:00:00Z','QF',null,null,'k18','k17','W'),
 ('k26','2026-07-10T19:00:00Z','QF',null,null,'k21','k22','W'),
 ('k27','2026-07-11T21:00:00Z','QF',null,null,'k19','k20','W'),
 ('k28','2026-07-12T01:00:00Z','QF',null,null,'k23','k24','W'),
 ('k29','2026-07-14T19:00:00Z','SF',null,null,'k25','k26','W'),
 ('k30','2026-07-15T19:00:00Z','SF',null,null,'k27','k28','W'),
 ('k31','2026-07-18T21:00:00Z','FINAL',null,null,'k29','k30','L'),
 ('k32','2026-07-19T19:00:00Z','FINAL',null,null,'k29','k30','W')
on conflict (id) do update set
  ko=excluded.ko, round=excluded.round,
  home_spec=excluded.home_spec, away_spec=excluded.away_spec,
  home_feeder=excluded.home_feeder, away_feeder=excluded.away_feeder, take=excluded.take;

-- A feeder tie's contribution to the next round: the winner ('W'), or — for the
-- third-place match ('L') — the loser (the resolved-pair team that did not win).
-- Mirrors feed()/pairOf()/winnerOf() in index.html (organizer kteams override
-- wins over the auto-derived pair, exactly like koTeams).
create or replace function wc_ko_feed(feeder text, take text, res jsonb, resolved jsonb, ovr jsonb)
returns text language plpgsql immutable as $f$
declare w text; ph text; pa text;
begin
  w := res->feeder->>'w';
  if w is null then return null; end if;            -- feeder not decided yet
  if take = 'W' then return w; end if;
  ph := coalesce(nullif(ovr->feeder->>'h',''), resolved->feeder->>'h');
  pa := coalesce(nullif(ovr->feeder->>'a',''), resolved->feeder->>'a');
  if w = ph then return pa; elsif w = pa then return ph; else return null; end if;
end $f$;

-- Resolve every knockout tie's HOME/AWAY teams (app orientation) from the
-- current results + organizer kteams override. Returns { kID: {h,a} } with only
-- the slots it can resolve; an unresolved away (best-third) is simply omitted.
create or replace function wc_ko_teams(res jsonb, ovr jsonb default '{}'::jsonb)
returns jsonb language plpgsql stable set search_path = public as $f$
declare
  win jsonb := '{}'::jsonb;     -- {A:'Mexico', ...}  group winners
  run jsonb := '{}'::jsonb;     -- {A:'South Africa', ...}  group runners-up
  out jsonb := '{}'::jsonb;     -- {k1:{h,a}, ...}
  rec record; k record;
  ngroups int;
  ht text; at_ text; ov_h text; ov_a text;
  validset text[];
begin
  -- every real team name (used to validate an organizer override, like FL[name])
  select array_agg(distinct t) into validset
    from (select home t from wc_fixtures union select away from wc_fixtures) z;

  -- group winner/runner-up — only once the whole group stage is in (groupStageComplete)
  select count(*) into ngroups
    from jsonb_each(res) e
    where e.key ~ '^m[0-9]+$'
      and (e.value->>'h') ~ '^[0-9]+$' and (e.value->>'a') ~ '^[0-9]+$';
  if ngroups >= 72 then
    for rec in
      with seeds(team,letter) as (values
        ('Mexico','A'),('Canada','B'),('Brazil','C'),('USA','D'),('Germany','E'),('Netherlands','F'),
        ('Belgium','G'),('Spain','H'),('France','I'),('Argentina','J'),('Colombia','K'),('England','L')),
      gteams as (   -- a group = its pot-1 seed + the three teams the seed plays
        select letter, team from seeds
        union
        select s.letter, case when f.home = s.team then f.away else f.home end
        from seeds s join wc_fixtures f on (f.home = s.team or f.away = s.team)),
      gres as (
        select gt.letter, f.home, f.away,
               (res->f.id->>'h')::int h, (res->f.id->>'a')::int a
        from wc_fixtures f
        join gteams gt on gt.team = f.home
        where (res->f.id->>'h') ~ '^[0-9]+$' and (res->f.id->>'a') ~ '^[0-9]+$'),
      perteam as (
        select letter, team, sum(pts) pts, sum(gf-ga) gd, sum(gf) gf
        from (
          select letter, home team, case when h>a then 3 when h=a then 1 else 0 end pts, h gf, a ga from gres
          union all
          select letter, away team, case when a>h then 3 when a=h then 1 else 0 end pts, a gf, h ga from gres
        ) z group by letter, team),
      ranked as (   -- FIFA group order: Pts, GD, GF, then team name (no head-to-head)
        select letter, team,
               row_number() over (partition by letter order by pts desc, gd desc, gf desc, team) pos
        from perteam)
      select letter, pos, team from ranked where pos <= 2
    loop
      if rec.pos = 1 then win := jsonb_set(win, array[rec.letter], to_jsonb(rec.team));
      else                 run := jsonb_set(run, array[rec.letter], to_jsonb(rec.team)); end if;
    end loop;

    for k in select id, home_spec, away_spec from wc_ko_sched where round = 'R32' loop
      ht  := case when left(k.home_spec,1)='1' then win->>substring(k.home_spec from 2)
                  when left(k.home_spec,1)='2' then run->>substring(k.home_spec from 2) else null end;
      at_ := case when left(k.away_spec,1)='1' then win->>substring(k.away_spec from 2)
                  when left(k.away_spec,1)='2' then run->>substring(k.away_spec from 2) else null end;
      ov_h := ovr->k.id->>'h'; ov_a := ovr->k.id->>'a';
      if ov_h is not null and ov_h = any(validset) then ht  := ov_h; end if;
      if ov_a is not null and ov_a = any(validset) then at_ := ov_a; end if;
      if ht is not null or at_ is not null then
        out := jsonb_set(out, array[k.id], jsonb_strip_nulls(jsonb_build_object('h', ht, 'a', at_)));
      end if;
    end loop;
  end if;

  -- R16 → final: feeders are declared earlier than their consumers, so one
  -- forward pass (ascending k-number) settles the whole upper bracket.
  for k in select id, home_feeder, away_feeder, take from wc_ko_sched
           where round <> 'R32' order by (substring(id from 2))::int loop
    ht  := wc_ko_feed(k.home_feeder, k.take, res, out, ovr);
    at_ := wc_ko_feed(k.away_feeder, k.take, res, out, ovr);
    ov_h := ovr->k.id->>'h'; ov_a := ovr->k.id->>'a';
    if ov_h is not null and ov_h = any(validset) then ht  := ov_h; end if;
    if ov_a is not null and ov_a = any(validset) then at_ := ov_a; end if;
    if ht is not null or at_ is not null then
      out := jsonb_set(out, array[k.id], jsonb_strip_nulls(jsonb_build_object('h', ht, 'a', at_)));
    end if;
  end loop;

  return out;
end $f$;

-- ============================================================
-- the brain
-- ============================================================
create or replace function wc_autoconfirm_tick() returns text
language plpgsql security definer set search_path = public as
$f$
declare
  resp record; payload jsonb; ev jsonb; comp jsonb;
  v_ko timestamptz; espn_h text; espn_a text; s_h int; s_a int; rh int; ra int;
  fx record; cur jsonb; merged jsonb; added int := 0;
  doha text; snapdate text; ranks jsonb; req bigint; url text; fired text := 'no';
  -- knockout confirm
  ko_ovr jsonb; ko_teams jsonb; pass int; ko_added int; ko_total int := 0; kf record; kev jsonb; kcomp jsonb;
  kdt timestamptz; kh_name text; ka_name text; kh_score text; ka_score text;
  kh_win boolean; ka_win boolean; v_w text; krh int; kra int;
begin
  ------------------------------------------------------------------
  -- 1) process the ESPN response fetched on the previous tick
  ------------------------------------------------------------------
  select r.* into resp
    from wc_poll_state s join net._http_response r on r.id = s.request_id
   where s.id = 1;
  if found and resp.status_code = 200 then
    ----------------------------------------------------------------
    -- 1a) confirm finished GROUP-stage results
    ----------------------------------------------------------------
    begin
      payload := resp.content::jsonb;
      select value::jsonb into cur from kv where key = 'wc:results';
      if cur is null then cur := '{}'::jsonb; end if;
      merged := cur;
      for ev in select * from jsonb_array_elements(coalesce(payload->'events','[]'::jsonb)) loop
        comp := coalesce(ev->'competitions'->0, '{}'::jsonb);
        if coalesce((comp->'status'->'type'->>'completed')::boolean, false) is not true then continue; end if;
        v_ko := (ev->>'date')::timestamptz;
        if v_ko is null or now() - v_ko < interval '130 minutes' then continue; end if;   -- calm window after FT
        espn_h := null; espn_a := null; s_h := null; s_a := null;
        select wc_ourname(c->'team'->>'displayName'), (c->>'score')::int into espn_h, s_h
          from jsonb_array_elements(comp->'competitors') c where c->>'homeAway' = 'home' limit 1;
        select wc_ourname(c->'team'->>'displayName'), (c->>'score')::int into espn_a, s_a
          from jsonb_array_elements(comp->'competitors') c where c->>'homeAway' = 'away' limit 1;
        if espn_h is null or espn_a is null then continue; end if;                    -- both names or nothing
        select * into fx from wc_fixtures f
         where abs(extract(epoch from (f.ko - v_ko))) <= 900
           and ((f.home = espn_h and f.away = espn_a) or (f.home = espn_a and f.away = espn_h))
         limit 1;
        if not found then continue; end if;                                           -- group fixtures only
        if merged ? fx.id then continue; end if;                                      -- organizer always wins
        if fx.home = espn_h then rh := s_h; ra := s_a; else rh := s_a; ra := s_h; end if;
        if rh is null or ra is null or rh < 0 or ra < 0 or rh > 20 or ra > 20 then continue; end if;
        merged := jsonb_set(merged, array[fx.id], jsonb_build_object('h', rh, 'a', ra));
        added := added + 1;
      end loop;
    exception when others then
      added := -1;   -- parse failure: report, never block the rest
    end;

    ----------------------------------------------------------------
    -- 1b) confirm finished KNOCKOUT results from the same payload.
    --     Match each due tie by its HOME team (a deterministic group
    --     seed for R32, a feeder winner for R16+), then record the
    --     winner + the final score (ET, penalties excluded) in the
    --     app's home/away orientation. Organizer entries always win.
    ----------------------------------------------------------------
    if added >= 0 and payload is not null then
      begin
        ko_ovr := coalesce((select value::jsonb from kv where key = 'wc:kteams'), '{}'::jsonb);
        -- a few passes so a round recorded this run can seed the next one
        for pass in 1..6 loop
          ko_added := 0;
          ko_teams := wc_ko_teams(merged, ko_ovr);
          for kf in
            select s.id as kid, s.ko as kko, ko_teams->s.id->>'h' as home_team
            from wc_ko_sched s
            where now() - s.ko >= interval '130 minutes'      -- calm window after FT (ET/pens long-settled)
              and not (merged ? s.id)                          -- organizer / earlier tick wins
              and ko_teams->s.id->>'h' is not null             -- this tie's teams are known
          loop
            v_w := null; krh := null; kra := null;
            for kev in select * from jsonb_array_elements(coalesce(payload->'events','[]'::jsonb)) loop
              kcomp := coalesce(kev->'competitions'->0, '{}'::jsonb);
              if coalesce((kcomp->'status'->'type'->>'completed')::boolean, false) is not true then continue; end if;
              kdt := (kev->>'date')::timestamptz;
              if kdt is null or abs(extract(epoch from (kdt - kf.kko))) > 21600 then continue; end if;  -- ±6h of this tie
              select wc_ourname(c->'team'->>'displayName'), c->>'score', coalesce((c->>'winner')::boolean,false)
                into kh_name, kh_score, kh_win
                from jsonb_array_elements(kcomp->'competitors') c where c->>'homeAway' = 'home' limit 1;
              select wc_ourname(c->'team'->>'displayName'), c->>'score', coalesce((c->>'winner')::boolean,false)
                into ka_name, ka_score, ka_win
                from jsonb_array_elements(kcomp->'competitors') c where c->>'homeAway' = 'away' limit 1;
              if kh_name is null or ka_name is null then continue; end if;
              -- orient by OUR home team (ESPN's home/away for a neutral tie may differ)
              if kf.home_team = kh_name then
                krh := nullif(kh_score,'')::int; kra := nullif(ka_score,'')::int;
                v_w := case when kh_win then kh_name when ka_win then ka_name else null end;
              elsif kf.home_team = ka_name then
                krh := nullif(ka_score,'')::int; kra := nullif(kh_score,'')::int;
                v_w := case when ka_win then ka_name when kh_win then kh_name else null end;
              else
                continue;                                       -- not this tie's game
              end if;
              exit;                                             -- matched
            end loop;
            -- record only a clean, sane, winner-bearing result (score = ET, no pens)
            if v_w is not null and krh is not null and kra is not null
               and krh between 0 and 20 and kra between 0 and 20 then
              merged := jsonb_set(merged, array[kf.kid], jsonb_build_object('w', v_w, 'h', krh, 'a', kra));
              ko_added := ko_added + 1;
              ko_total := ko_total + 1;
              added := greatest(added,0) + 1;
            end if;
          end loop;
          exit when ko_added = 0;
        end loop;
      exception when others then
        null;   -- knockout confirm never blocks group confirm / snapshot
      end;
    end if;

    if added > 0 then
      insert into kv(key, value, updated_at) values ('wc:results', merged::text, now())
      on conflict (key) do update set value = excluded.value, updated_at = now();
    end if;
    update wc_poll_state set request_id = null where id = 1;                          -- consume once
  end if;

  ------------------------------------------------------------------
  -- 2) daily rank snapshot for the leaderboard ▲▼ arrows
  ------------------------------------------------------------------
  begin
    doha := to_char((now() at time zone 'Asia/Qatar')::date, 'YYYY-MM-DD');
    select value::jsonb->>'date' into snapdate from kv where key = 'wc:ranksnap';
    if snapdate is distinct from doha then
      select jsonb_object_agg(slug, rnk) into ranks
        from (select slug, rank() over (order by pts desc, predicted desc, exact desc, correct desc) as rnk
                from standings()) t;
      if ranks is not null then
        insert into kv(key, value, updated_at)
        values ('wc:ranksnap', jsonb_build_object('date', doha, 'ranks', ranks)::text, now())
        on conflict (key) do update set value = excluded.value, updated_at = now();
      end if;
    end if;
  exception when others then null;                                                    -- snapshot never blocks confirms
  end;

  ------------------------------------------------------------------
  -- 3) fire the next ESPN request if any group OR knockout match is in play range
  ------------------------------------------------------------------
  if exists (select 1 from wc_fixtures where ko > now() - interval '26 hours' and ko < now())
     or exists (select 1 from wc_ko_sched where ko > now() - interval '26 hours' and ko < now()) then
    url := 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=120&dates='
        || to_char((now() - interval '26 hours') at time zone 'UTC', 'YYYYMMDD') || '-'
        || to_char(now() at time zone 'UTC', 'YYYYMMDD');
    req := net.http_get(url);
    update wc_poll_state set request_id = req where id = 1;
    fired := 'yes';
  end if;

  return 'confirmed ' || greatest(added,0) || case when added=-1 then ' (parse error)' else '' end
      || ' (ko ' || ko_total || ')'
      || ' · snapshot ' || coalesce(snapdate,'-') || '→' || doha || ' · next fetch: ' || fired;
end $f$;

-- PART 2 · extensions + schedule + kickoff
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('wc-autoconfirm') where exists (select 1 from cron.job where jobname='wc-autoconfirm');
select cron.schedule('wc-autoconfirm', '*/10 * * * *', $$select wc_autoconfirm_tick()$$);
select wc_autoconfirm_tick();   -- first fetch fires now; first confirms land on the next tick
