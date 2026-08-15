-- 0005: vista pública de conteo de ofertas por necesidad.
-- Fase 3: "conteo de ofertas por necesidad sin N+1 (consulta agrupada)".
-- security_invoker = true: las políticas RLS de help_offers y needs se aplican
-- al rol que consulta (anon/authenticated), por lo que las necesidades ocultas
-- o sus ofertas nunca contribuyen al conteo público (RLS sigue siendo autoridad).

create or replace view public.need_offer_counts
with (security_invoker = true) as
select ho.need_id, count(*) as offer_count
from public.help_offers ho
join public.needs n on n.id = ho.need_id and n.is_hidden = false
group by ho.need_id;

comment on view public.need_offer_counts is
  'Conteo de ofertas por necesidad (solo necesidades no ocultas). Consulta agrupada para listados públicos.';

grant select on public.need_offer_counts to anon, authenticated;
