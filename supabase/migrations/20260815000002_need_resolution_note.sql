-- ============================================================
-- 20260815000002_need_resolution_note.sql
-- Cierre de un pedido de ayuda: la actualización que escribe quien pidió
-- ayuda al marcarlo como solucionado (MVP §23).
--
-- Las fotos "después" ya eran posibles (`need_images.kind = 'AFTER'`), pero
-- faltaba dónde guardar el relato del cierre y el agradecimiento público.
-- No hace falta política nueva: `needs owner update` ya limita la escritura al
-- dueño del pedido y al panel de moderación.
-- ============================================================

alter table public.needs
  add column resolution_note text
  check (resolution_note is null or char_length(resolution_note) between 2 and 2000);

comment on column public.needs.resolution_note is
  'Actualización pública que escribe el autor al solucionar el pedido (MVP §23).';
