/* ============================================================
   SERVICE WORKER — Zayda Construtora
   Estratégia: stale-while-revalidate para CSS/JS/fontes
   (serve do cache imediatamente + atualiza em background)
============================================================ */
const CACHE = 'zayda-v1';
const STATIC = [
  '/',
  '/index.html',
  '/zayda-styles.css',
  '/zayda-app.js',
];

/* Pré-cacheia os arquivos estáticos na instalação */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

/* Remove caches antigos na ativação */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  /* Ignora: outros domínios, extensões de browser, POST */
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  const ext = url.pathname.split('.').pop().toLowerCase();

  /* HTML: network-first (sempre versão mais recente) */
  if (ext === 'html' || url.pathname === '/') {
    e.respondWith(
      fetch(request)
        .then(res => { caches.open(CACHE).then(c => c.put(request, res.clone())); return res; })
        .catch(() => caches.match(request))
    );
    return;
  }

  /* CSS, JS, fontes: stale-while-revalidate */
  if (['css', 'js', 'woff2', 'woff'].includes(ext)) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(request).then(cached => {
          const fresh = fetch(request).then(res => {
            cache.put(request, res.clone());
            return res;
          });
          return cached || fresh;
        })
      )
    );
  }
});
