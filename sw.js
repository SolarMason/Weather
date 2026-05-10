// Skyline Weather PWA — Service Worker
const VERSION = 'skyline-v1.2.0';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Network-first for weather APIs (always want fresh data)
  if (
    url.hostname.includes('open-meteo.com') ||
    url.hostname.includes('api.weather.gov') ||
    url.hostname.includes('bigdatacloud.net')
  ) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for shell
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      if (res.ok && url.origin === location.origin) {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});

// Periodic background sync for rain check (when supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'rain-check') {
    event.waitUntil(checkRainAlert());
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_RAIN') {
    event.waitUntil(checkRainAlert(event.data.lat, event.data.lon, event.data.placeName));
  }
});

async function checkRainAlert(lat, lon, placeName) {
  try {
    if (!lat || !lon) {
      const cache = await caches.open(RUNTIME_CACHE);
      const keys = await cache.keys();
      const last = keys.find((k) => k.url.includes('open-meteo.com/v1/forecast'));
      if (!last) return;
      const u = new URL(last.url);
      lat = u.searchParams.get('latitude');
      lon = u.searchParams.get('longitude');
    }
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&minutely_15=precipitation,precipitation_probability&forecast_minutely_15=24`;
    const res = await fetch(url);
    const data = await res.json();
    const m = data.minutely_15;
    if (!m) return;
    const now = Date.now();
    for (let i = 0; i < m.time.length; i++) {
      const t = new Date(m.time[i]).getTime();
      const minsAhead = Math.round((t - now) / 60000);
      if (minsAhead > 0 && minsAhead <= 60 && m.precipitation[i] > 0.1) {
        await self.registration.showNotification('Rain incoming', {
          body: `Rain expected in ~${minsAhead} min${placeName ? ' near ' + placeName : ''}. ${m.precipitation[i].toFixed(1)} mm forecast.`,
          icon: './icon.svg',
          badge: './icon.svg',
          tag: 'rain-alert',
          renotify: false,
          vibrate: [200, 80, 200]
        });
        return;
      }
    }
  } catch (e) {
    console.warn('rain-check failed', e);
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('./'));
});
