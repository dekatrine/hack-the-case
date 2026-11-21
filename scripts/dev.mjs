// One-command local development: reuse an existing Hack the Case API or start it.
// Uses only Node built-ins and the existing backend Python environment.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const backend = join(root, 'backend');
const candidates = [
  join(backend, '.venv', 'bin', 'python'),
  join(root, '.venv', 'bin', 'python'),
];
const python = process.env.HTC_PYTHON || candidates.find(existsSync) || 'python3';
let apiProcess = null;
let viteProcess = null;
let stopping = false;
const alive = async port => {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1200) });
    if (!response.ok) return false;
    const body = await response.json();
    return body?.status === 'ok';
  } catch { return false; }
};
function portAvailable(port) {
  return new Promise(resolvePort => {
    const server = createServer();
    server.once('error', () => resolvePort(false));
    server.listen(port, '127.0.0.1', () => server.close(() => resolvePort(true)));
  });
}
async function choosePort() {
  const preferred = Number(process.env.HTC_BACKEND_PORT || '8001');
  if (!Number.isInteger(preferred) || preferred < 1024 || preferred > 65535) {
    throw new Error('Некорректный HTC_BACKEND_PORT');
  }
  if (await alive(preferred)) return { port: preferred, reuse: true };
  for (let port = preferred; port < Math.min(preferred + 20, 65536); port += 1) {
    if (await portAvailable(port)) return { port, reuse: false };
  }
  throw new Error('Нет свободного порта для API рядом с ' + preferred);
}
function wait(ms) { return new Promise(resolveWait => setTimeout(resolveWait, ms)); }
function terminate(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  if (viteProcess && !viteProcess.killed) viteProcess.kill(signal);
  if (apiProcess && !apiProcess.killed) apiProcess.kill(signal);
}
process.on('SIGINT', () => terminate('SIGINT'));
process.on('SIGTERM', () => terminate('SIGTERM'));

async function start() {
  const {port, reuse} = await choosePort();
  if (reuse) {
    process.stdout.write(`✓ Используем уже работающий Hack the Case API на порту ${port}\n`);
  } else {
    process.stdout.write(`▶ Запускаю backend на порту ${port}…\n`);
    apiProcess = spawn(python, [
      '-m','uvicorn','app.main:app','--reload','--reload-dir','app',
      '--host','127.0.0.1','--port',String(port)
    ], { cwd: backend, env: process.env, stdio: 'inherit' });
    let backendExit = null;
    apiProcess.once('error', error => {
      backendExit = error;
      process.stderr.write(`Не удалось запустить Python: ${error.message}\n`);
    });
    apiProcess.once('exit', code => { backendExit = new Error(`Backend завершился (код ${code})`); });
    let ready = false;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      if (backendExit) throw backendExit;
      if (await alive(port)) { ready = true; break; }
      await wait(250);
    }
    if (!ready) throw new Error('Backend не ответил на /health. Проверь установку Python-зависимостей в backend/.venv.');
  }
  process.stdout.write(`✓ API готов: http://127.0.0.1:${port}/health\n▶ Запускаю сайт…\n`);
  const viteBinary = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  viteProcess = spawn(process.execPath, [viteBinary, ...process.argv.slice(2)], {
    cwd: root,
    env: { ...process.env, HTC_DEV_API_TARGET: `http://127.0.0.1:${port}` },
    stdio: 'inherit',
  });
  viteProcess.once('error', error => {
    process.stderr.write(`Не удалось запустить Vite: ${error.message}\n`);
    terminate();
    process.exitCode = 1;
  });
  viteProcess.once('exit', code => {
    terminate();
    process.exitCode = code || 0;
  });
}
start().catch(error => {
  process.stderr.write(`\nОшибка запуска Hack the Case: ${error.message}\n`);
  terminate();
  process.exitCode = 1;
});
