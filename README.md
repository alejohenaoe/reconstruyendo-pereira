# Ayudemos — Reconstruyendo

Plataforma comunitaria para coordinar ayuda tras emergencias: los vecinos
publican pedidos de ayuda y la comunidad ofrece ayuda concreta (mano de obra,
materiales, transporte). Construida con React + TypeScript + Vite y Supabase
(Auth + Postgres/RLS + Storage). La seguridad real vive en RLS (backend); la UI
solo guía la experiencia (ARCH §36, §49).

Documentos de referencia: `docs/MVP.md`, `docs/ARCHITECTURE_GUIDELINES.md`,
`docs/UX_UI_GUIDELINES.md`, `docs/IMPLEMENTATION_PLAN.md`.

## Requisitos

- Node.js ≥ 22 y npm.
- Docker (para el stack local de Supabase).
- Supabase CLI ≥ 2.x (`supabase --version`).

## Setup local

```sh
npm install
supabase start                 # levanta el stack local (API, DB, Studio, Mailpit)
supabase status                # anota: API URL y anon key
```

Crea el archivo de entorno:

```sh
cp .env.example .env           # completa VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY
```

> La `VITE_SUPABASE_PUBLISHABLE_KEY` local es la anon key de `supabase status`.
> Nunca uses una service/secret key en variables `VITE_*`.

Desarrollo:

```sh
npm run dev                    # Vite en localhost:5173
```

La base local se construye exclusivamente desde las migraciones versionadas
(`supabase/migrations/`). Para reconstruirla desde cero (misma operación que el
despliegue a un proyecto nuevo):

```sh
supabase db reset --local
```

## Verificación

```sh
npm run test                   # tests unitarios (Vitest): mappers de error, tiempo, estados
npm run test:contracts         # contratos e2e/seguridad por API (requiere stack local arriba)
npm run typecheck
npm run lint
npm run build
```

Los contratos (`supabase/tests/*.sh`) cubren integración y seguridad: RLS,
auth, publicación, ayuda/contacto, moderación y notificaciones. Verifican en
backend que un usuario no pueda editar cosas ajenas ni saltarse restricciones
por llamadas directas a la API; fallan si la protección RLS está ausente.

## Despliegue

> **Estado actual**: producción en `https://reconstruyamospereira.netlify.app`.
> Las migraciones están aplicadas al proyecto remoto `reconstruyendo-pereira`
> (ref `rpbpwwwvakpxzdinvojw`), el bucket de Storage `need-images` existe, el repo
> está conectado de forma nativa a Netlify (push a `main` → build + deploy), y el
> auth remoto ya tiene `site_url` y redirects de producción + localhost.

### 1. Base de datos (Supabase remoto)

El proyecto está vinculado (`supabase/.temp/project-ref`). Para aplicar las
migraciones al proyecto remoto:

```sh
supabase link --project-ref <ref>   # si aún no está vinculado
supabase db push                    # aplica las migraciones en orden
```

Configura en el dashboard remoto (Authentication → URL Configuration):

- Site URL: `https://<tu-sitio>.netlify.app`
- Redirect URLs: `https://<tu-sitio>.netlify.app/auth/callback` (y `http://localhost:5173/auth/callback` para desarrollo)
- Storage → `need-images`: el bucket y las políticas se crean con la migración `0004`, pero el bucket de Storage del proyecto debe existir para las imágenes.

### 2. Frontend (Netlify)

`netlify.toml` ya define build (`npm run build`, publica `dist`) y el redirect
SPA para el router y el callback de auth. Pasos:

1. Conecta el repo en Netlify (build command `npm run build`, publish `dist`).
2. Variables por entorno (ARCH §45), en Site settings → Environment variables:
   - Producción: `VITE_SUPABASE_URL=https://<ref>.supabase.co` y
     `VITE_SUPABASE_PUBLISHABLE_KEY=<anon key del proyecto remoto>`.
   - Deploy-preview: apunta a un proyecto de staging si quieres aislar datos de
     pruebas; si no, usa el mismo proyecto remoto.
3. Tras el primer deploy, vuelve a Authentication → URL Configuration y agrega
   la URL de producción como Redirect URL (paso 1).
