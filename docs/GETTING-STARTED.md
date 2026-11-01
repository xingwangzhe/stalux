# 快速开始

Stalux 同时提供两种使用方式，功能一致：

| 模式 | 适用场景 | 升级方式 |
| --- | --- | --- |
| npm 插件（推荐） | 已有 Astro 项目，或希望主题依赖独立升级 | `bun add @xingwangzhe/stalux@latest` |
| 源码模板 | 想直接修改主题源码、做二次开发 | `git pull` 后 `bun install` |

## 环境要求

| 项 | 要求 |
| --- | --- |
| Node.js | `>= 26`（见 `package.json` 的 `engines`） |
| Astro | `^7.4.4`（主题声明为 peerDependency，插件模式会自动安装） |
| 包管理器 | 推荐 Bun；仓库和 EdgeOne 构建使用 Bun 1.4.4 |
| 站点输出 | `output: "static"`，不需要 SSR 适配器 |

## 插件模式（推荐）

### 1. 创建项目并安装主题

```bash
bun create astro                    # 选择 minimal 空模板
cd myblog
bun add @xingwangzhe/stalux         # 所有主题依赖自动包含
bunx stalux init                    # 生成 stalux/ 内容目录
```

`stalux init` 只生成 `stalux/` 下的内容配置和示例文章，不会覆盖已有的 `package.json`、`astro.config.ts`、`src/content.config.ts`；已存在的文件也不会被覆盖。

### 2. 配置 `astro.config.ts`

```ts title="astro.config.ts"
import { defineConfig } from "astro/config";
import stalux from "@xingwangzhe/stalux";

export default defineConfig({
    output: "static",
    site: "https://example.com",
    integrations: [stalux({ contentDir: "stalux" })],
});
```

所有插件由 Stalux 集成默认打包注入，**无需手动配置**：

| 插件 | 默认行为 |
| --- | --- |
| Markdown | 自动注入 Mermaid（MDAST 识别 + HAST/SVG 渲染）、数学公式（Temml → MathML）、字数统计 / 特性标记、PhotoSwipe 灯箱到默认 `satteri()` processor；math / frontmatter / gfm / 智能标点默认开启 |
| Sitemap | 构建后生成 `/sitemap.xml`；单文件时复制 `sitemap-0.xml`，多文件时复制索引以保留完整 URL；`promote.export_md: true` 时收录已发布文章的 `/posts/*.md` 导出端点，默认过滤其它页面的 Markdown 镜像端点 |
| Expressive Code | 自动打包，默认启用代码块行号 |

如需自定义或关闭内置集成：

```ts title="astro.config.ts"
integrations: [
    stalux({
        contentDir: "stalux",
        sitemap: { filter: (page) => page.startsWith("https://example.com/posts/") },
        expressiveCode: { themes: ["dark-plus"], useDarkModeMediaQuery: false },
    }),
];
```

`sitemap: false`、`expressiveCode: false` 可分别关闭对应集成。若消费方把 `markdown.processor` 换成非 satteri processor，主题只会打 warning 并跳过 Markdown 插件注入，math / PhotoSwipe / 字数统计会失效。

### 3. 创建内容集合

```ts title="src/content.config.ts"
import { defineCollections } from "@xingwangzhe/stalux/schemas/collections";

export const collections = defineCollections({ contentDir: "stalux" });
```

### 4. 启动开发服务器

```bash
bun run dev   # 默认 http://localhost:4321
```

## 源码模板模式

```bash
git clone https://github.com/xingwangzhe/stalux.git my-blog
cd my-blog
bun install
bun run dev
```

模板仓库自身就是完整站点，`stalux/` 下带有示例配置、文章、关于页和随想。

## 内容目录结构

```text
stalux/
├── config/               # YAML 配置
│   ├── site.yml          # 站点元信息
│   ├── author.yml        # 作者信息
│   ├── navs.yml          # 导航菜单
│   ├── footer.yml        # 页脚配置
│   ├── links.yml         # 友情链接
│   ├── comment.yml       # 评论配置
│   ├── head.yml          # 统计和自定义 head
│   ├── media-links.yml   # 社交媒体
│   ├── promote.yml       # LLM 推广 / Markdown 导出
│   ├── ai-discovery.yml  # AI 发现文件
│   └── typetexts.yml     # 首页打字机文本
├── posts/                # 博客文章（Markdown）
├── about/index.md        # 关于页面
└── words/                # 随想 / 语录
```

各配置字段见 [配置说明](./CONFIGURATION.md)。

## 开发命令

| 命令 | 作用 |
| --- | --- |
| `bun install` | 安装依赖 |
| `bun run dev` | 开发服务器，默认 `localhost:4321` |
| `bun run build` | 生产构建到 `dist/` |
| `bun run preview` | 预览构建产物 |
| `bun run check:fix` / `bun run check` | 格式化 / 格式检查（Biome） |
| `bun run lint` / `bun run lint:fix` | Lint |
| `bun run astro:check` | Astro 类型检查 |
| `bun run test:run` | 单元测试（`bun run test` 是 watch 模式，不会退出） |
| `bun run validate` | 完整质量门禁：格式、类型、knip、覆盖率、构建、CLI |
| `bun run init` | 在当前目录初始化 `stalux/` 内容模板 |

> 本机沙箱若拦截 Astro 清理 `dist/.prerender/.vite`（`SAFE_DELETE_BULK_CONFIRM_REQUIRED`），构建前加 `CODEBUDDY_SAFE_DELETE_ENABLED=0`。

## 开发诊断日志

Stalux 使用 Astro 官方 logger 输出集成、内容加载和页面生成日志。普通模式保留初始化摘要、警告和错误；详细模式记录配置与路由注入、组件覆盖、字体分片缓存、Markdown 分析缓存、内容统计、feed、资源同步和 Pagefind 阶段信息。

```bash title="Stalux 开发诊断"
bun run dev:debug
bun run build:debug
# 消费主题的项目也可以直接运行：
STALUX_DEBUG=1 bun run dev --verbose
STALUX_DEBUG=1 bun run build --verbose
# 只静默 Astro 日志；独立 verify:build 的验收结果仍会输出：
bun run astro -- build --silent
```

| 日志位置 | 行为 |
| --- | --- |
| 终端 | 集成使用 `logger.fork("stalux/模块")`；页面使用 `Astro.logger`，端点和 loader 显式传递上下文 logger。支持 Astro 的日志级别、自定义 destination 和 `--silent`。 |
| 浏览器控制台 | 独立轻量封装，统一 `[stalux/模块]` 前缀。详细信息只在开发模式且 `STALUX_DEBUG=1` 或 `--verbose` 时输出；生产构建只保留警告和错误。 |
| 内容诊断 | `getStaticPaths()` 没有运行时 logger，纯计算函数由上层或 Astro 报告异常；数学错误沿 Sätteri 的诊断机制报告，避免重复错误。 |

浏览器日志覆盖页面挂载 / 清理、软导航、搜索、灯箱、评论、WebMCP、背景和外部统计脚本。日志不会上传到服务端，也不会新增遥测；不主动记录搜索词、文章正文、完整配置或凭据。错误保留模块、原因和堆栈，并过滤常见 token、密码和 URL 查询参数；第三方错误可能仍含业务信息，分享前请检查。

Astro 7.3 的集成 `logger.debug()` 使用官方 `DEBUG/--verbose` 通道，不进入自定义 JSON destination；`info/warn/error` 和渲染阶段诊断走配置的 destination。需要静默运行时不要同时启用 `--verbose` 或 `DEBUG`。

耗时只写入日志，不写入静态页面或缓存键。正常构建与详细构建切换后可能需要一次重新构建，同一模式连续构建保持确定性。使用 `astro dev --background` 的消费项目可通过 `astro dev logs` 查看终端日志。
