import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Respect the PORT assigned by the environment (e.g. the preview harness).
    // Vite ignores process.env.PORT by default; fall back to Vite's default 5173.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
});
