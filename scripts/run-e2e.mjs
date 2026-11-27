import { execFileSync, spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';

const rootDir = process.cwd();
const e2eApiPort = Number(process.env.E2E_API_PORT || 5099);
const e2eUiPort = Number(process.env.E2E_UI_PORT || 5174);

function killTree(pid) {
  if (!pid || pid <= 0) return;
  if (process.platform === 'win32') {
    try {
      execFileSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      // Process already exited
    }
  } else {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // Already dead
    }
  }
}

function clearListeningPorts(ports) {
  for (const port of ports) {
    if (process.platform === 'win32') {
      try {
        const out = execFileSync(
          'powershell.exe',
          [
            '-NoProfile',
            '-Command',
            `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`,
          ],
          { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
        ).trim();
        for (const line of out.split(/\r?\n/)) {
          const pid = Number(line.trim());
          if (pid > 0 && pid !== process.pid) {
            killTree(pid);
          }
        }
      } catch {
        // Ignore if port free
      }
    } else {
      try {
        const out = execFileSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        for (const line of out.split(/\r?\n/)) {
          const pid = Number(line.trim());
          if (pid > 0 && pid !== process.pid) {
            killTree(pid);
          }
        }
      } catch {
        // Ignore if lsof unavailable or port free
      }
    }
  }
}

function probeUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 2000 }, (res) => {
      res.resume();
      resolve((res.statusCode || 500) < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForUrl(url, label, timeoutMs, proc) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (proc.exitCode !== null) {
      throw new Error(`${label} exited prematurely with code ${proc.exitCode}`);
    }
    if (await probeUrl(url)) {
      return;
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  throw new Error(`Timed out waiting for ${label} at ${url}`);
}

async function main() {
  clearListeningPorts([e2eApiPort, e2eUiPort]);

  const apiProc = spawn(
    process.execPath,
    ['-r', 'ts-node/register/transpile-only', '__tests__/helpers/e2eServer.ts'],
    {
      cwd: path.join(rootDir, 'server'),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        E2E_API_PORT: String(e2eApiPort),
        TS_NODE_PROJECT: './tsconfig.json',
      },
    }
  );
  apiProc.stderr.on('data', (chunk) => process.stderr.write(`[e2e-api] ${chunk}`));

  const uiProc = spawn(process.execPath, [path.join(rootDir, 'scripts', 'e2e-ui-server.mjs')], {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      E2E_UI_PORT: String(e2eUiPort),
      VITE_API_BASE_URL: `http://127.0.0.1:${e2eApiPort}/api`,
      VITE_SOCKET_URL: `http://127.0.0.1:${e2eApiPort}`,
    },
  });
  uiProc.stdout.on('data', (chunk) => process.stdout.write(`[e2e-ui] ${chunk}`));
  uiProc.stderr.on('data', (chunk) => process.stderr.write(`[e2e-ui] ${chunk}`));

  const cleanup = () => {
    killTree(apiProc.pid);
    killTree(uiProc.pid);
    clearListeningPorts([e2eApiPort, e2eUiPort]);
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });

  try {
    await Promise.all([
      waitForUrl(`http://127.0.0.1:${e2eApiPort}/health-check`, 'E2E API Server', 60_000, apiProc),
      waitForUrl(`http://127.0.0.1:${e2eUiPort}/`, 'E2E UI Server', 120_000, uiProc),
    ]);

    const extraArgs = process.argv.slice(2);
    const hasReporter = extraArgs.some((arg) => arg === '--reporter' || arg.startsWith('--reporter='));
    const playwrightCli = path.join(rootDir, 'node_modules', '@playwright', 'test', 'cli.js');
    const pwArgs = [playwrightCli, 'test', ...(hasReporter ? [] : ['--reporter=list']), ...extraArgs];

    const exitCode = await new Promise((resolve) => {
      const pwChild = spawn(process.execPath, pwArgs, {
        cwd: rootDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          PLAYWRIGHT_SKIP_WEBSERVER: '1',
          E2E_API_PORT: String(e2eApiPort),
          E2E_UI_PORT: String(e2eUiPort),
        },
      });
      pwChild.on('exit', (code) => resolve(code ?? 1));
    });

    cleanup();
    process.exit(exitCode);
  } catch (err) {
    console.error('[run-e2e] Error:', err);
    cleanup();
    process.exit(1);
  }
}

main();
