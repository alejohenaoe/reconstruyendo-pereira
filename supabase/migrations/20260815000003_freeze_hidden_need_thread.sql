-- ============================================================
-- 20260815000003_freeze_hidden_need_thread.sql
-- Congelar el hilo de un pedido ocultado por moderación (MVP §21, §25).
--
-- Ocultar un pedido lo saca del listado público y ya impedía nuevas ofertas
-- (`prevent_offer_on_inactive_need` comprueba `is_hidden`), pero el hilo
-- seguía abierto: un tercero que conociera el id podía comentar por API, y
-- los comentarios existentes se leían consultando por `need_id`, porque la
-- política solo miraba el `is_hidden` del comentario, no el del pedido.
--
-- Esta migración cierra las dos mitades: no se puede comentar en un pedido
-- oculto, y su hilo deja de ser público. Autor del comentario, dueño del
-- pedido y administración siguen viéndolo: moderar oculta, nunca borra.
-- ============================================================

-- ---------- Escritura: no comentar en un pedido oculto ----------
-- security definer, igual que la regla equivalente de las ofertas: es una
-- regla de integridad y debe ver el pedido sin depender de la RLS del llamador.
create or replace function public.prevent_comment_on_hidden_need()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hidden boolean;
begin
  select n.is_hidden into v_hidden
  from public.needs n
  where n.id = new.need_id;

  if not found then
    raise exception 'La necesidad no existe';
  end if;

  if v_hidden then
    raise exception 'Esta necesidad no está disponible';
  end if;

  return new;
end;
$$;

create trigger prevent_comment_on_hidden_need before insert on public.need_comments
  for each row execute function public.prevent_comment_on_hidden_need();

-- ---------- Lectura: el hilo de un pedido oculto no es público ----------
-- security definer y no una subconsulta dentro de la política: las
-- subconsultas de una política se evalúan con la RLS del llamador, así que
-- para un visitante el pedido oculto "no existe" y la comprobación daría
-- siempre verdadero (mismo motivo que los triggers de integridad, 0002).
create or replace function public.is_need_hidden(p_need_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.needs n
    where n.id = p_need_id and n.is_hidden
  )
$$;

drop policy "need_comments public read" on public.need_comments;

create policy "need_comments public read" on public.need_comments
  for select using (
    public.is_admin()
    or auth.uid() = user_id
    or (
      not is_hidden
      and (
        public.is_need_owner(need_comments.need_id)
        or not public.is_need_hidden(need_comments.need_id)
      )
    )
  );

grant execute on function public.is_need_hidden(uuid) to anon, authenticated;
