import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Kontaktní formulář a přihlášení míří na Azure Functions.
      '/api': {
        target: 'http://localhost:7071',
        changeOrigin: true,
      },
      /*
       * Produkty mají vlastní dev server, ale i při vývoji musí být vidět
       * pod stejnou cestou jako v produkci – jinak by se prefix /izi-weddy
       * a návrat z přihlášení daly vyzkoušet až po nasazení. Tady portál
       * zastupuje Static Web Apps, které to jinak řeší routami.
       */
      '/izi-weddy': {
        target: 'http://localhost:5174',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
