---
title: 导航配置参考
tags:
    - 配置
    - 导航
categories:
    - 主题配置
---

## 导航配置参考 (`nav`)

Stalux 主题的导航菜单通过 `src/consts.ts` 文件中的 `site.nav` 数组进行配置。每个导航项都是一个对象，包含以下属性：

- **`title`** (`string`): 导航链接上显示的文本。
- **`path`** (`string`): 导航链接指向的路径。对于内部链接，通常以 `/` 开头 (例如 `/archives`, `/about`)；对于外部链接，则是完整的 URL (例如 `https://example.com`)。
- **`icon`** (`string`): 在导航链接文本旁边显示的图标名称。主题通常会内置一套图标，您需要使用这些图标的预定义名称 (例如 `home`, `archive`, `user`, `link` 等)。请查阅主题文档或源代码以获取可用的图标列表。

### 默认配置示例

以下是 `src/consts.ts` 中 `nav` 的默认配置：

```typescript
// src/consts.ts
export const site = {
  // ...其他配置...
  nav: [
    { title: '首页', path: '/', icon: 'home' },
    { title: '归档', path: '/archives', icon: 'archive' },
    { title: '分类', path: '/categories', icon: 'folder' },
    { title: '标签', path: '/tags', icon: 'tag' },
    { title: '友链', path: '/links', icon: 'link' },
    { title: '关于', path: '/about', icon: 'user' },
  ],
  // ...其他配置...
};
```

### 自定义导航

要自定义导航菜单，您可以在 `src/_config.ts` 文件中覆盖 `nav` 数组。例如，如果您想添加一个指向外部博客的链接，并移除“友链”页面：

```typescript
// src/_config.ts
import type { SiteConfig } from './types'; // 假设类型定义在 types.ts

export const customSiteConfig: Partial<SiteConfig> = {
  nav: [
    { title: '主页', path: '/', icon: 'home' }, // 修改了标题为“主页”
    { title: '文章归档', path: '/archives', icon: 'archive' }, // 修改了标题
    { title: '所有分类', path: '/categories', icon: 'folder' }, // 修改了标题
    { title: '热门标签', path: '/tags', icon: 'tag' }, // 修改了标题
    { title: '我的作品集', path: '/portfolio', icon: 'briefcase' }, // 新增内部页面
    { title: '外部博客', path: 'https://blog.example.com', icon: 'external-link' }, // 新增外部链接
    { title: '联系我', path: '/about', icon: 'user' }, // 修改了标题
  ],
  // ...其他自定义配置...
};
```

**注意事项:**

*   确保您使用的 `icon` 名称是主题支持的。
*   路径 `path` 对于内部页面应与您在 `src/pages` 目录下创建的页面或 Astro 集合路由相对应。
*   修改 `src/_config.ts` 后，通常需要重新构建站点才能看到更改。
