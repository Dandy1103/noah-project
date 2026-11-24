const target = 'https://noah-platform.dandy-cheng.com';
const platformHost = 'noah-platform.dandy-cheng.com';

function markDevHost(proxyReq, req) {
  proxyReq.removeHeader('x-forwarded-port');
  const host = req.headers.host;
  if (!host) return;
  proxyReq.setHeader('X-Forwarded-Host', host);
  proxyReq.setHeader('X-Forwarded-Proto', 'http');
  proxyReq.setHeader('X-Noah-Dev-Host', host);
  proxyReq.setHeader('X-Noah-Dev-Proto', 'http');
}

function stayHere(proxyRes) {
  const location = proxyRes.headers.location;
  if (!location) return;
  proxyRes.headers.location = Array.isArray(location) ? location.map(localPath) : localPath(location);
}

function localPath(location) {
  if (!location || location.startsWith('/')) return location;
  try {
    const next = new URL(location);
    if (next.hostname !== platformHost) return location;
    return `${next.pathname}${next.search}${next.hash}`;
  } catch {
    return location;
  }
}

const rule = {
  target,
  secure: true,
  changeOrigin: true,
  onProxyReq: markDevHost,
  onProxyRes: stayHere,
};

export default {
  '/api': rule,
  '/oauth2': rule,
  '/login': rule,
  '/auth': rule,
};
