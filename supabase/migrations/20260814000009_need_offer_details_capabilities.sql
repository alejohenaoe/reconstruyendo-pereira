-- ============================================================
-- 0009_need_offer_details_capabilities.sql
-- Fase 5: la vista pública de oferentes incluye la capacidad ofrecida
-- y oculta las ofertas canceladas (el hilo muestra ayudas vigentes).
-- ============================================================

drop view if exists public.need_offer_details;

create view public.need_offer_details
with (security_invoker = true) as
select
  ho.need_id,
  ho.id as offer_id,
  ho.user_id,
  p.display_name,
  ho.status as offer_status,
  ho.message,
  ho.capability_id,
  c.label_es as capability_label,
  ho.created_at as offered_at
from public.help_offers ho
join public.profiles p on p.id = ho.user_id
join public.needs n on n.id = ho.need_id
join public.capabilities c on c.id = ho.capability_id
where not n.is_hidden
  and ho.status <> 'CANCELLED';

grant select on public.need_offer_details to anon, authenticated;
