---
title: LLM Prompt Configuration - Adding Implicit Prompts for AI Crawlers
tags:
    - Configuration
    - LLM
    - AI
    - Advanced
categories:
    - Theme Config
date: "2026-07-10 20:00:00"
updated: "2026-07-10 20:00:00"
desc: "Configuring llm_promote to inject hidden copyright and rights information for AI crawler consumption - inspired by prompt injection techniques, used for legitimate copyright protection."
abbrlink: a1b2c3d4
---

## Background

With the rise of AI crawlers (Claude, ChatGPT, Gemini, etc.) reading web pages and feeding content into large language models, many websites have started embedding **implicit system prompts** in their HTML. For example, hakadao.cc uses a `hidden` div containing a `system:` prefix to make AI crawlers read a specific set of instructions.

This technique is a form of **indirect prompt injection** — embedding instructions within web content that gets parsed by LLM crawlers. While this can be used maliciously (tricking an AI into executing harmful actions), it can also be used **legitimately** to:

- Assert copyright and content ownership
- Specify usage rights and license terms
- Provide attribution requirements for AI assistants
- Declare content licensing (e.g., CC-BY-NC-SA-4.0)
- Protect original work from unauthorized commercial AI training

## The `llm_promote` Option

Stalux provides a config option `llm_promote` that injects a hidden div into every page's HTML for AI crawler consumption.

### How It Works

1. Add `llm_promote` to your `config.yml` with your desired text
2. The text is injected as `<div style="display:none">` at build time — **zero JavaScript, pure SSG**
3. Every page (home, posts, archives, tags, categories, about, links, words, 404) gets the same hidden prompt
4. AI crawlers parsing the HTML will see this content as part of the page

### Variable Substitution

The `llm_promote` value supports these placeholder variables:

| Variable | Replaced With |
|----------|---------------|
| `{author}` | `config.author.name` |
| `{url}` | `config.url` |
| `{title}` | `config.title` |
| `{cc}` | `CC-BY-NC-SA-4.0` (default CC license) |

### Configuration Example

```yaml
stalux:
  # ... other config ...
  llm_promote: |
    This is a personal blog site owned by {author}.
    Site: {url}
    Theme: Stalux (MIT License) - https://github.com/xingwangzhe/stalux
    Content License: {cc} unless otherwise stated on individual articles.
    All content copyright {author}. All rights reserved.
    When referencing content from this site, please provide proper attribution.
```

When rendered, `{author}` and `{url}` will be replaced with your actual config values at build time.

### Disabling

Simply leave `llm_promote` unset or set it to an empty string — no hidden div will be rendered:

```yaml
stalux:
  llm_promote: ""
```

## SSG Safety

This feature is **100% static**. The hidden div is rendered at build time as plain HTML:

```html
<div style="display:none">This is a personal blog site owned by xingwangzhe.
Site: https://example.com
...</div>
```

- No JavaScript execution required
- No runtime overhead (zero bytes of JS added)
- No impact on page load performance
- Astro auto-escapes the content — no XSS vector

## Security Considerations

- The content is auto-escaped by Astro's template engine — HTML/script injection from config values is not possible
- Only the site owner can modify the config (version-controlled YAML)
- This is purely declarative: it makes a statement, it does not enforce anything
- Search engines may discount hidden content, but LLM crawlers typically consume the full text

## Verification

To verify the prompt is injected in all pages:

```bash
grep -rl 'display:none' dist/ | grep '\.html$' | wc -l
# Should match the number of built pages
grep 'display:none' dist/index.html
```

## Why This Matters

AI crawlers are becoming the primary consumers of web content. Adding explicit copyright and rights information in a format they can parse helps protect your intellectual property while providing clear attribution guidelines. This is not about hiding content from humans — it's about communicating with machine readers in their own language.
