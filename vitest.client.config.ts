import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'

/**
 * Contrato del cliente: ejecuta las funciones reales de `features/*\/services`
 * contra el stack local, tal como las llama el navegador (`npm run test:client`).
 *
 * Existe porque los contratos en bash mandan las peticiones a mano y pueden
 * probar llamadas que el cliente no hace: así estuvieron rotos en producción
 * `addComment`, `createHelpOffer` y `createReport`, los tres por no enviar el
 * `user_id` que exige la RLS, con la suite en verde.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['supabase/tests/client_writes.test.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54421',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
    },
  },
})
