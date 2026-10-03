[中文文档](./README_CN.md) | English

[![CI](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml/badge.svg?branch=newMain)](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml)

# Stalux — Modern Astro Blog Theme

**Dual-mode: Use as a source template 📦 or install as an npm plugin 🔌**

**[stalux.needhelp.icu](https://stalux.needhelp.icu)**

A dark-themed, high-performance Astro blog theme with elegant glassmorphism design, native per-page CJK font subsets, and a focus on content-first reading experience.

All HTML routes include a circular back-to-top button in the footer. It appears after scrolling 240px and scrolls smoothly to the top, respecting reduced motion preferences. The button stays in the footer layout without covering content or changing the page width and alignment, and is hidden when printing. No configuration is required.

The homepage typewriter is built into Stalux and continues to use the `items` string list in `stalux/config/typetexts.yml`, with no new configuration. Defaults are 100ms per typed grapheme, 33ms per deleted grapheme, a 1500ms hold, and a 500ms pause after deletion. It pauses outside the viewport or in background tabs and cleans up on soft navigation. Reduced motion displays whole messages without a blinking cursor. Without JavaScript, the first message remains visible; screen readers and print receive the complete list.

---

## 🚀 Quick Start

### Plugin Mode (recommended)

```bash
bun create astro                    # Choose "minimal" template
cd myblog
bun add @xingwangzhe/stalux         # Install theme (all dependencies included)
bunx stalux init                    # Generate stalux/ content directory
```

Requires Node.js 26 or later. Then configure `astro.config.ts`. All plugins are bundled into the Stalux integration by default — **no manual configuration is needed**:

- **Markdown**: Mermaid (MDAST detection + HAST/SVG rendering), math formulas (Temml → MathML), word count / feature flags, and PhotoSwipe image lightbox are injected into the default `satteri()` processor automatically (math / frontmatter / gfm / smart punctuation are enabled by default).
- **Sitemap**: `@astrojs/sitemap` is bundled (published post `/posts/*.md` endpoints are included when `promote.export_md` is enabled; other Markdown mirrors stay filtered by default).
- **Expressive Code**: bundled with line numbers enabled by default.

```ts
import { defineConfig } from "astro/config";
import stalux from "@xingwangzhe/stalux";

export default defineConfig({
    output: "static",
    site: "https://example.com",
    integrations: [stalux({ contentDir: "stalux" })],
});
```

Set the optional `accentColor` in `stalux/config/site.yml` to customize the shared theme and Waline accent. It accepts a six-digit HEX color and defaults to `#EAB308`; choose a color with sufficient contrast against your background.

```yaml title="stalux/config/site.yml"
accentColor: "#EAB308"
```

To customize the bundled integrations, pass options (or disable them with `false`):

```ts
integrations: [
    stalux({
        contentDir: "stalux",
        sitemap: { filter: (page) => page.startsWith("https://example.com/posts/") },
        expressiveCode: { themes: ["dark-plus", "github-light"] },
    }),
];
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
- 🔤 **Native per-page font subsets** — Rust/N-API emits cached WOFF2 subsets for each page's visible CJK text
- 🔍 **Full-text search** via Pagefind (auto-indexed on build)
- 📡 **RSS & Atom feeds**
- 🗺️ **Sitemap** (bundled; `.md` source endpoints auto-filtered)
- 🖼️ **PhotoSwipe** image lightbox
- 📊 **Mermaid** diagrams and flowcharts
- 📐 **Math formula rendering** (Temml → MathML)
- 💬 **Waline** comment system
- 🤖 **LLM discovery files** (llms.txt / llms-full.txt)
- 🤝 **WebMCP tools** for AI agents (W3C draft, pure front-end)
- ⚡ **View transitions** for smooth navigation
- 🌐 **i18n** (English / Simplified Chinese; missing locale keys fall back to English)
- 🏷️ **Tags, categories, archives** pages
- 🎨 **Component override system** (Starlight-style)
- 🛠️ **Easy YAML configuration** — no coding required

---

## 🔤 Font Optimization

Stalux ships with LXGW WenKai and a variable code font (Google Sans Code). During the build, the Rust/N-API package `@xingwangzhe/cjk-font-split-native` creates one content-addressed WOFF2 subset from each page's visible or expandable CJK text. The browser downloads only the page subset; repeated character sets share the same file. CJK text inside code and MathML is covered too.

Arabic digits `0-9` are always reserved in every subset (`RESERVED_GLYPHS`), even on pages without any visible number. Digits produced at runtime by client scripts — clocks, counters, dates, injected values — never appear in the built HTML, so reserving them keeps numbers from falling back to a system font. Callers can append more characters through the optional `extraChars` argument of `writePageFontSubset`.

The subset CSS uses an exact per-character `unicode-range` and `font-display: swap`, so visible text and the downloaded glyphs stay aligned. The variable code font continues to use Astro's local Fonts API.

The persistent BLAKE3 cache key includes font bytes, face index, normalized character set, and algorithm version. Cache files live under `node_modules/.astro/` and are reused across pages and incremental builds. Font inputs are read locally; builds do not fetch fonts from the network.

### Visibility-aware loading and updates

The desktop tag cloud loads dynamically near the viewport. Switching to mobile, leaving the viewport or hiding the document destroys it and stops animation scheduling; becoming visible recreates it. Tag clicks use Astro client navigation. Clocks and the footer runtime update only while visible, and the date changes only on a new day. Comments load within half a viewport (capped at 400px). Tag groups, archive months and category cards retain static HTML while deferring offscreen rendering.

### Modern JavaScript

TypeScript uses ESNext. The theme defaults `vite.build.target` to `"esnext"` to retain modern syntax with minimal compatibility transforms; an explicit consumer target takes precedence. This targets modern browsers, does not polyfill missing Web APIs, and does not move ordinary scripts onto the GPU. Biome enforces `noVar` and `useConst` as errors in maintained source; dependencies and generated bundles are outside this source policy.

### Initial CSS and search styles

The theme defaults to Astro's `build.inlineStylesheets: "never"`: hashed shared CSS can be cached across routes, while component styles load on the pages that use them. Normal blocking stylesheets prevent an unstyled first paint. An explicit consumer setting of `build.inlineStylesheets: "always"` restores inline styles at the cost of larger HTML responses.

Pagefind dialog CSS is emitted as a separate hashed static file with a `prefetch` hint. Opening search activates the stylesheet and waits for it before displaying the dialog. It does not block the initial content or depend on JavaScript generating a CSS asset. A `<noscript>` stylesheet fallback is included.

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
│   ├── author.yml       # Author info (name/avatar/bio/jobTitle)
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

> The Partytown migration in this branch is an unpublished candidate. Representative route measurements show lower TBT, but LCP regresses on the homepage and category page, so performance validation is incomplete. The following describes the candidate implementation.

`stalux()` includes Partytown. The Google Analytics, Clarity, and Umami scripts run in a Web Worker without an additional consumer integration. Page tracking follows `astro:page-load`; browsers with `Element.moveBefore()` preserve the worker during navigation. Vercount loads asynchronously in the main window, avoiding worker startup and DOM bridge delays for visible counters. It runs once after each `astro:page-load` to bind incoming page counters and use the current URL and first-party visitor cookie.

For Google Analytics, turn off **Page changes based on browser history events** under **Admin → Data streams → Enhanced measurement → Page views → Advanced settings**. Stalux sets `send_page_view: false` and sends the URL and title for each navigation explicitly. GA's history tracking must also be disabled in the property to prevent duplicate soft-navigation pageviews. Other enhanced measurement options can remain enabled. See [Google's pageview documentation](https://developers.google.com/analytics/devguides/collection/ga4/views).

`bingClarityId` is the historical Stalux field name for a Microsoft Clarity Project ID. Get the ID from the Clarity project under **Settings → Setup → Get tracking code**. Stalux loads the tracking code through Partytown and keeps one loader in browsers that support preserving the worker. Do not install the same project again through `anyhead`, a tag manager, or another plugin.

The Project ID is a public browser identifier. Never put a Clarity Data Export API token in this YAML or in client-side code. If the site uses a strict CSP, consent banner, or CMP, configure those host-site policies and signals separately; this theme does not make legal compliance decisions for the site.

After deployment, verify the script URL contains the exact Project ID and that the browser sends Clarity `/collect` requests (the collection host may be a regional endpoint such as `a.clarity.ms`).

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

### Author JSON-LD configuration

`stalux/config/author.yml` accepts the optional `jobTitle` field. When present, Stalux includes it in the homepage and article JSON-LD `Person` entity so agents can identify the author's role without changing the visual author card:

```yaml title="stalux/config/author.yml"
id: author
name: xingwangzhe
avatar: /avatar.png
bio: Blog Theme Stalux
jobTitle: Software Engineer # Optional; emitted as JSON-LD Person.jobTitle
```

This is a build-time metadata field. It does not create a contact endpoint or expose private information; only publish a role that is already intended to be public.


## Development diagnostics

Stalux routes integration, content-loader and rendering diagnostics through Astro's official logger. Normal mode keeps summaries, warnings and errors. Verbose mode adds configuration/routes, component overrides, font cache, Markdown analysis/cache, content statistics, feeds, asset sync and Pagefind stages.

```bash title="Stalux diagnostics"
bun run dev:debug
bun run build:debug
# In a consuming project:
STALUX_DEBUG=1 bun run dev --verbose
STALUX_DEBUG=1 bun run build --verbose
# Silence Astro; standalone verification output remains separate:
bun run astro -- build --silent
```

| Surface | Behavior |
| --- | --- |
| Terminal | Integration loggers use `fork("stalux/module")`; rendering uses `Astro.logger`, with explicit context propagation to utilities and loaders. Astro levels, custom destinations and `--silent` remain authoritative. |
| Browser console | A separate lightweight logger uses `[stalux/module]` prefixes. Detail requires development mode plus `STALUX_DEBUG=1` or `--verbose`; enable Verbose messages in DevTools. Production only emits warnings and errors. |
| Content diagnostics | `getStaticPaths()` has no runtime logger; pure computation errors are reported by callers or Astro. Math failures use Sätteri diagnostics without duplicate error reporting. |

Browser diagnostics cover mount/disposal, navigation, search, PhotoSwipe, Waline, WebMCP, backgrounds and external analytics script loading. Logs stay local: no reporting endpoint or telemetry is added. Search terms, article bodies, complete configuration and credentials are not intentionally logged. Errors retain module, cause and stack; common credentials and URL query parameters are redacted, but review third-party error text before sharing.

In Astro 7.3, integration `logger.debug()` uses the official `DEBUG/--verbose` channel, separate from custom JSON destinations. `info/warn/error` and rendering diagnostics use the configured destination. Do not enable `--verbose` or `DEBUG` when requesting a silent run.

Timing is emitted only as logs, never included in generated pages or cache keys. Switching between normal and verbose builds may require one rebuild; repeated builds in the same mode remain deterministic. Consumers running `astro dev --background` can read terminal output with `astro dev logs`.

Keep the TypeScript 6 alias for `astro check`, upgrade Vitest and its coverage provider together, and run `bun run validate` before releasing.

## Style development and output

Stalux precompiles its UnoCSS styles; consuming projects need no UnoCSS dependency or configuration. Shared CSS is a cacheable external stylesheet by default. Article/math, archive, category, tag and quote styles load with their components. Explicit Astro `build.inlineStylesheets: "always"` restores inline output. New utilities in consumer override components require the consumer’s own compiler. See [STYLING.md](./docs/STYLING.md) for maintenance and watch mode.

Wide article pages use 280px sidebars within a layout up to 1920px wide, with 16px outer padding. Sidebars collapse below 1600px. UnoCSS remains the style builder; prose and integration styles use standard CSS, and build checks reject Tailwind variables and uncompiled directives.

The friend links list is up to 1600px wide with 16px horizontal padding. Cards fill their grid columns, with one to five columns depending on the viewport.

Article bodies and summary cards are up to 840px wide. Summaries use the existing post `desc` and are omitted when empty. Markdown blockquotes appear as callout cards without new configuration or syntax.
