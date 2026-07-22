# Stalux Config.yml → Config/*.yml 拆分改造计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 stalux 的单一巨无霸 config.yml 拆分为 `config/` 目录下的多个独立 .yml 文件，每个文件对应独立的内容集合定义，同时识别可转为内容集合的其他配置。

**Architecture:** 当前 `config.yml` 使用 `file()` 加载器 → 改为 `glob({ base: "stalux/config/", pattern: "*.yml" })` 加载多文件；Zod schema 按职责拆分为独立小 schema，每个文件定义自己的 `id` 便于查询。所有消费端从 `configs.get("xxx")` 模式访问。

**Tech Stack:** Astro Content Collections, Zod, YAML

---

## 当前结构分析

### 当前 config.yml 结构（~245 行）

```
config.yml (项目根)
├── site/: lang, title, url, description, timezone, canonical, favicon
├── author/: name, avatar, bio
├── head/: googleAnalyticsId, bingClarityId, umami, anyhead
├── navs/: [] (导航栏)
├── typetexts/: [] (打字动画)
├── mediaLinks/: [] (社交媒体)
├── links/: { title, description, sites: [] } (友情链接)
├── footer/: { buildtime, copyright, theme, beian, badges, custom }
├── comment/: { enabled, waline: {} }
├── llm_promote: string (可选)
└── export_md: boolean
```

### 消费端分布（所有使用 config 的文件）

| 组件/页面 | 访问的字段 |
|-----------|-----------|
| `src/components/stalux/layout/head.astro` | canonical/url, favicon, author.avatar, lang, noindex, nofollow, head.* |
| `src/layouts/Stalux.astro` | lang, llm_promote, author.name, url, title |
| `src/components/stalux/layout/PostLayout.astro` | comment.*, author |
| `src/components/stalux/footer/Footer*.astro` | lang |
| `src/components/stalux/layout/listPage.astro` | title |
| `src/components/stalux/analytics/google.astro` | head.googleAnalyticsId |
| `src/components/stalux/analytics/clarity.astro` | head.bingClarityId |
| `src/components/stalux/analytics/umami.astro` | head.umami |
| `src/utils/ai-discovery.ts` | url, title, description, author.*, mediaLinks, export_md, links.*, lang |
| `src/pages/*.ts/astro` | 通过 loadConfig() 访问 |
| 各个 pages (about, archives, words, etc.) | lang, title, description |

---

## 任务分解

### Task 1: 创建 config/ 目录及各子文件

**目标：** 将 config.yml 按职责拆分为 config/ 下的独立 .yml 文件，每个文件有唯一 id 字段。

**Files:**
- Create: `stalux/config/site.yml`
- Create: `stalux/config/author.yml`
- Create: `stalux/config/head.yml`
- Create: `stalux/config/navs.yml`
- Create: `stalux/config/typetexts.yml`
- Create: `stalux/config/media-links.yml`
- Create: `stalux/config/links.yml`
- Create: `stalux/config/footer.yml`
- Create: `stalux/config/comment.yml`
- Create: `stalux/config/promote.yml`

- [ ] **Step 1: Create config/site.yml**

```yaml
id: site
lang: en
title: Stalux Blog Theme
url: https://stalux.needhelp.icu
description: "Blog theme Stalux - A professional display platform for content creators..."
timezone: "Asia/Shanghai"
favicon: "/stalux.ico"
canonical: "https://stalux.needhelp.icu"
```

- [ ] **Step 2: Create config/author.yml**

```yaml
id: author
name: xingwangzhe
avatar: /avatar.png
bio: Blog Theme Stalux
```

- [ ] **Step 3: Create config/head.yml**

```yaml
id: head
googleAnalyticsId: ""
bingClarityId: ""
umami:
  id: ""
  url: ""
anyhead: ""
```

- [ ] **Step 4: Create config/navs.yml**

```yaml
id: navs
items:
  - title: Home
    icon: home
    link: /
  - title: Posts
    icon: archive
    link: /archives
  - title: Categories
    icon: folder
    link: /categories
  - title: Tags
    icon: tag
    link: /tags
  - title: Words
    icon: quote
    link: /words
  - title: Links
    icon: link
    link: /links
  - title: About
    icon: user
    link: /about
  - title: Travellings
    icon: train-front
    link: https://www.travellings.cn/go
```

- [ ] **Step 5: Create config/typetexts.yml**

```yaml
id: typetexts
items:
  - "Free for free, not free for charge!"
  - "Where's the any key?"
  - "Press F12?"
  - "Hello World!"
```

- [ ] **Step 6: Create config/media-links.yml**

```yaml
id: media-links
items:
  - icon: github
    link: https://github.com/xingwangzhe/stalux
  - icon: bilibili
    link: https://bilibili.com/
  - icon: X
    link: https://x.com
  - icon: juejin
    link: https://juejin.cn/
  - icon: zhihu
    link: https://www.zhihu.com/
  - icon: maildotru
    link: mailto:xingwangzhe@outlook.com
  - icon: telegram
    link: https://t.me/
```

- [ ] **Step 7: Create config/links.yml**

```yaml
id: links
title: Helpful Links
description: These sites are great and have been very helpful to this theme!
sites:
  - name: Astro
    description: A modern static site generator...
    link: https://astro.build/
    icon: https://astro.build/favicon.svg
  - name: MDN
    description: Provides open, detailed information...
    link: https://developer.mozilla.org/
    icon: https://developer.mozilla.org/favicon.ico
  - name: animejs
    description: A powerful JavaScript animation library...
    link: https://animejs.com/
    icon: https://animejs.com/assets/images/favicon.png
  - name: feather-icons
    description: A clean icon library...
    link: https://feathericons.com/
    icon: https://feathericons.com/favicon.ico
  - name: simple-icons
    description: Thousands of brand icons...
    link: https://simpleicons.org/
    icon: https://simpleicons.org/icons/simpleicons.svg
```

- [ ] **Step 8: Create config/footer.yml**

```yaml
id: footer
buildtime: "2025-05-01T10:00:00"
copyright:
  enabled: true
  startYear: 2024
  customText: ""
theme:
  showPoweredBy: true
  showThemeInfo: true
beian:
  icp:
    enabled: false
    number: "辽ICP备XXXXXXXX号"
  security:
    enabled: false
    text: "辽公网安备 XXXXXXXXXXXX号"
    number: "XXXXXXXXXXXX"
badges:
  - label: "Powered by"
    message: "Astro"
    color: "orange"
    style: "flat-square"
    alt: "Powered by Astro"
    href: "https://astro.build/"
  # ... remaining badges same as original
custom: |
  <!-- footer custom hook -->
```

- [ ] **Step 9: Create config/comment.yml**

```yaml
id: comment
enabled: false
waline:
  serverURL: https://walines.xingwangzhe.fun
  lang: zh-CN
  login: "force"
  dark: true
  reaction: false
  meta:
    - nick
    - mail
    - link
  requiredMeta: []
  commentSorting: "latest"
  wordLimit: 200
  pageSize: 10
```

- [ ] **Step 10: Create config/promote.yml**

```yaml
id: promote
export_md: true
# llm_promote: 留空则不插入
```

- [ ] **Step 11: Verify all 10 files exist**

```bash
ls -la /home/xingwangzhe/桌面/博客/stalux/stalux/config/
```

Expected: `site.yml author.yml head.yml navs.yml typetexts.yml media-links.yml links.yml footer.yml comment.yml promote.yml`

---

### Task 2: 修改 content.config.ts 中的 config 集合定义

**目标：** 将 `config` 集合加载器从 `file("config.yml")` 改为 `glob()`，并为每个子文件定义独立的 Zod schema。

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: 重写 config 集合定义**

```typescript
const config = defineCollection({
    // 注意：loader base 是 stalux/config/，但 glob 的 base 相对于项目根
    loader: glob({
        pattern: ["*.yml"],
        base: "stalux/config/",
        generateId: ({ data }) => String(data["id"]),
    }),
    schema: z.discriminatedUnion("id", [
        // site
        z.object({
            id: z.literal("site"),
            lang: z.string().optional().default("zh-CN"),
            title: z.string().min(1, "site.title 不能为空"),
            url: z.string().url("site.url 必须是合法 URL"),
            description: z.string().min(1, "site.description 不能为空"),
            timezone: z.string().optional().default("Asia/Shanghai"),
            canonical: z.string().url().optional(),
            twitterSite: z.string().optional(),
            noindex: z.boolean().optional().default(false),
            nofollow: z.boolean().optional().default(false),
            favicon: z.string().optional().default("/favicon.ico"),
        }),
        // author
        z.object({
            id: z.literal("author"),
            name: z.string().min(1, "author.name 不能为空"),
            avatar: z.string().min(1, "author.avatar 不能为空"),
            bio: z.string().min(1, "author.bio 不能为空"),
        }),
        // head
        z.object({
            id: z.literal("head"),
            googleAnalyticsId: z.string().optional(),
            bingClarityId: z.string().optional(),
            umami: z.object({
                id: z.string().optional(),
                url: z.string().optional(),
            }).optional(),
            anyhead: z.string().optional(),
        }),
        // navs
        z.object({
            id: z.literal("navs"),
            items: z.array(
                z.object({
                    title: z.string().min(1),
                    icon: z.string().min(1),
                    link: z.string().min(1),
                }),
            ),
        }),
        // typetexts
        z.object({
            id: z.literal("typetexts"),
            items: z.array(z.string()),
        }),
        // media-links
        z.object({
            id: z.literal("media-links"),
            items: z.array(
                z.object({
                    icon: z.string().min(1),
                    link: z.string().min(1),
                }),
            ),
        }),
        // links
        z.object({
            id: z.literal("links"),
            title: z.string().min(1),
            description: z.string(),
            sites: z.array(
                z.object({
                    name: z.string().min(1),
                    description: z.string(),
                    icon: z.string().min(1),
                    link: z.string().min(1),
                }),
            ),
        }),
        // footer
        z.object({
            id: z.literal("footer"),
            buildtime: z.string().optional(),
            copyright: z.object({
                enabled: z.boolean().optional().default(true),
                startYear: z.number().optional(),
                customText: z.string().optional(),
            }).optional(),
            theme: z.object({
                showPoweredBy: z.boolean().optional().default(true),
                showThemeInfo: z.boolean().optional().default(true),
            }).optional(),
            beian: z.object({
                icp: z.object({
                    enabled: z.boolean().optional().default(false),
                    number: z.string().optional(),
                }).optional(),
                security: z.object({
                    enabled: z.boolean().optional().default(false),
                    text: z.string().optional(),
                    number: z.string().optional(),
                }).optional(),
            }).optional(),
            badges: z.array(
                z.union([
                    z.object({
                        label: z.string(),
                        message: z.string(),
                        color: z.string().optional(),
                        style: z.string().optional(),
                        alt: z.string().optional(),
                        href: z.string().optional(),
                    }),
                    z.object({
                        title: z.string(),
                        collapsed: z.boolean().optional().default(true),
                        items: z.array(z.object({
                            label: z.string(),
                            message: z.string(),
                            color: z.string().optional(),
                            style: z.string().optional(),
                            alt: z.string().optional(),
                            href: z.string().optional(),
                        })),
                    }),
                ]),
            ).optional(),
            custom: z.string().optional(),
        }),
        // comment
        z.object({
            id: z.literal("comment"),
            enabled: z.boolean().optional().default(false),
            waline: z.object({
                serverURL: z.string().url().optional(),
                lang: z.string().optional().default("zh-CN"),
                locale: z.any().optional(),
                emoji: z.array(z.string()).optional(),
                reaction: z.boolean().optional().default(false),
                meta: z.array(z.string()).optional().default(["nick", "mail", "link"]),
                requiredMeta: z.array(z.string()).optional().default([]),
                login: z.string().optional().default("enable"),
                recaptchaV3Key: z.string().optional(),
                turnstileKey: z.string().optional(),
                dark: z.union([z.string(), z.boolean()]).optional().default(true),
                noCopyright: z.boolean().optional().default(false),
                commentSorting: z.string().optional().default("latest"),
                imageUploader: z.any().optional(),
                highlighter: z.any().optional(),
                texRenderer: z.any().optional(),
                search: z.any().optional(),
                wordLimit: z.number().optional().default(200),
                pageSize: z.number().optional().default(10),
            }).optional(),
        }),
        // promote
        z.object({
            id: z.literal("promote"),
            llm_promote: z.string().optional(),
            export_md: z.boolean().optional().default(false),
        }),
    ]),
});
```

**注意：** 删除原有的 `config` 定义，并将导出的 `collections` 对象保留。如果 `about`、`posts`、`words` 保持不变。

```typescript
export const collections = { posts, about, config, words };
```

- [ ] **Step 2: 保存文件并运行 Astro type-check**

```bash
cd /home/xingwangzhe/桌面/博客/stalux && npx astro check
```

Expected: 类型错误应该仅来自消费端（因为类型变了），不来自 collection 定义本身。

---

### Task 3: 更新 ai-discovery.ts 中的 Config 类型和 loadConfig

**目标：** Config 类型从单个 data 对象变为 `Map<string, Record<string, unknown>>`，更新 loadConfig 函数返回 `ConfigMap` 并更新所有辅助函数。

**Files:**
- Modify: `src/utils/ai-discovery.ts`

- [ ] **Step 1: 更新类型定义和 loadConfig**

```typescript
export type ConfigMap = Map<string, Record<string, unknown>>;

/** 加载 config 集合，返回按 id 索引的 Map */
export async function loadConfig(): Promise<ConfigMap> {
    const configCollection = await getCollection("config");
    return new Map(configCollection.map((entry) => [entry.id, entry.data]));
}

/** 安全的从 ConfigMap 中获取字段 */
export function getConfigField<T>(config: ConfigMap, id: string, field: string, defaultValue?: T): T | undefined {
    const section = config.get(id);
    if (!section) return defaultValue;
    return (section as Record<string, unknown>)[field] as T | undefined ?? defaultValue;
}

/** 快捷获取站点 URL */
export function getSite(config: ConfigMap, contextSite?: string): string {
    const siteConfig = config.get("site");
    const url = getConfigField<string>(config, "site", "url");
    return (contextSite || url || "").replace(/\/$/, "");
}
```

- [ ] **Step 2: 更新 getMediaLinks**

```typescript
export function getMediaLinks(config: ConfigMap): Array<{ name: string; url: string }> {
    const mediaLinks = config.get("media-links");
    if (!mediaLinks) return [];
    const items = mediaLinks.items as Array<{ icon: string; link: string }> | undefined;
    if (!items) return [];
    return items
        .filter((link) => link.link && !link.link.startsWith("mailto:"))
        .map((link) => {
            // ... same logic as before
        });
}
```

- [ ] **Step 3: 更新 getEmail**

```typescript
export function getEmail(config: ConfigMap): string | undefined {
    const mediaLinks = config.get("media-links");
    if (!mediaLinks) return undefined;
    const items = mediaLinks.items as Array<{ icon: string; link: string }> | undefined;
    if (!items) return undefined;
    const mail = items.find((l) => l.link?.startsWith("mailto:"))?.link;
    if (mail) return mail.replace(/^mailto:/, "");
    return undefined;
}
```

- [ ] **Step 4: 更新 renderLlmsTxt 和其他 render 函数，使其读取 ConfigMap 而非 Config**

```typescript
/** 从 ConfigMap 获取 site 相关字段 */
function siteConfig(config: ConfigMap) {
    const s = config.get("site") || {};
    return s as { title?: string; description?: string; url?: string; lang?: string; export_md?: boolean };
}

/** 生成 llms.txt 核心 markdown 内容 */
export async function renderLlmsTxt(config: ConfigMap, site: string): Promise<string> {
    const posts = await getPublishedPosts();
    const about = await loadAbout();
    const s = config.get("site") as Record<string, unknown> | undefined;
    const a = config.get("author") as Record<string, unknown> | undefined;
    const links = config.get("links") as Record<string, unknown> | undefined;
    const mediaLinks = getMediaLinks(config);
    const email = getEmail(config);
    const lang = (s?.lang as string) || "zh-CN";
    const zh = lang.startsWith("zh");
    const exportMd = (config.get("promote") as Record<string, unknown>)?.export_md as boolean ?? false;

    const lines: string[] = [];
    lines.push(`Lang: ${lang}`);
    lines.push("");
    lines.push(`# ${(s?.title as string) || t(lang, "博客", "Blog")}`);
    lines.push("");
    lines.push(`> ${escapeMd(s?.description as string)}`);
    // ...
}
```

**注意：** `renderAiTxt`、`renderBrandTxt`、`renderFaqAiTxt`、`renderDeveloperAiTxt`、`renderRobotsAiTxt`、`buildIdentityJson`、`buildAiJson` 都需要接受 `ConfigMap` 类型。

---

### Task 4: 更新 Stalux.astro 和 head.astro

**目标：** 修改这两个 Layout 组件中的 config 访问模式。

**Files:**
- Modify: `src/layouts/Stalux.astro`
- Modify: `src/components/stalux/layout/head.astro`

- [ ] **Step 1: 更新 Stalux.astro**

```astro
---
import Head from "@components/stalux/layout/head.astro";
import Footer from "@components/stalux/layout/footer.astro";
import { getCollection } from "astro:content";
import "@styles/base/init.css";
import "@styles/shared/stagger.css";

const props = Astro.props as Props;

const configEntries = await getCollection("config");
const siteConfig = configEntries.find(e => e.id === "site")?.data as Record<string, unknown> | undefined;
const authorConfig = configEntries.find(e => e.id === "author")?.data as Record<string, unknown> | undefined;
const promoteConfig = configEntries.find(e => e.id === "promote")?.data as Record<string, unknown> | undefined;

const lang = (siteConfig?.lang as string) || "zh-CN";
const llmPromote = String(promoteConfig?.llm_promote ?? "")
    ?.replace(/\{author\}/g, String(authorConfig?.name ?? ""))
    ?.replace(/\{url\}/g, String(siteConfig?.url ?? ""))
    ?.replace(/\{title\}/g, String(siteConfig?.title ?? ""))
    ?.replace(/\{cc\}/g, "CC-BY-NC-SA-4.0");
// ...
---
```

- [ ] **Step 2: 更新 head.astro**

```astro
---
const configEntries = await getCollection("config");
const site = configEntries.find(e => e.id === "site")?.data ?? {};
const author = configEntries.find(e => e.id === "author")?.data ?? {};
const headConfig = configEntries.find(e => e.id === "head")?.data ?? {};

const canonicalBase = (site as any).canonical || (site as any).url;
const faviconPath = (site as any).favicon || "/favicon.ico";
// ...
```

- [ ] **Step 3: 更新 analytics 组件**

在每个 analytics 组件中（google.astro、clarity.astro、umami.astro），修改 config 的读取方式。

---

### Task 5: 更新所有页面组件

**目标：** 修改所有 `(await getCollection("config"))[0]?.data` 的消费端。

**Files to modify (查找所有出现模式):**
- `src/pages/*.astro` × 约 8 个文件
- `src/components/stalux/**/*.astro` × 约 6 个文件
- `src/components/stalux/footer/*.astro` × 约 3 个文件
- `src/components/stalux/posts/*.astro` × 约 2 个文件
- `src/utils/ai-discovery.ts`

**关键模式：** 将 `(await getCollection("config"))[0]?.data` 替换为从 configEntries 查找特定 id 的模式。

- [ ] **Step 1: 在需要 site 信息的组件中统一替换**

```astro
// BEFORE:
const stalux = (await getCollection("config"))[0]?.data ?? {};
const lang = stalux.lang || "zh-CN";

// AFTER:
const configEntries = await getCollection("config");
const siteConfig = configEntries.find(e => e.id === "site")?.data ?? {};
const lang = (siteConfig as any).lang || "zh-CN";
```

- [ ] **Step 2: 在需要 comment 信息的组件中**

```astro
// PostLayout.astro 中
const commentConfig = configEntries.find(e => e.id === "comment")?.data ?? {};
const commentEnabled = (commentConfig as any).enabled ?? false;
const walineConfig = (commentConfig as any).waline;
```

- [ ] **Step 3: 在需要 footer 信息的组件中**

```astro
// FooterCopyright.astro, FooterStats.astro 中
const siteConfig = (await getCollection("config")).find(e => e.id === "site")?.data ?? {};
const lang = (siteConfig as any).lang || "zh-CN";
```

---

### Task 6: 更新页面路由文件中的 loadConfig 调用

**目标：** ai-discovery.ts 的 loadConfig 已经返回 `ConfigMap`，所有调用它的路由文件需要适配。

**Files:**
- Modify: `src/pages/llms.txt.ts`
- Modify: `src/pages/llm.txt.ts`
- Modify: `src/pages/ai.txt.ts`
- Modify: `src/pages/ai.json.ts`
- Modify: `src/pages/identity.json.ts`
- Modify: `src/pages/brand.txt.ts`
- Modify: `src/pages/faq-ai.txt.ts`
- Modify: `src/pages/developer-ai.txt.ts`
- Modify: `src/pages/robots-ai.txt.ts`
- Modify: `src/pages/llms.html.astro`

**注意：** 这些文件通过 `loadConfig()` 获得 `ConfigMap`，然后传给对应的 `render*` 函数。如果 render 函数的签名改为接受 `ConfigMap`，这些路由文件本身不需要更改——它们只是传递 config。

但 `llms.html.astro` 中直接访问 `config?.title` 等字段，需要改为 `config.get("site")?.title`。

- [ ] **Step 1: 更新 llms.html.astro**

```astro
const configMap = await loadConfig();
const site = getSite(configMap, Astro.site?.toString());
const llmsText = await renderLlmsTxt(configMap, site);
const siteData = configMap.get("site") ?? {};
const title = (siteData as any).title || "Blog";
const description = (siteData as any).description || "";
const lang = (siteData as any).lang || "zh-CN";
```

---

### Task 7: 更新 ai-discovery 中的 i18n 辅助函数

**目标：** 之前 `t(config, zh, en)` 需要改为 `t(lang, zh, en)` 或直接传字符串。

- [ ] **Step 1: 修改 `t` 和 `isZh` 函数**

```typescript
/** 判断字符串语言 */
export function isZh(lang: string): boolean {
    return lang.startsWith("zh");
}

/** 返回本地化文本 */
export function t(lang: string, zh: string, en: string): string {
    return isZh(lang) ? zh : en;
}
```

- [ ] **Step 2: 更新所有调用 `t` 的地方，从 `t(config, zh, en)` 改为 `t(lang, zh, en)`**

需要遍历 ai-discovery.ts 中的所有 `t(config, ...)` 调用并替换。

---

### Task 8: 构建验证

**目标：** 确认 stalux 构建成功，生成的 AI 文件内容正确。

- [ ] **Step 1: 运行构建**

```bash
cd /home/xingwangzhe/桌面/博客/stalux && npm run build
```

Expected: 构建成功无错误。

- [ ] **Step 2: 检查关键文件内容**

```bash
# 检查所有 AI 发现文件
for f in dist/llms.txt dist/ai.txt dist/identity.json dist/brand.txt dist/faq-ai.txt dist/developer-ai.txt dist/robots-ai.txt dist/ai.json dist/llms.html/index.html; do
  echo "=== $f ($(wc -c < $f) bytes) ==="
  head -5 $f
  echo
done
```

- [ ] **Step 3: 检查导航、页脚等页面组件是否正常渲染**

```bash
# 检查 dist/ 中是否有常规页面
ls dist/*/index.html | head -10
```

---

### Task 9: 迁移到 staluxmyblog

**目标：** 将同样的拆分模式应用到 staluxmyblog。

- [ ] **Step 1: 复制 config/ 目录**

```bash
cp -r /home/xingwangzhe/桌面/博客/stalux/stalux/config/ /home/xingwangzhe/桌面/博客/staluxmyblog/stalux/config/
```

- [ ] **Step 2: 更新每个 .yml 文件内容以匹配 staluxmyblog 的配置值**

需对比现有 staluxmyblog/config.yml 中每个 section 的值。

- [ ] **Step 3: 复制 src/content.config.ts 中的 config 集合定义**

- [ ] **Step 4: 复制 src/utils/ai-discovery.ts**

- [ ] **Step 5: 复制所有路由文件和组件文件的修改**

- [ ] **Step 6: 构建并验证**

---

### Task 10: CodeGraph 重新索引

**目标：** 更新两个项目的 codegraph 索引，确保代码探索可用。

- [ ] **Step 1: 索引 stalux**

```bash
codegraph index /home/xingwangzhe/桌面/博客/stalux
```

- [ ] **Step 2: 索引 staluxmyblog**

```bash
codegraph index /home/xingwangzhe/桌面/博客/staluxmyblog
```

---

## 影响范围总结

| 文件 | 改动类型 | 影响程度 |
|------|---------|---------|
| `stalux/config.yml` | 删除（被替换） | — |
| `stalux/config/*.yml` × 10 | 新建 | — |
| `src/content.config.ts` | 重写 config 集合定义 | 核心变更 |
| `src/utils/ai-discovery.ts` | 重写类型和函数 | 大改 |
| `src/pages/llms.html.astro` | 小改 config 访问 | 中 |
| `src/layouts/Stalux.astro` | 改 config 访问模式 | 中 |
| `src/components/stalux/layout/head.astro` | 改 config 访问模式 | 中 |
| `src/components/stalux/layout/PostLayout.astro` | 改 config 访问模式 | 小 |
| `src/components/stalux/analytics/*.astro` × 3 | 改 config 访问模式 | 小 |
| `src/components/stalux/footer/*.astro` × 2 | 改 config 访问模式 | 小 |
| `src/components/stalux/layout/listPage.astro` | 改 config 访问模式 | 小 |
| `src/pages/*.astro` × 8 | 改 config 访问模式 | 小 |
| `src/pages/*.txt.ts` × 9 | 大多无需改（委托 ai-discovery） | 无~小 |
| `staluxmyblog` 对应文件 | 复制 stalux 变更 | 大（批量） |
