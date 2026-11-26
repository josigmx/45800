import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// every request to /api goes to the server on 3105 (no CORS needed)
// /api/expenses -> http://localhost:3105/expenses
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3105',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
