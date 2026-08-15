-- ============================================================
-- 0002_functions_triggers.sql
-- Funciones security definer + triggers de integridad.
-- ============================================================

-- ---------- Helpers de autorización (security definer) ----------

-- Email verificado (fuente de verdad: auth.users.email_confirmed_at)
create or replace function public.is_email_verified()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  )
$$;

-- Usuario baneado/suspendido
create or replace function public.is_banned(p_target_uid uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = coalesce(p_target_uid, auth.uid())
      and p.banned_at is not null
  )
$$;

-- ¿Es administrador?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.app_role = 'ADMIN'
      and p.banned_at is null
  )
$$;

-- ¿Es el dueño de la necesidad?
create or replace function public.is_need_owner(p_need_id uuid, p_user_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.needs n
    where n.id = p_need_id
      and n.user_id = coalesce(p_user_id, auth.uid())
  )
$$;

-- ¿Puede gestionar imágenes de la necesidad (subir/editar/borrar)?
-- Usado por las políticas de Storage.
create or replace function public.can_manage_need_images(p_need_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_email_verified()
    and (public.is_need_owner(p_need_id) or public.is_admin())
$$;

-- Variante para políticas de Storage: extrae el need_id del path
-- 'needs/{needId}/{imageId}.ext' de forma segura (sin excepciones).
create or replace function public.can_manage_need_images_path(p_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_need_id uuid;
begin
  begin
    v_need_id := (storage.foldername(p_path))[2]::uuid;
  exception
    when others then
      return false;
  end;
  return public.can_manage_need_images(v_need_id);
end;
$$;

-- ---------- Contacto: revelación controlada y trazable ----------

-- Devuelve contacto privado SOLO a usuarios relacionados con la necesidad
-- (dueño o oferente no cancelado) y registra cada revelación.
-- Parámetro llamado `need_id` para que PostgREST acepte {"need_id": ...}.
-- security definer + VOLATILE porque escribe en contact_access_log.
create or replace function public.get_need_contact(need_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_need uuid := need_id;
  v_need_user uuid;
  v_result jsonb;
  v_is_owner boolean;
  v_is_offerer boolean;
begin
  if not public.is_email_verified() then
    return null;
  end if;

  select n.user_id into v_need_user
  from public.needs n
  where n.id = v_need;

  if v_need_user is null then
    return null;
  end if;

  v_is_owner := (v_need_user = auth.uid());
  v_is_offerer := exists (
    select 1 from public.help_offers ho
    where ho.need_id = v_need
      and ho.user_id = auth.uid()
      and ho.status <> 'CANCELLED'
  );

  -- El dueño ve a quienes se ofrecieron (no cancelados) con su teléfono si lo tienen
  if v_is_owner then
    select jsonb_build_object(
      'owner', null,
      'offerers', coalesce(
        jsonb_agg(
          jsonb_build_object(
            'user_id', pp.id,
            'display_name', pp.display_name,
            'phone', ph.phone,
            'offer_id', ho.id,
            'offer_status', ho.status
          )
        ),
        '[]'::jsonb
      )
    )
    into v_result
    from public.help_offers ho
    join public.profiles pp on pp.id = ho.user_id
    left join public.profile_phone ph on ph.profile_id = ho.user_id
    where ho.need_id = v_need
      and ho.status <> 'CANCELLED';

    insert into public.contact_access_log (need_id, viewer_id)
    values (v_need, auth.uid());

    return v_result;
  end if;

  -- Un oferente ve el teléfono y la dirección del dueño
  if v_is_offerer then
    select jsonb_build_object(
      'owner', jsonb_build_object(
        'user_id', pp.id,
        'display_name', pp.display_name,
        'phone', ph.phone,
        'address', na.address
      ),
      'offerers', null
    )
    into v_result
    from public.profiles pp
    left join public.profile_phone ph on ph.profile_id = pp.id
    left join public.need_address na on na.need_id = v_need
    where pp.id = v_need_user;

    insert into public.contact_access_log (need_id, viewer_id)
    values (v_need, auth.uid());

    return v_result;
  end if;

  return null;
end;
$$;

-- ---------- Triggers ----------

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger needs_set_updated_at before update on public.needs
  for each row execute function public.set_updated_at();
create trigger help_offers_set_updated_at before update on public.help_offers
  for each row execute function public.set_updated_at();
create trigger profile_phone_set_updated_at before update on public.profile_phone
  for each row execute function public.set_updated_at();
create trigger need_address_set_updated_at before update on public.need_address
  for each row execute function public.set_updated_at();

-- Perfil garantizado al crear el usuario (ARCH §14)
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

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- No ofrecerse ayuda a sí mismo.
-- security definer: es una regla de integridad y debe ver la necesidad
-- independientemente de la RLS del llamador (la RLS ya autoriza el INSERT).
create or replace function public.prevent_self_offer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  select n.user_id into v_owner
  from public.needs n
  where n.id = new.need_id;

  if v_owner is null then
    raise exception 'La necesidad no existe';
  end if;

  if v_owner = new.user_id then
    raise exception 'No puedes ofrecer ayuda en tu propia necesidad';
  end if;

  return new;
end;
$$;

create trigger prevent_self_offer before insert on public.help_offers
  for each row execute function public.prevent_self_offer();

-- Oferta solo en necesidad activa (OPEN/IN_PROGRESS).
-- security definer: regla de integridad; ve la necesidad sin depender de la RLS.
create or replace function public.prevent_offer_on_inactive_need()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.need_status;
  v_hidden boolean;
begin
  select n.status, n.is_hidden into v_status, v_hidden
  from public.needs n
  where n.id = new.need_id;

  if not found then
    raise exception 'La necesidad no existe';
  end if;

  if v_hidden then
    raise exception 'Esta necesidad no está disponible';
  end if;

  if v_status not in ('OPEN', 'IN_PROGRESS') then
    raise exception 'Esta necesidad ya no acepta nuevas ofertas';
  end if;

  return new;
end;
$$;

create trigger prevent_offer_on_inactive_need before insert on public.help_offers
  for each row execute function public.prevent_offer_on_inactive_need();

-- Transiciones de estado de oferta controladas
-- (dueño de la necesidad avanza/rechaza; oferente solo cancela/edita mensaje).
create or replace function public.validate_offer_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_need_owner uuid;
  v_old_rank int;
  v_new_rank int;
  v_actor uuid;
begin
  v_actor := auth.uid();
  v_old_rank := case old.status
    when 'CANCELLED' then 0
    when 'OFFERED' then 1
    when 'CONTACTED' then 2
    when 'AGREED' then 3
    when 'COMPLETED' then 4
    when 'CONFIRMED' then 5
  end;
  v_new_rank := case new.status
    when 'CANCELLED' then 0
    when 'OFFERED' then 1
    when 'CONTACTED' then 2
    when 'AGREED' then 3
    when 'COMPLETED' then 4
    when 'CONFIRMED' then 5
  end;

  -- Una oferta cancelada es terminal
  if old.status = 'CANCELLED' and new.status <> 'CANCELLED' then
    raise exception 'Una oferta cancelada no puede reactivarse';
  end if;

  -- Sin cambio de estado (p. ej. edición de mensaje): permitido
  if old.status = new.status then
    return new;
  end if;

  select n.user_id into v_need_owner
  from public.needs n
  where n.id = old.need_id;

  if v_need_owner = v_actor then
    -- El dueño de la necesidad avanza la oferta o la rechaza
    if new.status = 'CANCELLED' then
      return new;
    end if;
    if new.status in ('CONTACTED', 'AGREED', 'COMPLETED', 'CONFIRMED')
       and v_new_rank > v_old_rank then
      return new;
    end if;
    raise exception 'Transición de estado de oferta no permitida';
  end if;

  if old.user_id = v_actor then
    -- El oferente solo puede cancelar su oferta
    if new.status = 'CANCELLED' then
      return new;
    end if;
    raise exception 'Un oferente solo puede cancelar su oferta';
  end if;

  if public.is_admin() then
    return new;
  end if;

  raise exception 'No autorizado para modificar esta oferta';
end;
$$;

create trigger validate_offer_status_change before update on public.help_offers
  for each row execute function public.validate_offer_status_change();

-- No reabrir una necesidad RESOLVED/CLOSED
create or replace function public.prevent_need_reopen()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status in ('RESOLVED', 'CLOSED')
     and new.status in ('OPEN', 'IN_PROGRESS') then
    raise exception 'Una necesidad solucionada o cerrada no puede reabrirse';
  end if;
  return new;
end;
$$;

create trigger prevent_need_reopen before update on public.needs
  for each row execute function public.prevent_need_reopen();
