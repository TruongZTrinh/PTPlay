import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  server: {
    port: 5175,
    host: '0.0.0.0',
    strictPort: true,
  },
  preview: {
    port: 5175,
    host: '0.0.0.0',
    strictPort: true,
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
    assetsInlineLimit: 4096,
  },
});
