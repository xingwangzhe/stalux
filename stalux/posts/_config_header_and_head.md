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

| Tool              | Config Field             | Notes                                                       |
| ----------------- | ------------------------ | ----------------------------------------------------------- |
| Google Analytics  | `googleAnalyticsId`      | Format `G-XXXXXXXXXX`, theme auto-loads GA4                 |
| Microsoft Clarity | `bingClarityId`          | Theme auto-loads Clarity tracking                           |
| Umami             | `umami.id` + `umami.url` | Both `id` and `url` required                                |
| Custom snippets   | `anyhead`                | Arbitrary HTML (e.g., verification meta tags, custom fonts) |

### Microsoft Clarity setup

Set the Project ID from your Clarity project in `head.yml`:

```yaml
id: head
bingClarityId: "YOUR_CLARITY_PROJECT_ID"
```

The field name is kept for compatibility with older Stalux configuration, while the product is now called Microsoft Clarity. In the Clarity console, open **Settings → Setup → Get tracking code** and use the Project ID for that project. Stalux injects the asynchronous loader into `<head>` for you; do not paste the same snippet into `anyhead`, Google Tag Manager, or another integration.

The Project ID is a public client-side identifier. It is not the Data Export API token. Keep Data Export tokens server-side and never place them in `head.yml` or browser code. To verify a deployed site, check that the generated `https://www.clarity.ms/tag/<project-id>` URL preserves the configured value and that Network shows `https://www.clarity.ms/collect`. The loader is guarded so Astro View Transitions do not add another Stalux loader.

If the host site has a strict CSP or needs cookie consent, configure those policies and consent signals at the host site. Stalux only loads the tracking code and does not make privacy or legal-compliance decisions.

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
