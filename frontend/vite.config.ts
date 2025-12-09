import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import proxyOptions from './proxyOptions';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/assets/battle/frontend/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../battle/public/frontend'),
    emptyOutDir: true,
  },
  server: {
    proxy: proxyOptions,
  },
});
