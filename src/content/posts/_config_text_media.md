---
title: 打字配置与社交媒体链接
tags:
    - 配置
    - 社交媒体
categories:
    - 主题配置
date: 2025-5-10T13:00:00+08:00
updated: 2025-5-10T16:00:00+08:00
abbrlink: 8e8c59c4
---

## 打字配置

在首页上，系统会随机展示打字动效内容。通过以下配置可自定义这些文字：

```yaml title="_config.yml"
# 打字配置
textyping:
  - "Free for free, not free for charge!"
  - "任意键在哪?"
  - "F12看看?"
  - "Hello World!"
```

这是一个简单的字符串数组，您可以根据需要添加或修改内容。建议保持每条内容简短以获得最佳显示效果。

## 社交媒体链接设置

您可以配置显示在网站上的社交媒体链接：

```yaml title="_config.yml"
# 社交媒体链接配置
medialinks:
  - title: "Github"
    url: "https://github.com/xingwangzhe"
    icon: "github"
  - title: "Bilibili"
    url: "https://space.bilibili.com/1987297874"
    icon: "bilibili"
  - title: "QQ"
    url: "https://wpa.qq.com/msgrd?v=3&uin=2098422920&site=qq&menu=yes"
    icon: "qq"
  - title: "eMail"
    url: "mailto:xingwangzhe@outlook.com"
    icon: "maildotru"
```

每个链接配置包含：
- `title`: 显示的名称
- `url`: 跳转链接
- `icon`: 图标名称，来自[simpleicons](https://simpleicons.org/)库，提供丰富的图标选择
