import { defineConfig, Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname } from 'node:path';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function serveAssetsPlugin(): Plugin {
  const assetsDir = resolve(__dirname, 'assets');
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.json': 'application/json',
  };

  const handleAsset = (req: any, res: any, next: any) => {
    if (req.url && req.url.startsWith('/assets/')) {
      const subPath = req.url.replace(/^\/assets\//, '').split('?')[0];
      const filePath = resolve(assetsDir, subPath);
      const publicPath = resolve(__dirname, 'public', 'assets', subPath);
      const target = (fs.existsSync(filePath) && fs.statSync(filePath).isFile())
        ? filePath
        : ((fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) ? publicPath : null);

      if (target) {
        const ext = extname(target).toLowerCase();
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        fs.createReadStream(target).pipe(res);
        return;
      }
    }
    next();
  };

  return {
    name: 'serve-root-assets',
    configureServer(server) {
      server.middlewares.use(handleAsset);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleAsset);
    },
    closeBundle() {
      const distAssetsDir = resolve(__dirname, 'dist', 'assets');
      if (fs.existsSync(assetsDir)) {
        fs.mkdirSync(distAssetsDir, { recursive: true });
        for (const file of fs.readdirSync(assetsDir)) {
          const src = resolve(assetsDir, file);
          const dest = resolve(distAssetsDir, file);
          if (fs.statSync(src).isFile()) {
            fs.copyFileSync(src, dest);
          }
        }
      }
    },
  };
}

export default defineConfig({
  root: __dirname,
  plugins: [serveAssetsPlugin()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    strictPort: true,
  },
  preview: {
    port: 5174,
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
