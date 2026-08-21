---
title: Typing Animation, Social Media & Friend Links
tags:
    - Configuration
    - Social Media
categories:
    - Theme Config
date: "2025-05-10 13:00:00"
updated: "2026-07-22 00:00:00"
desc: Configuration for the homepage typing animation (typetexts.yml), social media links (media-links.yml), and friend links (links.yml).
abbrlink: 8e8c59c4
---

## typetexts.yml — Homepage Typing Animation

File: `stalux/config/typetexts.yml`

```yaml
id: typetexts
items:
    - "Free for free, not free for charge!"
    - "Where's the any key?"
    - "Press F12?"
    - "Hello World!"
```

| Aspect      | Guidance                                  |
| ----------- | ----------------------------------------- |
| Display     | Items cycle randomly on the homepage      |
| Text length | Keep each short for first-screen display  |
| Empty       | Leave `items` empty to hide the animation |

## media-links.yml — Social Media Links

File: `stalux/config/media-links.yml`

```yaml
id: media-links
items:
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

| Field    | Description                                                                            |
| -------- | -------------------------------------------------------------------------------------- |
| `icon`   | [simple-icons](https://simpleicons.org/) name (lowercase, e.g. `github`, `x`, `zhihu`) |
| `link`   | URL or `mailto:` address                                                               |
| Fallback | Unrecognized icons show the first letter                                               |

## links.yml — Friend Links

File: `stalux/config/links.yml`

```yaml
id: links
title: "Helpful Links" # Section heading
description: "Great sites!" # Section description
sites:
    - name: Astro
      description: A modern static site generator.
      link: https://astro.build/
      icon: https://astro.build/favicon.svg
    - name: MDN
      description: Web standards documentation.
      link: https://developer.mozilla.org/
      icon: https://developer.mozilla.org/favicon.ico
    - name: animejs
      description: JavaScript animation library.
      link: https://animejs.com/
      icon: https://animejs.com/assets/images/favicon.png
    - name: feather-icons
      description: Open-source icon library.
      link: https://feathericons.com/
      icon: https://feathericons.com/favicon.ico
    - name: simple-icons
      description: Brand icons collection.
      link: https://simpleicons.org/
      icon: https://simpleicons.org/icons/simpleicons.svg
```

Each `sites[]` entry requires `name`, `description`, `link`, and `icon`.

Friend-link cards render as `target="_blank"` links with `rel="noopener"` — the referrer is passed through (the target site sees where visitors came from) while `window.opener` stays protected.
