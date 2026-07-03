---
title: Custom Head and Header Navigation
tags:
    - Configuration
    - Customization
categories:
    - Theme Config
    - Layout Customization
date: "2025-05-10 12:00:00"
updated: "2026-02-03 12:00:00"
desc: Use the head field in config.yml to configure website analytics tools (Google Analytics, Bing Clarity, Umami) and custom head content.
abbrlink: 0035a0ee
---

## Head Customization and Analytics Tools

Use the `head` field in config.yml to configure website analytics tools (Google Analytics, Bing Clarity, Umami) and custom head content:

```yaml
head:
    # Google Analytics 4 tracking ID (format: G-XXXXXXXXXX)
    googleAnalyticsId: "G-XXXXXXXXXX"

    # Microsoft Bing Clarity project ID
    bingClarityId: "your-clarity-id"

    # Umami analytics configuration
    umami:
        id: "your-umami-website-id" # Website ID
        url: "https://umami.example.com/umami.js" # Umami script URL

    # Additional custom head content (HTML string)
    anyhead: |
        <!-- Custom styles -->
        <style>:root { --theme-color: #42b883; }</style>
        <!-- Other custom scripts -->
```

### Analytics Tools Overview

- **Google Analytics**: Just fill in `googleAnalyticsId`, and the theme will automatically load the GA4 script.
- **Bing Clarity**: Fill in `bingClarityId`, and the theme will automatically load the Microsoft Clarity tracking code.
- **Umami**: Both `id` (website ID) and `url` (script address) must be provided.

All analytics scripts run in a Web Worker using `partytown`, so they won't affect page performance.

### Migrating from Legacy Configuration

Users who previously inserted scripts directly via `anyhead` are recommended to migrate to the new structured configuration:

- Remove analytics scripts from `anyhead`
- Fill in the corresponding tracking IDs into the appropriate configuration fields
- Keep other custom content in `anyhead`

## Header Navigation

Navigation configuration comes from the `navs` array in config.yml:

```yaml
navs:
    - title: Home
      icon: home
      link: /
    - title: Posts
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
```

Notes:

- `link` supports internal paths or full external links; `icon` uses [Lucide Icons](https://lucide.dev/icons/) standard names (e.g., `home`, `train-front`).
- To add a new navigation item, append it following the same structure; the search entry is built-in and does not need manual configuration.

## Common Operations

- Add analytics tools: Configure the corresponding tracking ID under `head`, no need to manually write scripts.
- Add custom head content: Use `head.anyhead` to insert additional HTML snippets.
- Add new navigation items: Append items at the end of `navs`; external links must include the protocol (https://).
- Change favicon: Modify the `favicon` path in config.yml (supports absolute or site-relative paths).
