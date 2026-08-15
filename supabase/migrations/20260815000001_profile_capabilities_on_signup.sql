-- ============================================================
-- 20260815000001_profile_capabilities_on_signup.sql
-- Capacidades declaradas en el registro (MVP §19).
--
-- El registro exige "tipo de participación", que en este proyecto son
-- capacidades multi-selección (decisión 2 del plan de implementación), nunca
-- roles excluyentes. Cuando las confirmaciones de correo están activas no hay
-- sesión inmediatamente después del signup, así que el cliente no puede
-- escribir en profile_capabilities: las capacidades viajan como arreglo de
-- slugs en la metadata del usuario y este trigger las materializa junto con el
-- perfil, en la misma transacción.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
  v_municipality_slug text;
  v_municipality_id smallint;
  v_capabilities jsonb;
begin
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    split_part(new.email, '@', 1),
    'Usuario'
  );
  v_municipality_slug := nullif(trim(new.raw_user_meta_data ->> 'municipality'), '');

  if v_municipality_slug is not null then
    select m.id into v_municipality_id
    from public.municipalities m
    where m.slug = v_municipality_slug;
  end if;

  insert into public.profiles (id, display_name, municipality_id)
  values (new.id, left(v_display_name, 80), v_municipality_id)
  on conflict (id) do nothing;

  -- Se unen contra el catálogo, así que un slug inexistente se ignora en vez
  -- de romper el registro. Si la metadata no trae un arreglo, no se toca nada.
  v_capabilities := new.raw_user_meta_data -> 'capabilities';

  if jsonb_typeof(v_capabilities) = 'array' then
    insert into public.profile_capabilities (profile_id, capability_id)
    select new.id, c.id
    from public.capabilities c
    where c.slug in (select jsonb_array_elements_text(v_capabilities))
    on conflict do nothing;
  end if;

  return new;
end;
$$;
