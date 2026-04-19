/* ───────────────────────────────────────────────────────────
   Plano de Estudos — Service Worker
   Estratégia: Cache-First para shell, Stale-While-Revalidate
   para fontes. Shell mínimo, atualização automática em
   nova versão (skipWaiting + clients.claim).
   ─────────────────────────────────────────────────────────── */

const VERSION = 'estudo-v1.0.0';
const SHELL_CACHE = `shell-${VERSION}`;
const FONTS_CACHE = `fonts-${VERSION}`;

/* Recursos do shell — tudo que o app precisa para funcionar offline.
   Caminhos relativos ('./') para funcionar em subpasta (ex.: github.io/estudo). */
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* Domínios de fontes — armazenados em cache separado */
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

/* ─── INSTALL ─── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ─── ACTIVATE: limpa caches antigos ─── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((k) => k !== SHELL_CACHE && k !== FONTS_CACHE)
        .map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

/* ─── FETCH ─── */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  /* Apenas GET. POST/PUT/DELETE passam direto. */
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* Bloqueia esquemas não-http (chrome-extension://, etc.) */
  if (!url.protocol.startsWith('http')) return;

  /* Fontes Google: stale-while-revalidate */
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(req, FONTS_CACHE));
    return;
  }

  /* Mesma origem: cache-first com fallback de rede */
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req, SHELL_CACHE));
    return;
  }

  /* Terceiros não previstos: passa direto à rede */
});

/* ─── ESTRATÉGIAS ─── */

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    /* Só cacheia respostas válidas (status 200, mesma origem) */
    if (fresh && fresh.status === 200 && fresh.type === 'basic') {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    /* Offline e sem cache → tenta servir o index.html como fallback */
    const fallback = await cache.match('./index.html');
    if (fallback) return fallback;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

/* ─── MENSAGENS DA APP ─── */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
