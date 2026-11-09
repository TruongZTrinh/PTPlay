import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    assetsInlineLimit: 2500000,
    chunkSizeWarningLimit: 3000,
    cssCodeSplit: false,
  },
});
