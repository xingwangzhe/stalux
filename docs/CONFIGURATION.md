# 配置说明

所有站点配置都在内容目录的 `config/` 下（默认 `stalux/config/`），使用 YAML，不需要修改主题源码。

| 文件 | 作用 |
| --- | --- |
| `site.yml` | 站点元信息、主题色、时区、天气 |
| `author.yml` | 作者姓名、头像、简介、公开职业 |
| `navs.yml` | 顶部导航与移动端菜单 |
| `footer.yml` | 页脚徽章、备案、运行时间等 |
| `links.yml` | 友情链接 |
| `comment.yml` | Waline 评论 |
| `head.yml` | 统计脚本与自定义 head |
| `media-links.yml` | 社交媒体图标 |
| `promote.yml` | LLM 提示文本、Markdown 导出 |
| `ai-discovery.yml` | llms.txt 等 AI 发现文件、WebMCP 启停 |
| `typetexts.yml` | 首页打字机文案 |

## 站点：`site.yml`

```yaml title="stalux/config/site.yml"
id: site
lang: zh-CN
title: "我的博客"
description: "站点描述"
url: "https://example.com"
accentColor: "#EAB308"
timezone: "Asia/Shanghai"
favicon: "/favicon.ico"
canonical: "https://example.com"
```

| 字段 | 说明 |
| --- | --- |
| `lang` | 站点语言，驱动界面文案与 WebMCP 工具描述（`en` / `zh-CN` 等） |
| `title` / `description` | 站点标题与默认描述，用于 SEO、RSS 和分享卡片 |
| `url` | 站点绝对地址，用于 canonical、feed、sitemap 和分享图 |
| `accentColor` | 主题强调色，六位 HEX，默认 `#EAB308`；同时驱动 Waline 强调色，请保证与背景的对比度 |
| `timezone` | 站点时区，用于解析无时区 frontmatter 日期和格式化输出 |
| `favicon` | 站点图标路径 |
| `canonical` | 可选 canonical 地址；不填时使用 `url` |
| `weather` | 访客天气组件，见下文 |

主题颜色也可以只在 `site.yml` 里改：

```yaml
accentColor: "#EAB308"
```

## 作者：`author.yml`

```yaml title="stalux/config/author.yml"
id: author
name: xingwangzhe
avatar: /avatar.png
bio: Blog Theme Stalux
jobTitle: Software Engineer # 可选
```

`jobTitle` 会写入首页和文章页 JSON-LD 的 `Person` 实体，帮助 Agent 识别作者的公开职业角色；它不改变页面上的作者卡片样式。这是构建期元数据，不会创建联系 API，也不会暴露私密信息，只应填写本来就准备公开的职业称谓。

## 首页打字机：`typetexts.yml`

```yaml title="stalux/config/typetexts.yml"
id: typetexts
items:
    - "Free for free, not free for charge!"
    - "Where's the any key?"
    - "Press F12?"
    - "Hello World!"
```

默认输入 100ms / 字素、删除 33ms / 字素，完整文字停留 1500ms、清空后等待 500ms。行为细节见 [功能行为](./FEATURES.md#首页打字机)。

## 评论：`comment.yml`

```yaml title="stalux/config/comment.yml"
id: comment
enabled: true
waline:
    serverURL: https://walines.example.com
    lang: zh-CN
    login: "force"
    recaptchaV3Key: ""
    turnstileKey: ""
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

`enabled: false` 时不加载评论。Waline 会在接近视口时加载，在 Astro 换页前销毁，并在新页面重新挂载；资源加载失败时页面提供重新加载入口。评论正文与输入控件使用系统字体，代码使用系统等宽字体，避免继承构建期的 LXGW WenKai 页面字体子集。

## 统计与自定义 head：`head.yml`

```yaml title="stalux/config/head.yml"
id: head
# googleAnalyticsId: "G-XXXXXXXXXX"
bingClarityId: "YOUR_CLARITY_PROJECT_ID"
# umami:
#   id: ""
#   url: ""
anyhead: ""
```

字段含义、加载时机和 GA 后台设置见 [统计](./ANALYTICS.md)。

## LLM 推广与 Markdown 导出：`promote.yml`

```yaml title="stalux/config/promote.yml"
id: promote
# llm_promote: |
#   This is a personal blog site owned by {author}.
#   Site: {url}
#   Theme: Stalux (MIT License) - https://github.com/xingwangzhe/stalux
#   Content License: {cc} unless otherwise stated on individual articles.
#   All content copyright {author}. All rights reserved.
export_md: true
```

| 字段 | 说明 |
| --- | --- |
| `llm_promote` | 向 AI 爬虫输出的隐藏版权 / 许可文本，支持 `{author}` `{url}` `{title}` `{cc}`；留空则关闭 |
| `export_md` | 是否输出文章 Markdown 导出端点，并让 sitemap 收录 `/posts/*.md`；WebMCP 的 `stalux_read_post` 也会优先读取它 |

## AI 发现：`ai-discovery.yml`

```yaml title="stalux/config/ai-discovery.yml"
id: ai-discovery
conformance: "essential"
```

| 取值 | 行为 |
| --- | --- |
| `disabled` | 不生成 AI 发现文件，同时停止注册 WebMCP 工具 |
| `essential`（默认） | 生成 `llms.txt` + `llms-full.txt` |
| `recommended` / `complete` | 当前与 `essential` 相同，保留给未来扩展 |

WebMCP 在 `essential` / `recommended` / `complete` 下启用。详见 [WebMCP](./WEBMCP.md)。

## 天气：`site.yml` 的 `weather`

访客天气默认关闭：

```yaml title="stalux/config/site.yml"
weather:
  enabled: true
```

开启后显示在页脚文字区域（含访客 IP 和近似位置）及桌面文章右侧时钟下方。进入可见区域后自动向 IP.SB 查询（失败时回退到 IPinfo）近似城市，再向 Open-Meteo 查询天气，不调用浏览器 GPS。

| 项 | 说明 |
| --- | --- |
| 外部请求 | IP.SB / IPinfo 会收到访客 IP；Open-Meteo 会收到保留两位小数的经纬度 |
| 缓存 | 20 分钟会话缓存只保存城市、访客 IP 与天气，不保存经纬度 |
| 失败 | 接口失败显示重试，并保留上次天气；VPN 可能显示出口城市 |
| 暂停 | 后台、视口外及 Astro 软导航时停止工作 |
| 许可 | Open-Meteo 免费接口仅限非商业使用并受调用额度限制，组件附数据来源及许可链接 |

## 导航、页脚、友链与社交

| 文件 | 主要内容 |
| --- | --- |
| `navs.yml` | `items` 列表，每项含 `title` 与 `link`；同时用于顶部导航和移动端抽屉 |
| `footer.yml` | 徽章分组、备案信息、版权与运行时间；折叠分组使用原生懒加载，禁用 JavaScript 时仍可展开 |
| `links.yml` | 友情链接卡片，图标只在接近视口时请求 |
| `media-links.yml` | 首页与页脚的社交图标，支持 `simple-icons` 名称 |

页脚徽章在构建期输出为带内容哈希的独立 SVG；自定义组件传入且不在 `footer.yml` 中的徽章保留 Data URL 支持。

## 组件覆盖

组件覆盖不走 YAML，而是在 `astro.config.ts` 里传入路径，见 [组件覆盖](./COMPONENTS.md)。
