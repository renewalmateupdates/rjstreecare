// Bump this name whenever cached files must be refreshed for returning visitors
const CACHE = 'rjtreecare-v2'
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
  // Videos stream in byte ranges, which the cache can't store: let the browser fetch them directly
  if (e.request.headers.has('range') || url.pathname.endsWith('.mp4')) return
  // HTML, CSS and JS: network-first (always get fresh content, like the seasonal theme switch), fall back to cache
  if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => { caches.open(CACHE).then((c) => c.put(e.request, res.clone())); return res })
        .catch(() => caches.match(e.request))
    )
    return
  }
  // Images/fonts: cache-first
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
