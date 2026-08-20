# AGENTS.md — Reconstruyendo

Guía operativa para agentes que trabajan en este repositorio. Complementa y nunca contradice
`docs/ARCHITECTURE_GUIDELINES.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/UX_UI_GUIDELINES.md` y `docs/MVP.md`.

## Visión

Aplicación móvil-first (en español) para la reconstrucción del eje cafetero tras el terremoto
del 10 de agosto de 2026: los damnificados publican **pedidos de ayuda** de reconstrucción (con
fotos y oficios requeridos), otros usuarios
ofrecen **ayuda** y gestionan ofertas, y hay un panel de **moderación** + **notificaciones**
in-app. Auth por correo y contraseña, con el correo autoconfirmado en el registro. RLS es la autoridad de seguridad; la UI solo guía la experiencia.

## Stack y comandos

- React 19 + TypeScript ~6 + Vite 8 + React Router 7 + Tailwind 4 + lucide-react + `@supabase/supabase-js` 2.57.
- Sin TanStack Query: el fetching se hace con hooks propios bajo `src/features/*/hooks`.
- Scripts (ver `package.json`):
  - `npm run dev` — dev server Vite (usa el `.env` local).
  - `npm run build` — `tsc -b && vite build` (output `dist/`).
  - `npm run lint` — oxlint. `npm run typecheck` — `tsc -b`.
  - `npm run test` — tests unitarios Vitest (53 tests, co-localizados en `src/**/*.test.ts`).
  - `npm run test:contracts` — contratos e2e/seguridad (`supabase/tests/run_all.sh`). **Requiere el stack local corriendo** (`supabase status`). Ejecuta en orden: rls_security (53), auth (13), publish (30), help (59), moderation (50), notifications (49).
  - `npm run test:client` — contrato del cliente (`supabase/tests/client_writes.test.ts`, Vitest): ejecuta las funciones reales de `features/*/services` contra el stack local, tal como las llama el navegador. **También requiere el stack local.** Es la red que faltaba: los contratos en bash arman las peticiones a mano y pueden validar llamadas que el cliente no hace.
  - `npm run format` / `format:check` — Prettier (incluye `prettier-plugin-tailwindcss`).

## Estructura

- `src/features/{auth,home,needs,help,profile,moderation,notifications}/` — feature slices; cada una con `pages/`, `components/`, `hooks/`, `services/`, `types.ts`.
- `src/shared/{components,hooks,lib,types,utils}/` — código compartido. El cliente único de Supabase está en `src/shared/lib/supabase.ts` (alias `@` → `./src`, ver `vite.config.ts`).
- `supabase/migrations/` — 16 migraciones versionadas (la única vía de cambios de esquema; nunca editar el esquema a mano).
- `supabase/tests/` — contratos e2e por API (`*.sh`) + `run_all.sh`.

## Supabase

- **Remoto**: proyecto `reconstruyendo-pereira`, ref `rpbpwwwvakpxzdinvojw`, región Canada Central, vinculado (`.temp/project-ref`). URL API: `https://rpbpwwwvakpxzdinvojw.supabase.co`.
- **Local**: `supabase start` / `stop` (config en `supabase/config.toml`). Los puertos reales salen de `supabase status` (API, REST `/rest/v1`, Auth `/auth/v1`, Mailpit).
- Migraciones:
  - `supabase db reset --local` — reconstruye la DB local **solo desde las migraciones** (validación previa a `db push`).
  - `supabase db push` — aplica al remoto. `supabase migration list` — compara local/remoto.
- El bucket de Storage `need-images` (público, 5 MB, jpeg/png/webp) se crea/verifica también vía API (`POST /storage/v1/bucket`) si el servicio no lo refleja tras `db push`.

## Variables de entorno y tokens

- `.env` (gitignored, **no versionar**) es la fuente de config. Solo las variables con prefijo `VITE_` llegan al bundle del cliente; lo demás queda en el servidor.
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — requeridas por `src/shared/lib/supabase.ts` (lanza error si faltan).
  - `SUPABASE_ACCESS_TOKEN` — **token de acceso personal de Supabase (Management API / CLI)**. Está guardado en `.env`. Para usarlo en comandos:
    `export SUPABASE_ACCESS_TOKEN=$(grep ^SUPABASE_ACCESS_TOKEN .env | cut -d= -f2)`
  - `GH_TOKEN` — **token de acceso personal de GitHub (push/HTTPS, scopes `repo` + `workflow`)**. Está guardado en `.env`. El push del repo ya funciona vía `gh auth setup-git`; si hace falta usar este token (p. ej. para crear/actualizar `.github/workflows/`):
    `export GH_TOKEN=$(grep ^GH_TOKEN .env | cut -d= -f2)`
  - `NETLIFY_AUTH_TOKEN` — **token de acceso personal de Netlify (deploys por CLI)**. Está guardado en `.env`. Para desplegar por CLI: `export NETLIFY_AUTH_TOKEN=$(grep ^NETLIFY_AUTH_TOKEN .env | cut -d= -f2)`.
  - `.env.production` (gitignored) apunta al remoto para builds de producción.
- La publishable key es **pública** por diseño; la **service_role/secret key NUNCA** debe ir en archivos ni en variables `VITE_` (`.env.example` documenta esto).
- **Netlify**: producción en `https://reconstruyamospereira.netlify.app`, cuenta `pereira` (slug `alejohenaoec`), site id `a2724421-9f8b-486b-a6c7-5286786b9c2e`. El repo está conectado de forma nativa (`netlify.toml` define build `npm run build` y publish `dist`). Estado local del link en `.netlify/state.json`.
  - **Un deploy sólo se dispara con un push a `main`**: `allowed_branches = ["main"]` (no hay branch deploys) y `skip_prs = true` (no hay deploy previews de PRs). El trabajo va en ramas y se integra a `main` cuando se quiere publicar.
  - Las `VITE_*` viven en el dashboard (contexto `all`) y **no deben marcarse como "secret"**: Vite las inyecta en texto plano en el bundle y el secrets scanning de Netlify aborta el build. Son públicas por diseño.
  - Config por API: `https://api.netlify.com/api/v1/accounts/alejohenaoec/env?site_id=<id>` (env vars) y `PATCH /api/v1/sites/<id>` (build settings). En el plan Free, mandar `scopes` en las env vars devuelve 403 (`Upgrade your Netlify account to set specific scopes`): hay que omitir el campo.
- Management API (config de auth del remoto, p. ej. `uri_allow_list`/`site_url` para el callback): `PATCH https://api.supabase.com/v1/projects/{ref}/config/auth` con Bearer `$SUPABASE_ACCESS_TOKEN`. **Ojo**: `uri_allow_list` es un **string separado por comas**, no un array ni saltos de línea. Ya configurado: `site_url` = producción y redirects de localhost + producción.

## Convenciones y gotchas críticas

- Las subconsultas dentro de una política RLS se evalúan **con la RLS del llamador**: para comprobar algo de otra tabla (p. ej. si el pedido está oculto) hay que usar un helper `security definer` (`is_need_hidden`, `is_need_owner`), o la comprobación se vuelve siempre verdadera para quien no ve esa fila.
- Las tablas comunitarias (`needs`, `need_comments`, `help_offers`) y `reports` **no tienen default en la columna de autor** (`user_id` / `reporter_id`) y su RLS la compara con `auth.uid()`: el cliente debe enviarla siempre o el insert se rechaza con 403. Así estuvieron rotos en producción `addComment`, `createHelpOffer` y `createReport` —comentar, ofrecer ayuda y reportar— con los contratos en verde, porque el bash mandaba el id y el cliente no. Cualquier escritura nueva debe quedar cubierta por `npm run test:client`.
- Bloqueo entre personas (`user_blocks`): sus efectos son **simétricos** y se aplican en backend —políticas de lectura de `need_comments`/`help_offers`, triggers de inserción y `get_need_contact`— mediante el helper `has_block_between()`. La tabla es privada (solo el bloqueador ve sus filas), así que cualquier comprobación desde otra tabla necesita ese helper `security definer`.
- **Correo autoconfirmado en el registro** (`mailer_autoconfirm = true` en el remoto, `enable_confirmations = false` en `supabase/config.toml`): entrar y crear cuenta son un solo paso. El gate `is_email_verified()` **no cambió** —lo siguen usando las políticas de INSERT, `can_manage_need_images()`, `get_need_contact()` y el trigger de `user_blocks`—, simplemente se cumple desde el alta. Consecuencia práctica: `POST /auth/v1/signup` devuelve una **sesión**, así que el usuario llega en `.user`, no en la raíz de la respuesta. El estado `EMAIL_UNVERIFIED` y `/verify-email` se conservan inertes por si la confirmación se reactiva (motivo y contrapartidas en `docs/ARCHITECTURE_GUIDELINES.md` §7.2.1).
- **RLS es la autoridad definitiva**: los contratos verifican por API que un usuario no pueda leer/editar/confirmar datos ajenos ni saltarse restricciones. Si un contrato falla, arreglar RLS en migración, no en la UI.
- PATCH con 0 filas afectadas devuelve **204** (no hay cuerpo); verificar el resultado con un GET posterior. Con `return=representation` la respuesta es un **array** (acceder con `.[0].id`).
- Embeds de PostgREST: una relación **a-uno** (FK saliente, p. ej. `need_comments → needs(title)`) llega como **objeto**; una **a-muchos** llega como arreglo. Ojo: `postgrest-js` los infiere como arreglos porque el proyecto no usa tipos generados de la base, así que hace falta `as unknown as ...` — pero leerlos con `[0]` en tiempo de ejecución da `undefined` (fue el bug de `target_label` en el panel de reportes). Comprobado por contrato en `moderation_contract.sh`.
- En bash, el filtro `or=(and(created_at.lt.X),and(created_at.eq.X,id.lt.Y))` exige codificar `/`, `(`, `)`, `+`, `:`; el `OR_FILTER` en peticiones con query (`/notifications?...`) debe llevar el `/` inicial. (supabase-js lo codifica solo; los `.sh` lo hacen a mano.)
- Los listados usan paginación por cursor keyset `(created_at desc, id desc)`, nunca `select('*')` ni listados completos.
- Notificaciones: triggers `SECURITY DEFINER` en la migración 0011 (la tabla no expone INSERT → 403 a clientes); payload `{title, actor_name, status?}`; índice parcial `(user_id) where read_at is null`.
- Migraciones para el primer despliegue: se mantienen las versionadas tal cual (no condensar) — decisión documentada en `docs/IMPLEMENTATION_PLAN.md` (Fase 8).
- Datos privados (teléfono, perfil) nunca en consultas públicas; UI siempre en español, mobile-first y accesible.
- No añadir dependencias/patrones fuera de alcance sin justificación documentada en los docs.
