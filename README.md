**This project is accelerated, computed and protected by Alibaba Cloud ESA**

![Alibaba Cloud Acceleration](aliyun.png)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xingwangzhe/stalux)
[![Deploy with EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https://github.com/xingwangzhe/stalux)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/xingwangzhe/stalux)

**#Alibaba Cloud ESA Pages** **#Alibaba Cloud Yungong Kaichuang**

# Stalux - Modern Astro Blog Theme

![Multi-device Preview](image.png)

## **[stalux.needhelp.icu](https://stalux.needhelp.icu)**

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/xingwangzhe/stalux)

**This blog theme has [Software Copyright Registration](./软著证明.pdf) and is protected by Chinese copyright law. Please comply with the [LICENSE](./LICENSE) (MIT License).**

<p align="center">
  Elegant, high-performance, easily configurable Astro static blog theme
</p>

In terms of design, Stalux draws on minimalism and moderate decoration: it maintains an overall dark tone with subtle glassmorphism textures, and the background uses tiled decorative patterns to enhance visual depth without being distracting (see the repository notice for background sources). The theme's goal is to focus the reader's attention on the content while retaining moderate decorative details to enhance overall recognition.

In terms of experience, Stalux balances SSG's high performance with the smooth feel of page transitions without full reloads. Through view transitions and handling of `astro:page-load` events, the theme keeps the header, footer, and other common components stable during navigation or main content switching, reducing white flashes and ensuring that comments, search, and other scripts continue to work properly after transitions.

Content-first is one of the theme's core principles: writing and presentation are considered top priority. The theme supports CommonMark, code highlighting, Mermaid flowcharts, and KaTeX math formulas out of the box. Articles support automatic table of contents generation and reading time estimation, and content collections are placed under `stalux/posts`, `stalux/about`, and `stalux/words` by default for easy folder-level content management.

### New Page: Words (/words)

The theme includes a "Words" quotes page for collecting short phrases, code snippets, or anything you want to record. Simply create a Markdown file under `stalux/words/`:

```yaml
---
source: "Source or author"
link: "https://source-link" # Optional; when present, source becomes a clickable external link
sourceDate: "1999" # Optional; source date, displayed in italics at the bottom right
date: "2026-06-18 20:45:00" # Optional; when this word was recorded, displayed at the bottom left
updated: "2026-06-18 21:00:00" # Optional
draft: false # Optional; defaults to false, true hides the entry
---
Write the quote body here, supports **Markdown**, `inline code`, and code blocks.
```

Add `- title: Words / icon: quote / link: /words` to the `navs` section in `config.yml` to include it in navigation.

For configuration, Stalux uses YAML as the primary configuration format (`config.yml`), with type checking and loading handled by `content.config.ts`, which keeps configuration readable while catching common errors at build time. The repository also provides `BACK.yml` as an example and backup.

```yaml
stalux:
    lang: zh-CN # Site language, options: zh-CN, en
    title: Stalux Blog Theme
    url: https://stalux.needhelp.icu
    description: "Blog theme Stalux - A professional display platform for content creators..."
    timezone: "Asia/Shanghai"
    # canonical: # Canonical URL, defaults to stalux.url
    # twitterSite: # Twitter site handle
    # noindex: # Whether to block search engine indexing, default false
    # nofollow: # Whether to block search engine link following, default false
    # Analytics and custom head configuration
    head:
        # Google Analytics 4 tracking ID (format: G-XXXXXXXXXX)
        # googleAnalyticsId: ""
        # Microsoft Bing Clarity project ID
        # bingClarityId: ""
        # Umami analytics configuration
        # umami:
        #   id: ""      # Website ID
        #   url: ""     # Umami script URL
        # Extra custom head content (HTML string)
        anyhead: ""
    favicon: "/stalux.ico" # Favicon path, defaults to root

    author:
        name: xingwangzhe
        avatar: /avatar.png
        bio: Blog Theme Stalux

    navs:
        # icon: use standard Lucide icon names
        # Icon list: https://lucide.dev/icons/
        - title: Home
          icon: home
          link: /
        - title: Archives
          icon: archive
          link: /archives
        - title: Categories
          icon: folder
          link: /categories
        - title: Tags
          icon: tag
          link: /tags
        - title: Words
          icon: quote
          link: /words
        - title: Links
          icon: link
          link: /links
        - title: About
          icon: user
          link: /about
        - title: Travellings
          icon: train-front
          link: https://www.travellings.cn/go

    typetexts:
        - "Free for free, not free for charge!"
        - "Where's the any key?"
        - "Press F12?"
        - "Hello World!"

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

    links:
        title: Helpful Links
        description: These sites are great and have been very helpful to this theme!
        sites:
            - name: Astro
              description: A modern static site generator for building content-rich websites.
              link: https://astro.build/
              icon: https://astro.build/favicon.svg
            - name: MDN
              description: Provides open, detailed, and easy-to-understand information about web standards.
              link: https://developer.mozilla.org/
              icon: https://developer.mozilla.org/favicon.ico
            - name: animejs
              description: A powerful JavaScript animation library that helps you easily create complex animations.
              link: https://animejs.com/
              icon: https://animejs.com/assets/images/favicon.png
            - name: feather-icons
              description: A clean and beautiful open-source icon library suitable for various design projects.
              link: https://feathericons.com/
              icon: https://feathericons.com/favicon.ico
            - name: simple-icons
              description: An open-source icon library providing thousands of brand icons for web and app design.
              link: https://simpleicons.org/
              icon: https://simpleicons.org/icons/simpleicons.svg

    footer:
        # Site build time, used to calculate uptime
        buildtime: "2025-05-01T10:00:00"

        # Copyright information
        copyright:
            enabled: true
            startYear: 2024
            customText: ""

        # Theme information
        theme:
            showPoweredBy: true
            showThemeInfo: true

        # Filing/ICP information
        beian:
            # ICP filing
            icp:
                enabled: false
                number: "辽ICP备XXXXXXXX号"
            # Public security filing
            security:
                enabled: false
                text: "辽公网安备 XXXXXXXXXXXX号"
                number: "XXXXXXXXXXXX"

        # Badge configuration
        badges:
            - label: "Powered by"
              message: "Astro"
              color: "orange"
              style: "flat-square"
              alt: "Powered by Astro"
              href: "https://astro.build/"
            - label: "Theme"
              message: "Stalux"
              color: "blueviolet"
              alt: "Theme: Stalux"
              href: "https://github.com/xingwangzhe/stalux"
            - label: "Built with"
              message: "❤"
              color: "red"
              style: "for-the-badge"
              alt: "Built with Love"
              href: "https://github.com/xingwangzhe"
            - label: "license"
              message: "MIT"
              color: "blue"
              alt: "License: MIT"
              href: "https://github.com/xingwangzhe/stalux/blob/main/LICENSE"
            - label: "Copyright"
              message: "Reg# 2025SR2258474"
              color: "yellowgreen"
              alt: "Software Copyright Registration No. 2025SR2258474"
              href: "/软著证明.pdf"
            - label: "Aliyun ESA"
              message: "Powered"
              color: "brightgreen"
              alt: "Alibaba Cloud ESA"
              href: "https://www.aliyun.com/product/esa"
            - label: "Sitemap"
              message: "XML"
              color: "orange"
              alt: "Sitemap XML"
              href: "/sitemap-index.xml"
            - label: "RSS"
              message: "Feed"
              color: "orange"
              alt: "RSS Feed"
              href: "/rss.xml"
            - label: "Atom"
              message: "Feed"
              color: "orange"
              alt: "Atom Feed"
              href: "/atom.xml"
            - label: "LLMs"
              message: "Dataset"
              color: "blue"
              alt: "LLM Dataset"
              href: "/llms.txt"

        custom: |
            <!-- footer custom slot example, can place stats, widgets, etc. -->
            <div id="custom-footer-hook"></div>
            <script>console.log('Custom footer loaded');</script>

    comment:
        enabled: false # Toggle to enable/disable comments, disabled by default
        waline:
            serverURL: https://walines.xingwangzhe.fun
            lang: zh-CN
            # locale: # Optional, custom language configuration
            login: "force" # 'enable' | 'disable' | 'force' (force login prevents impersonation)
            recaptchaV3Key: "" # Optional, configure reCAPTCHA v3 site key to enable CAPTCHA
            turnstileKey: "" # Optional, configure Cloudflare Turnstile key to enable CAPTCHA
            dark: true
            # Emoji preset list: https://waline.js.org/next/guide/features/emoji.html#presets
            reaction: false
            meta:
                - nick
                - mail
                - link
            requiredMeta: []
            commentSorting: "latest"
            # imageUploader: # Optional, custom image upload function
            # highlighter: # Optional, custom code highlighter function
            # texRenderer: # Optional, custom TeX renderer function
            # search: # Optional, custom search function
            wordLimit: 200
            pageSize: 10
```

In terms of functionality ecosystem, the theme includes Waline comment integration, Feather and Simple Icons icon sets, PhotoSwipe image lightbox, Orama full-text search, and a badge generator. For developer experience, Stalux uses TypeScript + CSS Modules, and recommends using Bun for faster install and build speeds, though npm/pnpm/yarn are also fully compatible.

Quick start:

```bash
git clone https://github.com/xingwangzhe/stalux.git my-blog
cd my-blog
# Recommended: Bun
bun install
bun run dev
# Or npm:
# npm install && npm run dev
```

To write a post, simply create a Markdown file under `stalux/posts/`. The minimum frontmatter requires `title`, `abbrlink`, and `date` (optional fields like `tags`, `categories`, `cc`, `cover` enhance article metadata display). To write a "Word", place it under `stalux/words/`. For more detailed configuration and usage examples, see `BACK.yml`, `license.txt` (dependency license listing), and `LICENSE` in the repository.

If you like this theme, please consider giving it a ⭐️ to show your support!
