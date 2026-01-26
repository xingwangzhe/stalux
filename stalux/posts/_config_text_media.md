---
title: 打字配置与社交媒体链接
tags:
  - 配置
  - 社交媒体
categories:
  - 主题配置
date: 2025-5-10T13:00:00+08:00
updated: 2026-1-26T00:00:00+08:00
abbrlink: 8e8c59c4
---

## 概要

本篇对照当前 config.yml 重写，涵盖首页打字动效 (`typetexts`) 和社交媒体链接 (`mediaLinks`) 的配置与注意事项。

## 打字动效配置

首页打字机动效使用字符串数组，随机显示：

```yaml title="config.yml"
typetexts:
  - "Free for free, not free for charge!"
  - "任意键在哪?"
  - "F12看看?"
  - "Hello World!"
```

- 建议每条文案保持简短，便于在首屏完整展示。
- 支持任意数量的字符串；为空时将不显示打字动效。

## 社交媒体链接

主题从 `mediaLinks` 读取社交链接，使用 simple-icons 生成 SVG：

```yaml title="config.yml"
mediaLinks:
  - icon: github
    link: https://github.com/xingwangzhe/stalux
  - icon: bilibili
    link: https://bilibili.com/
  - icon: X
    link: https://x.com
  - icon: juejin
    link: https://juejin.cn/
  - icon: zhihu
    link: https://www.zhihu.com/
  - icon: maildotru
    link: mailto:xingwangzhe@outlook.com
  - icon: telegram
    link: https://t.me/
```

字段说明：

- `icon` 必填，建议使用 [simple-icons](https://simpleicons.org/) 的名称（例如 `github`、`telegram`、`zhihu`、`x`）；内部会移除非字母数字并匹配大小写。
- `link` 必填，社交地址或 mailto/外链 URL。
- 未匹配到图标时，会退化为首字母展示，确保可点击。

## 常见修改

- 添加/删除文案：直接增删 `typetexts` 数组项。
- 新增社交链接：在 `mediaLinks` 追加 `{ icon, link }`，确保 icon 能被 simple-icons 识别。
- 替换图标：将 `icon` 改为新的 simple-icons 名称；如未内置，可自定义 icon 名并接受首字母回退。

## 验证与预览

- 修改配置后运行 `bun run dev` 预览，检查首页打字动效与社交图标是否正常显示。
- 若图标缺失，先确认 simple-icons 是否存在该名称，或改用全小写/无特殊字符的写法。
