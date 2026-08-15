-- ============================================================
-- 0010_moderation_admin_grants.sql
-- Fase 6: habilitar acciones de moderación de los administradores.
--  - grants que faltaban: UPDATE/DELETE en reports, UPDATE en profiles.
--  - RPC admin_stats() (SECURITY DEFINER, solo admin) para el dashboard.
-- ============================================================

-- Los administradores moderan reportes (cambiar estado, borrar).
grant update, delete on public.reports to authenticated;

-- Los administradores suspenden usuarios (banned_at).
grant update on public.profiles to authenticated;

-- Estadísticas del panel administrativo.
create or replace function public.admin_stats()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stats jsonb;
begin
  if not public.is_admin() then
    raise exception 'Se requieren permisos de administrador';
  end if;

  select jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'users_banned', (select count(*) from public.profiles where banned_at is not null),
    'needs', (select count(*) from public.needs),
    'needs_by_status', (
      select coalesce(
        jsonb_object_agg(status::text, total),
        '{}'::jsonb
      )
      from (
        select n.status, count(*)::int as total
        from public.needs n
        group by n.status
      ) s
    ),
    'needs_hidden', (select count(*) from public.needs where is_hidden),
    'offers', (select count(*) from public.help_offers),
    'comments', (select count(*) from public.need_comments),
    'reports_pending', (select count(*) from public.reports where status = 'PENDING')
  ) into v_stats;

  return v_stats;
end;
$$;

grant execute on function public.admin_stats() to authenticated;
