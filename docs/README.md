# Stalux 文档

README 只保留主题介绍、安装、使用和部署入口，细节都收在这里。

## 使用文档

| 文档 | 内容 |
| --- | --- |
| [快速开始](./GETTING-STARTED.md) | 环境要求、插件 / 模板两种安装方式、项目结构、开发命令、诊断日志 |
| [配置说明](./CONFIGURATION.md) | `stalux/config/*.yml` 全量说明，accentColor、作者、天气、评论、AI 发现等 |
| [功能行为](./FEATURES.md) | 打字机、图片图注、灯箱、代码主题、Waline、软导航、背景等运行时行为 |
| [字体](./FONTS.md) | 中文按页字体子集、缓存、字体许可 |
| [搜索](./SEARCH.md) | Pagefind + CJK 子串索引、`searchKeywords`、降级行为 |
| [统计](./ANALYTICS.md) | Google Analytics、Clarity、Umami、Vercount 配置与注意事项 |
| [部署](./DEPLOYMENT.md) | 静态构建、EdgeOne、缓存目录、构建产物 |
| [性能与加载](./PERFORMANCE.md) | 按可见性加载、首屏 CSS、预加载、背景图、现代 JavaScript |
| [文章分享卡片](./SOCIAL-CARDS.md) | `og:image` / `cover` 优先级、黑白卡片与彩色封面、Satori 生成、缓存 |
| [WebMCP](./WEBMCP.md) | 页面内 AI 工具、数据源、启停、polyfill |
| [组件覆盖](./COMPONENTS.md) | Starlight 风格的组件覆盖系统 |
| [许可](./LICENSING.md) | 主题 MIT、字体 OFL / GUST 许可范围 |

## 维护文档

| 文档 | 内容 |
| --- | --- |
| [模块与视图过渡](./MOTION.md) | 55 类可见模块与 Swup / View Transition 设计契约 |
| [生命周期与静态接口](./RUNTIME.md) | Astro 生命周期、AST 后处理、缓存与静态端点 |
| [样式维护](./STYLING.md) | UnoCSS 结构、生产类名压缩、布局与验收清单 |
| [reports](./reports/) | 历史样式精简报告 |
| 日期化报告 | `runtime-performance-*.md`、`view-transitions-*.md`、`cjk-search-*.md` 等，按主题归档 |

## 外部资源

| 资源 | 地址 |
| --- | --- |
| 在线演示 | [stalux.needhelp.icu](https://stalux.needhelp.icu) |
| 问题反馈 | [GitHub Issues](https://github.com/xingwangzhe/stalux/issues) |
| Astro 文档 | [docs.astro.build](https://docs.astro.build) |
| Astro 文档 MCP | `https://mcp.docs.astro.build/mcp`（开发期用，与博客前端 WebMCP 不同） |
