import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/assets/battle/frontend/',
  build: {
    outDir: path.resolve(__dirname, '../battle/public/frontend'),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '^/(app|api|assets|files)': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
