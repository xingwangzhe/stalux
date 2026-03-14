---
title: Vite8 - 统一的基建开始
date: 2026-3-14 13:24:32
tags: ["vite", "voidzero", "serverless"]
categories: vite
abbrlink: vite-voidzero-features
---

**前言**

在 **Astro 6** 发布不久后，`Vite 8` 正式推出，标志着 **Vite** 终于统一了工具链，彻底结束了 `rollup` 和 `esbuild` 的混合使用。`Vite+` 也最终宣布开源，同时 **VoidZero** 推出了 `Vite` 专属的平台，似乎是要与 **Vercel** 展开竞争。

## Vite 8 Comes out!

![Vite8图片](https://vite.dev/og-image-announcing-vite8.webp)

最初，**Vite** 采用了一种务实的双打包器策略：开发阶段使用 `esbuild` 实现极速编译，生产构建则依赖 `Rollup` 进行优化。这一策略多年来运行良好，但也带来了维护两个独立转换管道、插件系统不一致、边缘情况累积等挑战。

`Vite 8` 的解决方案是引入 `Rolldown` —— 一个由 **VoidZero** 团队用 `Rust` 编写的 **统一打包器**。

> **性能飞跃、插件兼容、能力拓展**：统一架构解锁了完整 `bundle` 模式、更灵活的代码分割、模块级持久缓存、模块联邦等高级特性。

还有许多功能，详情请查看官方博客 [Vite 8.0 is out!](https://vite.dev/blog/announcing-vite8)

团队特别感谢 `Rollup` 和 `esbuild` 为 **Vite** 早期成功奠定的基础，并强调 `Rolldown` 继承了 `Rollup` 的插件 **API** 设计理念，同时吸收了 `esbuild` 对速度的极致追求。

`Vite 8` 不仅是一次版本升级，更是 Web 前端工具链向 **统一、高性能、可扩展** 方向迈进的重要里程碑。我觉得对于个人开发者而言，这是重大利好，构建速度的提升让我们减少了等待时间，**节约生命**。

## Vite+：All in one

[Announcing Vite+ Alpha](https://voidzero.dev/posts/announcing-vite-plus-alpha)

![Vite+ Alpha Cover](https://voidzero.dev/covers/announcing-vite-plus-alpha.jpg)

`Vite+` 的 `alpha` 版本推出了。与去年年末的声明不同，原以为是要为企业生产服务做专门的付费业务，但现在，他们将其以 `MIT` 协议开源，造福社区。正如他们所说：

> 我们决定，只有当 `Vite+` 真正免费且开源时，才能实现让 **JavaScript** 开发者比以往更高生产力的使命。我们厌倦了争论哪些功能应该付费、如何限制，因为这只会在我们开源用户已经喜欢和喜爱的工作流程中制造摩擦。社区的反馈帮助我们坚定了信念。因此，我们决定以 `MIT` 许可证完全开源 `Vite+`。

不禁感叹，多么伟大的行动，相信社区会让 `Vite+` 变得更好。我不愿意等待，所以我选择主动去贡献！

[feat(cli): add Zed editor support for project creation \#832](https://github.com/voidzero-dev/vite-plus/pull/832)

![PR图片](/PR/viteplus.webp)

## void.cloud: Vite 专属平台

[Introducing Void, the Vite-native deployment platform:](https://x.com/youyuxi/status/2032385324572180575)

![void.cloud](/X/voidcloud.webp)

很显然，**Vite** 不但在质量上逐渐成为前端基建，在云平台上也开始了商业发力，为开发者提供更便捷的部署方案。同时也能看到这里面的商业化动机：虽然 `Vite+` 是免费开源的，但 `void.cloud` 可以提供一站式服务，这也许是开源商业化的一个新思路。

## 结语

**Vite 8** 的发布不仅是工具链的一次技术迭代，更是前端基建走向“大一统”的转折点。通过 **Rolldown** 消除开发与生产环境的差异，**Vite+** 拥抱开源社区，以及 **void.cloud** 补全了商业部署的最后一块拼图，**VoidZero** 正在构建一个更纯粹、更高效的开发者生态。对于我们开发者而言，这不仅意味着构建速度的飞跃，更是一个由社区驱动、技术引领的 Web 开发新纪元的开启。
