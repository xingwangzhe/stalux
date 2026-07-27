[English](./README.md) | 中文文档

[![CI](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml/badge.svg?branch=newMain)](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml)

# Stalux — 现代化 Astro 博客主题

**双模式使用：既可作为模板 📦，也可作为插件安装 🔌**

**[stalux.needhelp.icu](https://stalux.needhelp.icu)**

优雅、高性能、易配置的 Astro 静态博客主题。

---

## 🚀 两种使用方式

### 方式 A：Git Clone 源码（模板模式）

获取完整源码，随意修改：

```bash
git clone https://github.com/xingwangzhe/stalux.git my-blog
cd my-blog
bun install           # 或 npm install
bun run dev           # 或 npm run dev
```

### 方式 B：安装为 Astro 集成（插件模式）

保持项目干净，在全新或已有 Astro 项目中安装使用。

**从零开始完整步骤：**

```bash
# 1. 创建新 Astro 项目（选择 minimal 空模板）
bun create astro

# 2. 进入项目目录
cd ./myblog

# 3. 安装 stalux 主题包
bun add @xingwangzhe/stalux

# 4. 初始化内容模板（创建 stalux/ 目录结构和示例内容）
bunx stalux init

# 5. 安装必需的附加依赖
bun add @astrojs/markdown-satteri astro-expressive-code @astrojs/sitemap
bun add @xingwangzhe/satteri-mermaid @xingwangzhe/satteri-photoswipe
```

**6. 配置 `astro.config.mjs`：**

```ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import expressiveCode from "astro-expressive-code";
import stalux from "@xingwangzhe/stalux";
import { mermaidHast } from "@xingwangzhe/satteri-mermaid";
import { photoswipe } from "@xingwangzhe/satteri-photoswipe";

export default defineConfig({
    output: "static",
    site: "https://example.com",
    integrations: [
        stalux({ contentDir: "stalux" }),
        sitemap(),
        expressiveCode({ themes: ["dark-plus", "github-light"] }),
    ],
    markdown: {
        processor: satteri({
            features: { math: true, smartPunctuation: true, gfm: true, frontmatter: true },
            hastPlugins: [photoswipe(), mermaidHast({ responsive: true, theme: "dark" })],
        }),
    },
});
```

创建 `src/content.config.ts`：

```ts
import { defineCollections } from "@xingwangzhe/stalux/schemas";
export const collections = defineCollections({ contentDir: "stalux" });
```

**7. 启动开发服务器：**

```bash
bun run dev
```

> 💡 `bunx stalux init` 创建默认 `stalux/` 目录结构和示例配置，不会覆盖已有文件。

---

## 📝 内容目录结构

```
stalux/
├── config/              # YAML 配置文件
│   ├── site.yml         # 站点元信息
│   ├── author.yml       # 作者信息
│   ├── navs.yml         # 导航菜单
│   ├── footer.yml       # 页脚
│   ├── links.yml        # 友情链接
│   ├── comment.yml      # 评论配置
│   ├── head.yml         # 统计和自定义 head
│   ├── media-links.yml  # 社交媒体
│   ├── promote.yml      # LLM 推广
│   ├── ai-discovery.yml # AI 发现文件
│   └── typetexts.yml    # 打字机文本
├── posts/               # 博客文章（Markdown）
├── about/index.md       # 关于页面
└── words/               # 随想/语录（Markdown）
```

---

## ✨ 功能特性

- 🌙 **暗色主题** + 玻璃拟态设计
- 🔍 **全文搜索**（Pagefind 构建时自动索引）
- 📡 **RSS / Atom 订阅**
- 🖼️ **PhotoSwipe** 图片灯箱
- 📊 **Mermaid** 图表
- 📐 **数学公式**渲染
- 🤖 **LLM 发现文件**
- 💬 **Waline** 评论系统
- 📱 **响应式设计**
- ⚡ **视图过渡动画**
- 🏷️ **标签、分类、归档**
- 🌐 **国际化**

---

## 🛠️ 本地开发

```bash
bun install           # 推荐
bun run dev           # 开发
bun run build         # 构建
bun run preview       # 预览
```

---

## 🎨 自定义组件

```ts
stalux({
    components: {
        Navs: "./src/CustomNavs.astro",
        // 完整列表见 src/internal/override.ts
    },
});
```

---

## 📄 许可证

MIT License
