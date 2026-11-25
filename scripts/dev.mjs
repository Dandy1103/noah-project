import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createConnection } from 'node:net';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const route = process.argv[2];
const remotePort = Number(process.argv[3]);
if (!route || !Number.isInteger(remotePort) || remotePort < 1 || remotePort > 65535) {
  console.error('用法：node scripts/dev.mjs <路由> <remote port>');
  process.exit(1);
}

const reloadPort = 4390;
const appRoot = fileURLToPath(new URL('..', import.meta.url));
const shellRoot = join(appRoot, '..', 'noah-shell');
const url = `http://localhost:4200/${route}`;
const children = new Set();
let stopping = false;

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' });
    const finish = (open) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(400);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGINT');
  setTimeout(() => process.exit(code), 200);
}

function launch(command, args, cwd) {
  const child = spawn(command, args, { cwd, stdio: 'inherit' });
  children.add(child);
  child.on('exit', (code, signal) => {
    children.delete(child);
    if (!stopping && !signal && code) stop(code);
  });
  return child;
}

function listenForShellReload() {
  const clients = new Set();
  const server = createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (request.method === 'OPTIONS') {
      response.writeHead(204);
      response.end();
      return;
    }
    if (request.url === '/health') {
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end('ok');
      return;
    }
    if (request.url === '/events') {
      response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      response.write(':\n\n');
      clients.add(response);
      request.on('close', () => clients.delete(response));
      return;
    }
    if (request.method === 'POST' && request.url === '/reload') {
      tellClients();
      response.writeHead(204);
      response.end();
      return;
    }
    response.writeHead(404);
    response.end();
  });

  function tellClients() {
    for (const client of clients) client.write('event: reload\ndata: rebuild\n\n');
  }

  return new Promise((resolve) => {
    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') resolve(postShellReload);
      else throw error;
    });
    server.listen(reloadPort, '127.0.0.1', () => resolve(tellClients));
  });
}

function postShellReload() {
  fetch(`http://127.0.0.1:${reloadPort}/reload`, { method: 'POST' }).catch(() => {});
}

function watchRebuild(reload) {
  let text = '';
  let waiting = false;
  return (chunk) => {
    text += chunk.toString();
    if (text.length > 8000) text = text.slice(-8000);
    const started = text.lastIndexOf('Building federation artefacts');
    if (started < 0) return;
    const done = text.indexOf('Done!', started);
    if (done < 0) return;
    text = text.slice(done + 'Done!'.length);
    if (waiting) return;
    waiting = true;
    setTimeout(() => {
      waiting = false;
      console.log('這個 app 編完了，請 Shell 重新整理。');
      reload();
    }, 200);
  };
}

function launchApp(reload) {
  const child = spawn('npx', ['ng', 'serve'], { cwd: appRoot, stdio: ['inherit', 'pipe', 'pipe'] });
  children.add(child);
  const watch = watchRebuild(reload);
  const forward = (stream, chunk) => {
    stream.write(chunk);
    watch(chunk);
  };
  child.stdout.on('data', (chunk) => forward(process.stdout, chunk));
  child.stderr.on('data', (chunk) => forward(process.stderr, chunk));
  child.on('exit', (code, signal) => {
    children.delete(child);
    if (!stopping && !signal && code) stop(code);
  });
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

const shellAlreadyUp = await portOpen(4200);
const reloadShell = await listenForShellReload();
console.log(`這個 app 從 ${url} 進去。`);
if (!existsSync(join(shellRoot, 'package.json'))) {
  console.error('找不到旁邊的 noah-shell。');
  process.exit(1);
}
if (shellAlreadyUp) console.log('Shell 已在 4200，沿用。');
else console.log('Shell 還沒開，一起啟動。');

launchApp(reloadShell);
if (!shellAlreadyUp) launch('npm', ['start'], shellRoot);

const started = Date.now();
const timer = setInterval(async () => {
  if (stopping) {
    clearInterval(timer);
    return;
  }
  const remoteUp = await portOpen(remotePort);
  const shellUp = await portOpen(4200);
  if (!remoteUp || !shellUp) {
    if (Date.now() - started > 180000) {
      clearInterval(timer);
      console.log(`還在編譯。好了之後開 ${url}`);
    }
    return;
  }
  clearInterval(timer);
  console.log(`開 ${url}`);
  if (process.platform === 'darwin') spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
}, 1000);
