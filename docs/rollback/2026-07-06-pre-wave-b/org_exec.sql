-- Captured from LIVE (project fzybuasvhzhmkbhxbton) 2026-07-06 ~04:0xZ, immediately
-- before the Wave-B SQL deploy. pg_get_functiondef() verbatim. Running this file
-- restores the pre-Wave-B org_exec (key whitelist WITHOUT wc:powerups_live).
-- md5(prosrc) of the restored body must be 043f1e8eba8cf6732c0058a9ff3db921
-- (md5(pg_get_functiondef) 4be63e1808d1b5a6f82ff333248e2177).
CREATE OR REPLACE FUNCTION public.org_exec(p_code text, p_op text, p_key text, p_value text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v jsonb; v_slug text;
begin
  if not public.org_check(p_code) then
    raise exception 'bad_code';
  end if;

  if p_op = 'set' then
    if p_key is null or p_key !~ '^wc:(results|kteams|player:[a-z0-9._]{1,30})$' then
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
    if p_key is null or p_key !~ '^wc:(results|kteams|player:[a-z0-9._]{1,30})$' then
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
end $function$
