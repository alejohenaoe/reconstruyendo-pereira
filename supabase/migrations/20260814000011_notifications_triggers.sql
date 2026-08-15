-- Fase 7: notificaciones in-app. La tabla notifications + RLS + grants ya existen
-- (0001/0003). Aquí se crean los triggers que generan notificaciones ante los
-- eventos de dominio, de modo que no dependan del frontend (ARCH §47).

-- Funciones SECURITY DEFINER para poder insertar pese a que la tabla no expone
-- INSERT a authenticated (solo el dueño lee/actualiza/borra sus notificaciones).

-- 1) Nueva oferta de ayuda -> notifica al dueño de la necesidad.
create or replace function public.notify_help_offer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_title text;
  v_name text;
begin
  if new.status <> 'OFFERED' then
    return new;
  end if;
  select n.user_id, n.title into v_owner, v_title
    from public.needs n where n.id = new.need_id;
  if v_owner is null or v_owner = new.user_id then
    return new;
  end if;
  select display_name into v_name from public.profiles where id = new.user_id;
  insert into public.notifications (user_id, type, actor_id, need_id, payload)
  values (v_owner, 'HELP_OFFER', new.user_id, new.need_id,
          jsonb_build_object('title', coalesce(v_title, ''),
                             'actor_name', coalesce(v_name, 'Alguien')));
  return new;
end;
$$;

create trigger notify_help_offer_trigger
after insert on public.help_offers
for each row execute function public.notify_help_offer();

-- 2) Nuevo comentario -> notifica al dueño de la necesidad.
create or replace function public.notify_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_title text;
  v_name text;
begin
  if new.is_hidden then
    return new;
  end if;
  select n.user_id, n.title into v_owner, v_title
    from public.needs n where n.id = new.need_id;
  if v_owner is null or v_owner = new.user_id then
    return new;
  end if;
  select display_name into v_name from public.profiles where id = new.user_id;
  insert into public.notifications (user_id, type, actor_id, need_id, payload)
  values (v_owner, 'COMMENT', new.user_id, new.need_id,
          jsonb_build_object('title', coalesce(v_title, ''),
                             'actor_name', coalesce(v_name, 'Alguien')));
  return new;
end;
$$;

create trigger notify_comment_trigger
after insert on public.need_comments
for each row execute function public.notify_comment();

-- 3) Ayuda confirmada (el dueño confirma una oferta) -> notifica al oferente.
create or replace function public.notify_help_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_title text;
  v_name text;
begin
  if old.status = 'CONFIRMED' or new.status <> 'CONFIRMED' then
    return new;
  end if;
  select n.user_id, n.title into v_owner, v_title
    from public.needs n where n.id = new.need_id;
  if v_owner is null or v_owner = new.user_id then
    return new;
  end if;
  select display_name into v_name from public.profiles where id = v_owner;
  insert into public.notifications (user_id, type, actor_id, need_id, payload)
  values (new.user_id, 'HELP_CONFIRMED', v_owner, new.need_id,
          jsonb_build_object('title', coalesce(v_title, ''),
                             'actor_name', coalesce(v_name, 'Alguien')));
  return new;
end;
$$;

create trigger notify_help_confirmed_trigger
after update on public.help_offers
for each row execute function public.notify_help_confirmed();

-- 4) Cambio de estado de la necesidad -> notifica a los oferentes vigentes.
create or replace function public.notify_need_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offerer uuid;
  v_title text;
  v_name text;
begin
  if old.status = new.status then
    return new;
  end if;
  v_title := new.title;
  select display_name into v_name from public.profiles where id = new.user_id;
  for v_offerer in
    select distinct ho.user_id
    from public.help_offers ho
    where ho.need_id = new.id
      and ho.status <> 'CANCELLED'
      and ho.user_id <> new.user_id
  loop
    insert into public.notifications (user_id, type, actor_id, need_id, payload)
    values (v_offerer, 'NEED_STATUS_CHANGE', new.user_id, new.id,
            jsonb_build_object('title', coalesce(v_title, ''),
                               'status', new.status::text,
                               'actor_name', coalesce(v_name, 'Alguien')));
  end loop;
  return new;
end;
$$;

create trigger notify_need_status_change_trigger
after update on public.needs
for each row execute function public.notify_need_status_change();

-- Índice parcial para el contador de no leídas (badge).
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;
