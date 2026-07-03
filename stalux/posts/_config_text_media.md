---
title: Typing Configuration and Social Media Links
tags:
    - Configuration
    - Social Media
categories:
    - Theme Config
date: "2025-05-10 13:00:00"
updated: "2026-01-26 00:00:00"
desc: This article is rewritten to match the current config.yml, covering the configuration and notes for the homepage typing animation (typetexts) and social media links (mediaLinks).
abbrlink: 8e8c59c4
---

## Overview

This article is rewritten to match the current config.yml, covering the configuration and notes for the homepage typing animation (`typetexts`) and social media links (`mediaLinks`).

## Typing Animation Configuration

The homepage typing animation uses a string array and displays items randomly:

```yaml title="config.yml"
typetexts:
    - "Free for free, not free for charge!"
    - "Where's the any key?"
    - "Press F12?"
    - "Hello World!"
```

- It is recommended to keep each text short for complete display in the first screen area.
- Supports any number of strings; when empty, the typing animation will not be displayed.

## Social Media Links

The theme reads social links from `mediaLinks` and generates SVGs using simple-icons:

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

Field descriptions:

- `icon` is required; it is recommended to use [simple-icons](https://simpleicons.org/) names (e.g., `github`, `telegram`, `zhihu`, `x`); internally, non-alphanumeric characters are removed and case is matched.
- `link` is required; social address or mailto/external URL.
- When no matching icon is found, it falls back to displaying the first letter to ensure clickability.

## Common Modifications

- Add/remove text: Directly add or remove items from the `typetexts` array.
- Add new social links: Append `{ icon, link }` to `mediaLinks`, ensuring the icon can be recognized by simple-icons.
- Replace icons: Change `icon` to a new simple-icons name; if not built-in, you can customize the icon name and accept the first-letter fallback.

## Verification and Preview

- After modifying the configuration, run `bun run dev` to preview, checking that the homepage typing animation and social icons display correctly.
- If an icon is missing, first confirm whether the name exists in simple-icons, or try using all lowercase/no special characters.
