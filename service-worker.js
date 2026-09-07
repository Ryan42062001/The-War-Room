/* War Room offline shell. Network stays authoritative when available. */
var CACHE_PREFIX = 'war-room-shell-';
var CACHE_NAME = CACHE_PREFIX + '20260907-2';
var CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './draft-polish.css',
  './fantasypros-2026-data.js',
  './espn-2026-board-data.js',
  './war-room-config.js',
  './script.js',
  './js/war-room-ui.js',
  './js/war-room-espn-sync.js',
  './js/war-room-rankings.js',
  './js/war-room-draft-state.js',
  './js/war-room-scoring.js',
  './js/war-room-scoring-canonical.js',
  './js/war-room-recommendations.js',
  './js/war-room-recommendations-canonical.js',
  './js/war-room-hardening.js',
  './js/war-room-resilience.js',
  './js/war-room-command-bar.js',
  './js/war-room-command-bar-fixes.js',
  './js/war-room-draft-awareness.js',
  './js/war-room-awareness-live-sync.js',
  './assets/steelers-logo.png',
  './favicon.ico'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.allSettled(CORE_ASSETS.map(function(asset) {
        return cache.add(asset);
      }));
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) {
        if (name.indexOf(CACHE_PREFIX) === 0 && name !== CACHE_NAME) return caches.delete(name);
        return Promise.resolve(false);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function(event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var requestUrl;
  try { requestUrl = new URL(request.url); }
  catch (error) { return; }
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).then(function(response) {
      if (response && response.ok && response.type !== 'opaque') {
        var copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(function(cache) {
          return cache.put(request, copy);
        }));
      }
      return response;
    }).catch(function() {
      return caches.match(request, {ignoreSearch: true}).then(function(cached) {
        if (cached) return cached;
        if (request.mode === 'navigate') return caches.match('./index.html', {ignoreSearch: true});
        return Response.error();
      });
    })
  );
});
