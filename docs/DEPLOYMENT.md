# 部署

Stalux 是纯静态主题，构建产物在 `dist/`，可以部署到任意支持静态文件的平台。

## 构建

```bash
bun install
bun run build     # 样式预编译 → astro build → verify:build
bun run preview   # 本地预览生产产物
```

构建会依次完成：

| 阶段 | 产物 |
| --- | --- |
| `styles:build` | 预编译 UnoCSS、生成生产样式名映射 |
| `astro build` | HTML、CSS、JS、字体子集、背景与静态资源 |
| `verify:build` | 校验构建产物、资源引用与私有类名 |
| `astro:build:done` | 页面后处理、OG 分享图、Pagefind 索引、sitemap |

## 环境要求

| 项 | 要求 |
| --- | --- |
| Node.js | `>= 26` |
| Astro | `^7.4.4` |
| Bun | 推荐 1.4.4（仓库 `edgeone.json` 固定该版本） |
| 输出目录 | `dist/` |

## EdgeOne Pages

仓库根目录的 `edgeone.json` 固定了安装与构建命令：

```json title="edgeone.json"
{
    "installCommand": "bunx --bun bun@1.4.4 install --frozen-lockfile",
    "buildCommand": "bunx --bun bun@1.4.4 run build"
}
```

| 项 | 说明 |
| --- | --- |
| 固定 Bun 版本 | 避免平台预装旧 Bun 忽略 v2 锁文件并重新解析依赖 |
| `--frozen-lockfile` | 安装严格跟随 `bun.lock` |
| 构建命令 | 仍使用项目现有的 `bun run build`，不切换包管理器 |

消费项目部署时也应使用相同命令；若平台预装 Bun 已满足要求，可直接使用 `bun install --frozen-lockfile && bun run build`。

## 缓存目录

| 目录 | 内容 | 是否保留 |
| --- | --- | --- |
| `node_modules/.astro/` | 原生字体子集缓存、页面后处理缓存、分享图缓存、增量构建缓存 | 建议在 CI 中恢复；删除后会自动重建，但会失去增量收益 |
| `node_modules/.astro/stalux-page-output/` | 页面后处理结果 | 同上 |
| `node_modules/.astro/stalux-social-cards/` | WebP / PNG 分享图缓存 | 同上 |
| `dist/` | 最终静态产物 | 每次构建重新生成 |

保留 `node_modules/.astro/` 才能跨构建受益。缓存检查会跟踪原始 HTML、页面路径、实际依赖的本地 CSS / 图片内容、字体和处理代码；相关输入变化或记录损坏时会重新处理，不会返回过期页面。

## 产物检查

部署后建议抽查：

| 项 | 检查 |
| --- | --- |
| Pagefind | `/pagefind/pagefind.js` 可访问，搜索弹窗能返回结果 |
| Sitemap | `/sitemap.xml` 指向实际文章 URL；`promote.export_md: true` 时包含 `/posts/*.md` |
| Feed | `/rss.xml`、`/atom.xml` 的日期与站点时区一致 |
| 字体 | `dist/_astro/fonts/` 含分片 WOFF2，HTML `head` 有同源 `preload` |
| 分享图 | `/og/<hash>.webp` 可公开访问，`og:image` 为绝对地址 |
| 背景 | 背景 WebP 使用内容寻址 URL，未返回 404 |
| 统计 | 浏览器 Network 中统计脚本与收集请求成功（见 [统计](./ANALYTICS.md)） |

CDN 可能缓存旧页面；核对线上时使用带随机 query 的 URL 绕缓存。

## 时区

站点时区由 `site.yml` 的 `timezone` 决定。无时区的 frontmatter 日期按站点时区解析，不依赖构建机器本地时区；部署到 UTC 构建机也保持一致。日期必须写成补零的 `"YYYY-MM-DD HH:MM:SS"`，否则 schema 会拒绝构建。
