[中文文档](./README_CN.md) | English

[![CI](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml/badge.svg?branch=newMain)](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml)

# Stalux — Modern Astro Blog Theme

**Dual-mode: Use as a template 📦 or install as a plugin 🔌**

**[stalux.needhelp.icu](https://stalux.needhelp.icu)**

Elegant, high-performance, easily configurable Astro static blog theme.

In terms of design, Stalux draws on minimalism and moderate decoration: it maintains an overall dark tone with subtle glassmorphism textures, and the background uses tiled decorative patterns to enhance visual depth without being distracting.

In terms of experience, Stalux balances SSG's high performance with the smooth feel of page transitions without full reloads. Through view transitions and handling of `astro:page-load` events, the theme keeps the header, footer, and other common components stable during navigation or main content switching.

Content-first is one of the theme's core principles: writing and presentation are considered top priority. The theme supports CommonMark, code highlighting, Mermaid flowcharts, and KaTeX math formulas out of the box.

---

## 🚀 Two Ways to Use

### Option A: Clone Source Code (Template Mode)

Get the full source — modify anything, customize everything:

```bash
git clone https://github.com/xingwangzhe/stalux.git my-blog
cd my-blog
bun install           # or npm install
bun run dev           # or npm run dev
```

### Option B: Install as Astro Integration (Plugin Mode)

Keep your project clean — install stalux as a dependency in a new or existing Astro project.

**Step-by-step from scratch:**

```bash
# 1. Create a new Astro project (choose "minimal" template)
bun create astro

# 2. Enter your project directory
cd ./myblog

# 3. Install the stalux theme package
bun add @xingwangzhe/stalux

# 4. Initialize content template (creates stalux/ dir with configs & sample posts)
bunx stalux init

# 5. Add required peer dependencies (for Markdown, code highlighting, etc.)
bun add @astrojs/markdown-satteri astro-expressive-code @astrojs/sitemap
bun add @xingwangzhe/satteri-mermaid @xingwangzhe/satteri-photoswipe
```

**5. Configure `astro.config.mjs`:**

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

Create `src/content.config.ts`:

```ts
import { defineCollections } from "@xingwangzhe/stalux/schemas";
export const collections = defineCollections({ contentDir: "stalux" });
```

**6. Start writing and developing:**

```bash
bun run dev
```

Your blog is now running at `http://localhost:4321/` with all theme pages, search, RSS, and more ready to go.

> 💡 `bunx stalux init` creates the `stalux/` directory structure with example content.
> Run it any time to see what a valid config looks like — it won't overwrite existing files.

---

## 📝 Quick Start: Writing Content

Create a markdown file under `stalux/posts/`:

```yaml
---
title: Hello World
abbrlink: hello-world
date: 2026-07-27 10:00:00
tags: [Stalux, Getting Started]
categories: [Blog]
desc: A brief description of your post.
---
Your content here...
```

**Content Directory Structure:**

```
stalux/
├── config/              # YAML configuration files
│   ├── site.yml         # Site metadata
│   ├── author.yml       # Author info
│   ├── navs.yml         # Navigation menu
│   ├── footer.yml       # Footer badges & copyright
│   ├── links.yml        # Friend links
│   ├── comment.yml      # Waline comment config
│   ├── head.yml         # Analytics & custom head
│   ├── media-links.yml  # Social media links
│   ├── promote.yml      # LLM promotion & export
│   ├── ai-discovery.yml # AI discovery file config
│   └── typetexts.yml    # Typewriter text snippets
├── posts/               # Blog posts (Markdown)
├── about/index.md       # About page
└── words/               # Quotes / short notes (Markdown)
```

---

## ✨ Features

- 🌙 **Dark mode** as default, with elegant glassmorphism design
- 🔍 **Full-text search** via Pagefind (auto-indexed on build)
- 📡 **RSS & Atom feeds**
- 🖼️ **PhotoSwipe** image lightbox
- 📊 **Mermaid** diagrams & flowcharts
- 📐 **KaTeX / MathML** math rendering
- 🤖 **LLM discovery files** (llms.txt / llms-full.txt)
- 💬 **Waline** comment system
- 📱 **Fully responsive**
- ⚡ **View transitions** for smooth navigation
- 🏷️ **Tags, categories, archives**
- 🌐 **i18n** (zh-CN / en)

---

## 🛠️ Development

```bash
# Install dependencies
bun install           # recommended
# npm install

# Start dev server
bun run dev

# Build
bun run build

# Preview
bun run preview
```

---

## 🎨 Customizing Components

Stalux supports component overrides (like Starlight):

```ts
import { defineConfig } from "astro/config";
import stalux from "@xingwangzhe/stalux";

export default defineConfig({
    integrations: [
        stalux({
            components: {
                Navs: "./src/components/CustomNavs.astro",
                Footer: "./src/components/CustomFooter.astro",
                // ... see full list in src/internal/override.ts
            },
        }),
    ],
});
```

Use the `@stalux/component/*` import alias in your custom components:

```astro
---
import Navs from "@stalux/component/Navs";
---
<Navs />
```

---

## 📖 Documentation

Full documentation and live demo: **[stalux.needhelp.icu](https://stalux.needhelp.icu)**

---

## 📄 License

MIT License — see [LICENSE](./LICENSE).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xingwangzhe/stalux)
[![Deploy with EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https://github.com/xingwangzhe/stalux)
