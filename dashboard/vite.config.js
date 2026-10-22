import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy API requests to Express server running on port 4000
      '/issues': 'http://localhost:4000',
      '/health': 'http://localhost:4000',
    },
  },
});
