[English](./README.md) | 中文文档

[![CI](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml/badge.svg?branch=newMain)](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@xingwangzhe/stalux?color=EAB308&label=npm)](https://www.npmjs.com/package/@xingwangzhe/stalux)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

# Stalux

> **v1.70.0 破坏性更新（BREAKING CHANGE）。** 在 `astro.config.ts` 中将 `pagefind` 改为 `orama`，将 `searchCjk` 移到 `orama.cjk`。WebMCP 全文查询的 `source` 改为 `"orama+metadata"`。 [搜索迁移指南](./docs/SEARCH.md)

Astro 博客主题，内置中文字体子集、Orama 搜索、Markdown 渲染、Waline 评论和 Swup 导航。

[在线演示](https://stalux.needhelp.icu) · [完整文档](./docs/README.md) · [快速开始](#快速开始) · [问题反馈](https://github.com/xingwangzhe/stalux/issues)

<p align="center">
  <a href="https://stalux.needhelp.icu">
    <img src="./docs/assets/home.webp" alt="Stalux 首页：暗色玻璃拟态、极繁背景、打字机标题与作者信息" width="1200">
  </a>
</p>

## 快速开始

### 安装到 Astro 项目

```bash
bun create astro                    # 选择 minimal 空模板
cd myblog
bun add @xingwangzhe/stalux         # 主题及全部依赖
bunx stalux init                    # 生成 stalux/ 内容目录
```

配置 `astro.config.ts`：

```ts title="astro.config.ts"
import { defineConfig } from "astro/config";
import stalux from "@xingwangzhe/stalux";

export default defineConfig({
    output: "static",
    site: "https://example.com",
    integrations: [stalux({ contentDir: "stalux" })],
});
```

创建 `src/content.config.ts`：

```ts title="src/content.config.ts"
import { defineCollections } from "@xingwangzhe/stalux/schemas/collections";

export const collections = defineCollections({ contentDir: "stalux" });
```

```bash
bun run dev   # http://localhost:4321
```

`stalux init` 只生成 `stalux/` 下的配置和示例内容，不会覆盖已有的 `package.json`、`astro.config.ts` 或 `src/content.config.ts`。

### 从源码运行

```bash
git clone https://github.com/xingwangzhe/stalux.git my-blog
cd my-blog
bun install
bun run dev
```

> 需要 Node.js 26 或更高版本，推荐使用 Bun。完整步骤、插件选项和目录结构见 [快速开始](./docs/GETTING-STARTED.md)。

## 常用配置

站点信息、导航、作者、评论和统计都在 `stalux/config/` 的 YAML 里。换主题色只需要：

```yaml title="stalux/config/site.yml"
accentColor: "#7DD3B6"
```

`accentColor` 接受六位 HEX，同时驱动主题与 Waline 的强调色。其余字段见 [配置说明](./docs/CONFIGURATION.md)。

## 部署

```bash
bun run build     # 生成静态站点到 dist/
bun run preview   # 本地预览生产产物
```

`dist/` 可直接部署到任意静态托管。仓库自带 EdgeOne Pages 配置（固定 Bun 1.4.4 + `--frozen-lockfile`）；缓存目录、产物检查和时区注意事项见 [部署](./docs/DEPLOYMENT.md)。

## 文档

| 文档 | 内容 |
| --- | --- |
| [快速开始](./docs/GETTING-STARTED.md) | 环境要求、两种安装方式、目录结构、开发命令、诊断日志 |
| [配置说明](./docs/CONFIGURATION.md) | `stalux/config/*.yml` 全量字段、主题色、天气、评论、AI 发现 |
| [功能行为](./docs/FEATURES.md) | 打字机、图注、灯箱、代码主题、归档、软导航、背景 |
| [字体](./docs/FONTS.md) | 中文按页字体子集、缓存、字体许可 |
| [搜索](./docs/SEARCH.md) | `orama` 配置、PT15 索引、`searchKeywords` 与升级迁移 |
| [统计](./docs/ANALYTICS.md) | Google Analytics、Clarity、Umami、Vercount |
| [性能与加载](./docs/PERFORMANCE.md) | 按可见性加载、首屏 CSS、路由预热、背景资源 |
| [部署](./docs/DEPLOYMENT.md) | 静态构建、EdgeOne、缓存目录、产物检查 |
| [WebMCP](./docs/WEBMCP.md) | 页面内 AI 工具、数据源、启停、polyfill |
| [文章分享卡片](./docs/SOCIAL-CARDS.md) | 头像默认图与文章 `og:image` 覆盖 |
| [组件覆盖](./docs/COMPONENTS.md) | Starlight 风格组件覆盖 |
| [许可](./docs/LICENSING.md) | 主题 MIT 与字体许可范围 |

完整索引与维护文档见 [docs/README.md](./docs/README.md)。

## 许可证

主题代码采用 [MIT License](LICENSE)。内置字体（LXGW WenKai、Google Sans Code、Latin Modern Math 等）保留各自许可，详见 [许可说明](./docs/LICENSING.md)。
