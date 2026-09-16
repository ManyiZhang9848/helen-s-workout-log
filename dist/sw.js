const CACHE_NAME = 'workout-cache-v9-vault';
const STATIC_ASSETS = [
  './',
  'index.html',
  'catalog-data.js',
  'female-body-data.js',
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

  // 本站资源（HTML / JS / CSS / JSON）：网络优先。
  // 这些文件都带 ETag，未改动时协商返回 304、传输 0 字节，所以"每次都问服务器"并不慢；
  // 换来的是上线后用户第一次打开就是最新版，不需要手动刷新好几遍。断网时回退缓存。
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return networkResponse;
      }).catch(() => caches.match(event.request).then(cached => cached || caches.match('index.html')))
    );
    return;
  }

  // 动作库 CDN 图片：体积大、内容基本不变，继续用缓存优先（Stale-While-Revalidate）
  if (url.hostname.includes('jsdelivr.net')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
  }
});
