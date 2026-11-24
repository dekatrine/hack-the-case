import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '^/api/(?![^?]*\\.jsx?(?:[?]|$))': { target: process.env.HTC_DEV_API_TARGET || 'http://127.0.0.1:8001', changeOrigin: true },
      '/health': { target: process.env.HTC_DEV_API_TARGET || 'http://127.0.0.1:8001', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['**/*.test.{js,jsx}'],
  },
});
