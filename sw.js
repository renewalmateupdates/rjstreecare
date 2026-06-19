const CACHE = 'rjtreecare-v1'
const STATIC = [
  '/',
  '/index.html',
  '/about.html',
  '/services.html',
  '/contact.html',
  '/emergency.html',
  '/gallery.html',
  '/faq.html',
  '/service-area.html',
  '/tree-removal.html',
  '/trimming-pruning.html',
  '/stump-grinding.html',
  '/blog.html',
  '/css/style.css',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  // HTML pages: network-first (always get fresh content), fall back to cache
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(
      fetch(e.request)
        .then((res) => { caches.open(CACHE).then((c) => c.put(e.request, res.clone())); return res })
        .catch(() => caches.match(e.request))
    )
    return
  }
  // CSS/images/fonts: cache-first
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached
      return fetch(e.request).then((res) => {
        caches.open(CACHE).then((c) => c.put(e.request, res.clone()))
        return res
      })
    })
  )
})
