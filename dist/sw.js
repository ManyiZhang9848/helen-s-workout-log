const CACHE_NAME = 'workout-cache-v2';
const STATIC_ASSETS = [
  './',
  'index.html',
  'catalog-data.js',
  'workout-extras.css',
  'workout-extras.js',
  'manifest.json',
  'icon.svg'
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

  // 外部 AI 接口（如 DeepSeek、Ollama）不走缓存
  if (url.pathname.includes('/chat/completions') || url.pathname.includes('/models') || event.request.method !== 'GET') {
    return;
  }

  // 针对本站资源 或 动作库 CDN 图片：采用缓存优先（Stale-While-Revalidate）
  if (url.origin === self.location.origin || url.hostname.includes('jsdelivr.net')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);

          // 命中缓存则 0 毫秒立即返回，后台自动拉取更新
          return cachedResponse || fetchPromise;
        });
      })
    );
  }
});
