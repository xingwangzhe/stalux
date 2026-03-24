---
title: Astro 6 推出啦
date: "2026-03-12 09:27:03"
category: [astro]
tags: [astro, vite]
abbrlink: astro6-release
---

## Astro 6 终于推出！

```bash title="升级你的Astro版本到 6!"
npmx @astrojs/upgrade
```

就在昨天晚上，**`Astro 6.0`** 正式发布了。带来了新的特性，也引入了一些破坏性变更以及若干新的**实验性选项**。

### 主要亮点（概览）

详情可以查看[Astro 6.0](https://astro.build/blog/astro-6/)官方博客，我这里简单说几点

#### `vite7`

Astro 6 默认使用 **`Vite 7`**，带来更一致的 `dev` / `release` 体验，测试生产**一致性**得到了保证，这下终于不用为神秘**`bug`**而反复构建了。

有人可能会疑惑，那 `vite 8` 支持呢？毕竟 `vite 8` 要呼之欲出了，我也有这个疑惑，所以很久之前我就在 Discord 上问过，看来即使 `vite 8` 正式推出，`astro 6` 也很难启用 `vite 8`

![Discord 对话](/discord/discord-astro-vite8.webp)

具体链接在这：[关于 astro 6 与 vite 8](https://discord.com/channels/830184174198718474/830184175176122389/1476534217180446762)

注意 ⚠️，这并非**承诺**，只是推测，当 `vite 8` 正式推出时，官方也有可能有实验性更新。

#### 实验性 Rust 编译器

[Experimental Rust compiler](https://v6.docs.astro.build/zh-cn/reference/experimental-flags/rust-compiler/)

Astro 6 引入了 **Rust 编译器**，为 Astro 的组件和模板提供了更高效的编译性能，但处于实验状态，缺少很多特性，无法自动纠正 HTML 结构。

```diff lang="mjs" title="astro.config.mjs"
import { defineConfig } from "astro/config";

export default defineConfig({
  experimental: {
+    rustCompiler: true
  }
});
```

我认为对于博客模板来说，可以试试，比较大部分结构已经由模板固定，唯一不确定的是 Markdown 中混乱的 HTML 结构，不过应该没人那么写吧？

#### 实验性的队列渲染

[Experimental queued rendering](https://v6.docs.astro.build/zh-cn/reference/experimental-flags/queued-rendering/)

当启用**队列渲染**时，Astro 遍历树中的所有节点，并输出一个深度优先的节点列表。然后对该列表进行迭代和渲染，无需递归算法。这种渲染方式更省内存，并且在大型项目中应能带来更多优势，还有两个配置：**节点池化** 和 **内容缓存**，详情可以查看官方文档

```diff lang="mjs" title="astro.config.mjs"
import { defineConfig } from "astro/config";

export default defineConfig({
  experimental: {
+    queuedRendering: {
+       enabled: true
+    }
  }
});
```

### 构建速度加快

显而易见，构建速度变得更快了，启用实验特性+缓存，对我这个百十来篇文章的博客，在本机构建，最快时间缩小到 11s 左右。

---

Astro生态越来越好，希望大家都来尝试一下Astro！
