# P3-06: PWA 支持 (P2)

## 问题

当前产品是一个纯前端应用（无后端，所有数据在 localStorage），天然适合 PWA。但缺少 manifest 和 service worker，导致：

1. **无法安装到桌面**：用户每次都要打开浏览器 → 输入网址 → 进入 app
2. **无离线支持**：虽然所有资源都是静态的，但没有 service worker 缓存，断网时无法使用
3. **无启动屏**：打开 app 时看到白屏/闪一下布局
4. **浏览器地址栏/标签栏占用空间**：学习体验不够沉浸

对于学习工具，"可安装到桌面 + 离线可用"是提升日活的重要手段。每次打开需要输入网址的摩擦，足以让很多用户在犹豫时放弃。

## 目标

让用户可以：
1. 将 keykey.cc 添加到手机/电脑桌面（像一个原生 app）
2. 离线时依然可以学习（静态资源 + 已缓存数据）
3. 获得更沉浸的学习体验（无浏览器 UI）

## 实现方案

### 1. 创建 manifest.json

新建 `public/manifest.json`：

```json
{
  "name": "keykey.cc - 边打边学英语发音",
  "short_name": "keykey",
  "description": "通过打字听音学习英语发音的打字学习工具",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 2. 生成应用图标

在 `public/icons/` 目录下生成 PWA 图标：
- `icon-192x192.png`（192x192）
- `icon-512x512.png`（512x512）

可以简单使用 SVG 渲染的字母 "k" 图标，或者使用在线工具生成。最小方案：用一个文字图标。

### 3. 在 layout.tsx 中添加 manifest 引用

修改 `src/app/layout.tsx`，在 `<head>` 中添加：

```tsx
// 在现有 metadata 之后或 head 区域
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#000000" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black" />
<meta name="apple-mobile-web-app-title" content="keykey" />
<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
```

### 4. 创建极简 Service Worker

新建 `public/sw.js`：

```js
const CACHE = "keykey-v1";

// 预缓存的核心资源
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
];

// 安装时预缓存
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// 网络优先，离线时使用缓存
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
```

### 5. 注册 Service Worker

新建 `src/app/sw-register.ts`（客户端脚本）：

```ts
export function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.log("SW registration failed:", error);
        });
    });
  }
}
```

在 `src/app/layout.tsx` 或 `src/app/page.tsx` 中添加：

```tsx
"use client";
import { useEffect } from "react";
import { registerSW } from "./sw-register";

// 在客户端组件中
useEffect(() => {
  registerSW();
}, []);
```

### 6. Next.js 配置

修改 `next.config.ts`，确保静态文件被正确处理（通常无需额外配置，Next.js 默认支持 `public/` 目录）：

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 无需特殊配置，public/ 目录自动 serve
};

export default nextConfig;
```

### 涉及文件

| 文件 | 操作 |
|---|---|
| `public/manifest.json` | 新建 |
| `public/sw.js` | 新建 |
| `public/icons/icon-192x192.png` | 新建（需生成图标） |
| `public/icons/icon-512x512.png` | 新建（需生成图标） |
| `src/app/sw-register.ts` | 新建 |
| `src/app/layout.tsx` | 添加 manifest/apple meta 标签 + 注册 SW |

### 自测清单

- [ ] Chrome DevTools → Application → Manifest 显示正确的配置
- [ ] 浏览器地址栏右侧出现"安装"图标
- [ ] 点击安装后 app 以 standalone 模式打开
- [ ] 打开 app 后启动屏显示正确
- [ ] 断开网络后 app 仍然可以加载和使用
- [ ] 已缓存的词包和进度数据在离线时可用
- [ ] iOS Safari 中添加到主屏幕后正常工作

### 不需要做的

- 不需要离线时缓存所有词包 JSON（网络优先策略，默认会缓存已访问资源）
- 不需要推送通知
- 不需要后台同步
- 不需要 indexedDB（localStorage 已够用，PWA 完全兼容 localStorage）
