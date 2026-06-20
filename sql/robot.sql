-- PART 1 · core (tables + brain)\n-- ============================================================
-- STAFF CHALLENGE ROBOT — lives entirely inside Supabase.
-- Paste this whole file into the SQL Editor and press Run. Once.
-- Every 10 minutes it: (1) confirms finished GROUP-stage results
-- ~30 minutes after full time, never overwriting the organizer,
-- and (2) snapshots daily leaderboard ranks for the ▲▼ arrows.
-- Knockouts stay human. Pause anytime:
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

create or replace function wc_autoconfirm_tick() returns text
language plpgsql security definer set search_path = public as
$f$
declare
  resp record; payload jsonb; ev jsonb; comp jsonb;
  v_ko timestamptz; espn_h text; espn_a text; s_h int; s_a int; rh int; ra int;
  fx record; cur jsonb; merged jsonb; added int := 0;
  doha text; snapdate text; ranks jsonb; req bigint; url text; fired text := 'no';
begin
  ------------------------------------------------------------------
  -- 1) process the ESPN response fetched on the previous tick
  ------------------------------------------------------------------
  select r.* into resp
    from wc_poll_state s join net._http_response r on r.id = s.request_id
   where s.id = 1;
  if found and resp.status_code = 200 then
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
      if added > 0 then
        insert into kv(key, value, updated_at) values ('wc:results', merged::text, now())
        on conflict (key) do update set value = excluded.value, updated_at = now();
      end if;
    exception when others then
      added := -1;   -- parse failure: report, never block the rest
    end;
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
  -- 3) fire the next ESPN request if any group match is in play range
  ------------------------------------------------------------------
  if exists (select 1 from wc_fixtures where ko > now() - interval '26 hours' and ko < now()) then
    url := 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=120&dates='
        || to_char((now() - interval '26 hours') at time zone 'UTC', 'YYYYMMDD') || '-'
        || to_char(now() at time zone 'UTC', 'YYYYMMDD');
    req := net.http_get(url);
    update wc_poll_state set request_id = req where id = 1;
    fired := 'yes';
  end if;

  return 'confirmed ' || greatest(added,0) || case when added=-1 then ' (parse error)' else '' end
      || ' · snapshot ' || coalesce(snapdate,'-') || '→' || doha || ' · next fetch: ' || fired;
end $f$;
\n-- PART 2 · extensions + schedule + kickoff\n
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('wc-autoconfirm') where exists (select 1 from cron.job where jobname='wc-autoconfirm');
select cron.schedule('wc-autoconfirm', '*/10 * * * *', $$select wc_autoconfirm_tick()$$);
select wc_autoconfirm_tick();   -- first fetch fires now; first confirms land on the next tick
