---
title: Stalux Theme Configuration Overview
tags:
    - Configuration
    - Getting Started
categories:
    - Theme Config
date: "2025-05-10 10:00:00"
updated: "2026-02-03 00:00:00"
desc: Complete configuration file structure of the Stalux theme, descriptions of all configuration options, and a quick start guide.
abbrlink: 0b563d42
---

## Configuration File Locations

- Main config: config.yml
- Configuration schema definition: src/content.config.ts
- Other topic-specific docs: `_config_*.md` files located under stalux/posts

## Current Default Configuration (Excerpt)

```yaml
stalux:
    title: "Stalux Blog Theme"
    url: "https://stalux.needhelp.icu"
    description: "Blog theme Stalux - A professional display platform for content creators, supporting various customization features including comment system integration, friend link management, social media sharing, and rich SEO optimization options to make your content more attractive and discoverable."
    # canonical:
    # twitterSite:
    # noindex:
    # nofollow:
    # Analytics tools and custom head configuration
    head:
        # Google Analytics 4 tracking ID (format: G-XXXXXXXXXX)
        # googleAnalyticsId: ""
        # Microsoft Bing Clarity project ID
        # bingClarityId: ""
        # Umami analytics configuration
        # umami:
        #   id: ""      # Website ID
        #   url: ""     # Umami script URL
        # Additional custom head content (HTML string)
        anyhead: ""
    favicon: "/favicon.svg"
    timezone: "Asia/Shanghai" # IANA timezone, used to generate correct machine-readable time formats

    author:
        name: "xingwangzhe"
        avatar: "/avatar.png"
        bio: "Blog Theme Stalux"

    navs:
        - { title: "Home", icon: home, link: "/" }
        - { title: "Posts", icon: archive, link: "/archives" }
        - { title: "Categories", icon: folder, link: "/categories" }
        - { title: "Tags", icon: tag, link: "/tags" }
        - { title: "Words", icon: quote, link: "/words" }
        - { title: "Links", icon: link, link: "/links" }
        - { title: "About", icon: user, link: "/about" }
        - { title: "Travellings", icon: train-front, link: "https://www.travellings.cn/go" }

    typetexts:
        - "Free for free, not free for charge!"
        - "Where's the any key?"
        - "Press F12?"
        - "Hello World!"

    mediaLinks:
        - { icon: github, link: "https://github.com/xingwangzhe/stalux" }
        - { icon: bilibili, link: "https://bilibili.com/" }
        - { icon: X, link: "https://x.com" }
        - { icon: juejin, link: "https://juejin.cn/" }
        - { icon: zhihu, link: "https://www.zhihu.com/" }
        - { icon: maildotru, link: "mailto:xingwangzhe@outlook.com" }
        - { icon: telegram, link: "https://t.me/" }

    links:
        title: "Helpful Links"
        description: "These sites are great and have been very helpful to this theme!"
        sites:
            - {
                  name: "Astro",
                  description: "A modern static site generator for building content-rich websites.",
                  link: "https://astro.build/",
                  icon: "https://astro.build/favicon.svg",
              }
            - {
                  name: "MDN",
                  description: "Provides open, detailed, and easy-to-understand information about web standards.",
                  link: "https://developer.mozilla.org/",
                  icon: "https://developer.mozilla.org/favicon.ico",
              }
            - {
                  name: "animejs",
                  description: "A powerful JavaScript animation library for creating complex animation effects.",
                  link: "https://animejs.com/",
                  icon: "https://animejs.com/assets/images/favicon.png",
              }
            - {
                  name: "lucide",
                  description: "A clean and beautiful open-source icon library based on the Lucide icon system.",
                  link: "https://lucide.dev/",
                  icon: "https://lucide.dev/favicon.ico",
              }
            - {
                  name: "simple-icons",
                  description: "An open-source icon library with thousands of brand icons for web and app design.",
                  link: "https://simpleicons.org/",
                  icon: "https://simpleicons.org/icons/simpleicons.svg",
              }

    footer:
        buildtime: "2025-05-01T10:00:00"
        copyright:
            enabled: true
            startYear: 2024
            customText: ""
        theme:
            showPoweredBy: true
            showThemeInfo: true
        beian:
            icp: { enabled: false, number: "ICP备XXXXXXXX号" }
            security:
                {
                    enabled: false,
                    text: "Public Security Filing XXXXXXXXXXXX",
                    number: "XXXXXXXXXXXX",
                }
        badges:
            - {
                  label: "Powered by",
                  message: "Astro",
                  color: "orange",
                  style: "flat-square",
                  alt: "Powered by Astro",
                  href: "https://astro.build/",
              }
            - {
                  label: "Theme",
                  message: "Stalux",
                  color: "blueviolet",
                  alt: "Theme: Stalux",
                  href: "https://github.com/xingwangzhe/stalux",
              }
            - {
                  label: "Built with",
                  message: "❤",
                  color: "red",
                  style: "for-the-badge",
                  alt: "Built with Love",
                  href: "https://github.com/xingwangzhe",
              }
            - {
                  label: "license",
                  message: "MIT",
                  color: "blue",
                  alt: "License: MIT",
                  href: "https://github.com/xingwangzhe/stalux/blob/main/LICENSE",
              }
            - {
                  label: "Software Copyright",
                  message: "Reg# 2025SR2258474",
                  color: "yellowgreen",
                  alt: "Software Copyright Registration No. 2025SR2258474",
                  href: "/软著证明.pdf",
              }
            - {
                  label: "Alibaba ESA",
                  message: "Powered",
                  color: "brightgreen",
                  alt: "Alibaba Cloud ESA",
                  href: "https://www.aliyun.com/product/esa",
              }
            - {
                  label: "Sitemap",
                  message: "XML",
                  color: "orange",
                  alt: "Sitemap XML",
                  href: "/sitemap-index.xml",
              }
            - { label: "RSS", message: "Feed", color: "orange", alt: "RSS Feed", href: "/rss.xml" }
            - {
                  label: "Atom",
                  message: "Feed",
                  color: "orange",
                  alt: "Atom Feed",
                  href: "/atom.xml",
              }
            - {
                  label: "LLMs",
                  message: "Dataset",
                  color: "blue",
                  alt: "LLM Dataset",
                  href: "/llms.txt",
              }
        custom: |
            <!-- Example custom footer slot, can hold analytics, widgets, etc. -->
            <div id="custom-footer-hook"></div>
            <script>console.log('Custom footer loaded');</script>

    comment:
        enabled: false
        waline:
            serverURL: "https://walines.xingwangzhe.fun"
            lang: en-US
            emoji: ["https://unpkg.com/@waline/emojis@1.1.0/weibo"]
            reaction: false
            meta: [nick, mail, link]
            wordLimit: 200
            pageSize: 10
```

## Field Descriptions

- Basic Info: `title`, `url`, `description` are required for the site; `canonical`/`twitterSite`/`noindex`/`nofollow` can be enabled as needed; `favicon` supports relative paths.
- Head Extensions: `head` is used to configure analytics tools (Google Analytics, Bing Clarity, Umami) and custom `<head>` snippets.
    - `head.googleAnalyticsId`: GA4 tracking ID
    - `head.bingClarityId`: Microsoft Clarity project ID
    - `head.umami`: Umami analytics configuration (includes `id` and `url`)
    - `head.anyhead`: Additional custom head HTML
- Author Info: `author.name`, `author.avatar`, `author.bio` are displayed in posts, sidebar, and other locations.
- Navigation and Animation: `navs` is the top navigation, configurable with Home, Posts, Categories, Tags, Words, Friend Links, About, etc.; `icon` uses Lucide Icons standard PascalCase names (see https://lucide.dev/icons/); `typetexts` is the random text for the homepage typing animation.
- Content Collections: Posts are placed in `stalux/posts/`, about pages in `stalux/about/`, quotes in `stalux/words/`.
- Social and Friend Links: `mediaLinks` renders social icons; `links` defines friend link group titles, descriptions, and site lists.
- Footer: `footer.buildtime` is used for site uptime display; `copyright` controls copyright display; `theme` controls theme info display; `beian` provides ICP/security filing toggles; `badges` is the footer badge list; `custom` supports custom slot HTML.
- Comment Toggle: `comment.enabled` controls whether the comment section is rendered site-wide (default `false`).
- Comments: `comment.waline` configures Waline.

## Words (Quotes)

The `/words` page is used to collect short phrases, code snippets, or quotes, with content placed in `stalux/words/*.md`.

Optional frontmatter fields:

- `source`: Source or author.
- `link`: Source link; when present, `source` is displayed as a clickable external link.
- `sourceDate`: The date associated with the source, displayed in italics at the bottom-right of the card.
- `date`: The date this quote was written, displayed at the bottom-left of the card and used for sorting.
- `updated`: Update date.
- `draft`: Default `false`; when `true`, not displayed.

Example:

```markdown
---
source: "Quake III Arena"
link: "https://en.wikipedia.org/wiki/Fast_inverse_square_root"
sourceDate: "1999"
date: "2026-06-18 20:45:00"
updated: "2026-06-18 21:00:00"
draft: false
---

Talk is cheap. Show me the `code`.
```

To display it in navigation, add the following to `navs`:

```yaml
- title: Words
  icon: quote
  link: /words
```

## Common Modifications

- When deploying to a new domain, update `url` and optionally `canonical`, and check navigation external links.
- When adding new navigation items, follow the `navs` structure and choose PascalCase icon names from [Lucide Icons](https://lucide.dev/icons/).
- When you need more social or friend links, add them to `mediaLinks` or `links.sites` respectively.
- Footer badges can be added in the format `{ label, message, color, style?, alt?, href }`; filing info is only displayed when the corresponding toggle is enabled.
- When the Waline server address or emoji pack source changes, update `comment.waline` accordingly and refer to the dedicated article to confirm whether the client needs additional parameters.

## Validation and Preview

- After saving the configuration, run `bun run dev` to preview; the console will indicate missing fields or format errors.
- After modifying head snippets or analytics scripts, it is recommended to confirm in the browser console that there are no errors before deploying.
