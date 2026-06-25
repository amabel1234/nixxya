// Nixx AI Service Worker — cache static assets
  const CACHE = 'nixx-v1';
  const PRECACHE = ['/', '/dashboard', '/sign-in'];

  self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {})));
  });

  self.addEventListener('activate', e => {
    e.waitUntil(
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
      ).then(() => self.clients.claim())
    );
  });

  self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    // Jangan cache API calls
    if (url.pathname.startsWith('/api/')) return;
    // Cache-first untuk static assets (JS, CSS, fonts, images)
    if (
      url.pathname.match(/\.(js|css|woff2?|png|svg|ico|jpg|webp)$/) ||
      url.pathname.startsWith('/assets/')
    ) {
      e.respondWith(
        caches.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then(c => c.put(e.request, clone));
            }
            return res;
          }).catch(() => cached);
        })
      );
      return;
    }
    // Network-first untuk halaman HTML
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  });
  