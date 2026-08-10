[中文文档](./README_CN.md) | English

[![CI](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml/badge.svg?branch=newMain)](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml)

# Stalux — Modern Astro Blog Theme

**Dual-mode: Use as a source template 📦 or install as an npm plugin 🔌**

**[stalux.needhelp.icu](https://stalux.needhelp.icu)**

A dark-themed, high-performance Astro blog theme with elegant glassmorphism design, per-route font subsetting, and a focus on content-first reading experience.

---

## 🚀 Quick Start

### Plugin Mode (recommended)

```bash
bun create astro                    # Choose "minimal" template
cd myblog
bun add @xingwangzhe/stalux         # Install theme (all dependencies included)
bunx stalux init                    # Generate stalux/ content directory
```

Then configure `astro.config.mjs`:

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
import { defineCollections } from "@xingwangzhe/stalux/schemas/collections";
export const collections = defineCollections({ contentDir: "stalux" });
```

```bash
bun run dev  # Start writing!
```

### Template Mode

```bash
git clone https://github.com/xingwangzhe/stalux.git my-blog
cd my-blog
bun install
bun run dev
```

---

## ✨ Features

- 🌙 **Dark mode** with elegant glassmorphism design
- 🔤 **Per-route font subsetting** — 25 MB font → ~350 KB shared + ~1 KB per page
- 🔍 **Full-text search** via Pagefind (auto-indexed on build)
- 📡 **RSS & Atom feeds**
- 🖼️ **PhotoSwipe** image lightbox
- 📊 **Mermaid** diagrams and flowcharts
- 📐 **Math formula rendering** (KaTeX / MathML)
- 💬 **Waline** comment system
- 🤖 **LLM discovery files** (llms.txt / llms-full.txt)
- 🤝 **WebMCP tools** for AI agents (W3C draft, pure front-end)
- ⚡ **View transitions** for smooth navigation
- 🌐 **i18n** (English / Chinese)
- 🏷️ **Tags, categories, archives** pages
- 🎨 **Component override system** (Starlight-style)
- 🛠️ **Easy YAML configuration** — no coding required

---

## 🔤 Font Optimization

Stalux ships with a 25 MB Chinese font (LXGW WenKai). Instead of loading the full file, the build generates minimal subsets per route:

| Subset    | Size      | Content                                    |
| --------- | --------- | ------------------------------------------ |
| Common    | ~350 KB   | UI text, nav, i18n, shared post characters |
| Per-route | ~0.5–3 KB | Unique characters for each page            |

Every page loads `common.css` + `subset-{route}.css`. All route types are covered: `/`, `/about`, `/words`, `/posts/*`, `/archives`, `/tags`, `/categories`, `/links`.

Powered by `subset-font` (Harfbuzz WASM), running at build time and on-demand in dev mode.

---

## 🎨 Component Override

```ts
stalux({
    components: {
        Navs: "./src/components/CustomNavs.astro",
        Footer: "./src/components/CustomFooter.astro",
    },
});
```

30+ components are overridable. See `src/internal/override.ts` for the full list.

---

## 📝 Content Structure

```
stalux/
├── config/              # YAML configuration
│   ├── site.yml         # Site metadata
│   ├── author.yml       # Author info
│   ├── navs.yml         # Navigation menu
│   ├── footer.yml       # Footer badges & copyright
│   ├── links.yml        # Friend links
│   ├── comment.yml      # Waline comment config
│   ├── head.yml         # Analytics & custom head
│   ├── media-links.yml  # Social media links
│   ├── promote.yml      # LLM promotion
│   ├── ai-discovery.yml # AI discovery files
│   └── typetexts.yml    # Typewriter text
├── posts/               # Blog posts (Markdown)
├── about/index.md       # About page
└── words/               # Quotes / short notes
```

### Analytics configuration

Analytics are configured in `stalux/config/head.yml`, so no template changes are needed:

```yaml
id: head
bingClarityId: "YOUR_CLARITY_PROJECT_ID"
```

`bingClarityId` is the historical Stalux field name for a Microsoft Clarity Project ID. Get the ID from the Clarity project under **Settings → Setup → Get tracking code**. Stalux injects the asynchronous tracking code into `<head>` and keeps one loader during Astro View Transitions. Do not install the same project again through `anyhead`, a tag manager, or another plugin.

The Project ID is a public browser identifier. Never put a Clarity Data Export API token in this YAML or in client-side code. If the site uses a strict CSP, consent banner, or CMP, configure those host-site policies and signals separately; this theme does not make legal compliance decisions for the site.

After deployment, verify the script URL contains the exact Project ID and that the browser sends requests to `https://www.clarity.ms/collect`.

---

## 🛠️ Development Commands

```bash
bun install     # Install dependencies
bun run dev     # Start dev server at localhost:4321
bun run build   # Build to dist/
bun run preview # Preview production build
```

---

## 📖 Documentation

Full documentation and live demo: **[stalux.needhelp.icu](https://stalux.needhelp.icu)**

---

## 🤝 WebMCP / AI Agents

Stalux ships built-in WebMCP tools that let AI agents (browsers with
`document.modelContext`, e.g. Chrome's built-in Gemini or the [Ask nekuda](https://chromewebstore.google.com/detail/ask-nekuda/amochnnbmnkjjlblolhpddkokhnalkjp)
extension) interact with your blog directly — **no backend required**.

When a WebMCP-aware browser opens your site, these read-only tools are registered:

| Tool                  | What it does                                                            | Backing data            |
| --------------------- | ----------------------------------------------------------------------- | ----------------------- |
| `stalux_list_posts`   | Paginated list of all posts (with meta)                                 | `/api/posts.json`       |
| `stalux_get_post`     | Fetch one post's metadata by abbrlink or title keyword                  | `/api/posts.json`       |
| `stalux_current_post` | Metadata of the post currently being viewed                             | `/api/posts.json`       |
| `stalux_random_post`  | Pick a random post's metadata                                           | `/api/posts.json`       |
| `stalux_search_posts` | Full-text search across posts                                           | Pagefind `/pagefind/`   |
| `stalux_read_post`    | Fetch a post's normalized Markdown                                      | `/posts/{abbrlink}.md`  |
| `stalux_site_info`    | Site title, URL, description + pointers to `llms.txt` / `llms-full.txt` | `site.yml` (build-time) |

All tools are `readOnlyHint: true` — they never modify any state.

**Enabling / disabling:** the tools follow the `conformance` setting in
`stalux/config/ai-discovery.yml`. Set it to `disabled` to stop registering
tools; `essential` / `recommended` / `complete` all enable them.

**Browser support:** WebMCP is a W3C community-group draft (Chrome 149 Origin
Trial). On browsers without a native `modelContext`, Stalux loads the
[`@mcp-b/webmcp-polyfill`](https://www.npmjs.com/package/@mcp-b/webmcp-polyfill)
so agents still work; the polyfill becomes a no-op once native support lands.

---

## 📄 License

MIT License — see [LICENSE](./LICENSE).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xingwangzhe/stalux)
[![Deploy with EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https://github.com/xingwangzhe/stalux)
