---
title: Footer Configuration Details
tags:
    - Configuration
    - Footer
categories:
    - Theme Config
date: "2025-05-10 15:00:00"
updated: "2026-01-26 12:00:00"
desc: Footer fields come from the footer section of config.yml. The default values are as follows and do not depend on relative links within the project after publishing.
abbrlink: dd30cf92
---

## Overview

Footer fields come from the `footer` section of config.yml. The default values are as follows and do not depend on relative links within the project after publishing:

```yaml
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
        icp:
            enabled: false
            number: "ICP备XXXXXXXX号"
        security:
            enabled: false
            text: "Public Security Filing XXXXXXXXXXXX"
            number: "XXXXXXXXXXXX"
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
        - { label: "Atom", message: "Feed", color: "orange", alt: "Atom Feed", href: "/atom.xml" }
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
```

## Field Descriptions

- `buildtime`: Build time string, used for displaying site uptime on the frontend; it is recommended to fill in the actual deployment time.
- `copyright`: Copyright section toggle, start year, and custom text; when `enabled` is off, copyright info is not displayed.
- `theme`: Whether to show Powered by / Theme info.
- `beian`: Toggle and numbers for ICP and public security filing; only displayed when `enabled` is true.
- `badges`: Badge array, properties include `label`, `message`, `color`, `style` (e.g., flat-square/for-the-badge), `alt`, `href`.
- `custom`: Custom HTML snippet inserted into the footer, can be used for analytics or widgets.

## Common Operations

- Update filing numbers: Enable the corresponding `enabled` flag and fill in the number/text.
- Simplify badges: Remove unnecessary items, keeping only those relevant to your site.
- Customize copyright text: Fill in `customText` or adjust `startYear` to match the current year.
- Add scripts: Place analytics/verification code in `custom`; note that only trusted scripts should be inserted to avoid cross-origin security risks.
