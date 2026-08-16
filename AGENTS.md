# AGENTS.md — Reconstruyendo

Guía operativa para agentes que trabajan en este repositorio. Complementa y nunca contradice
`docs/ARCHITECTURE_GUIDELINES.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/UX_UI_GUIDELINES.md` y `docs/MVP.md`.

## Visión

Aplicación móvil-first (en español) para la reconstrucción del eje cafetero tras el terremoto
del 10 de agosto de 2026: los damnificados publican **pedidos de ayuda** de reconstrucción (con
fotos y oficios requeridos), otros usuarios
ofrecen **ayuda** y gestionan ofertas, y hay un panel de **moderación** + **notificaciones**
in-app. Auth por correo con código OTP. RLS es la autoridad de seguridad; la UI solo guía la experiencia.

## Stack y comandos

- React 19 + TypeScript ~6 + Vite 8 + React Router 7 + Tailwind 4 + lucide-react + `@supabase/supabase-js` 2.57.
- Sin TanStack Query: el fetching se hace con hooks propios bajo `src/features/*/hooks`.
- Scripts (ver `package.json`):
  - `npm run dev` — dev server Vite (usa el `.env` local).
  - `npm run build` — `tsc -b && vite build` (output `dist/`).
  - `npm run lint` — oxlint. `npm run typecheck` — `tsc -b`.
  - `npm run test` — tests unitarios Vitest (48 tests, co-localizados en `src/**/*.test.ts`).
  - `npm run test:contracts` — contratos e2e/seguridad (`supabase/tests/run_all.sh`). **Requiere el stack local corriendo** (`supabase status`). Ejecuta en orden: rls_security (45), auth (14), publish (30), help (53), moderation (49), notifications (47).
  - `npm run format` / `format:check` — Prettier (incluye `prettier-plugin-tailwindcss`).

## Estructura

- `src/features/{auth,home,needs,help,profile,moderation,notifications}/` — feature slices; cada una con `pages/`, `components/`, `hooks/`, `services/`, `types.ts`.
- `src/shared/{components,hooks,lib,types,utils}/` — código compartido. El cliente único de Supabase está en `src/shared/lib/supabase.ts` (alias `@` → `./src`, ver `vite.config.ts`).
- `supabase/migrations/` — 14 migraciones versionadas (la única vía de cambios de esquema; nunca editar el esquema a mano).
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
- **Netlify**: producción en `https://reconstruyamospereira.netlify.app` (site id `8eda2aea-627d-4869-aa21-9e1af4313c6b`). El repo ya está conectado de forma nativa (push a `main` → build y deploy automático; `netlify.toml` define build `npm run build` y publish `dist`). Las `VITE_*` ya están configuradas por entorno en el dashboard de Netlify (no se versionan). Estado local del link en `.netlify/state.json`.
- Management API (config de auth del remoto, p. ej. `uri_allow_list`/`site_url` para el callback): `PATCH https://api.supabase.com/v1/projects/{ref}/config/auth` con Bearer `$SUPABASE_ACCESS_TOKEN`. **Ojo**: `uri_allow_list` es un **string separado por comas**, no un array ni saltos de línea. Ya configurado: `site_url` = producción y redirects de localhost + producción.

## Convenciones y gotchas críticas

- Las subconsultas dentro de una política RLS se evalúan **con la RLS del llamador**: para comprobar algo de otra tabla (p. ej. si el pedido está oculto) hay que usar un helper `security definer` (`is_need_hidden`, `is_need_owner`), o la comprobación se vuelve siempre verdadera para quien no ve esa fila.
- **RLS es la autoridad definitiva**: los contratos verifican por API que un usuario no pueda leer/editar/confirmar datos ajenos ni saltarse restricciones. Si un contrato falla, arreglar RLS en migración, no en la UI.
- PATCH con 0 filas afectadas devuelve **204** (no hay cuerpo); verificar el resultado con un GET posterior. Con `return=representation` la respuesta es un **array** (acceder con `.[0].id`).
- Embeds de PostgREST: una relación **a-uno** (FK saliente, p. ej. `need_comments → needs(title)`) llega como **objeto**; una **a-muchos** llega como arreglo. Ojo: `postgrest-js` los infiere como arreglos porque el proyecto no usa tipos generados de la base, así que hace falta `as unknown as ...` — pero leerlos con `[0]` en tiempo de ejecución da `undefined` (fue el bug de `target_label` en el panel de reportes). Comprobado por contrato en `moderation_contract.sh`.
- En bash, el filtro `or=(and(created_at.lt.X),and(created_at.eq.X,id.lt.Y))` exige codificar `/`, `(`, `)`, `+`, `:`; el `OR_FILTER` en peticiones con query (`/notifications?...`) debe llevar el `/` inicial. (supabase-js lo codifica solo; los `.sh` lo hacen a mano.)
- Los listados usan paginación por cursor keyset `(created_at desc, id desc)`, nunca `select('*')` ni listados completos.
- Notificaciones: triggers `SECURITY DEFINER` en la migración 0011 (la tabla no expone INSERT → 403 a clientes); payload `{title, actor_name, status?}`; índice parcial `(user_id) where read_at is null`.
- Migraciones para el primer despliegue: se mantienen las versionadas tal cual (no condensar) — decisión documentada en `docs/IMPLEMENTATION_PLAN.md` (Fase 8).
- Datos privados (teléfono, perfil) nunca en consultas públicas; UI siempre en español, mobile-first y accesible.
- No añadir dependencias/patrones fuera de alcance sin justificación documentada en los docs.
