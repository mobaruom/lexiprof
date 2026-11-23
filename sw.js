const V = 'lexiprof-v17';
const SHELL = ['./', 'index.html', 'css/app.css?v=10', 'js/config.js?v=4', 'js/core.js?v=7', 'js/ui.js?v=3', 'js/fenn.js?v=1', 'js/fun.js?v=2', 'js/tour.js?v=1', 'js/views.js?v=7', 'js/views2.js?v=7', 'js/importer.js?v=5', 'js/pdf.js?v=3', 'js/privacy.js?v=6', 'js/plans.js?v=5', 'js/audit.js?v=1', 'js/coach.js?v=2', 'js/views3.js?v=8', 'js/userpages.js?v=4', 'js/backend-firebase.js?v=5', 'js/backend-php.js?v=4', 'js/app.js?v=8', 'js/vendor/pdf-lib.min.js?v=1.17.1', 'icons/icon-192.png', 'icons/icon-512.png', 'manifest.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/api/') || u.pathname.endsWith('/version.json')) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
