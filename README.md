[中文文档](./README_CN.md) | English

[![CI](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml/badge.svg?branch=newMain)](https://github.com/xingwangzhe/stalux/actions/workflows/ci.yml)

# Stalux — Modern Astro Blog Theme

**Dual-mode: Use as a source template 📦 or install as an npm plugin 🔌**

**[stalux.needhelp.icu](https://stalux.needhelp.icu)**

A dark-themed, high-performance Astro blog theme with elegant glassmorphism design, native per-page CJK font subsets, and a focus on content-first reading experience.

All HTML routes include a circular back-to-top button in the footer. It appears after scrolling 240px and scrolls smoothly to the top, respecting reduced motion preferences. The button stays in the footer layout without covering content or changing the page width and alignment, and is hidden when printing. No configuration is required.

The homepage typewriter is built into Stalux and continues to use the `items` string list in `stalux/config/typetexts.yml`, with no new configuration. Defaults are 100ms per typed grapheme, 33ms per deleted grapheme, a 1500ms hold, and a 500ms pause after deletion. It pauses outside the viewport or in background tabs and cleans up on soft navigation. Reduced motion displays whole messages without a blinking cursor. Without JavaScript, the first message remains visible; screen readers and print receive the complete list.

Standalone images written as `![Image description](url)` receive a `figure` and `figcaption` through a build-time satteri HAST plugin. Captions appear as small, centered gray text below the image, preserving image alt text and the PhotoSwipe lightbox. No configuration or browser script is required. Empty descriptions, inline images, multiple images in one paragraph, and existing figures are left unchanged. Captions are plain text with automatic escaping.

Code blocks default to the single `dark-plus` theme, with system color-scheme switching and theme selectors disabled. To opt into another theme or switching behavior, explicitly override `themes`, `useDarkModeMediaQuery`, and `themeCssSelector` through `expressiveCode`. This only changes generated code styles and adds no telemetry.

Swup owns soft navigation and motion timing. Astro renders static documents; only `main[data-stalux-route]` is replaced, while navigation, footer, scroll sentinel and background retain their DOM identities. After destination assets are ready, a visible height-bounded heading or introductory region receives a short exit and entry: up to 6px vertically for reading entry, 8px horizontally for explicit previous/next, 4px vertically for a neutral article change, and 6px horizontally within one taxonomy dimension. Cross-category/tag changes use a neutral fade. Desktop entry lasts 100–180ms with an 80ms exit; phones use a 120ms pure entry fade. Long documents remain directly readable without whole-main motion or hiding. History restoration, reduced motion, native browser gestures and same-page anchors skip page motion. Independent HTML and exported data use document navigation. See [Modules and view transitions](docs/MOTION.md) for the complete inventory and timing contract.

The runtime uses Swup's Head, Accessibility, Preload, Scroll and JS plugins with Stalux lifecycle handlers. It waits for incoming stylesheets and gives the destination font a bounded 150ms head start, disposes old interactions before replacement, loads first-seen page scripts, then dispatches the Astro-compatible page lifecycle events used by comments, counters, tag clouds and WebMCP. Each full document randomly selects and asynchronously decodes one background, revealing it from the stable dark canvas over 200ms. Swup soft navigations retain that image without selecting, decoding, or crossfading another SVG. Reduced motion reveals it immediately; saveData keeps the dark canvas without requesting decorative SVGs. Custom `window.__STALUX_BG_URLS__` remains supported, and slow or failed decoding never blocks reading. History positions are restored by the Swup runtime, including reduced-motion visits. This requires no new configuration or telemetry. Animation duration describes the effect itself, not total navigation time or a measured performance improvement.

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
- **Sitemap**: Automatically generates `/sitemap.xml` after build (copies `sitemap-0.xml` for a single sitemap, or the index for multiple sitemaps). `@astrojs/sitemap` is bundled (published post `/posts/*.md` endpoints are included when `promote.export_md` is enabled; other Markdown mirrors stay filtered by default).
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
        expressiveCode: { themes: ["dark-plus"], useDarkModeMediaQuery: false },
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

Desktop navigation sticks to the top of the viewport and gains a frosted glass background after scrolling past 24px, returning to transparent at the top. The mobile menu button gains the same glass surface while scrolling and stays hidden while its drawer is open. Quote dates provide permalink navigation while content and source links remain independently accessible.

Waline loads near the viewport, destroys its instance before Astro swaps the page, and mounts a fresh instance on the next page. A reload-page button recovers from comment resource loading failures, including cached module failures. Comments and inputs use system fonts, with system monospace for code, so user-generated text does not inherit the build-time LXGW WenKai page subset. No additional configuration is required.

## ✨ Features

- 🌙 **Dark mode** with elegant glassmorphism design
- 🔤 **Native per-page font subsets** — Rust/N-API emits cached WOFF2 subsets for each page's visible CJK text
- 🔍 **Full-text search** via Pagefind (auto-indexed on build)
- 📡 **RSS & Atom feeds**
- 🗺️ **Sitemap** (bundled; `.md` source endpoints auto-filtered)
- 🖼️ **PhotoSwipe** image lightbox
- 📊 **Mermaid** diagrams and flowcharts
  Uses Merman through `@xingwangzhe/satteri-mermaid@0.8.2`, with the `dark` theme and a transparent canvas by default. The plugin supports 11 theme presets; see the [configuration reference](https://github.com/xingwangzhe/satteri-mermaid/blob/v0.8.2/docs/configuration.md). Rendering failures throw by default.
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

The subset CSS uses an exact per-character `unicode-range` and `font-display: swap`, so visible text and the downloaded glyphs stay aligned. The variable code font continues to use Astro's local Fonts API. A same-origin font preload in the HTML head discovers the body subset early; consumers need no manual font links.

The persistent BLAKE3 cache key includes font bytes, face index, normalized character set, and algorithm version. Cache files live under `node_modules/.astro/` and are reused across pages and incremental builds. Font inputs are read locally; builds do not fetch fonts from the network.

Multi-page builds reuse prepared font data and hashing state through `FontSubsetter`, with up to four native worker tasks for cold subsets. Font containers are decoded/extracted to SFNT before reusable HarfBuzz preprocessing preserves original outlines; Google Brotli encodes WOFF2 at quality 8. Image dimensions, image loading hints, linked CSS text, and font character extraction share one HTML parse. Shared image dimensions and CSS-generated text are also reused within each build, image and font nodes are mutated on the same parse5 AST, then changed nodes are emitted once using source locations. Untouched scripts, comments, templates and subtrees retain their original source.

Local image dimensions use `image-size`, including SVG and AVIF support. Normal file reads inspect at most 512 KiB; a JPEG compatibility fallback may read the full file when the size marker is first or beyond that window. Explicit dimensions and remote images are preserved. Referenced assets are hashed as streams, and content changes at the same URL invalidate the page cache regardless of image extension.

Processed pages are cached under `node_modules/.astro/stalux-page-output/`. The cache checks source HTML and page paths, referenced local CSS/image content, font inputs, and processing code. Changed inputs, missing font files, and corrupt records trigger reprocessing. Unchanged pages restore their processed output; Pagefind still rebuilds the full search index on every build. Preserve `node_modules/.astro/` to reuse caches across builds; removing it safely rebuilds them.

### Visibility-aware loading and updates

The desktop tag cloud loads dynamically near the viewport. Switching to mobile, leaving the viewport or hiding the document destroys it and stops animation scheduling; becoming visible recreates it. Tag clicks use the same Swup navigation as ordinary internal links. Clocks and the footer runtime update only while visible, and the date changes only on a new day. Comments load within half a viewport (capped at 400px). Tag groups, archive months and category cards retain static HTML while deferring offscreen rendering.


Configured footer badges are generated as content-addressed SVG assets. Native lazy loading keeps closed groups from embedding their image payload in every page; expanding groups also works without JavaScript. Custom component badges outside footer.yml retain Data URL support.

### Modern JavaScript

TypeScript uses ESNext. The theme defaults `vite.build.target` to `"esnext"` to retain modern syntax with minimal compatibility transforms; an explicit consumer target takes precedence. This targets modern browsers, does not polyfill missing Web APIs, and does not move ordinary scripts onto the GPU. Biome enforces `noVar` and `useConst` as errors in maintained source; dependencies and generated bundles are outside this source policy.

### EdgeOne build environment

The repository `edgeone.json` runs install and build through `bunx --bun bun@1.4.4`. Installation uses `--frozen-lockfile`, preventing an older preinstalled Bun from ignoring the v2 lockfile and resolving different dependencies. Both development and peer dependencies require Astro `^7.4.4`. Consuming projects should use the same pinned commands when deploying; their existing build script remains unchanged.

### CJK search enhancement

Builds generate both Pagefind and a sharded CJK substring index shared by the dialog and WebMCP. Titles, summaries, tags and categories are searchable. Optional post frontmatter `searchKeywords: [alias, abbreviation]` defaults to an empty array; keywords are published in HTML and static search files, so never put private information there. Unquoted Chinese, Japanese and Korean queries add verified contiguous substring matches, including single characters, NFKC normalization and space-separated terms. Title matches rank first; native results are retained and deduplicated. Quoted queries and active filters retain native Pagefind semantics. Automatic Traditional/Simplified conversion, pinyin, typo correction and semantic search are not included. Search files load on demand, failures fall back to Pagefind and can be retried, with no external search service or new telemetry.

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

Google Analytics, Clarity, and Umami use low-priority native asynchronous scripts. Each SDK loads once per session, and failures do not block reading or navigation. Vercount rebinds visible counters after each `astro:page-load`. GA captures each URL, title, and referrer, then sends pageviews in visit order through separate background tasks after the shared Swup content-motion gate settles and a paint has been yielded. A bounded timer handles task starvation; hiding or leaving the document flushes pending views immediately. The SDK still runs on the main thread; this scheduling reduces synchronous work on the route's first frame. Umami disables automatic pageviews while retaining click tracking and captures page information before the SDK resolves so rapid navigation cannot mix visits. An existing older runtime or legacy Partytown session performs one full reload when it encounters the new runtime to prevent duplicate listeners and tracking.

For Google Analytics, turn off **Page changes based on browser history events** under **Admin → Data streams → Enhanced measurement → Page views → Advanced settings**. Stalux sets `send_page_view: false` and sends the URL and title for each navigation explicitly. GA's history tracking must also be disabled in the property to prevent duplicate soft-navigation pageviews. Other enhanced measurement options can remain enabled. See [Google's pageview documentation](https://developers.google.com/analytics/devguides/collection/ga4/views).

`bingClarityId` is the historical Stalux field name for a Microsoft Clarity Project ID. Get the ID from the Clarity project under **Settings → Setup → Get tracking code**. Stalux includes the official `@microsoft/clarity` npm dependency, imports it dynamically in the browser, and calls `Clarity.init()` once across soft navigation. Consumer projects such as myblog only configure the ID and upgrade the theme; no separate Clarity installation or script is needed. The theme observes tag loading failures and allows a later page to retry. Tag load, recorder readiness and successful collection are verified separately. The official npm package still loads the hosted recording engine and does not move DOM capture into a Worker. The SDK handles history navigation itself. Do not install the same project again through `anyhead`, a tag manager, or another plugin.

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

Stalux exposes page-local WebMCP tools to compatible browser agents or extensions. All data comes from static build artifacts, so **no backend is required**. This is not an HTTP `/mcp` server that a desktop MCP client can connect to directly: ordinary static hosting cannot process MCP JSON-RPC POST requests. See the [WebMCP community-group draft](https://webmachinelearning.github.io/webmcp/).

When a WebMCP-aware browser opens your site, these read-only tools are registered:

| Tool                  | What it does                                                            | Backing data            |
| --------------------- | ----------------------------------------------------------------------- | ----------------------- |
| `stalux_list_posts`   | Paginated list of all posts (with meta)                                 | `/api/posts.json`       |
| `stalux_get_post`     | Fetch one post's metadata by abbrlink or title keyword                  | `/api/posts.json`       |
| `stalux_current_post` | Metadata of the post currently being viewed                             | `/api/posts.json`       |
| `stalux_random_post`  | Pick a random post's metadata                                           | `/api/posts.json`       |
| `stalux_search_posts` | Full-text search across posts                                           | Pagefind `/pagefind/`   |
| `stalux_read_post`    | Read Markdown in chunks, or indexed plain text when not exported         | Markdown / Pagefind    |
| `stalux_site_info`    | Site title, URL, description + pointers to `llms.txt` / `llms-full.txt` | `site.yml` (build-time) |

All tools are `readOnlyHint: true` — they do not write site data or initiate navigation.

`stalux_search_posts` merges title, tag, category and description matches from the published metadata with body hits from the [Pagefind JavaScript API](https://pagefind.app/docs/api/), using `meta.title` and `plain_excerpt`. Results include `abbrlink` and absolute URL, are deduplicated, and prioritize title matches, with up to 10 posts per call. If the full-text index is unavailable, available metadata matches are labeled `source: "metadata"`, `fullText: false`; no metadata matches yields an index-unavailable error instead of pretending the full-text search succeeded with zero hits. Highlighted HTML is not returned as the tool excerpt. Failed metadata and Pagefind module loads remain retryable.

`stalux_read_post` accepts `id`, `offset` (default 0), and `maxChars` (default and maximum 50000). Offsets use UTF-16 units and never split surrogate pairs. With `promote.export_md` enabled, the result has `format: "text/markdown"` and `markdown`. If exports are disabled or the Markdown file is unavailable, it reads Pagefind using the exact `post` filter and returns `format: "text/plain"` and `content`; Markdown syntax and non-indexed content are not preserved by this fallback. Continue with `nextOffset` until it is `null`; `totalChars` and `truncated` describe the range. Disabling both Markdown exports and Pagefind returns `CONTENT_UNAVAILABLE`.

Tools initialize the polyfill and register on `astro:page-load`, then unregister and stop the outgoing batch on `astro:before-swap`. Requests only read static resources; search terms are not sent to an external search service, no model is called, and no telemetry is added. The article filter ID and Markdown export flag are public HTML attributes used to select available sources. JSON, Markdown and OpenAPI exports are static files and do not advertise dynamic quotas or fixed `RateLimit-*` balances.

**Enabling / disabling:** the tools follow the `conformance` setting in
`stalux/config/ai-discovery.yml`. Set it to `disabled` to stop registering
tools; `essential` / `recommended` / `complete` all enable them.

**Browser support:** WebMCP is a community-group draft; native support depends on browser and version. On browsers without a native `modelContext`, Stalux loads the
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


## Loading and navigation stability

The root reserves scrollbar space and uses explicit line height. The homepage typewriter reserves the maximum wrapped height of its complete messages and keeps the text origin fixed; clocks reserve line boxes and use tabular digits. Existing typing, cursor and route animations remain enabled. No additional configuration is required.

Swup's pre-replacement preparation warms the destination body font without installing it on the old page. The font receives at most 150ms of preparation time; failure, timeout and superseding navigation release that font wait. Incoming stylesheets and first-seen page modules have separate bounded loading waits so the next page can initialize its interactions. Initial loads on slow networks may still show the system fallback. Content authors must reserve dimensions for remote images and third-party embeds. Reduced-motion and print behavior remain supported.

See [style maintenance](docs/STYLING.md) and [lifecycle and static interfaces](docs/RUNTIME.md). Astro development documentation is available through the [official MCP endpoint](https://mcp.docs.astro.build/mcp); `.codex/config.toml`, `.mcp.json` and `AGENTS.md` record the project setup. This development MCP is separate from the blog's browser WebMCP tools.

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

Wide article pages use 280px sidebars within a layout up to 1544px wide, with 16px outer padding. Sidebars collapse below 1600px. UnoCSS remains the style builder; prose and integration styles use standard CSS, and build checks reject Tailwind variables and uncompiled directives.

The friend links list is up to 1600px wide with 16px horizontal padding. Cards fill their grid columns, with one to five columns depending on the viewport.

Article bodies and summary cards are up to 840px wide. Summaries use the existing post `desc` and are omitted when empty. Markdown blockquotes appear as callout cards without new configuration or syntax.

Visitor weather is optional: set `weather: { enabled: true }` in `stalux/config/site.yml` to show it as plain text in the footer (with visitor IP and approximate location) and below the desktop article clock. Omitted or `false` disables it. It automatically requests an approximate city from IP.SB (with IPinfo as fallback) and weather from Open-Meteo, only while visible; no browser GPS permission is requested. These external services receive the visitor IP, and Open-Meteo receives rounded coordinates. A 20-minute session cache stores the city, visitor IP and weather, without coordinates. Visitors behind VPNs may see the exit city. Hidden tabs, offscreen cards and Astro navigation stop work; unavailable services show a retry action and retain previous weather. Open-Meteo's free endpoint is for non-commercial use subject to its limits; the card links to its attribution licence. No server endpoint or extra package is needed.

Archives keep a transparent, single-column year/month timeline with all articles expanded. Each month gently fades and moves into place once when it enters the viewport (280ms), using native browser APIs without extra dependencies. Reduced motion, printing, missing browser APIs and disabled JavaScript retain the complete static list. Mobile dates sit above wrapping article titles. No new configuration is required. Article titles retain a single hover underline; hovering or keyboard-focusing a title previews its existing `desc` on the right, falling below near viewport edges. Empty descriptions show no preview, and touch navigation stays direct. The preview uses the browser top layer (with a high stacking-level fallback) to avoid clipping or overlap.

### Production style compaction (1.35.0)

Development keeps readable source names. Production builds compact private Stalux classes, custom properties and keyframes before Astro compilation and asset hashing, using a version-local mapping shipped with the package. Templates, client selectors, inline styles and dynamic server-generated animations share the mapping; its contents and transformer source participate in incremental cache invalidation.

Stable `data-*` hooks, article anchors, public font properties (`--font-body`, `--font-code`, plus the legacy override hooks `--accent` and `--foreground-60p`), third-party interfaces and user content keep their meaning. Use your own classes and public component interfaces for extensions; the generated `s*`, `--s*` and `k*` names are reserved for the theme. Existing CSS import paths remain available and consumers need no additional configuration or UnoCSS installation.

Theme CSS uses native nesting, modern RGB syntax, `overflow-wrap: anywhere` and clipped one-pixel accessible content with `clip-path`. Lightning CSS targets modern browser engines instead of generating obsolete compatibility expansions. Necessary multiline-clamping and third-party MathML browser adaptations remain. Production source maps are disabled to avoid exposing the original names. Build assertions check semantic CSS/HTML/JS surfaces and resource integrity without modifying article text or code examples; detector results always identify the rule or scanner version used.

Theme code is MIT; fonts retain their own licenses. LXGW WenKai and Google Sans Code use OFL 1.1; Latin Modern Math uses the GUST Font License. Stalux Math Aux is independently rebuilt from KaTeX's OFL font data, replacing the Temml font with conflicting FontCreator noncommercial metadata. Script-letter outlines are unchanged; primes use an OFL source with matching bounds, advances and repetition spacing, with slightly different curves. Fonts and full licenses are synchronized to the consumer's `public/fonts/`; the old unused `Temml.woff2` can be removed. See `scripts/build-math-font.py` and `scripts/font-sources/` for reproducible inputs.

## LICENSES and scope

Theme code is **MIT**; the root [LICENSE](LICENSE) contains the standard text for GitHub detection. Bundled fonts retain their own licenses and are not relicensed as MIT. Independent license texts and their scopes are listed below:

| 组件 / Component | 许可 / License | 全文 / Full text |
| --- | --- | --- |
| Stalux theme code | MIT | [LICENSE-MIT.txt](LICENSES/LICENSE-MIT.txt) |
| LXGW WenKai | OFL-1.1, reserved names and additional web-font permission | [LXGW-WenKai-OFL.txt](public/fonts/LXGW-WenKai-OFL.txt) |
| Google Sans Code | OFL-1.1 | [Google-Sans-Code-OFL.txt](public/fonts/Google-Sans-Code-OFL.txt) |
| Stalux Math Aux, rebuilt from KaTeX OFL font data | OFL-1.1, independently named | [StaluxMathAux-OFL.txt](public/fonts/StaluxMathAux-OFL.txt) |
| Latin Modern Math | GUST Font License / LPPL-1.3c | [LICENSE-GUST.txt](LICENSES/LICENSE-GUST.txt) |
| Full LPPL 1.3c text | LPPL-1.3c | [LICENSE-LPPL-1.3c.txt](LICENSES/LICENSE-LPPL-1.3c.txt) |
| Standard OFL 1.1 text | OFL-1.1 | [LICENSE-OFL-1.1.txt](LICENSES/LICENSE-OFL-1.1.txt) |
| Font copyrights, reserved names and modification notices | Each font’s original license | [LICENSE-FONT-NOTICES.txt](LICENSES/LICENSE-FONT-NOTICES.txt) |

The npm package includes `LICENSES/` and font-specific texts in `public/fonts/`; builds synchronize font notices to the consumer’s public font directory alongside the served WOFF2 files. Native subsetting dependencies retain their [separate license inventory](https://github.com/xingwangzhe/cjk-font-split-native/blob/main/README.en.md#licenses-and-scope) and packaged `THIRD_PARTY_LICENSES.txt`. GitHub’s primary-license display identifies theme code; fonts and other third-party components retain the scopes listed above.


### Article social sharing cards

Image priority is **explicit `og:image` → a card with a valid `cover` → an automatic title card**. The article list continues to use `cover`. An explicit `og:image` is used as-is and accepts HTTP(S), protocol-relative URLs, or site-root paths; PNG/JPEG at 1200×630 is recommended. Omit it or leave it empty to generate a card automatically. Existing posts need no changes.

```yaml title="Article sharing images"
cover: /images/article-cover.webp
og:image: /images/custom-social-card.png
```

`@takumi-rs/core` renders a static 1200×630 WebP at `/og/<metadata-hash>.webp` using the bundled LXGW WenKai font. Cards include the title, summary, site identity, author, category, accent color and date in the site timezone. No renderer JavaScript is sent to the browser. Static `og:image`, `twitter:image` and BlogPosting `image` use the same absolute URL; generated images also declare dimensions and MIME type. Articles use `summary_large_image`. A second `og:image` points to a PNG fallback; platforms choose which format they can read. WebP quality is 86; AVIF is not the default.

Local covers are read from the final `publicDir`. Remote covers are requested by the build machine, with an 8-second timeout and an 8 MiB limit (remote bytes are cached for 24 hours); unreadable or undecodable artwork emits a warning and falls back to a title card. No remote image-generation service is used. WebP and PNG outputs are cached in `stalux-social-cards/` under Astro's cache directory and copied into each build output. Explicit sharing images are fetched by social platforms, so they must be publicly accessible images. Platforms maintain their own preview caches and may not refresh an existing share immediately after deployment.

Motion is specified for 55 visible semantic modules in [Modules and view transitions](docs/MOTION.md). Swup animates one visible, height-bounded heading or introductory region after destination assets are ready, with cues for reading, returning, filtering and previous/next articles. Long documents stay readable and the header, footer and dark canvas remain stable. Phones use a short fade; history restores the reading position; same-page anchors use interruptible native scrolling. Module hover, focus, press and asynchronous update feedback complement bounded secondary entry cues. Reduced motion and print remain static and readable. No new configuration is required.

Built-in backgrounds use committed WebP companions composited against the default #202020 canvas (quality 80, original resolution). Custom CSS canvas colors use the original transparent WebP; SVG sources are retained. Ratio-only SVG sizing is preserved with `contain`; custom background URLs retain their existing sizing. Regenerate companions after changing the SVG originals with `bun run backgrounds:build`.
