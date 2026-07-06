-- Pre-change public.org_exec — the exact source deployed live before the
-- 2026-07-06 safeguards change (audit journal). Extracted from
-- sql/protect.sql @ a4c4180 (the Wave-B step-① deploy source); verified
-- against LIVE immediately pre-change:
--   md5(prosrc)             65fb143cb8ea004a3ed6b91b8beb05aa
--   md5(pg_get_functiondef) 2d102e90e4e9273cc964baabe081cff6
-- To roll back: paste this whole file into the SQL editor and Run, then
-- re-verify both md5s above. Grants are preserved by CREATE OR REPLACE.
create or replace function public.org_exec(p_code text, p_op text, p_key text, p_value text default null)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $f$
declare v jsonb; v_slug text;
begin
  if not public.org_check(p_code) then
    raise exception 'bad_code';
  end if;

  if p_op = 'set' then
    if p_key is null or p_key !~ '^wc:(results|kteams|powerups_live|player:[a-z0-9._]{1,30})$' then
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
    if p_key is null or p_key !~ '^wc:(results|kteams|powerups_live|player:[a-z0-9._]{1,30})$' then
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
end $f$;
