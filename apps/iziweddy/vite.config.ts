import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  // Aplikace nejede na vlastní doméně, ale pod cestou www.fridrich.cloud/izi-weddy.
  // Odsud si základ vezme i router přes import.meta.env.BASE_URL.
  base: '/izi-weddy/',
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': { target: 'http://localhost:7071', changeOrigin: true },
    },
  },
  build: { outDir: 'dist', sourcemap: true },
});
