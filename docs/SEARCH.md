# 搜索

Stalux 构建后生成 Orama 混合索引。搜索弹窗和 WebMCP 按需加载同一份静态索引。

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

`searchKeywords` 默认空数组。这些关键词会公开写入 HTML 和静态搜索索引，**不应用于保存私密内容**。

## 查询处理与排序

默认启用 `searchCjk`。构建和查询共用 Orama 官方 `@orama/tokenizers/mandarin`、连续 CJK 字符的一字和相邻两字词项，以及英文技术词。Orama 混合模式使用 BM25 和本地字符特征向量召回候选，再用原文核对连续词。引号查询要求整句连续匹配。

`stalux({ searchCjk: false })` 关闭中文分词和字符词项。既有的 `stalux({ pagefind: false })` 仍可关闭索引生成。


搜索弹窗默认按文章发布时间从新到旧排序。关于页和短文列表等无文章发布时间的结果排在末尾。

## 加载与降级

| 情况 | 行为 |
| --- | --- |
| 索引加载 | 按需加载，无外部查询服务，不新增遥测 |
| 资源加载失败 | 可重试 |
| 无 JavaScript | 保留 `<noscript>` 样式回退 |

## 搜索界面

搜索弹窗使用 Orama 官方 `<orama-search-box>`。组件和索引都在打开弹窗时才加载。结果显示标题、命中摘录、发布时间、分类和标签，标题与摘录中的匹配词使用 `<mark>` 高亮。

## 搜索弹窗与 WebMCP

搜索弹窗和 WebMCP 的 `stalux_search_posts` 共享检索能力，但输出不同：弹窗返回页面结果，WebMCP 返回分页元信息与摘要。工具细节见 [WebMCP](./WEBMCP.md)。
