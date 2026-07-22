---
title: Footer Configuration Details
tags:
    - Configuration
    - Footer
categories:
    - Theme Config
date: "2025-05-10 15:00:00"
updated: "2026-07-22 12:00:00"
desc: Footer configuration from footer.yml — buildtime, copyright, badges, beian, and custom HTML.
abbrlink: dd30cf92
---

## Overview

Footer configuration is in `stalux/config/footer.yml`:

```yaml
id: footer
buildtime: "2025-05-01T10:00:00"      # Build time for uptime display
copyright:
    enabled: true
    startYear: 2024
    customText: ""
theme:
    showPoweredBy: true
    showThemeInfo: true
beian:
    icp:
        enabled: false
        number: "ICP备XXXXXXXX号"
    security:
        enabled: false
        text: "Public Security Filing"
        number: "XXXXXXXXXXXX"
badges:
  - label: "Powered by"
    message: "Astro"
    color: "orange"
    style: "flat-square"
    href: "https://astro.build/"
  # ... more badges ...
  # Collapsible badge group (v1.1+):
  - title: "博客社区"
    collapsed: true
    items:
      - label: "示例社区A"
        message: "社区"
        color: "green"
        href: "https://example.com"
      - label: "示例社区B"
        message: "导航"
        color: "yellow"
        href: "https://example.org"
custom: |
    <div id="custom-footer-hook"></div>
```

## Badge Types

| Type | Fields | Behavior |
|------|--------|----------|
| Flat badge | `label`, `message`, `color`, `style`, `alt`, `href` | Renders a single badge |
| Badge group | `title`, `collapsed`, `items[]` | Collapsible `<details>` with localStorage persistence |

## Common Operations

| Operation | How |
|-----------|-----|
| Update filing numbers | Enable the toggle and fill in the number |
| Simplify badges | Remove items you don't need |
| Customize copyright | Set `customText` or adjust `startYear` |
| Add scripts | Place them in `custom` (trusted scripts only) |
