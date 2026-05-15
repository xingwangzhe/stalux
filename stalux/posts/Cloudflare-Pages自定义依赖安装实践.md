---
title: Cloudflare Pages自定义依赖安装实践
abbrlink: cf-pages-custom-deps
date: "2026-05-15 20:03:36"
categories: 技术
tags:
    - cloudflare
    - 前端
    - 部署
    - 记录
---

折腾 **Cloudflare Pages** 的时候，我一度以为它只能跑默认的 `npm install`，但事实并非如此——Cloudflare Pages 的构建系统其实**相当灵活**。

---

## 官方文档里的环境说明

先来看看官方文档是怎么展示构建镜像信息的。下面这两张截图来自 [Cloudflare 官方文档](https://developers.cloudflare.com/pages/configuration/build-image/#supported-languages-and-tools)，清晰展示了构建系统支持的语言和工具：

### 第一步：查看构建系统镜像环境

文档页面明确列出了当前构建镜像的默认环境，包括 Node.js、Python、Ruby 等语言的版本信息：

![查看默认构建系统镜像环境](/cf-pages-custom-deps/1查看默认构建系统镜像有什么环境.webp)

> Cloudflare 正在逐步推进 v3 构建镜像，v1 将于 2026 年 9 月 15 日自动迁移，v2 则是 2027 年 2 月 23 日。建议提前适配，避免到时候构建突然炸掉。

---

### 第二步：环境变量设置入口

文档还说明了如何通过环境变量或配置文件来覆盖默认版本，这是后续自定义安装的基础：

![环境变量设置](/cf-pages-custom-deps/2环境变量设置.webp)

---

## 实战操作：自定义依赖安装

看完文档，接下来进入真正的操作环节。下面是我实际在 Cloudflare Dashboard 上配置的完整流程。

### 第三步：搜索 Pages 项目

登录 Cloudflare Dashboard，进入 Workers & Pages 页面，搜索你要配置的项目：

![搜索 Pages 项目](/cf-pages-custom-deps/3实践-搜索pages.webp)

---

### 第四步：选中目标项目

点击项目名称进入详情页：

![选中 Pages 项目](/cf-pages-custom-deps/4选中pages.webp)

---

### 第五步：进入已有项目的设置

找到你的 Pages 项目后，点击 **Settings**（设置）进入配置页面：

![进入已有项目的设置](/cf-pages-custom-deps/分支1-5已有项目的设置.webp)

> 如果你是从头新建项目，流程也大同小异，只是在初始化配置阶段就设置好。

---

### 第六步：修改环境变量（关键！）

这一步分两个子动作：

#### 6.1 添加 `SKIP_DEPENDENCY_INSTALL`

新增一个环境变量，**Name** 填 `SKIP_DEPENDENCY_INSTALL`，**Value** 填 `1`：

![第一步修改环境变量](/cf-pages-custom-deps/1-6第一步修改环境变量.webp)

#### 6.2 修改构建命令

把原来的构建命令（比如 `npm run build`）改成你**自定义的完整流程**。例如，如果你想用 `pnpm` 安装依赖并构建：

```bash title="自定义构建命令示例"
npm install -g pnpm && pnpm install && pnpm run build
```

或者你项目里有特殊的预安装脚本，也可以一并写进去：

```bash title="更复杂的自定义构建命令"
corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile && pnpm run build
```

![第二步修改安装命令](/cf-pages-custom-deps/1-6第二步修改安装命令.webp)

> 这里的关键思路是：**既然跳过了默认安装，那你就要对整条构建链路负责**。从包管理器的准备、依赖安装到最终构建，都得自己写清楚。

---

### 第七步：重新部署验证

保存配置后，触发一次新的部署。如果一切顺利，构建日志里会显示你自定义的命令被执行，而不是默认的 `npm install`：

![重新部署](/cf-pages-custom-deps/1-6重新部署.webp)

---

## 一些踩坑提醒

| 坑点                                       | 说明                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------- |
| **v3 不支持 Node.js codename**             | 比如 `hydrogen` 或 `lts/hydrogen` 这种写法在 v3 构建镜像里不识别，必须写具体版本号 |
| **Yarn/pnpm 版本不会自动从 lock 文件检测** | v3 不再根据 `yarn.lock` 或 `pnpm-lock.yaml` 推断包管理器版本，必须显式指定         |
| **package.json engines 字段被忽略**        | 别指望 `"engines": { "node": ">=20" }` 能生效，还是要靠环境变量或配置文件          |
| **pipenv 和 Pipfile 支持已移除**           | v3 构建镜像不再支持，Python 项目建议用 `requirements.txt` 或 Poetry                |

---

## 什么时候需要自定义安装

不是每个项目都需要这么折腾。以下几种场景比较值得动手：

- **需要特定版本的包管理器**：比如项目强制要求 pnpm 9.x，而默认是 10.x
- **需要预安装系统级依赖**：某些 npm 包编译时需要系统库，默认环境可能缺
- **构建流程复杂**：需要先跑脚本生成代码，再安装依赖，最后构建
- **monorepo 场景**：需要用 `pnpm --filter` 之类的命令精准安装子包依赖
- **迁移旧项目**：从 v1/v2 构建镜像迁移到 v3 时，默认行为变了，需要手动锁定版本

---

## 总结

Cloudflare Pages 的构建系统远比表面看起来灵活。通过 `SKIP_DEPENDENCY_INSTALL` 这个环境变量，我们可以完全接管依赖安装过程，配合丰富的**语言版本环境变量**和**配置文件覆盖机制**，几乎能满足各种奇奇怪怪的构建需求。

一言以蔽之：**默认流程够用就省事儿，不够用了也有后门可以走**——这就是 Cloudflare Pages 构建系统的真实写照。

如果你也在用 Cloudflare Pages 部署项目，建议提前了解一下 [官方构建镜像文档](https://developers.cloudflare.com/pages/configuration/build-image/#supported-languages-and-tools)，

---

## 参考链接

[^1]: [Cloudflare Pages Build Image - Supported Languages and Tools](https://developers.cloudflare.com/pages/configuration/build-image/#supported-languages-and-tools)
