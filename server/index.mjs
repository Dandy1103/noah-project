import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

const port = Number(process.env.PORT || 8080);
const browserDir = resolve(import.meta.dirname, '..', 'dist', 'noah-project', 'browser');
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

const server = createServer((request, response) => {
  const url = new URL(request.url || '/', 'http://localhost');
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const requested = resolve(browserDir, relative);
  const inside = requested === browserDir || requested.startsWith(`${browserDir}${sep}`);
  const file = inside && existsSync(requested) && statSync(requested).isFile()
    ? requested
    : join(browserDir, 'index.html');
  if (!existsSync(file)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('找不到。');
    return;
  }
  const isIndex = file === join(browserDir, 'index.html');
  response.writeHead(200, {
    'Content-Type': types[extname(file)] || 'application/octet-stream',
    'Cache-Control': isIndex ? 'no-store' : 'public, max-age=31536000',
  });
  createReadStream(file).pipe(response);
});

server.listen(port, '0.0.0.0', () => {
  console.log('專案管理在 http://0.0.0.0:' + port);
});
