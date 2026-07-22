---
title: Custom Head, Analytics & Navigation
tags:
    - Configuration
    - Customization
categories:
    - Theme Config
    - Layout Customization
date: "2025-05-10 12:00:00"
updated: "2026-07-22 12:00:00"
desc: Configure analytics tools (Google Analytics, Bing Clarity, Umami), custom head content, and navigation bar items.
abbrlink: 0035a0ee
---

## head.yml — Analytics & Custom Head

File: `stalux/config/head.yml`

```yaml
id: head
# googleAnalyticsId: "G-XXXXXXXXXX"      # Google Analytics 4 tracking ID
# bingClarityId: ""                       # Microsoft Bing Clarity project ID
# umami:
#   id: ""                                # Umami website ID
#   url: ""                               # Umami script URL
anyhead: "" # Custom HTML injected into <head>
```

### Analytics Tools

| Tool             | Config Field             | Notes                                                       |
| ---------------- | ------------------------ | ----------------------------------------------------------- |
| Google Analytics | `googleAnalyticsId`      | Format `G-XXXXXXXXXX`, theme auto-loads GA4                 |
| Bing Clarity     | `bingClarityId`          | Theme auto-loads Clarity tracking                           |
| Umami            | `umami.id` + `umami.url` | Both `id` and `url` required                                |
| Custom snippets  | `anyhead`                | Arbitrary HTML (e.g., verification meta tags, custom fonts) |

## navs.yml — Navigation Bar

File: `stalux/config/navs.yml`

```yaml
id: navs
items:
    - title: Home
      icon: home
      link: /
    - title: Posts
      icon: archive
      link: /archives
    # ... more items
```

| Field         | Description                                               |
| ------------- | --------------------------------------------------------- |
| `link`        | Internal path or full external URL                        |
| `icon`        | [Lucide Icons](https://lucide.dev/icons/) PascalCase name |
| Search button | Built-in, does not need a nav item                        |

## Common Operations

| Operation        | How                                                                    |
| ---------------- | ---------------------------------------------------------------------- |
| Add analytics    | Set the tracking ID in `head.yml`, no script needed                    |
| Custom head HTML | Use `anyhead` to inject `<meta>`, `<style>`, etc.                      |
| Add a nav item   | Append to `items` in `navs.yml`; external links need `https://` prefix |
| Change favicon   | Set `site.yml` → `favicon` path                                        |
