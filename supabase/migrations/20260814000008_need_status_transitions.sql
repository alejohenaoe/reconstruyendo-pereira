-- ============================================================
-- 0008_need_status_transitions.sql
-- Fase 5: transiciones de estado de necesidad controladas.
-- OPEN → IN_PROGRESS → RESOLVED, y cierre a CLOSED desde cualquier
-- estado activo. Solo el dueño avanza su necesidad (RLS owner update);
-- los administradores pasan (la moderación de Fase 6 puede cerrar).
-- El "no reabrir" ya lo cubre prevent_need_reopen (0002).
-- ============================================================

create or replace function public.validate_need_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Sin cambio de estado: permitido (p. ej. editar descripción).
  if old.status = new.status then
    return new;
  end if;

  -- El admin gestiona la moderación sin estas restricciones de secuencia.
  if public.is_admin() then
    return new;
  end if;

  -- Solo el dueño de la necesidad cambia su estado.
  if old.user_id <> auth.uid() then
    raise exception 'Solo el autor puede cambiar el estado de la necesidad';
  end if;

  -- OPEN → IN_PROGRESS
  if old.status = 'OPEN' and new.status = 'IN_PROGRESS' then
    return new;
  end if;

  -- IN_PROGRESS → RESOLVED
  if old.status = 'IN_PROGRESS' and new.status = 'RESOLVED' then
    return new;
  end if;

  -- Cierre a CLOSED desde cualquier estado activo
  if new.status = 'CLOSED' and old.status in ('OPEN', 'IN_PROGRESS', 'RESOLVED') then
    return new;
  end if;

  raise exception 'Transición de estado no permitida';
end;
$$;

create trigger validate_need_status_change before update on public.needs
  for each row execute function public.validate_need_status_change();

grant execute on function public.validate_need_status_change() to authenticated;
