-- ============================================================
-- 0004_storage.sql
-- Bucket para imágenes de necesidades + políticas de Storage.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'need-images',
  'need-images',
  true,
  5242880, -- 5 MB por archivo
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública de imágenes (los visitantes pueden ver fotos)
create policy "need-images public read" on storage.objects
  for select using (bucket_id = 'need-images');

-- Subida/edición/borrado: solo dueño de la necesidad (verificado) o admin.
-- El need_id se extrae del path 'needs/{needId}/{imageId}.ext'.
create policy "need-images owner insert" on storage.objects
  for insert with check (
    bucket_id = 'need-images'
    and public.can_manage_need_images_path(name)
  );

create policy "need-images owner update" on storage.objects
  for update using (
    bucket_id = 'need-images'
    and public.can_manage_need_images_path(name)
  );

create policy "need-images owner delete" on storage.objects
  for delete using (
    bucket_id = 'need-images'
    and public.can_manage_need_images_path(name)
  );
