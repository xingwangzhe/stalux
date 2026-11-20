# 搜索

Stalux 从 Astro 内容集合生成 Orama PT15 索引。开发期按需响应 `/orama/index.bin`，生产构建把同一路由预渲染成静态文件。搜索弹窗和 WebMCP 都使用这份索引。

## 配置与升级

| Stalux 1.70 配置 | 行为 |
| --- | --- |
| 省略 `orama` 或设为 `true` | 启用 Orama，默认开启 CJK |
| `orama: false` | 关闭索引、搜索按钮和 WebMCP 全文查询。WebMCP 仍可查元数据和 Markdown |
| `orama: { cjk: false }` | 保留搜索，关闭中文分词和字符词项 |

从 1.70 之前的版本升级时，把 `pagefind: false` 改为 `orama: false`，把 `searchCjk: false` 改为 `orama: { cjk: false }`。旧键会触发配置错误。原有 `searchKeywords` frontmatter 继续可用。

自 v1.75 起，搜索结果和按文章读取直接使用 Orama 命中记录。文章 ID 存在索引的 `post` 字段中，文章 HTML 无需搜索专用属性。

## 索引内容

| 字段 | 是否参与检索 |
| --- | --- |
| 标题 | 是 |
| 摘要（`desc`） | 是 |
| 标签 | 是 |
| 分类 | 是 |
| 正文 | 是 |
| `searchKeywords` | 是，来自文章 frontmatter 的可选字符串数组 |

```yaml title="文章 frontmatter 示例"
searchKeywords: [别名, 缩写]
```

`searchKeywords` 默认空数组。这些关键词会公开写入静态搜索索引，**不应用于保存私密内容**。

## 查询处理与排序

默认启用 `orama.cjk`。构建和查询共用 Orama 官方 `@orama/tokenizers/mandarin`、连续 CJK 字符的一字和相邻两字词项，以及英文技术词。Orama 混合模式使用 PT15 全文索引和本地字符特征向量召回候选，再用原文核对连续词。引号查询要求整句连续匹配。

搜索弹窗默认按文章发布时间从新到旧排序。关于页和短文列表等无文章发布时间的结果排在末尾。

## 加载与降级

| 情况 | 行为 |
| --- | --- |
| 索引加载 | 按需加载，无外部查询服务，不新增遥测 |
| 资源加载失败 | 可重试 |

## 搜索界面

搜索弹窗使用 Orama 官方 `<orama-search-box>`。组件和索引都在打开弹窗时才加载。结果显示标题、命中摘录、发布时间、分类和标签，标题与摘录中的匹配词使用 `<mark>` 高亮。

## 搜索弹窗与 WebMCP

搜索弹窗和 WebMCP 的 `stalux_search_posts` 共享检索能力，但输出不同：弹窗返回页面结果，WebMCP 返回分页元信息与摘要。工具细节见 [WebMCP](./WEBMCP.md)。
