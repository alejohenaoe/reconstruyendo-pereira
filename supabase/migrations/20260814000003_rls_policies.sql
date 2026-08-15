-- ============================================================
-- 0003_rls_policies.sql
-- Políticas RLS + GRANTs explícitos (nuevas tablas NO se auto-exponen).
-- ============================================================

-- ---------- Catálogos: lectura pública ----------
create policy "municipalities public read" on public.municipalities
  for select using (true);

create policy "capabilities public read" on public.capabilities
  for select using (true);

create policy "need_categories public read" on public.need_categories
  for select using (true);

-- ---------- profiles ----------
create policy "profiles public read" on public.profiles
  for select using (true);

-- El dueño edita su perfil; los administradores gestionan roles/suspensiones.
-- WITH CHECK impide auto-promoción y auto-suspensión.
create policy "profiles owner update" on public.profiles
  for update
  using (auth.uid() = id or public.is_admin())
  with check (
    public.is_admin()
    or (app_role = 'USER' and banned_at is null and id = auth.uid())
  );

-- ---------- profile_capabilities ----------
create policy "profile_capabilities public read" on public.profile_capabilities
  for select using (true);

create policy "profile_capabilities owner write" on public.profile_capabilities
  for all
  using (auth.uid() = profile_id or public.is_admin())
  with check (auth.uid() = profile_id or public.is_admin());

-- ---------- profile_phone (privado; solo dueño/admin por SELECT, resto vía RPC) ----------
create policy "profile_phone owner read" on public.profile_phone
  for select using (auth.uid() = profile_id or public.is_admin());

create policy "profile_phone owner insert" on public.profile_phone
  for insert with check (auth.uid() = profile_id or public.is_admin());

create policy "profile_phone owner update" on public.profile_phone
  for update
  using (auth.uid() = profile_id or public.is_admin())
  with check (auth.uid() = profile_id or public.is_admin());

create policy "profile_phone owner delete" on public.profile_phone
  for delete using (auth.uid() = profile_id or public.is_admin());

-- ---------- needs ----------
-- Lectura pública salvo contenido oculto por moderación
create policy "needs public read" on public.needs
  for select using (not is_hidden or auth.uid() = user_id or public.is_admin());

-- Crear: autenticado + verificado + no baneado; siempre OPEN y propia.
-- La regla de "una necesidad activa" la impone el índice único.
create policy "needs verified insert" on public.needs
  for insert with check (
    user_id = auth.uid()
    and public.is_email_verified()
    and not public.is_banned()
    and status = 'OPEN'
    and not is_hidden
  );

-- Actualizar: dueño (no puede ocultar ni transferir) o admin
create policy "needs owner update" on public.needs
  for update
  using (auth.uid() = user_id or public.is_admin())
  with check (
    public.is_admin()
    or (auth.uid() = user_id and not is_hidden and hidden_at is null)
  );

create policy "needs owner delete" on public.needs
  for delete using (auth.uid() = user_id or public.is_admin());

-- ---------- need_address (privado; terceros solo vía RPC) ----------
create policy "need_address owner read" on public.need_address
  for select using (public.is_need_owner(need_id) or public.is_admin());

create policy "need_address owner write" on public.need_address
  for all
  using (public.is_need_owner(need_id) or public.is_admin())
  with check (public.is_need_owner(need_id) or public.is_admin());

-- ---------- need_images ----------
create policy "need_images public read" on public.need_images
  for select using (true);

-- Subir: verificado + dueño/admin de la necesidad; el path debe pertenecer a la necesidad
create policy "need_images owner insert" on public.need_images
  for insert with check (
    public.is_email_verified()
    and (public.is_need_owner(need_id) or public.is_admin())
    and storage_path like 'needs/' || need_id::text || '/%'
  );

create policy "need_images owner update" on public.need_images
  for update
  using (public.is_need_owner(need_id) or public.is_admin())
  with check (public.is_need_owner(need_id) or public.is_admin());

create policy "need_images owner delete" on public.need_images
  for delete using (public.is_need_owner(need_id) or public.is_admin());

-- ---------- help_offers ----------
-- Lectura pública salvo ofertas de necesidades ocultas
create policy "help_offers public read" on public.help_offers
  for select using (
    public.is_admin()
    or auth.uid() = user_id
    or not exists (
      select 1 from public.needs n
      where n.id = help_offers.need_id and n.is_hidden
    )
  );

-- Crear: verificado + no baneado + propia; triggers validan self-offer y necesidad activa
create policy "help_offers verified insert" on public.help_offers
  for insert with check (
    user_id = auth.uid()
    and public.is_email_verified()
    and not public.is_banned()
    and status = 'OFFERED'
  );

-- Actualizar: oferente, dueño de la necesidad o admin.
-- Las transiciones válidas las controla el trigger validate_offer_status_change.
create policy "help_offers related update" on public.help_offers
  for update
  using (auth.uid() = user_id or public.is_need_owner(need_id) or public.is_admin())
  with check (auth.uid() = user_id or public.is_need_owner(need_id) or public.is_admin());

create policy "help_offers owner delete" on public.help_offers
  for delete using (auth.uid() = user_id or public.is_admin());

-- ---------- need_comments ----------
create policy "need_comments public read" on public.need_comments
  for select using (not is_hidden or auth.uid() = user_id or public.is_admin());

create policy "need_comments verified insert" on public.need_comments
  for insert with check (
    user_id = auth.uid()
    and public.is_email_verified()
    and not public.is_banned()
  );

create policy "need_comments owner update" on public.need_comments
  for update
  using (auth.uid() = user_id or public.is_admin())
  with check (
    public.is_admin()
    or (auth.uid() = user_id and not is_hidden and hidden_at is null)
  );

create policy "need_comments owner delete" on public.need_comments
  for delete using (auth.uid() = user_id or public.is_admin());

-- ---------- reports ----------
-- Solo el reportero ve sus reportes; los admins ven todos.
-- El usuario reportado NO puede ver los reportes en su contra (evita represalias).
create policy "reports reporter select" on public.reports
  for select using (auth.uid() = reporter_id or public.is_admin());

create policy "reports verified insert" on public.reports
  for insert with check (
    reporter_id = auth.uid()
    and public.is_email_verified()
    and not public.is_banned()
    and (reported_user_id is null or reported_user_id <> auth.uid())
  );

create policy "reports admin update" on public.reports
  for update using (public.is_admin()) with check (public.is_admin());

create policy "reports admin delete" on public.reports
  for delete using (public.is_admin());

-- ---------- contact_access_log (solo lectura admin; escritura vía RPC) ----------
create policy "contact_access_log admin read" on public.contact_access_log
  for select using (public.is_admin());

-- ---------- notifications ----------
create policy "notifications owner select" on public.notifications
  for select using (auth.uid() = user_id or public.is_admin());

create policy "notifications owner update" on public.notifications
  for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "notifications owner delete" on public.notifications
  for delete using (auth.uid() = user_id or public.is_admin());

-- ============================================================
-- GRANTs (las tablas nuevas no se auto-exponen a los roles de API)
-- ============================================================
grant usage on schema public to anon, authenticated;

-- Catálogos: lectura pública
grant select on public.municipalities, public.capabilities, public.need_categories
  to anon, authenticated;

-- Lectura pública de datos no privados
grant select on public.profiles, public.needs, public.need_images,
  public.help_offers, public.need_comments, public.profile_capabilities
  to anon, authenticated;

-- Privado (RLS limita filas; la revelación de contacto va por RPC)
grant select, insert, update, delete on public.profile_phone, public.need_address
  to authenticated;

-- Escritura comunitaria
grant insert, update, delete on public.needs, public.help_offers, public.need_comments
  to authenticated;
grant select, insert, update, delete on public.profile_capabilities
  to authenticated;
grant select, insert on public.reports
  to authenticated;
grant select, update, delete on public.notifications
  to authenticated;
grant select on public.contact_access_log
  to authenticated;

-- Secuencias (columnas identity)
grant usage on all sequences in schema public to anon, authenticated;

-- Funciones usadas por el cliente / políticas
grant execute on function public.is_email_verified() to authenticated;
grant execute on function public.is_banned(uuid) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_need_owner(uuid, uuid) to authenticated;
grant execute on function public.can_manage_need_images(uuid) to authenticated;
grant execute on function public.can_manage_need_images_path(text) to authenticated;
grant execute on function public.get_need_contact(uuid) to authenticated;
