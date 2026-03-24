---
title: GitHub Actions 文件时间戳丢失问题及解决方案
abbrlink: 4568800c
date: 2025-07-04 18:44:32
updated: 2025-07-04 18:44:32
categories:
    - 疑难杂症
tags:
    - github
    - github-actions
    - 教程
    - 静态博客
---

## 一次偶然的发现

我有一次创建 [GitHub Actions workflow](https://docs.github.com/zh/actions/learn-github-actions/understanding-github-actions) 之后，发现构建完的文章的**创建时间**和**修改时间**都变成构建时间了。我试了好多次发现结果都一样，我就明白了这是构建阶段文件时间戳丢失的问题。

## 问题分析

这又令我思考：什么文件操作会对文件的时间戳造成影响？**复制**？**剪切**？**粘贴**？**修改**？查了一下资料发现：

| 操作类型      | 是否影响创建时间 | 是否影响修改时间 | 备注                               |
| ------------- | ---------------- | ---------------- | ---------------------------------- |
| 复制+粘贴     | 是               | 是               | 新文件会获得新的时间戳             |
| 剪切+粘贴     | 否               | 否               | 保留原文件时间戳                   |
| 修改内容      | 否               | 是               | 仅更新修改时间                     |
| Git克隆/拉取  | 是               | 是               | 获取操作时的时间戳                 |
| GitHub Action | 是               | 是               | 在工作流程中创建的文件获得新时间戳 |

经过研究，我发现 [GitHub Actions](https://github.com/features/actions) 工作流程中的 [checkout 操作](https://github.com/actions/checkout)会导致文件时间戳丢失，这是因为 **Git 本身不保存文件的时间戳信息**。Git 只记录提交时的作者时间和提交时间，而不会存储每个文件的创建和修改时间。当在 GitHub Actions 中 checkout 代码时，所有文件都会被重新创建，获取当前的时间戳。

有一个常见思路是通过 `git log` 来获取时间，但这存在几个问题：

1. 文件的创建时间可能早于首次 Git 提交的时间
2. 更新时间与最后一次修改提交时间可能不完全一致
3. 重命名或移动的文件可能会丢失历史记录

思来想去，脑海里产生了一个可能的解决办法。

## 解决办法

考虑到`git push`之前都需要`run dev`，我可以用这个阶段的钩子来触发脚本遍历文档获取时间戳。通过静态保存的方法创建`file-timestamps.json`，在`run build`阶段直接使用该JSON，避免构建时时间戳出错。

### 具体实现方案

我为博客项目创建了两个关键文件：

1. `file-timestamps.mjs` - 负责管理时间戳的保存和读取
2. `timestamp-integration.mjs` - 作为 Astro 集成，在构建过程中应用时间戳

下面是时间戳收集和应用的基本流程：

```javascript title="file-timestamps.mjs" {12-16} showLineNumbers
// 在开发环境保存时间戳
function saveTimestamps(timestamps) {
    // 仅在开发环境写入，生产环境只使用内存缓存
    if (process.env.NODE_ENV === "production") return;

    try {
        writeFileSync("file-timestamps.json", JSON.stringify(timestamps, null, 2), "utf-8");
        // 保存成功提示
        console.log("✅ 时间戳已保存");
    } catch (error) {
        // 错误处理
        console.error("❌ 保存时间戳失败:", error);
    }
}

// 初始化文件时间戳
function initFileTimestamp(filepath) {
    const timestamps = loadTimestamps();
    const relPath = getRelativePath(filepath);

    // 如果没有记录，从文件系统获取时间
    if (!timestamps[relPath]) {
        const stats = statSync(filepath);
        timestamps[relPath] = {
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
        };
        saveTimestamps(timestamps);
    }

    return timestamps[relPath];
}
```

然后在 `astro.config.mjs` 中将其作为集成启用：

```javascript title="astro.config.mjs" mark="2"
import timestampIntegration from "./src/integrations/timestamp-integration.mjs";

export default defineConfig({
    integrations: [
        timestampIntegration(),
        // 其他集成...
    ],
    // 其他配置...
});
```

### 小问题的解决

即使构建成功了，也会**可能**有一点小问题，比如说时间有点不对，正好差了**8个小时**，这应该是 GitHub Action 构建时的时区默认是世界标准时（UTC），需要在环境变量里配一下时区：

```yml title="github-workflow.yml" frame="terminal"
- name: 构建博客
  env:
      TZ: "Asia/Shanghai" # 设置时区为中国标准时间
  run: bun run build
```

完成这个设置后，构建出来的文件时间戳就会正确显示了，解决了静态博客在自动部署时的时间戳丢失问题。

## 总结

通过这个方案，我们解决了 GitHub Actions 中文件时间戳丢失的问题：

1. 在本地开发时，自动保存所有文件的时间戳信息到 JSON 文件
2. 将这个 JSON 文件与代码一起提交到仓库
3. 在 GitHub Actions 构建过程中，通过插件从 JSON 恢复文件的时间戳
4. 设置正确的时区环境变量避免时区差异

以下是这个系统在 Astro 中工作的示例：

```javascript title="timestamp-integration.mjs" showLineNumbers
import { loadTimestamps } from "./file-timestamps.mjs";

/**
 * Astro 集成，用于恢复文件时间戳
 */
export default function () {
    return {
        name: "timestamp-integration",
        hooks: {
            "astro:config:setup": ({ updateConfig }) => {
                // 加载已保存的时间戳数据
                const timestamps = loadTimestamps();

                updateConfig({
                    markdown: {
                        remarkPlugins: [
                            () => (tree, file) => {
                                // 获取文件相对路径
                                const relativePath = file.history[0]
                                    .replace(process.cwd(), "")
                                    .replace(/^\//, "");

                                // 应用时间戳到文章的 frontmatter
                                if (timestamps[relativePath]) {
                                    file.data.astro.frontmatter.pubDate =
                                        timestamps[relativePath].created;
                                    file.data.astro.frontmatter.updatedDate =
                                        timestamps[relativePath].modified;
                                }
                            },
                        ],
                    },
                });
            },
        },
    };
}
```

虽然我主要讲的是 Astro 构建，但对于其他的构建来说，也是等价的，本质上都是把时间信息保存下来再读取，从而绕过文件本身的时间戳

## 参考资料

- [Git 如何处理文件时间戳](https://git-scm.com/docs/git-commit#_date_formats)
- [GitHub Actions 环境变量文档](https://docs.github.com/zh/actions/learn-github-actions/environment-variables)
- [Node.js 文件系统 API](https://nodejs.org/api/fs.html#fsstatpath-options-callback)
