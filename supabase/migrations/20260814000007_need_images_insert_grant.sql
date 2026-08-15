-- Fase 4: los dueños insertan filas en need_images al vincular fotos.
-- Faltaba el grant; la RLS (need_images owner insert) ya exige ser dueño.
grant insert on public.need_images to authenticated;
