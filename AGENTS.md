# Frontmatter 写作规范

本文档描述了 stalux 博客中 `stalux/posts/` 目录下 Markdown 文章的 frontmatter 编写规范。

## 格式概述

所有文章必须使用 YAML 格式的 frontmatter，以 `---` 开头和结尾。

```yaml
---
title: 文章标题
date: "YYYY-MM-DD HH:MM:SS"
abbrlink: 短链接标识
tags:
    - 标签1
    - 标签2
categories:
    - 分类1
updated: "YYYY-MM-DD HH:MM:SS"
draft: false
---
```

## 字段说明

### 必填字段

| 字段       | 类型   | 说明                                                                 | 示例                                                 |
| ---------- | ------ | -------------------------------------------------------------------- | ---------------------------------------------------- |
| `title`    | string | 文章标题，与文件名一致（文件名去除扩展名）                           | `title: 在Linux上玩Flash网页游戏-洛克王国`           |
| `date`     | string | 发布日期，必须用双引号包裹，格式为 `YYYY-MM-DD HH:MM:SS`             | `date: "2026-03-27 14:30:00"`                        |
| `abbrlink` | string | 短链接标识，用于文章的永久链接。可以是语义化缩写，也可以是随机字符串 | `abbrlink: play-flash-luoke` 或 `abbrlink: cbab25fa` |

### 可选字段

| 字段         | 类型    | 说明                                                      | 默认值            |
| ------------ | ------- | --------------------------------------------------------- | ----------------- |
| `updated`    | string  | 最后更新日期，格式同 `date`                               | -                 |
| `tags`       | array   | 文章标签数组。**所有标签必须小写**。空数组使用 `tags: []` | `[]`              |
| `categories` | string  | 文章分类，**默认只允许一个，必须小写**                    | -                 |
| `draft`      | boolean | 是否为草稿，`true` 表示不发布                             | `false`           |
| `cc`         | string  | 版权协议                                                  | `CC-BY-NC-SA-4.0` |

### 自动生成字段

以下字段由 remark 插件在构建时自动生成，**不需要手动填写**：

- `desc` - 文章摘要
- `minutesRead` - 预计阅读时间
- `wordCount` - 文章字数

## 格式示例

### 完整示例

```yaml
---
title: 2025年终总结
abbrlink: cbab25fa
date: "2025-12-31 18:37:55"
updated: "2025-12-31 19:37:07"
categories: 年终总结
tags:
    - 记录
    - 年终总结
---
```

### 简洁示例（内联数组）

```yaml
---
title: Astro 5.17构建性能优化实践：从18s到13s
abbrlink: astro-517-performance-optimization
date: "2026-02-02 19:52:00"
tags: [Astro, 性能优化, 前端, ssg]
categories: 技术
---
```

### 新文章草稿示例

```yaml
---
title: 在Linux上玩Flash网页游戏-洛克王国
abbrlink:
date: ""
categories:
tags: []
---
```

## 缩进规范

- 使用 **4个空格** 缩进（不要使用 tabs）
- 数组块格式中，`-` 后面跟一个空格再写内容
- 字符串不需要引号，除非包含特殊字符或者日期格式（日期必须用引号）

## 验证

请参考 `content.config.ts` 中的 Zod schema 进行类型校验：

- `title` 必须是字符串
- `abbrlink` 必须是字符串或可转为字符串
- `date` 必须可转为 Date 类型
- `tags` 必须是字符串数组
- `draft` 默认为 `false`
