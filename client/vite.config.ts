/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-i18next': path.resolve(__dirname, './src/i18n/react-i18next.ts'),
      'i18next': path.resolve(__dirname, './src/i18n/react-i18next.ts'),
      'i18next-browser-languagedetector': path.resolve(__dirname, './src/i18n/react-i18next.ts'),
    },
  },
  server: {
    port: 5173,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
