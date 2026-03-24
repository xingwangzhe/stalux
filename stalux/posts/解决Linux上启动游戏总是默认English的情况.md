---
title: 解决Linux上启动游戏总是默认English的情况
abbrlink: 81fc36f0
date: 2025-09-27 20:32:44
updated: 2025-09-27 20:59:18
categories:
    - Steam
tags:
    - Linux
    - steam
    - 英文
    - 问题解决
    - 技术分享
---

## 前言

虽然我使用 Linux 已经好几个月了，可以说是完全沉浸其中，很少玩游戏了，但最近心血来潮，想玩 Rusted Warfare，却发现通过 Steam 的 Proton 兼容层启动游戏，默认都是 English，且游戏内没有语言选项，这让我感到不便，于是仔细研究了一下...

### Steam启动选项-LANG

Steam 启动游戏时，用户可以添加一些参数来修改行为，这里我们直接讨论语言相关的设置

一般来说，中文 Linux 用户的系统语言环境可能是 zh_CN.UTF-8，因此，我们可以通过设置 LANG 环境变量来解决这个问题。

```bash title="打开命令行，查看当前语言环境"
locale
```

可能的中文结果应该是

| Locale      | 地区     |
| ----------- | -------- |
| zh_CN.UTF-8 | 中国大陆 |
| zh_TW.UTF-8 | 中国台湾 |
| zh_HK.UTF-8 | 中国香港 |
| zh_MO.UTF-8 | 中国澳门 |
| zh_SG.UTF-8 | 新加坡   |

以我的 Ubuntu 系统为例，默认语言环境为 zh_CN.UTF-8，因此可以进行如下设置

```bash
LANG=zh_CN.UTF-8 %command%
```

或者

```bash
LC_ALL=zh_CN.UTF-8 %command%
```

**%command%**是steam重要的占位符，不可忽略！

经过测试，发现第二条设置生效，游戏成功切换为中文
![成功解决](https://i.ibb.co/fY4yfpRw/2025-09-27-20-31-16.webp)
