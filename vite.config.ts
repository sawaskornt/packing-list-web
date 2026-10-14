import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const BACKEND_URL = 'https://packing-list-1081640935031.us-west1.run.app';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
