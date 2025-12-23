const CACHE_NAME = 'photo-classifier-v8';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/app.js',
    './js/camera.js',
    './js/db.js',
    './js/export.js'
];

// 安裝階段：快取所有資產
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 激活階段：清理舊快取
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 攔截請求：優先從快取讀取（Cache First Strategy）
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // 如果快取中有，就直接回傳；否則去網路抓
            return response || fetch(event.request).catch(() => {
                // 如果網路也斷了且沒快取，這裡可以回傳一個自訂的離線頁面
                console.log('[Service Worker] Fetch failed; returning offline content');
            });
        })
    );
});
