// public/sw.js

// 监听安装事件
self.addEventListener('install', (event) => {
  // 强制立即接管控制权
  self.skipWaiting();
});

// 监听激活事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker 已激活');
});

// 核心硬性指标：必须包含 fetch 监听器
self.addEventListener('fetch', (event) => {
  // 这是最基础的“占位”写法。
  // 它什么都不做，直接放行所有网络请求，但只要有了它，Chrome 就会放行 PWA 安装。
  // (未来如果你想做真正的离线缓存，逻辑就写在这里面)
});