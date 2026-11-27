import fs from 'node:fs';
import path from 'node:path';
import { build, preview } from 'vite';

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'node_modules', '.cache', 'e2e-dist');
const port = Number(process.env.E2E_UI_PORT || 5174);
const skipBuild =
  process.env.E2E_SKIP_BUILD === '1' &&
  fs.existsSync(path.join(outDir, 'index.html'));

async function main() {
  if (!skipBuild) {
    await build({
      root: rootDir,
      configFile: path.join(rootDir, 'vite.config.ts'),
      logLevel: 'warn',
      build: {
        outDir,
        emptyOutDir: true,
      },
    });
  }

  const previewServer = await preview({
    root: rootDir,
    configFile: path.join(rootDir, 'vite.config.ts'),
    build: {
      outDir,
    },
    preview: {
      host: '127.0.0.1',
      port,
      strictPort: true,
    },
  });

  console.log(`[E2E UI] Serving built bundle on http://127.0.0.1:${port}/`);

  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    const forceTimer = setTimeout(() => process.exit(0), 1200);
    forceTimer.unref();
    previewServer.httpServer.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGBREAK', shutdown);
}

main().catch((err) => {
  console.error('[E2E UI] Startup failed:', err);
  process.exit(1);
});
