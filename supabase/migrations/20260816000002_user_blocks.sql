-- ============================================================
-- 20260816000002_user_blocks.sql
-- Bloqueo entre personas (MVP §21).
--
-- Es distinto de lo que ya existía: reportar avisa a la moderación y suspender
-- lo decide un administrador. Bloquear lo decide cada persona y solo afecta a
-- la relación entre esas dos.
--
-- El bloqueo es discreto (quien es bloqueado no se entera) y **simétrico en sus
-- efectos**: da igual quién bloqueó a quién, los dos dejan de verse en el hilo
-- y en las ofertas, no pueden ofrecerse ayuda mutuamente y el contacto deja de
-- revelarse. Un bloqueo unilateral que dejara al otro seguir escribiendo sería
-- peor que no tenerlo.
--
-- No se borra nada: los mensajes y ofertas anteriores siguen existiendo para
-- terceros y para su autor; simplemente dejan de verse entre las dos personas.
-- ============================================================

create table public.user_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

-- Para resolver el sentido inverso ("¿quién me bloqueó?") sin escanear la tabla.
create index user_blocks_blocked_idx on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;

-- Cada quien ve y gestiona solo sus propios bloqueos: la persona bloqueada no
-- puede consultar quién la bloqueó.
create policy "user_blocks own read" on public.user_blocks
  for select using (auth.uid() = blocker_id);

create policy "user_blocks own insert" on public.user_blocks
  for insert with check (auth.uid() = blocker_id and not public.is_banned());

create policy "user_blocks own delete" on public.user_blocks
  for delete using (auth.uid() = blocker_id);

grant select, insert, delete on public.user_blocks to authenticated;

-- ---------- Helper ----------
-- security definer porque hay que ver también los bloqueos ajenos (los que me
-- hicieron a mí), que la política de la tabla nunca devolvería al llamador.
create or replace function public.has_block_between(p_other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and p_other is not null
    and p_other <> auth.uid()
    and exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p_other)
         or (b.blocker_id = p_other and b.blocked_id = auth.uid())
    )
$$;

grant execute on function public.has_block_between(uuid) to anon, authenticated;

-- ---------- Lectura: dejar de verse ----------
-- El hilo: se conserva todo lo de la migración anterior (comentario oculto por
-- moderación, hilo de un pedido oculto) y se añade el bloqueo.
drop policy "need_comments public read" on public.need_comments;

create policy "need_comments public read" on public.need_comments
  for select using (
    public.is_admin()
    or auth.uid() = user_id
    or (
      not is_hidden
      and not public.has_block_between(user_id)
      and (
        public.is_need_owner(need_comments.need_id)
        or not public.is_need_hidden(need_comments.need_id)
      )
    )
  );

-- Las ofertas: la vista `need_offer_details` es security_invoker, así que
-- hereda esta política sin tocarla.
drop policy "help_offers public read" on public.help_offers;

create policy "help_offers public read" on public.help_offers
  for select using (
    public.is_admin()
    or auth.uid() = user_id
    or (
      not public.has_block_between(user_id)
      and not exists (
        select 1 from public.needs n
        where n.id = help_offers.need_id and n.is_hidden
      )
    )
  );

-- ---------- Escritura: no interactuar ----------
create or replace function public.prevent_interaction_when_blocked()
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

  if v_owner is not null and public.has_block_between(v_owner) then
    raise exception 'No puedes participar en este pedido de ayuda';
  end if;

  return new;
end;
$$;

create trigger prevent_offer_when_blocked before insert on public.help_offers
  for each row execute function public.prevent_interaction_when_blocked();

create trigger prevent_comment_when_blocked before insert on public.need_comments
  for each row execute function public.prevent_interaction_when_blocked();

-- ---------- Contacto: dejar de revelarse ----------
-- Misma lógica que antes; sólo se filtran las contrapartes bloqueadas.
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
      and ho.status <> 'CANCELLED'
      and not public.has_block_between(ho.user_id);

    insert into public.contact_access_log (need_id, viewer_id)
    values (v_need, auth.uid());

    return v_result;
  end if;

  if v_is_offerer then
    -- Con un bloqueo de por medio no se revela el contacto del dueño.
    if public.has_block_between(v_need_user) then
      return null;
    end if;

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
