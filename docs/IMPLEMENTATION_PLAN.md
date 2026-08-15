# PLAN DE IMPLEMENTACIÓN — MVP plataforma comunitaria de ayuda

## 1. Propósito del documento

Este documento plasma el **plan de implementación por fases** del MVP, aprobado tras la auditoría técnica inicial.

Es el punto de partida de la ejecución: cualquier fase se considera completa únicamente cuando cumple su contenido, su criterio de verificación y las directrices de los documentos de referencia.

No sustituye a `MVP.md`, `ARCHITECTURE_GUIDELINES.md` ni `UX_UI_GUIDELINES.md`. En caso de conflicto prevalece el orden de prioridad definido en `ARCHITECTURE_GUIDELINES.md` §51:

1. Seguridad y restricciones técnicas fundamentales.
2. Reglas de negocio de `MVP.md`.
3. Arquitectura de `ARCHITECTURE_GUIDELINES.md`.
4. UX/UI de `UX_UI_GUIDELINES.md`.

## 2. Documentos de referencia

- `docs/MVP.md` — alcance funcional (se referencia desde `docs/`, no desde la raíz).
- `ARCHITECTURE_GUIDELINES.md` — cómo debe construirse técnicamente.
- `UX_UI_GUIDELINES.md` — cómo debe comportarse y presentarse la interfaz.

## 3. Decisiones de diseño aprobadas

Estas decisiones quedan fijadas en la fase de auditoría y deben respetarse durante toda la implementación:

1. **Estado "Cancelada"**: el `MVP.md` §8 menciona "Cancelada", pero no existe un estado `CANCELLED` de necesidad. Se mapea a `CLOSED` (cerrada sin resolución). Estados de necesidad: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`.
2. **"Tipo de participación"**: se implementa como capacidades multi-selección (`profile_capabilities`), nunca como roles excluyentes (ARCH §11/§12).
3. **Verificación de email**: requisito para todas las acciones comunitarias, garantizado por RLS con `is_email_verified()` y reforzado en la UI (ARCH §7.2).
4. **Regla "una necesidad activa por usuario"**: garantizada por índice único parcial en PostgreSQL (atómico ante concurrencia), no solo desde React (MVP §8, ARCH §19).
5. **Datos privados aislados**: `profile_phone` y `need_address` son tablas separadas (RLS es por fila, no por columna). Nunca se devuelven en consultas públicas; el único camino es el RPC `get_need_contact()` (ARCH §30/§31).
6. **Contacto**: `get_need_contact(need_id)` es un RPC `security definer` que valida autenticación + email verificado + relación con la necesidad y registra cada revelación en `contact_access_log`.
7. **`needs_assessment`**: booleano en `needs` para la opción "No sé exactamente qué necesito" (UX §12).
8. **`reports` única, sin polimorfismo genérico**: columnas FK nullable `need_id`, `comment_id`, `reported_user_id` + CHECK que exige exactamente un objetivo. Objetivos reportables del MVP: `Need`, `Comment`, `User`. No se reportan `help_offers` ni materiales. `ON DELETE SET NULL` para conservar el reporte si el contenido desaparece.
9. **Notificaciones in-app**: dentro del alcance del MVP (MVP §27), implementadas mediante triggers en la base de datos.
10. **Storage**: bucket `need-images`, paths `needs/{needId}/{imageId}.{ext}`, lectura pública, escritura solo del dueño verificado, compresión en cliente + transformaciones de Supabase para miniaturas.
11. **Stack**: React + Vite + TypeScript + Tailwind CSS + Supabase (Auth/PostgreSQL/Storage/RLS) + React Router + Netlify. Sin React Query, sin Redux/Zustand, sin backend independiente.
12. **Git**: el proyecto se inicializará con `git init` en la fase 0. El repositorio GitHub será creado posteriormente por el equipo y conectado para el despliegue.

## 4. Supabase remoto

- Proyecto: `rpbpwwwvakpxzdinvojw` (verificado accesible).
- URL: `https://rpbpwwwvakpxzdinvojw.supabase.co`.
- Se enlaza en la fase 1 mediante `supabase link`.
- Verificación de correo habilitada en preview/producción; en desarrollo local con Supabase CLI puede deshabilitarse para facilitar el flujo.

## 5. Fases de implementación

### Fase 0 — Scaffold del proyecto

**Contenido**

- `git init` (repositorio local).
- Scaffold Vite + React + TypeScript (`react-ts`).
- Tailwind CSS v4 con plugin de Vite.
- Design tokens centralizados (colores, tipografía, espaciado, radios, sombras, breakpoints, estados) compatibles con Tailwind (UX §31).
- Estructura de carpetas orientada a features según `ARCHITECTURE_GUIDELINES.md` §5.
- Configuración de linting + formateo: oxlint (linter que trae el scaffold oficial de Vite) + Prettier.
- Cliente único de Supabase en `src/shared/lib/supabase.ts` (ARCH §6).
- Alias de importación `@/` → `src/`.
- `.env.example` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (la publishable key reemplaza a la antigua anon; la secret/service key nunca se usa en el frontend).
- `netlify.toml` con build, publish y redirects SPA (para rutas del cliente y callback de auth).
- `.gitignore` (incluye `.env`).
- Páginas organizadas como `features/<feature>/pages/` (extensión de la estructura ARCH §5 para el router).

**Criterio de verificación**

- `npm run dev`, `npm run lint`, `npm run build` funcionan.
- Estructura de carpetas presente y consistente.
- Tokens definidos en un único lugar.

### Fase 1 — Migraciones de base de datos (Supabase)

**Estado: COMPLETADA y verificada localmente (41/41 tests de seguridad RLS PASS).**

**Contenido entregado**

- `supabase init` + `project_id = "rpbpwwwvakpxzdinvojw"` en `supabase/config.toml`. `supabase link` y push remoto quedan pendientes (requieren `supabase login` y la contraseña de DB — ver §4).
- Migraciones versionadas (`supabase/migrations/`):
  - `0001_initial_schema.sql`: enums (`app_role`, `need_status`, `help_offer_status`, `image_kind`, `report_status`, `report_reason`, `notification_type`), lookups con seed (`municipalities`, `capabilities`, `need_categories`), `profiles`, `profile_capabilities`, `profile_phone`, `needs`, `need_address`, `need_images`, `help_offers`, `need_comments`, `reports` (FK nullable + CHECK de exactamente un objetivo + índice único anti-duplicados con COALESCE sentinel), `contact_access_log`, `notifications`; RLS habilitado en todas.
  - `0002_functions_triggers.sql`: funciones `security definer` (`is_email_verified()`, `is_banned(uid)`, `is_admin()`, `is_need_owner(need_id, uid)`, `can_manage_need_images(need_id)`, `can_manage_need_images_path(path)`, `get_need_contact(need_id)`) y triggers (`set_updated_at`, `handle_new_user`, `prevent_self_offer`, `prevent_offer_on_inactive_need`, `validate_offer_status_change`, `prevent_need_reopen`).
  - `0003_rls_policies.sql`: políticas por tabla + **GRANTs explícitos** (las tablas nuevas NO se auto-exponen a `anon`/`authenticated`).
  - `0004_storage.sql`: bucket `need-images` (público, 5 MB, jpeg/png/webp) + políticas de Storage que extraen el `need_id` del path `needs/{needId}/…` vía `can_manage_need_images_path`.
- Índices críticos: `one_active_need_per_user` (partial unique), `one_offer_per_user_per_need` (partial unique, excluye CANCELLED), `one_primary_image_per_need`, anti-reportes duplicados.
- Script de pruebas repetible: `supabase/tests/rls_security.sh` (41 casos vía API local: accesos anónimos, auto-perfil, una-necesidad-activa, self-offer, ofertas duplicadas, transiciones de estado, privacidad de contacto vía RPC, usuario sin email verificado, reportes, log de contactos, cascada).

**Decisiones técnicas surgidas durante la verificación**

- **Triggers de integridad como `security definer`**: `SELECT … FOR SHARE` + RLS devuelve 0 filas (el policy de `needs` referencia `auth.uid()`); además, las reglas de negocio (no self-offer, solo necesidad activa) deben ver la fila independientemente del rol del llamador. La autorización la hace la política RLS del INSERT; el trigger solo valida integridad. Se eliminó `FOR SHARE`.
- **Parámetro de RPC llamado `need_id`**: PostgREST empareja las claves JSON con el nombre de los parámetros. Con `p_need_id` el cliente no podía llamar `get_need_contact({need_id})`. Se renombró el parámetro a `need_id` y se usa una variable local `v_need` para evitar ambigüedad con columnas.
- **La vista del dueño en `get_need_contact` muestra a todos los oferentes no cancelados** (aunque no tengan teléfono), para que el dueño sepa quién se ofreció.
- **Puertos locales desplazados a `544xx`** (db 54422, API 54421, Studio 54423…) para no colisionar con el stack local del proyecto `photo-project` (54321/54322/54323…).
- `supabase/` quedaba con propietario `root` (shell con sudo); se corrigió con `chown -R alejandrohenaoecheverri:staff`.

**Criterio de verificación (cumplido)**

- Migraciones aplican limpias desde cero: `supabase db reset` local OK (4 migraciones, sin errores).
- `supabase/tests/rls_security.sh` → **41 PASS / 0 FAIL** (anónimos, privacidad, una-necesidad-activa, ofertas, verificación de email, reportes, RPC de contacto, bucket).

### Fase 2 — Autenticación

**Estado: COMPLETADA y verificada localmente (typecheck/lint/build verdes, RLS 41/41, contrato e2e 10/10).**

**Contenido entregado**

- `AuthProvider` en `app/providers/AuthProvider.tsx` con estados `AUTH_LOADING`, `UNAUTHENTICATED`, `EMAIL_UNVERIFIED`, `AUTHENTICATED` derivados de sesión + `session.user.email_confirmed_at` (sin duplicar `email_verified`).
- `useAuth()` como única interfaz de consumo (ARCH §7.5); no se llama `getSession()` disperso en la UI.
- Servicio `features/auth/services/authService.ts`: signUp, signIn, signOut, resetPassword, resendVerification, updatePassword, getSession, onAuthStateChange, getMunicipalities + `mapAuthError` (mensajes en español con códigos `invalid_credentials`, `email_not_confirmed`, `user_already_exists`, `rate_limited`, `weak_password`, `signups_disabled`, `invalid_token`, `user_not_found`, `same_password`, `network`, `unknown`).
- `AuthResult<T>` como unión discriminada por `ok` (`{ok:true;data:T;error:null;code:null}` | `{ok:false;data:null;error:string;code:AuthErrorCode}`). El discriminante `ok` es la única forma de que TypeScript estreche el union (`error: string | null` no discrimina).
- Páginas: `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/account` (Protected+Verified) y `/admin` (placeholder AdminRoute).
- Guards: `ProtectedRoute`, `VerifiedRoute`, `AdminRoute` + hook `useIsAdmin` (lee `profiles.app_role === 'ADMIN'`). Navegación: no autenticado → `/login`; sin verificar → `/verify-email`.
- Continuación de intención: `?redirect=...` preservado en registro/login; verificación usa `emailRedirectTo = ${origin}/auth/callback?redirect=<encoded>` y recuperación `${origin}/reset-password`; `/auth/callback` lee el fragmento `#access_token` (lo consume el cliente de Supabase) y navega al `redirect` o al destino por defecto.
- Verificación del trigger `handle_new_user` (perfil auto-creado con `display_name` y `municipality_id` resuelto desde `user_metadata.municipality`) — cubierto por el contrato e2e.
- UI compartida: `AppHeader` (auth-aware), `Button`/`ButtonLink`/`buttonStyles`, `TextField`, `Alert`, `Spinner`, `PageLoader`, `AuthLayout`.
- `.env` (remoto) / `.env.local` (gitignored, local) — ambos con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.

**Decisiones técnicas surgidas durante la verificación**

- **Config local de confirmaciones**: `supabase/config.toml` con `[auth.email] enable_confirmations = true` (emula preview/producción) y `email_sent = 100` (el rate limit por defecto de 2 rompía los tests). `site_url = "http://127.0.0.1:5173"` y `additional_redirect_urls` para `http://127.0.0.1:3000` y `http://127.0.0.1:5173`.
- **`redirect_to` va por query string, no por body**: el GoTrue local (v2.195.0) ignora `redirect_to` en el body JSON; lo lee de la cabecera o de query/form (`internal/utilities/request.go` `getRedirectTo`). El JS client de Supabase lo envía como query string (`src/lib/fetch.ts`: `qs['redirect_to'] = options.redirectTo`), así que `emailRedirectTo`/`redirectTo` de `authService` funciona tal cual. `IsRedirectURLValid` acepta cualquier URL con mismo scheme+hostname+puerto que `site_url` (o en el allow-list, que además soporta globs).
- **Con confirmaciones ON**, `/signup` devuelve el usuario plano sin `access_token` ni wrapper `user`; en los tests el id se extrae con `.user.id // .id`.
- **Login de usuario sin verificar** → GoTrue responde `{"code":422,"error_code":"email_not_confirmed","msg":"Email not confirmed"}` (campos `msg`/`error_code`, no `error_description`); el JS client lo expone como `AuthError` con `message: "Email not confirmed"` → `mapAuthError` lo traduce a `email_not_confirmed` y `LoginPage` redirige a `/verify-email`.
- **`[analytics] enabled = false`** en config local: el contenedor Logflare fallaba al arrancar (`RuntimeError: could not find persistent term for endpoint LogflareWeb.Endpoint`); analytics/vector son opcionales y no se necesitan.
- Fixes requeridos para verde en `tsc -b`/oxlint: discriminante `ok` en `AuthResult`; listener de `onAuthStateChange` async; `useIsAdmin` como IIFE async con try/catch; `result.data ?? []` en `useMunicipalities`; `buttonStyles` movido a archivo propio (Fast Refresh de oxlint); sin hooks condicionales en `VerifyEmailPage`.

**Criterio de verificación (cumplido)**

- Registro → email de confirmación en Mailpit → canje del enlace → 303 a `/auth/callback?redirect=...#access_token=...` → login OK con `email_confirmed_at` seteado.
- Usuario sin verificar recibe error `Email not confirmed` al hacer login (RLS ya lo bloquea en backend).
- Reenvío de verificación y recuperación de contraseña con enlace a `/reset-password` (query string) verificados.
- Regreso a la intención original tras login/verificación (parámetro `redirect` en el enlace y consumo en `/auth/callback`).
- `npm run typecheck && npm run lint && npm run build` verdes; `supabase/tests/rls_security.sh` → **41 PASS / 0 FAIL**; contrato e2e `supabase/tests/auth_contract.sh` → **10 PASS / 0 FAIL**.

### Fase 3 — Necesidades públicas

**Estado: COMPLETADA y verificada localmente (typecheck/lint/build verdes, RLS 41/41, contrato e2e 10/10, queries de API verificadas por anon).**

**Contenido entregado**

- Lista de necesidades pública en `/needs` (`NeedsListPage`), paginada por cursor `(created_at, id)`, sin `select('*')` (select explícito de columnas; `NEEDS_PAGE_SIZE = 8`, se piden 9 filas para detectar `hasMore`).
- Filtros municipio / categoría / estado (UX §39) sincronizados con `searchParams` (`?municipality=&category=&status=`); inline en desktop y panel/modal compacto en móvil (`NeedFilters`).
- Detalle público en `/needs/:id` (`NeedDetailPage`) con orden de UX §10/§37: estado → categoría → título → dónde → autor/fecha → descripción → fotografías → personas que se ofrecieron; aviso de `needs_assessment`; CTA condicional de registro/login con `?redirect=` de retorno al detalle.
- Componentes: `NeedCard`, `NeedStatus`, `NeedHeader`, `NeedGallery` (imagen principal + miniaturas + placeholder/error + "Ampliar"), `NeedImage` (estados de carga con skeleton, error y fallback a la URL original), `NeedFilters`, `Skeleton` compartido, util `timeAgo` (fechas relativas en español).
- Capa de datos en `features/needs/`: `types.ts`, `services/needService.ts`, hooks `usePublicNeeds` (paginación + assets agrupados), `usePublicNeed` (detalle), `useNeedCategories`.
- Conteo de ofertas sin N+1: vista `need_offer_counts` (migración 0005) consultada con `.in(need_id, [...])` por página; imágenes también en una sola query agrupada por página.
- Vistas nuevas: `need_offer_counts` (0005) y `need_offer_details` (0006) con `security_invoker = true` y `grant select` a `anon, authenticated`.
- Estados de loading (skeletons)/empty/error comprensibles (UX §23/§24/§25): "No encontramos necesidades con estos filtros." con acción "Limpiar filtros", y "Reintentar" ante error.
- `HomePage` con CTA primario "Ver necesidades" → `/needs`; `AppHeader` con enlace "Necesidades" visible para todos.
- Fixtures deterministas en `supabase/tests/seed_phase3.sh` (7 usuarios verificados, 15 necesidades en variedad de estados, 8 ofertas, 1 imagen por storage API) para ejercitar paginación, filtros y conteos.

**Decisiones técnicas surgidas durante la verificación**

- **Paginación por cursor en PostgREST**: el operador `or` exige el formato `or=(...)`; sin paréntesis PostgREST lo interpreta como filtro de columna (`column needs.orstatus does not exist`). El keyset completo va dentro de un único `or=(and(created_at.lt.X),and(created_at.eq.X,id.lt.Y))` (los filtros top-level se combinan con AND y romperían el OR). postgrest-js `.or(value)` ya envuelve el valor en paréntesis, así que el servicio pasa el keyset sin paréntesis. El timestamp con `+00:00` se URL-encoda automáticamente.
- **Orden estable**: `order=created_at.desc,id.desc` con tiebreaker por `id`; sin él, filas con el mismo `created_at` (inserciones masivas del seed) vuelven en orden arbitrario entre páginas (duplicados/huecos).
- **`profiles` no es embebible desde `needs` ni `help_offers`**: las FKs apuntan a `auth.users`, no a `profiles`, así que PostgREST no infiere la relación. El listado NO muestra el autor (no lo pide UX §9); el detalle consulta `profiles` por id (una query fija). Para los oferentes se creó la vista `need_offer_details` (une `help_offers` + `profiles`, oculta needs) y para los conteos `need_offer_counts` (agrupa por `need_id`, excluye needs ocultas). Ambas con `security_invoker = true` para heredar las políticas RLS de las tablas base.
- **supabase-js tipa los embeds como arrays** (`need_categories: { label_es: any }[]`) mientras el runtime devuelve objetos; los casts de las filas de `needs` pasan por `unknown` para evitar el error TS2352.
- **Regla one-active-por-usuario** también complica los fixtures (máximo una necesidad OPEN/IN_PROGRESS por usuario), por eso el seed usa usuarios dedicados por necesidad activa y SQL directo para la variedad de estados.
- **`need_images` no se embebe en la lista** (evita el payload); se consulta agrupada con `.in` y se construyen URLs transformadas (`?width=160&height=120&resize=cover`) con fallback a la URL original si la transformación falla (verificado 200 local en ambos casos).

**Criterio de verificación (cumplido)**

- Visitante sin sesión ve, filtra (municipio+categoría+estado) y abre el detalle de cualquier necesidad visible (verificado por anon vía REST: lista con embeds, filtros combinados, keyset, conteos, imágenes, oferentes y autor).
- Paginación correcta: página 1 (8 de 14 visibles) + página 2 sin duplicados ni huecos; las 15 filas del seed y la oculta se comportan como esperado.
- Empty state con filtros dice exactamente "No encontramos necesidades con estos filtros." y ofrece limpiar.
- `npm run typecheck && npm run lint && npm run build` verdes; `supabase/tests/rls_security.sh` → **41 PASS / 0 FAIL**; `supabase/tests/auth_contract.sh` → **10 PASS / 0 FAIL**.

### Fase 4 — Publicar necesidad

**Estado: COMPLETADA y verificada localmente (typecheck/lint/build verdes, RLS 41/41, auth 10/10, contrato de publicación 21/21).**

**Contenido entregado**

- Ruta protegida `/needs/new` (`NewNeedPage` bajo `VerifiedRoute`); CTAs: enlace "Publicar" en `AppHeader` para usuarios verificados y botón "Publicar" en `NeedsListPage`.
- Formulario `NeedForm`: título (5–120), descripción (20–4000), categoría, municipio, zona/barrio (≤120), checkbox `needs_assessment` ("No sé exactamente qué necesito"), fotografías opcionales y dirección exacta opcional.
- Dirección exacta claramente marcada como privada (UX §35): aviso en el formulario ("solo la verás tú y, cuando haya ofertas, las personas que se ofrezcan a ayudarte") y guardada en `need_address` (RLS: solo el dueño escribe; anon no lee).
- `ImagePicker`: miniaturas con preview, eliminar selección, estados `uploading|done|error` por foto, validación de cantidad (máx. 5) y peso (máx. 30 MB por original) (UX §13).
- Compresión en cliente (`src/shared/utils/imageCompress.ts`): sin límites de calidad sobre la foto original; se guarda SOLO el webp (~q0.82, lado mayor máx. 1600px, sin escalar fotos pequeñas). El original nunca se sube ni se almacena.
- `needPublishService`: `createNeed` (envía `user_id` explícito exigido por la RLS; mapea `23505`/`one_active_need_per_user` → "Ya tienes una necesidad activa. Espera a que se resuelva o se cierre antes de publicar otra."), `attachAddress`, `uploadNeedImage` (compresión → storage `needs/{needId}/{uuid}.webp` → insert `need_images` con `is_primary` en la primera; si el insert falla se limpia el objeto del bucket).
- Flujo robusto ante fallos parciales: la necesidad se crea una sola vez (ref en la página), fotos/dirección se reintentan; si algo queda sin guardar se navega al detalle con aviso (`state.notice` mostrado como Alert).
- Migración `20260814000007_need_images_insert_grant.sql`: faltaba el `grant insert ... to authenticated` en `need_images` (la RLS ya exigía ser dueño).

**Decisiones técnicas surgidas durante la verificación**

- **`need_images` no tenía grant INSERT para `authenticated`** (solo SELECT): el plan asumía backend sin cambios, pero la verificación del contrato detectó `42501 permission denied for table need_images`. Se creó la migración 0007 (la política `need_images owner insert` ya existía).
- **Violación de `one_active_need_per_user` responde 409** (no 400) vía PostgREST; el mapeo del servicio usa `code === '23505'` para no depender del HTTP.
- **El storage local es intermitente en las negaciones**: el mismo request de un tercero a veces responde `403` y a veces `400` (AccessDenied/parse). El contrato acepta cualquier código de denegación (400/401/403); la propiedad de seguridad es "no 2xx".
- **PostgREST `return=representation` devuelve un array** (aunque el cliente supabase-js lo convierta a objeto con `.single()`); los scripts de contrato leen `.[0].id`.
- **Embeber `need_address` como anon falla con 400/42703** (sin grant para anon), confirmando que el detalle público jamás expone la dirección; el contrato lo verifica con `code != 200`.

**Criterio de verificación (cumplido)**

- Un usuario con necesidad activa no puede publicar otra: segunda creación rechazada con 409 + `23505`/`one_active_need_per_user` (mensaje amigable en el servicio).
- Subida segura de imágenes: el dueño sube (200) e inserta `need_images` (201); un tercero no (403); anon no (401/403); path fuera de `needs/{needId}/` rechazado (400/403).
- La dirección exacta no aparece en consultas públicas (anon no lee `need_address` ni la embebe).
- Contrato e2e `supabase/tests/publish_contract.sh` → **21 PASS / 0 FAIL**; regresión `rls_security.sh` → **41 PASS / 0 FAIL**; `auth_contract.sh` → **10 PASS / 0 FAIL**; `npm run typecheck && npm run lint && npm run build` verdes; smoke 200 en `/`, `/needs`, `/needs/new`, `/account`.

### Fase 5 — Ayuda y hilo de colaboración

**Estado: COMPLETADA y verificada localmente (typecheck/lint/build verdes, RLS 41/41, auth 10/10, contrato de publicación 21/21, contrato de ayuda e2e 53/53).**

**Contenido entregado**

- Backend: migración `20260814000008_need_status_transitions.sql` (trigger `validate_need_status_change`: transiciones `OPEN → IN_PROGRESS → RESOLVED`, cierre a `CLOSED`, solo el dueño, admin bypass, mensajes "Solo el autor puede cambiar el estado de la necesidad"/"Transición de estado no permitida"; `prevent_need_reopen` rechaza reabrir) y `20260814000009_need_offer_details_capabilities.sql` (drop + recreate de `need_offer_details` con `capability_id`/`capability_label` y filtro de `CANCELLED`; `create or replace` no puede cambiar columnas de una vista).
- Oferta de ayuda (`HelpOfferForm`): catálogo de `capabilities` + mensaje breve (5–1000); duplicados rechazados por índice único (`409`/`one_offer_per_user_per_need`); auto-oferta rechazada por trigger ("No puedes ofrecer ayuda en tu propia necesidad").
- Lista de ofertas (`OfferersSection`) con estados y lenguaje preciso: "se ofreció a ayudar" ≠ "ayudó" (UX §16, `OfferStatusBadge`); las canceladas no aparecen en público.
- Contacto privado: botón `Contactar` vía RPC `get_need_contact()` (SECURITY DEFINER) — el dueño ve teléfonos de los oferentes; cada oferente ve teléfono + dirección del autor; extraños/anon reciben `null`; cada revelación se registra en `contact_access_log` (ARCH §30).
- Transiciones de oferta: el oferente solo puede cancelar (CANCELLED); el dueño avanza `OFFERED → CONTACTED → AGREED → COMPLETED → CONFIRMED`; nunca auto-confirmación.
- Hilo de colaboración (`CommentsSection`): comentarios públicos con nombre del autor (join a `profiles`), insert de autenticados, lectura anon, `COMMENT_LIMIT=200`.
- Frontend: `features/help/{types,services/helpService,hooks/useNeedCommunity,hooks/useCapabilities,components/*}`; `NeedDetailPage` integra ofertas, hilo, acciones de estado y formulario (bloqueado para anónimos/ajeno/necesidad inactiva, con alerta "Esta necesidad ya no acepta nuevas ofertas" — UX §40); `AccountPage` permite guardar el teléfono de contacto (`profile_phone`, upsert por `profile_id`), requisito del flujo de contacto.
- Sin UI optimista en acciones críticas (UX §41): `NeedStatusActions` espera confirmación del backend y usa `window.confirm` antes de cerrar.

**Decisiones técnicas surgidas durante la verificación**

- **`create or replace view` no cambia columnas**: al añadir `capability_id`/`capability_label` a `need_offer_details` hubo que hacer `drop view` + recrear (migración 0009).
- **PATCH sin filas coincidentes responde 204 (no 403/404)**: un tercero que intenta cambiar una necesidad ajena no "falla" a nivel HTTP; la seguridad se comprueba leyendo el estado tras el intento (el contrato lo verifica con GET).
- **`offer_status` de la vista es el enum crudo** (`CONFIRMED`, no la etiqueta); la etiqueta ("Ayuda confirmada") vive en `HELP_OFFER_STATUS_LABELS` en el frontend.
- **El teléfono se edita en `AccountPage`** (`profile_phone`, upsert con `onConflict: 'profile_id'`, validación 6–30) porque el contacto por RPC depende de que los involucrados lo registren; la RLS ya garantizaba que solo su dueño lo lee/escribe.

**Criterio de verificación (cumplido, `supabase/tests/help_contract.sh` → 53 PASS / 0 FAIL)**

- Flujo MVP §33 pasos 7–13 de punta a punta: oferta → contacto → confirmación por el autor → transiciones → cierre.
- Un usuario no puede ofrecerse a sí mismo, ni ofrecer en necesidad no activa ("no acepta nuevas ofertas"), ni confirmarse ayuda, ni avanzar el estado de una oferta ajena, ni reabrir una necesidad cerrada.
- El contacto privado solo se revela a involucrados (dueño/oferente) y queda registrado en `contact_access_log` (2 revelaciones).

**Contenido**

- Oferta de ayuda (`HelpOfferForm`): tipo de ayuda (capacidades) + mensaje breve.
- Lista de ofertas con estados claros y lenguaje preciso: "se ofreció a ayudar" ≠ "ayudó" (UX §16).
- Hilo de colaboración: comentarios + ofertas visualmente diferenciados (MVP §14).
- Transiciones de estado de oferta: `OFFERED → CONTACTED → AGREED → COMPLETED → CONFIRMED`, con `CANCELLED`.
- Contacto: botón `Contactar` habilitado solo con relación válida; RPC `get_need_contact()` + log de revelación (UX §18, ARCH §30).
- Confirmación de ayuda por el creador de la necesidad (nunca auto-asignada).
- Transiciones de necesidad: `OPEN → IN_PROGRESS → RESOLVED` y cierre a `CLOSED`, solo por el dueño; no reabrir.
- Mensajes claros ante conflictos de concurrencia (UX §40): "Esta necesidad ya no acepta nuevas ofertas".

**Criterio de verificación**

- El flujo MVP §33 pasos 1–13 funciona de punta a punta.
- Un usuario no puede ofrecerse a sí mismo, ni ofrecer en necesidad no activa, ni confirmarse ayuda.
- El contacto privado solo se revela a involucrados y queda registrado.

### Fase 6 — Moderación y panel administrativo

**Estado: COMPLETADA y verificada localmente (typecheck/lint/build verdes, RLS 41/41, auth 10/10, publicación 21/21, ayuda 53/53, contrato de moderación 40/40).**

**Contenido entregado**

- **Backend** (migración `20260814000010_moderation_admin_grants.sql`): grants que faltaban para que un admin pudiera moderar por API — `grant update, delete on reports to authenticated` (solo existía `select, insert`, igual que el hallazgo de Fase 4 con `need_images`) y `grant update on profiles to authenticated` (para suspender con `banned_at`). RPC `admin_stats()` (SECURITY DEFINER, lanza `Se requieren permisos de administrador` si `not is_admin()`): usuarios/total+ban, necesidades/total+por estado+ocultas, ofertas, comentarios, reportes pendientes.
- **Reportes** (frontend): página `/report?type=need|comment|user&id=…&label=…&needId=…` con `ReportForm` (motivos de MVP §26, detalles ≤1000). Botones "Reportar" en `NeedDetailPage`: la necesidad, el autor, cada comentario y cada oferente — distingue "reportar al usuario" vs "reportar su contenido" (criterio de verificación de la fase). Solo verificado y no suspendido puede reportar (RLS); sin auto-reporte (`403`) y sin duplicados (`409`/`one_report_per_user_target`).
- **Panel admin** (`AdminLayout` con sidebar, rutas `/admin`, `/admin/reports`, `/admin/users`, `/admin/needs` bajo `AdminRoute`): dashboard con `AdminStatsCards`; `ReportsTable` (ver todos, cambiar `PENDING/REVIEWED/ACTIONED/DISMISSED`, eliminar); `UsersTable` (búsqueda por nombre + filtro de municipio, suspender/restaurar); `NeedsTable` (ocultar/restaurar/cerrar).
- **Moderación** verificada de punta a punta: ocultar necesidad/comentario (`is_hidden` deja de verse por anon), cerrar necesidad (el trigger 0008 permite a admin), suspender usuario (`is_banned()` bloquea crear necesidad/comentario/reporte con `403`).
- **`supabase/tests/seed_admin.sh`**: promueve un email existente a ADMIN (la UI oculta las rutas admin, pero la protección real es RLS, ARCH §36/§49). `useIsAdmin` extraído a `src/features/auth/hooks/useIsAdmin.ts` (reutilizado por `AdminRoute` y `AppHeader`, que muestra el enlace "Admin").

**Decisiones técnicas surgidas durante la verificación**

- **`reports` y `profiles` no tenían grants para acciones de admin**: `reports` solo `select, insert` (el admin no podía cambiar estado/borrar → `42501`) y `profiles` solo `select` (no podía suspender). La migración 0010 los agrega; las políticas RLS de admin ya existían.
- **Reportes residuales entre corridas**: los reportes son globales y solo el admin puede borrarlos; el contrato limpia `reports` por SQL al inicio para contar exacto.
- **La búsqueda de usuarios es por `display_name` + municipio**: `auth.users.email` no está expuesto por API; se rehúye un RPC que lo consulte para no ampliar la superficie de seguridad.
- **`Suspender` solo fija `banned_at`** (decisión de alcance): bloquea acciones nuevas vía `is_banned()`; no se oculta masivamente el contenido previo.

**Criterio de verificación (cumplido, `supabase/tests/moderation_contract.sh` → 40 PASS / 0 FAIL)**

- Reportar necesidad, comentario y usuario funciona; "reportar al usuario" ≠ "reportar su contenido".
- Un usuario normal no puede ejecutar acciones de admin aunque llame a la API directamente (reportes ajenos, ocultar/cerrar necesidad, suspender, ocultar comentarios — verificado por GET, ya que PATCH sin filas responde 204; `admin_stats` rechazado con 400).
- El contenido oculto deja de verse públicamente; el admin lo restaura; el suspendido queda bloqueado para publicar/participar.

**Contenido**

- Reportes: necesidad, comentario, usuario (tipos acordados), con motivos de MVP §26.
- Panel administrativo (`AdminRoute`): ver/buscar usuarios, suspender, ver necesidades, ocultar, cerrar, ver reportes, moderar comentarios, estadísticas básicas.
- Acciones de moderación: `is_hidden`, cierre de necesidad, `banned_at` en perfiles, estado del reporte (`PENDING/REVIEWED/ACTIONED/DISMISSED`).
- Autorización administrativa real en DB (`is_admin()`), no controlada por el cliente (ARCH §36, §49).

**Criterio de verificación**

- Reportar contenido y usuario funciona (incluye el caso "reportar al usuario" vs "reportar su contenido").
- Un usuario normal no puede ejecutar acciones de admin aunque llame a la API directamente.
- El contenido oculto deja de verse públicamente.

### Fase 7 — Notificaciones in-app

**Estado: COMPLETADA y verificada localmente (typecheck/lint/build verdes, RLS 41/41, auth 10/10, publicación 21/21, ayuda 53/53, moderación 40/40, contrato de notificaciones 47/47).**

**Contenido entregado**

- **Triggers de dominio** (migración `20260814000011_notifications_triggers.sql`): la tabla `notifications` ya existía (0001) con RLS dueño + grants `select/update/delete` (sin insert, de diseño); la fase agrega 4 funciones SECURITY DEFINER (`set search_path = ''`) + triggers que las crean: `notify_help_offer` (oferta → dueño), `notify_comment` (comentario → dueño), `notify_help_confirmed` (confirmación → oferente), `notify_need_status_change` (cambio de estado → oferentes vigentes). El payload lo arma el trigger: `title` + `actor_name` (+ `status` para cambios de estado). Sin auto-notificación (el actor nunca es el destinatario).
- **Índice parcial** `notifications_user_unread_idx (user_id) where read_at is null` para el conteo del badge (se mantiene `notifications_user_idx (user_id, created_at desc)` para paginación).
- **Bandeja `/notifications`** (`ProtectedRoute` + `VerifiedRoute`): `src/features/notifications/{types, services/notificationsService, hooks/useNotifications, components/NotificationItem, pages/NotificationsPage}` con mensajes en español por tipo (UX §23), punto + resaltado de no leídas, "Marcar leída" por fila, "Marcar todo como leído", "Eliminar", enlace "Ver" a la necesidad, y paginación por cursor `(created_at desc, id desc)` con "Cargar más" — mismo patrón que `getPublicNeeds` (PAGE_SIZE+1 sin COUNT).
- **Badge en cabecera**: `AppHeader` muestra "Notificaciones" con contador de no leídas (hook `useUnreadCount`, misma consulta del contrato: `select=id` + `read_at=is.null` con conteo exacto), solo para usuarios autenticados.

**Decisiones técnicas surgidas durante la verificación**

- **Los triggers eran la pieza faltante**: la tabla, RLS y grants existían desde Fase 1, pero no había triggers → esta fase solo creó funciones/triggers e índice, sin tocar esquema ni políticas.
- **Las funciones son SECURITY DEFINER** porque la tabla no expone INSERT (RLS owner + sin grant); aun así, el cliente no puede insertar notificaciones a mano (403 `permission denied`), lo que cierra el camino a la auto-generación.
- **El `status` que llega al payload es el enum crudo** del backend (p. ej. `IN_PROGRESS`); el frontend lo muestra tal cual (no hay etiquetas de estado en el contrato para evitar duplicar el mapeo).
- **Paginación por cursor, no por offset** (mismo criterio que Fase 4): consistente con la UI y sin COUNT por página. En bash, el filtro `or=(and(created_at.lt.X),and(created_at.eq.X,id.lt.Y))` requiere codificar `+`, `:` y paréntesis en la URL (el cliente JS lo hace solo con supabase-js; el contrato lo hace con sed).

**Criterio de verificación (cumplido, `supabase/tests/notifications_contract.sh` → 47 PASS / 0 FAIL)**

- El destinatario recibe la notificación correcta ante cada evento de dominio (4 tipos, payload con título y actor).
- Las notificaciones no dependen del frontend (las crean los triggers).
- Marcar como leída funciona y no afecta otras notificaciones (conteo de no leídas exacto por API).

**Contenido**

- Tabla `notifications` + triggers que crean notificaciones al: oferta de ayuda, comentario, ayuda confirmada, cambio de estado de necesidad.
- Bandeja simple dentro de la aplicación con estado de leído/no leído.
- Consultas paginadas y con índice `(user_id, read_at, created_at DESC)`.

**Criterio de verificación**

- El destinatario recibe la notificación correcta ante cada evento de dominio.
- Las notificaciones no dependen del frontend (las crean los triggers).
- Marcar como leída funciona y no afecta otras notificaciones.

### Fase 8 — Testing y despliegue

**Estado: COMPLETADA — incluye el despliegue en vivo.** Producción en `https://reconstruyamospereira.netlify.app`, conectado de forma nativa al repo (push a `main` → build y deploy). Proyecto Supabase remoto `reconstruyendo-pereira` con las 11 migraciones aplicadas, bucket de Storage `need-images` funcional y auth configurado (`site_url` + redirects localhost/producción). Unit 29/29, contratos 6/6, typecheck/lint/build verdes.

**Contenido entregado**

- **Tests unitarios (Vitest)**: `npm run test` → 29 tests. Cubren funciones puras: `mapAuthError` (todos los códigos/mensajes), `mapPublishError`, `notificationMessage` (4 tipos + fallbacks), `timeAgo` (franjas relativas + fecha larga), y la lógica de estados de oferta (`HELP_OFFER_OWNER_NEXT`: cadena OFFERED→…→CONFIRMED, terminales). Config en `vitest.config.ts` (alias `@`, env ficticio para inicializar el cliente sin red).
- **Tests de integración y seguridad**: reutilizan los 6 contratos e2e (`supabase/tests/*.sh`) mediante `npm run test:contracts` (`supabase/tests/run_all.sh`), que los ejecuta en orden y falla si alguno no pasa. Verifican por API que un usuario no pueda editar/confirmar/leer cosas ajenas ni saltarse restricciones por llamadas directas (RLS como autoridad, ARCH §36/§49).
- **Despliegue**: `netlify.toml` (build `npm run build`, publish `dist`, redirect SPA para el router y el callback `/auth/callback`), `.env.example` con comentarios por entorno, y `README.md` completo (setup local, verificación, y despliegue Supabase + Netlify paso a paso).

**Decisión: migraciones para el primer despliegue**

- Se mantienen las 11 migraciones versionadas tal cual (no se condensan). Razones: para un proyecto remoto nuevo `supabase db push` aplica todo en orden y el resultado es idéntico a tener un solo archivo; los 11 archivos ya están probados por los 6 contratos (RLS 41, auth 10, publish 21, help 53, moderation 40, notifications 47); se conserva la granularidad para depurar y el flujo estándar de `schema_migrations`.
- Pre-despliegue validado con `supabase db reset --local` (reconstruye la DB **solo desde las migraciones**, la misma operación que hará `db push` en el remoto). Esto también resolvió una desincronización: las migraciones 0006-0011 se habían aplicado por `psql` directo sin registrarlas en `supabase_migrations.schema_migrations` (solo constaban 0001-0005). Tras el reset, la historia registra los 11 y la base reconstruida pasó los 6 contratos + typecheck/lint/build + smoke.
- Pasos del despliegue real: `supabase projects create` → `supabase link --project-ref <ref>` → `supabase db push` → configurar auth callback y bucket de storage en el dashboard remoto → variables `VITE_*` por entorno en Netlify → Netlify.

**Criterio de verificación**

- `npm run test` verde (29/29).
- Los tests de seguridad fallan cuando la protección RLS está ausente y pasan cuando está presente (los contratos fallan si la RLS no protege; se verifica contra una base con RLS aplicada).
- Deploy en Netlify funcional con auth callback configurado — **cumplido**: `https://reconstruyamospereira.netlify.app` (site id `8eda2aea-627d-4869-aa21-9e1af4313c6b`), repo conectado de forma nativa, `VITE_*` por entorno en el dashboard de Netlify, y redirects de auth en el remoto (localhost + producción).

## 6. Reglas transversales para todas las fases

- Respetar siempre los tres documentos de referencia y las decisiones de la sección 3.
- No introducir dependencias, patrones ni funcionalidades fuera del alcance sin justificación documentada.
- RLS es la autoridad definitiva; la UI solo guía la experiencia.
- Los datos privados nunca se exponen en consultas públicas.
- Toda migración de esquema pasa por migraciones versionadas, nunca por cambios manuales en el dashboard.
- Los listados usan paginación; no se cargan listados completos ni `select('*')`.
- La interfaz siempre en español, mobile-first y accesible.

## 7. Orden de dependencias

```
Fase 0 (scaffold)
   ↓
Fase 1 (DB/RLS) ──→ Fase 2 (Auth)
   ↓                    ↓
Fase 3 (públicas) ←── Fase 4 (publicar)
   ↓                    ↓
Fase 5 (ayuda + hilo)  ←─ (depende de 3 y 4)
   ↓
Fase 6 (moderación) → Fase 7 (notificaciones)
   ↓
Fase 8 (testing + despliegue)
```

Las fases 3 y 4 dependen de Auth para las acciones con sesión, pero el consumo público de la fase 3 puede desarrollarse antes de completar la 2.
