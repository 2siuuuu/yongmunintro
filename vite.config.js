import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { getRequestListener } from '@hono/node-server';
import app from './server/app.js';

function apiMiddleware(server) {
  const listener = getRequestListener(app.fetch, { overrideGlobalObjects: false });
  server.middlewares.use((request, response, next) => {
    if (/^\/api(?:\/|\?|$)/.test(request.url || '')) {
      return listener(request, response);
    }
    next();
  });
}

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'village-api',
    configureServer: apiMiddleware,
    configurePreviewServer: apiMiddleware,
  }],
  server: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' } },
  preview: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' } },
  appType: 'mpa',
  build: { target: 'es2022' },
});
