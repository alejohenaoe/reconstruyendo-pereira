-- ============================================================
-- 0006_need_offer_details.sql
-- Vista pública de oferentes con nombre (sin N+1 para el detalle).
-- help_offers.user_id apunta a auth.users; profiles no es FK embebible
-- desde needs ni help_offers en PostgREST, así que la vista une y expone.
-- ============================================================

create view public.need_offer_details
with (security_invoker = true) as
select
  ho.need_id,
  ho.id as offer_id,
  ho.user_id,
  p.display_name,
  ho.status as offer_status,
  ho.message,
  ho.created_at as offered_at
from public.help_offers ho
join public.profiles p on p.id = ho.user_id
join public.needs n on n.id = ho.need_id
where not n.is_hidden;

grant select on public.need_offer_details to anon, authenticated;
