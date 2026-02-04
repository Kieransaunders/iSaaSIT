import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import * as dotenv from 'dotenv';

// Load .env.local (TanStack Start/Vite convention)
dotenv.config({ path: '.env.local', quiet: true });
// Also load .env as fallback
dotenv.config({ quiet: true });

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/blog': {
        target: 'http://localhost:4321',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart(),
    viteReact(),
  ],
});
