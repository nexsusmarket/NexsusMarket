import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/signup': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/signin': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/request-password-reset': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/verify-otp': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/verify-otp-and-reset': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});

