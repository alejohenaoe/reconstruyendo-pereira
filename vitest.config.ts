import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // `supabase/tests/client_writes.test.ts` necesita el stack local: va aparte,
    // en `npm run test:client`.
    exclude: ['**/node_modules/**', '**/dist/**', 'supabase/**'],
    // El módulo @/shared/lib/supabase exige VITE_* al inicializar el cliente.
    // Valores ficticios: los tests unitarios solo ejercitan funciones puras.
    env: {
      VITE_SUPABASE_URL: 'https://unit-test.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_unit_test',
    },
  },
})
