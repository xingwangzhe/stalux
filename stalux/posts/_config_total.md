---
title: Stalux Theme Configuration Overview
tags:
    - Configuration
    - Getting Started
categories:
    - Theme Config
date: "2025-05-10 10:00:00"
updated: "2026-07-22 00:00:00"
desc: Complete configuration file structure of the Stalux theme — each config section is now a separate YAML file under stalux/config/, with Zod schema validation.
abbrlink: 0b563d42
---

## Configuration File Structure

The Stalux theme uses Astro content collections. Configuration files are stored as individual YAML files under `stalux/config/`, each validated by a dedicated Zod schema:

```bash
stalux/config/
├── site.yml          # Site identity: title, url, description, lang, timezone, canonical, favicon
├── author.yml        # Author info: name, avatar, bio
├── head.yml          # Analytics & custom <head>: Google Analytics, Bing Clarity, Umami, anyhead
├── navs.yml          # Navigation bar items
├── typetexts.yml     # Homepage typing animation texts
├── media-links.yml   # Social media links (rendered with simple-icons SVGs)
├── links.yml         # Friend links: title, description, sites list
├── footer.yml        # Footer: buildtime, copyright, theme, beian, badges, custom HTML
├── comment.yml       # Comment system (Waline): enabled toggle + waline config
├── promote.yml       # LLM promote hidden text + export_md toggle
└── ai-discovery.yml  # AI discovery files (llms.txt, ai.txt, etc.): conformance level & overrides
```

The schema definitions are in `src/schemas/config.ts`, using `z.discriminatedUnion("id")` to join them into a single `config` collection.

## Quick Start

1. Set your site identity in `site.yml`
2. Add your name/bio in `author.yml`  
3. Configure navigation in `navs.yml`
4. Add social links in `media-links.yml`
5. Build: `bun run build`

## Validation

All config files are validated at build time against their Zod schemas. Missing required fields or invalid formats will produce clear error messages.

## Detailed Guides

See the `_config_*.md` article series under `stalux/posts/` for each config section:

| Article | Covers |
|---------|--------|
| `_config_basic.md` | site.yml, author.yml, content collections |
| `_config_header_and_head.md` | head.yml, navs.yml |
| `_config_text_media.md` | typetexts.yml, media-links.yml, links.yml |
| `_config_footer.md` | footer.yml |
| `_config_comment.md` | comment.yml |
| `_config_llm_promote.md` | promote.yml, ai-discovery.yml |
| `_config_code.md` | Expressive Code syntax highlighting |
| `_markdown.md` | Markdown rendering & Sätteri processor |
