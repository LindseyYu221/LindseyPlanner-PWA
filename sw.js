// Lindsey 计划本 - Service Worker
// 版本号：每次发布新内容时手动升高，可强制客户端更新缓存
const CACHE_VERSION = "v1";
const CACHE_NAME = `lindsey-planner-${CACHE_VERSION}`;

// 应用自身的核心文件（同源，直接可控）
const APP_SHELL = [
  "./",
  "./index.html",
  "./app.jsx",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./favicon.png",
];

// 第三方 CDN 资源（React / Babel / 字体），首次联网时缓存，之后离线可用
const CDN_ASSETS = [
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://unpkg.com/@babel/standalone/babel.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 应用自身文件必须缓存成功
      await cache.addAll(APP_SHELL);
      // CDN 资源尽量缓存，单个失败不影响安装（比如离线首次安装时）
      await Promise.all(
        CDN_ASSETS.map((url) =>
          cache.add(new Request(url, { mode: "cors" })).catch(() => {})
        )
      );
      self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("lindsey-planner-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 缓存优先，命中即返回；未命中则联网获取并写入缓存；离线且未命中时对导航请求回退到 index.html
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          // 只缓存成功的同源或 CORS 响应
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return undefined;
        });
    })
  );
});
