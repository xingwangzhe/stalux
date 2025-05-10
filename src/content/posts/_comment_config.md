---
title: 评论系统配置参考
tags:
    - 配置
    - 评论
    - Waline
categories:
    - 主题配置
---

## 评论系统配置参考 (`comment`)

Stalux 主题集成了 [Waline](https://waline.js.org/) 作为其主要的评论系统。相关的配置位于 `src/consts.ts` 文件中的 `site.comment.waline` 对象下。

### Waline 配置项详解

以下是 `site.comment.waline` 对象中可用的配置项及其说明：

- **`serverURL`** (`string`): **必需项**。您的 Waline 服务端地址。您需要自行部署 Waline 服务端，并在此处填写其 URL。
  - 示例: `'https://your-waline-server.example.com'`
- **`lang`** (`string`, 可选): Waline 客户端的显示语言。默认为 `'zh-CN'` (简体中文)。其他可选值请参考 Waline 文档，例如 `'en-US'` (英语)。
  - 示例: `'zh-CN'`
- **`emoji`** (`Array<string | object>`, 可选): 自定义表情包配置。您可以提供一个或多个表情包 CDN 地址或更详细的表情配置对象。
  - 示例 (简单 CDN): `['https://unpkg.com/@waline/emojis@1.1.0/weibo']`
  - 示例 (详细配置): (请参考 Waline 文档了解更高级的表情配置)
- **`requiredFields`** (`Array<'nick' | 'mail' | 'link'>`, 可选): 设置评论时必须填写的字段。默认情况下，Waline 可能允许匿名评论或只要求填写昵称。如果希望强制用户填写邮箱或网址，可以在此数组中添加相应的值。
  - 示例 (要求填写昵称和邮箱): `['nick', 'mail']`
  - 默认 (来自 `consts.ts`): `[]` (无必填项，以 Waline 默认行为准)
- **`reaction`** (`boolean | Array<string>`, 可选): 是否启用文章反应（点赞、点踩等）功能。可以是一个布尔值，或者是一个包含自定义反应图标 URL 的数组。
  - 示例 (启用默认反应): `true`
  - 默认 (来自 `consts.ts`): `true`
- **`meta`** (`Array<'nick' | 'mail' | 'link'>`, 可选): 控制评论框中显示哪些评论者信息输入框。数组中的值可以是 `'nick'` (昵称), `'mail'` (邮箱), `'link'` (网址)。
  - 示例: `['nick', 'mail', 'link']` (显示昵称、邮箱和网址输入框)
  - 默认 (来自 `consts.ts`): `['nick', 'mail', 'link']`
- **`wordLimit`** (`number | [number, number]`, 可选): 评论字数限制。可以是一个数字（最大字数限制），或者一个包含两个数字的数组（最小和最大字数限制）。设置为 `0` 表示不限制。
  - 示例 (最大 500 字): `500`
  - 示例 (10 到 1000 字): `[10, 1000]`
  - 默认 (来自 `consts.ts`): `200` (最大 200 字)
- **`pageSize`** (`number`, 可选): 每页显示的评论数量。用于评论分页。
  - 示例: `10`
  - 默认 (来自 `consts.ts`): `10`

### 默认配置示例 (来自 `src/consts.ts`)

```typescript
// src/consts.ts
export const site = {
  // ...其他配置...
  comment: {
    waline: {
      serverURL: 'https://waline.xingwangzhe.fun', // 这是一个示例地址，请替换为您自己的
      lang: 'zh-CN',
      emoji: ['https://unpkg.com/@waline/emojis@1.1.0/weibo'],
      requiredFields: [],
      reaction: true,
      meta: ['nick', 'mail', 'link'],
      wordLimit: 200,
      pageSize: 10
    }
  },
  // ...其他配置...
};
```

### 自定义评论系统配置

要修改 Waline 的配置，您可以在 `src/_config.ts` 文件中提供您自己的 `comment.waline` 对象。例如，如果您想更改 `serverURL` 并设置评论必须填写邮箱：

```typescript
// src/_config.ts
import type { SiteConfig } from './types';

export const customSiteConfig: Partial<SiteConfig> = {
  comment: {
    waline: {
      serverURL: 'https://my-personal-waline.example.org', // 替换为您的 Waline 服务地址
      lang: 'en-US', // 将语言更改为英语
      requiredFields: ['nick', 'mail'], // 要求填写昵称和邮箱
      wordLimit: [5, 500], // 评论字数限制在5到500字之间
      // 此处未指定的其他 Waline 配置将沿用 src/consts.ts 中的默认值或 Waline 自身的默认值
    }
  },
  // ...其他自定义配置...
};
```

**重要提示:**

*   **`serverURL` 是成功运行 Waline 评论系统的关键。** 您必须拥有一个正在运行的 Waline 服务端实例。
*   Stalux 主题通过 `src/utils/config-adapter.ts` 合并默认配置和自定义配置。如果您在 `src/_config.ts` 中只提供了部分 Waline 配置项，未提供的项将尝试从 `src/consts.ts` 中获取默认值。
*   修改配置后，请确保重新构建您的 Astro 站点以使更改生效。
