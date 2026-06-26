---
title: 告别 Pagefind，用 Orama 实现静态博客的全文搜索
abbrlink: "orama-search-replace-pagefind"
date: "2026-06-26 18:30:00"
desc: Pagefind 的中文分词不尽如人意，而且 Dev 模式下搜索完全不可用。本文介绍如何用 Orama 替代 Pagefind，从 Astro Content Collections 直接建索引，实现 Dev/Build 双模式可用的中文全文搜索。
tags: [Astro, Orama, 搜索, Pagefind, 中文分词]
categories: 技术
---

> **本文部分内容（Pagefind vs Orama 原理分析）存在 AI 辅助生成**

最近我把博客的搜索从 `astro-pagefind` 换成了 Orama，过程踩了不少坑。本文记录一下完整的方案和踩坑经验。

## 为什么换掉 Pagefind

Pagefind 本身是个优秀的静态搜索方案——构建时生成碎片化索引，按需加载。但用了这么长时间，几个问题越来越不能忍：

**Dev 模式下搜索不可用**。这是最大的痛点。Pagefind 只在 `astro build` 时生成索引，`astro dev` 下搜索框打了字永远返回空结果。每次想在本地调搜索样式，都得先 build 一遍，非常影响效率。

**中文分词不够好**。Pagefind 对中文有一定支持，但实际体验中分词精度不足。比如搜"公安"，有很多时候搜不到。

**需要 HTML 标注**。Pagefind 依赖 `data-pagefind-body` 之类的属性来控制索引范围，对于高度自定义的 Astro 组件来说，多了一层心智负担。

## 选型：为什么是 Orama

[Orama](https://docs.orama.com/) 是一个运行在浏览器里的全文搜索引擎，核心包 `@orama/orama` 。几个关键能力打动了我：

| 特性                            | 说明                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| **纯客户端运行**                | 索引是一个 JSON 文件，浏览器 fetch 后全部在本地搜索，零后端依赖。                          |
| **30+ 语言支持**                | `@orama/tokenizers/mandarin` 专门做中文分词，配合 `@orama/stopwords/mandarin` 停用词过滤。 |
| **从数据源直接建索引**          | 不需要像 Pagefind 那样抓取渲染后的 HTML，直接从 Astro 的 Content Collections 拿数据。      |
| **搜索权重可配置**              | `boost` 参数让标题匹配高于正文匹配，搜索结果更符合直觉。                                   |
| **`@orama/highlight` 精准高亮** | 能定位关键词在全文中的位置，摘要自动居中。                                                 |

## 底层对比：Pagefind 的分片索引 vs Orama 的 BM25 全文检索引擎

介绍完选型理由，来深入扒一扒这两种搜索方案在分词、索引和评分上的根本差异。以下所有分析都基于两边的**公开源码**——Pagefind 的 Rust 核心（[GitHub](https://github.com/CloudCannon/pagefind)）和 Orama 的 TypeScript 实现（[GitHub](https://github.com/oramasearch/orama)）。

说实话，不看源码之前我也有很多想当然的理解，看了之后才发现事实跟我想的差别不小。

---

### 一个重要的前提：两者本身都不带中文分词

先说清楚一个很多人（包括之前我）容易忽略的事实：

**Pagefind 和 Orama 本质上都是搜索引擎内核**——它们负责索引的构建、存储、搜索和打分，但**中文文本的分词本身不是它们的职责**。中文分词需要额外接入专门的分词包。

| 方案     | 中文支持方式                                                       |
| -------- | ------------------------------------------------------------------ |
| Pagefind | 编译期开启 `extended` feature 来启用 `charabia`（底层 `jieba-rs`） |
| Orama    | 额外安装 `@orama/tokenizers/mandarin` 包（底层 `Intl.Segmenter`）  |

没有这些额外包，两者对中文的处理方式完全一致：按空白符和标点拆分。这对英文没问题，对中文就是**灾难**。

---

### Pagefind 的分词逻辑

**Pagefind 默认的"分词"** 涉及两个文件。`pagefind/src/fossick/splitting.rs` 里的 `get_indexable_words` 函数处理单个词单元的归一化：

| #   | 处理步骤         | 说明                                                                                                                |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | **字母数字过滤** | 遍历每个字符，只保留 `is_alphanumeric()` 为 true 的（中文汉字满足这个条件）                                         |
| 2   | **小写化**       | 对非 ASCII 大写字母调用 `to_lowercase()`                                                                            |
| 3   | **词干提取**     | 如果传入了 stemmer（语种相关），对去变音符号后的词做词干提取                                                        |
| 4   | **复合词拆分**   | 通过 `convert_case` crate 的 `Case::Lower` 拆解驼峰、蛇形、连字符命名（如 `camelCase`、`snake_case`、`kebab-case`） |

但真正决定"怎么把一段文本切成一个个词"的是**调用方** `pagefind/src/fossick/mod.rs` 里的 `parse_digest` 函数——它先用 `split_whitespace()` 按空白符切分，再把切出来的每个片段交给 `get_indexable_words` 处理。也就是说，Pagefind 默认的"分词"就是 `split_whitespace()`——英文按空格拆，西班牙语按空格拆，中文也按空格拆。一段没有空格的连续中文"全文搜索方案"，在索引里就是**一个完整的 token**。

> 我翻源码之前一直以为 Pagefind 对中文做了 bigram（二元组）切分，翻了 `splitting.rs` 之后确认：**没有**。它不做任何字符级 n-gram，也没有 ICU 的中文分词。中文汉字只是通过了 `is_alphanumeric()` 的检查被保留下来，但边界识别全靠空格。

这解释了为什么中文搜索体验差——不是匹配不到，而是匹配方式完全不对。`find_word_extensions` 做的是**前缀匹配**（`key.starts_with(term)`），这意味着：

| 场景                             | 结果   | 原因                                       |
| -------------------------------- | ------ | ------------------------------------------ |
| 搜"公安"匹配"公安局"、"公安机关" | 匹配   | 它们**以"公安"开头**                       |
| 搜"安全"匹配"公共安全系统"       | 不匹配 | 索引里是整词"公共安全系统"，不以"安全"开头 |
| 搜"全系"匹配                     | 不匹配 | 前缀匹配不支持**中间**和**尾部**的子串     |

这种匹配机制对于中文来说是完全不可控的：你的输入词必须是目标词的前缀才能命中，而中文恰恰是一种不以空格分界的语言。

**Pagefind 确实有一个可选的 CJK 功能**，在 `Cargo.toml` 中以 `extended` feature 声明：

```toml title="Cargo.toml"
[features]
extended = ["dep:charabia"]

[dependencies]
charabia = { version = "0.9.3", optional = true, default-features = false, features = ["chinese","japanese","thai"] }
```

这个 feature 启用 `charabia` crate 做中日泰分词。而 `charabia` 的 Chinese 分词（见其 [Cargo.toml](https://raw.githubusercontent.com/meilisearch/charabia/main/charabia/Cargo.toml)）底层依赖的是 `jieba-rs` v0.8.1，通过 `chinese-segmentation` feature 激活。

**jieba-rs 的分词算法**（源码见 `jieba.rs` 和 `sparse_dag.rs`）：

| #   | 步骤           | 说明                                                                                                            |
| --- | -------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | **前缀字典**   | 使用 **Double-Array Trie（Cedar）** 存储词频词典，支持非常快的前缀查找                                          |
| 2   | **构建 DAG**   | 对输入句子中每个位置，在前缀字典中查找所有可能的词，构建一个有向无环图                                          |
| 3   | **动态规划**   | 从句子末尾向前遍历，计算每个位置的最大对数概率路径：`route[i] = max( log(freq(word[i:j])/total) + route[j+1] )` |
| 4   | **按路径分割** | 从位置 0 按最优路径向前推进，取出分词结果                                                                       |

`Pagefind` 调用 `charabia` 时禁用了 HMM（`hmm: false`），所以**无法处理未登录词（OOV）**——词典里没有的词会被切成单个字。这个词典本身来自人民日报等语料库的词频统计，覆盖了绝大多数常见中文词汇。

在 `parse_digest` 函数中，当 `lang` 以 `zh`、`ja` 或 `th` 开头时，会用 `seg.segment_str()`（来自 charabia）对文本做词汇级切分。

但问题是：

| 问题                          | 说明                                                                     |
| ----------------------------- | ------------------------------------------------------------------------ |
| **不在默认构建中**            | 这个 feature 不在默认构建中（default = `["serve"]`）                     |
| **预编译二进制不带 extended** | `astro-pagefind` 等 npm 包下载的是预编译的默认二进制                     |
| **索引与搜索分词不一致**      | 源码明确说浏览器端 WASM 没有同样的分词器，索引时切了词搜索时可能匹配不上 |

> "Currently hesitant to run segmentation during indexing that we can't also run during search, since we don't ship a segmenter to the browser."

> 翻译：**浏览器端的 WASM 没有同样的分词器**，索引时切了词，搜索时客户端可能无法用同样的方式切分查询词，导致匹配不上。所以这个功能处于一种尴尬的半成品状态。

**Orama 这边同样需要额外包**。`@orama/tokenizers/mandarin` 就是那个专门的中文分词包，它的核心代码只有几十行：

```typescript title="tokenizer.ts"
const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });

function tokenize(text: string): string[] {
    const segments = segmenter.segment(text);
    const tokens: string[] = [];
    for (const segment of segments) {
        if (segment.isWordLike) {
            tokens.push(segment.segment);
        }
    }
    return tokens;
}
```

底层依赖 **浏览器和 Node.js 内置的 `Intl.Segmenter`**，而 `Intl.Segmenter` 背后是 **ICU 的 `DictionaryBasedBreakIterator`**。

ICU 的中文分词走的是 **字典驱动的分词算法**，以最大匹配（Maximum Matching）为基础，配合更复杂的回溯和规则处理：

| #   | 步骤              | 说明                                                         |
| --- | ----------------- | ------------------------------------------------------------ |
| 1   | **Trie 词典查找** | 使用 Trie（前缀树）结构的**编译好的字典**，字典大小约 2MB    |
| 2   | **最长匹配**      | 从每个字符位置开始，在字典中查找**最长的匹配词**（最长优先） |
| 3   | **词频破平**      | 当多个词在相同位置重叠时，用**词频权重**来破平               |
| 4   | **单字回退**      | 字典里找不到的字符保留为单个字                               |

这个算法的分词准确率与 ICU 版本相关，在不额外加载词典的情况下表现稳定，优势在于**不需要额外加载字典文件**——字典已经在浏览器和 Node.js 运行环境里编译好了。

关键优势：**`Intl.Segmenter` 是同一套 API，服务端（Node.js）构建索引时和浏览器查询时分词表现完全一致**。不会出现 Pagefind extended 那种索引端用 charabia/jieba 分词、浏览器端用不了同款分词器的不一致问题。

所以回到核心问题：两种方案对中文的感知能力完全不在一个量级上。

| 场景                              | Pagefind（默认） | Pagefind（extended）               | Orama（mandarin tokenizer）      |
| --------------------------------- | ---------------- | ---------------------------------- | -------------------------------- |
| "搜索" 是否匹配文章中的"搜索引擎" | 不匹配           | 匹配                               | 匹配                             |
| 索引时如何拆分中文                | 空格/标点分界    | jieba-rs (DAG+DP)                  | ICU DictionaryBasedBreakIterator |
| 搜索时如何拆分中文                | 空格/标点分界    | 空格/标点分界（无 charabia）       | ICU DictionaryBasedBreakIterator |
| 索引与查询分词一致                | 是               | 不一致                             | 是                               |
| 底层词典                          | 无               | Double-Array Trie（Cedar）词频词典 | Trie 编译词典（~2MB，内置）      |
| 未登录词处理                      | N/A              | HMM 禁用                           | 无                               |
| 歧义消解                          | N/A              | DP 全局最优路径                    | 字典匹配+词频破平                |

---

### 索引结构：碎片化分片 vs 单文件倒排索引

**Pagefind 的索引组织**（源码见 `pagefind/src/index/mod.rs`）：

| #   | 步骤           | 说明                                                                                            |
| --- | -------------- | ----------------------------------------------------------------------------------------------- |
| 1   | **提取词数据** | 解析 HTML 得到每个页面的 `word_data`（词→位置映射）和 `meta_word_data`（元数据字段中的词）      |
| 2   | **分片**       | 所有页面的词表合并后，按**位置总数**（`locs + meta_locs + 1 per page`）切分成多个 chunk         |
| 3   | **编码词表**   | 每个 chunk 包含按字母序排列的词，每个词下是页号（delta 编码）和位置（delta 编码，复合权重编码） |
| 4   | **序列化**     | chunk 用 CBOR 二进制格式序列化，输出为 `.pf_index` 文件                                         |
| 5   | **元数据索引** | `MetaIndex`（CBOR）记录每个 chunk 的起始词和结束词、分页信息、排序字段、可筛选字段              |

客户端搜索时，流程是：

| #   | 步骤           | 执行方 | 说明                                                                         |
| --- | -------------- | ------ | ---------------------------------------------------------------------------- |
| 1   | **传递查询词** | JS     | 把查询词传给 WASM 的 `request_indexes` 函数                                  |
| 2   | **定位 chunk** | WASM   | 根据查询词的前缀，在 `chunks` 元数据中查找需要加载哪些 chunk                 |
| 3   | **加载 chunk** | JS     | fetch 对应的 chunk 二进制文件，传入 `load_index_chunk`                       |
| 4   | **搜索打分**   | WASM   | 所有 chunk 加载完后，调用 `search` 做 BM25 打分、排序                        |
| 5   | **加载片段**   | JS     | 用结果中的 `page_hash` 加载对应的**页面片段**（JSON `fragment`）用于生成摘要 |

这个"先查元数据→再按需加载 chunk→再查 chunk 内部的倒排索引"的三层架构，设计初衷是让大型站点不用一次性下载所有索引数据。但对于中小博客，这层间接反而增加了搜索延迟。

**Orama 的索引组织**（源码见 `packages/orama/src/components/index.ts`）：

| 步骤             | 说明                                                                         |
| ---------------- | ---------------------------------------------------------------------------- |
| **建倒排索引**   | 每个 string 类型属性用 Radix Tree（基数树）存储词到文档 ID 的映射            |
| **记录评分参数** | 同步记录 `frequencies`、`tokenOccurrences`、`fieldLengths`、`avgFieldLength` |
| **序列化**       | 调用 `save()` 将完整索引序列化为一个 JSON 对象                               |
| **客户端加载**   | 浏览器 fetch 后用 `load()` 在内存中重建完整的 Radix Tree + 评分参数          |

Orama 没有分片，所有数据在一个 JSON 文件里。代价是首次加载需要下载整个索引（~4MB / gzip ~800KB），好处是之后的搜索全是内存操作，零网络往返。

---

### 搜索评分：两套 BM25 的实现对比

两边的排序算法都基于 BM25，但具体实现和可配置性差别很大。

**Pagefind 的评分**（源码见 `pagefind_web/src/search.rs` 的 `search_term` 和 `calculate_bm25_word_score`）：

| #   | 步骤          | 说明                                                                                                    |
| --- | ------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | **前缀扩展**  | 用 `find_word_extensions` 找到所有以查询词**为前缀**的索引词（如搜"search"匹配"searching"、"searcher"） |
| 2   | **词长惩罚**  | 对每个匹配词计算 `word_length_bonus`——词越长惩罚越大（高斯衰减）                                        |
| 3   | **位置合并**  | 对每个匹配词组合并**同一个位置的权重**（取最低权重，相同权重则叠加）                                    |
| 4   | **BM25 打分** | 对每个匹配词做 BM25 变体计算，带四个可调参数：                                                          |

| 参数              | 默认值 | 作用                                         |
| ----------------- | ------ | -------------------------------------------- |
| `term_similarity` | 1.0    | 控制词长差异的衰减速度                       |
| `term_saturation` | 1.4    | BM25 的 k1 参数                              |
| `page_length`     | 0.75   | BM25 的 b 参数                               |
| `term_frequency`  | 1.0    | 控制 BM25 的 TF 和原始加权词频之间的插值比例 |

Pagefind 的评分特别之处在于它对**元数据字段有独立的加权系统**：代码里 meta_weights 默认给 `title` 字段 5 倍权重，`description`、`image_alt` 等字段也有不同的权重。但这个配置是在 WASM 加载时设死的，不像 Orama 那样可以在搜索请求中动态指定。

**Orama 的评分**（源码见 `packages/orama/src/components/algorithms.ts` 的 `BM25` 函数）：

BM25 公式实现很标准，和维基百科上的定义一致：

```typescript title="algorithms.ts"
export function BM25(
    tf: number, // 词在文档中的频率
    matchingCount: number, // 包含该词的文档数
    docsCount: number, // 总文档数
    fieldLength: number, // 该文档字段长度
    averageFieldLength: number, // 平均字段长度
    { k, b, d }: Required<BM25Params>,
) {
    const idf = Math.log(1 + (docsCount - matchingCount + 0.5) / (matchingCount + 0.5));
    return (idf * (d + tf * (k + 1))) / (tf + k * (1 - b + (b * fieldLength) / averageFieldLength));
}
```

参数默认值：`k = 1.2`（词频饱和度）、`b = 0.75`（文档长度归一化）、`d = 0.5`

Orama 还在搜索结果排序上多了一层处理：`threshold` 参数控制匹配严格程度——`threshold = 0` 只返回包含**所有**查询词的结果，`threshold = 1` 返回包含**任意**查询词的结果，中间值表示覆盖率阈值。Pagefind 则没有这个机制——只要 `find_word_extensions` 找到了前缀匹配就会返回，没有"所有词必须匹配"的开关。

---

### 对比汇总

| 维度                   | Pagefind                                                  | Orama（本方案）                   |
| ---------------------- | --------------------------------------------------------- | --------------------------------- |
| **中文分词**（默认）   | 只按空格拆分，不做词汇切分                                | `Intl.Segmenter` 中文分词         |
| **中文分词**（可选项） | `charabia` 词典分词（extended feature）但索引和搜索不一致 | 同一 API 保证一致性               |
| **索引结构**           | 按位置数分片，CBOR 二进制，按需加载                       | 单 JSON 文件，全量加载            |
| **索引树**             | BTreeMap（有序映射）                                      | Radix Tree（基数树）              |
| **评分算法**           | BM25 变体 + 元数据独立加权 + 前缀匹配                     | 标准 BM25 + boost 加权 + 阈值控制 |
| **词位置编码**         | delta 编码 + 复合权重编码                                 | 不存储位置（仅 TF）               |
| **Dev 可用**           | 否                                                        | 是                                |
| **索引来源**           | 渲染后 HTML → `data-pagefind-body`                        | Content Collections 直读          |

补充一句：Orama 其实还有一个 `searchVector` 方法做向量嵌入搜索（用于 AI 语义搜索场景），但**本文的方案用不到**。我们用的是传统的 BM25 全文搜索，没有把文章转成 embedding——别误会。

---

### Orama 方案的代价

全量加载索引意味着首次搜索前需要下载 ~800KB（gzip）的数据。对于移动端弱网环境，这个体积可能需要优化（比如渐进式加载或者 Service Worker 缓存）。

---

## 踩坑：官方 Astro 插件不能用

Orama 确实有官方插件 `@orama/plugin-astro`，但装不上。

npm 上最新版 v3.1.18 的 `peerDependencies` 锁在 `astro: ^2.0.4`，而当前项目跑的是 Astro 7。即使 `--force` 强行装上，构建直接崩：

```text title="错误日志"
ENOENT: no such file or directory, mkdir '/.../%E6%A1%8C%E9%9D%A2/.../dist/assets'
```

根因是 Astro 5 改了 `IntegrationRouteData.distURL` 的类型，插件里的 `prepareOramaDb` 还在用旧 API 拿构建目录，路径中的中文被 URL 编码后透传给了 `mkdirSync`。

我去翻了 [GitHub issues](https://github.com/oramasearch/orama) ：

| Issue                                                                                         | 状态                       |
| --------------------------------------------------------------------------------------------- | -------------------------- |
| [#862](https://github.com/oramasearch/orama/issues/862) — 报告 Astro 5 不兼容                 | fix PR #870 **已合并**     |
| [#882](https://github.com/oramasearch/orama/issues/882) — 要求更新 peer dependency 到 Astro 5 | PR #885 **关闭了但没合并** |

也就是说代码修了一部分、peer dep 根本没更新。Astro 7 下仍然不可用。

结论：**手写 endpoint 是目前唯一的稳的方案**。

## 实现

### 1. 构建时生成索引

新建 `src/pages/search-index.json.ts`，作为 Astro 的静态端点：

```typescript title="src/pages/search-index.json.ts"
import { create, insertMultiple, save } from "@orama/orama";
import { createTokenizer } from "@orama/tokenizers/mandarin";
import { stopwords as mandarinStopwords } from "@orama/stopwords/mandarin";
import { getCollection } from "astro:content";
import removeMarkdown from "remove-markdown";

const schema = {
    id: "string",
    type: "string",
    title: "string",
    description: "string",
    content: "string",
    url: "string",
    date: "string",
    tags: "string[]",
} as const;

export async function GET() {
    const [posts, aboutPages, wordEntries] = await Promise.all([
        getCollection("posts", ({ data }) => !data.draft),
        getCollection("about"),
        getCollection("words", ({ data }) => !data.draft),
    ]);

    const documents = [];

    for (const post of posts) {
        const body = typeof post.body === "string" ? post.body : "";
        documents.push({
            id: `post-${post.data.abbrlink}`,
            type: "post",
            title: post.data.title,
            description: post.data.desc,
            content: removeMarkdown(body), // 清理 markdown 语法
            url: `/posts/${post.data.abbrlink}/`,
            date: post.data.date ?? "",
            tags: post.data.tags ?? [],
        });
    }

    // ... about 和 words 类似处理

    const db = create({
        schema,
        components: {
            tokenizer: createTokenizer({
                // 中文分词
                stopWords: mandarinStopwords, // 中文停用词
            }),
        },
    });
    insertMultiple(db, documents);
    const index = save(db);

    return new Response(JSON.stringify(index), {
        headers: { "Content-Type": "application/json" },
    });
}
```

关键设计：

| 设计要点          | 说明                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **并行读取**      | 用 `Promise.all` 并行读取多 collection                                                                                     |
| **清理 markdown** | `remove-markdown` 清理正文中的 `##`、`_text_`、`[link]()` 等语法                                                           |
| **中文分词**      | `createTokenizer({ stopWords })` 配置中文分词和停用词                                                                      |
| **原始正文来源**  | `post.body` 来自 Astro content collection 的 `retainBody: true` 配置（`content.config.ts` 中设置），是原始 markdown 字符串 |

### 2. 客户端搜索组件

改造 `src/components/stalux/common/search.astro`，保留原有模态框壳子，换掉内部 Pagefind 组件：

```html title="search.astro"
<script>
    import { create, load, search } from "@orama/orama";
    import { createTokenizer } from "@orama/tokenizers/mandarin";
    import { stopwords as mandarinStopwords } from "@orama/stopwords/mandarin";
    import { Highlight, highlightStrategy } from "@orama/highlight";

    const schema = {
        id: "string", type: "string", title: "string",
        description: "string", content: "string",
        url: "string", date: "string", tags: "string[]",
    } as const;

    async function initOrama() {
        const response = await fetch("/search-index.json");
        const data = await response.json();
        const instance = create({
            schema,
            components: {
                tokenizer: createTokenizer({
                    stopWords: mandarinStopwords,
                }),
            },
        });
        load(instance, data);
        return instance;
    }

    async function performSearch(query: string) {
        const db = await initOrama();
        const results = await search(db, {
            term: query,
            limit: 20,
            threshold: 0,    // 只返回包含所有查询词的文档
            properties: ["title", "description", "content", "tags"],
            boost: { title: 2, tags: 1.5 },
        });
        renderResults(results.hits, query);
    }

    function renderResults(hits, query) {
        for (const hit of hits) {
            const dHL = new Highlight({
                HTMLTag: "mark",
                strategy: highlightStrategy.PARTIAL_MATCH,
            });
            dHL.highlight(hit.document.content ?? hit.document.description, query);
            // trim(200) 自动居中到第一个匹配位置
            const snippet = dHL.positions.length > 0
                ? dHL.trim(200)
                : (dHL.HTML ?? "").substring(0, 200);
            // 设置 innerHTML 显示高亮
        }
    }
</script>
```

服务端和客户端**同时配置相同的分词器**是必须的，否则索引时和搜索时分词不一致会导致匹配失败。

### 3. 配置清理

`astro.config.mjs` 中移除 Pagefind 集成；`package.json` 中：

```diff title="package.json"
- "astro-pagefind": "^2.0.0"
+ "@orama/orama": "^3.1.18"
+ "@orama/tokenizers": "^3.1.18"
+ "@orama/stopwords": "^3.1.18"
+ "@orama/highlight": "^0.1.9"
+ "remove-markdown": "^0.6.4"
```

## Dev 模式下能搜索，这才是核心

`.json.ts` 端点被 Astro 作为 API 路由处理——在 `astro dev` 和 `astro build` 下都能正常响应。每次请求时动态从 Content Collections 读取并构建索引。

这意味着：

| 场景         | 体验                                       |
| ------------ | ------------------------------------------ |
| **搜索**     | 本地开发时打开搜索，结果立刻出来           |
| **调参**     | 调整分词参数后刷新即生效，不需要重新 build |
| **调试样式** | 调试高亮样式、摘要长度时所见即所得         |

这是整个方案相比 Pagefind 最大的优势。

## 效果对比

| 特性         | Pagefind             | Orama (本方案)                |
| ------------ | -------------------- | ----------------------------- |
| Dev 模式搜索 | 不可用               | 可用                          |
| 中文分词     | 基础支持             | mandarin tokenizer            |
| 高亮精度     | 基本                 | `trim()` 自动居中             |
| 索引来源     | 渲染后 HTML          | Content Collections 直接读    |
| 搜索权重     | 有限                 | `boost` 自定义                |
| 作用域标注   | `data-pagefind-body` | 不需要                        |
| 索引输出     | 碎片化文件           | 单个 JSON (~4MB, gzip ~800KB) |

## 参考链接

1. [pagefind/src/fossick/mod.rs](https://github.com/CloudCannon/pagefind/blob/main/pagefind/src/fossick/mod.rs)
2. [ICU DictionaryBasedBreakIterator](https://unicode-org.github.io/icu-docs/apidoc/released/icu4c/classBreakIterator.html)
3. [packages/orama/src/methods/search-fulltext.ts](https://github.com/oramasearch/orama)
4. [remove-markdown](https://www.npmjs.com/package/remove-markdown)

## 小结

搜索是博客体验的最后一公里。一个能在 dev 阶段就调试的搜索系统，不仅能提升读者体验，也让开发流程顺畅得多。Pagefind 是个好工具，但 Orama 在灵活性、中文支持和开发体验上明显更胜一筹。

如果你也用 Astro，不妨试试这个方案。代码都在 [stalux 主题仓库](https://github.com/xingwangzhe/stalux)里。
