import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/foco-iphone-demo/',
  plugins: [react()],
  server: {
    // Phone tunnels (loca.lt / cloudflare) send a foreign Host header.
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        kiosk: resolve(import.meta.dirname, 'kiosk/index.html'),
      },
    },
  },
});
