const target = 'https://noah-platform.dandy-cheng.com';
const rule = { target, secure: true, changeOrigin: true, xfwd: true };

export default {
  '/api': rule,
  '/oauth2': rule,
  '/login': rule,
  '/auth': rule,
};
