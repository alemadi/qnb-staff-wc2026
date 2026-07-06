-- Captured from LIVE (project fzybuasvhzhmkbhxbton) 2026-07-06 ~04:0xZ, immediately
-- before the Wave-B SQL deploy. pg_get_functiondef() verbatim. Running this file
-- restores the pre-Wave-B save_picks (no chips handling). md5(prosrc) of the restored
-- body must be ffa80185167f34b29285226b35947ad0 (md5(pg_get_functiondef) 15d42403e56a80bb867d0d6ea5cc9825).
CREATE OR REPLACE FUNCTION public.save_picks(p_slug text, p_pin text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_hash text; v_stored text;
  cur jsonb; cur_preds jsonb; new_preds jsonb;
  fin jsonb; fin_preds jsonb := '{}'::jsonb;
  k text; v jsonb; pv jsonb;
  v_o text; v_w text; v_h int; v_a int; v_champ text;
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

  insert into kv(key, value, updated_at)
  values ('wc:player:' || p_slug, fin::text, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();

  return fin;
end $function$
