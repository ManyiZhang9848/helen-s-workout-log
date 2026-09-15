const CACHE_NAME = 'workout-cache-v1';
const STATIC_ASSETS = [
  './',
  'index.html',
  'catalog-data.js',
  'workout-extras.css',
  'workout-extras.js',
  'manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 外部 API（如 DeepSeek、Ollama）不走离线缓存，直接请求网络
  if (url.origin !== self.location.origin || event.request.method !== 'GET') {
    return;
  }

  // 针对静态资源：采用 Stale-While-Revalidate（缓存优先，后台静默拉取更新）
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        // 如果本地缓存里有，立即 0 毫秒返回！后台自动更新缓存
        return cachedResponse || fetchPromise;
      });
    })
  );
});
