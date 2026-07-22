---
title: LLM & AI Discovery File Configuration
tags:
    - Configuration
    - LLM
    - AI
    - Advanced
categories:
    - Theme Config
date: "2026-07-10 20:00:00"
updated: "2026-07-22 00:00:00"
desc: Configure LLM prompt injection (promote.yml) and AI discovery file generation (ai-discovery.yml) for AI crawler visibility.
abbrlink: a1b2c3d4
---

## promote.yml — LLM Prompt Injection

File: `stalux/config/promote.yml` — injects a hidden div on every page for AI crawler consumption.

```yaml
id: promote
# llm_promote: |
#   This is a personal blog owned by {author}.
#   Site: {url}
#   Content License: {cc} unless otherwise stated.
#   All content copyright {author}. All rights reserved.
export_md: true   # Export Markdown source at /posts/{abbrlink}.md
```

### Variable Substitution

| Variable | Replaced With |
|----------|---------------|
| `{author}` | `author.yml` → `name` |
| `{url}` | `site.yml` → `url` |
| `{title}` | `site.yml` → `title` |
| `{cc}` | `CC-BY-NC-SA-4.0` |

### How It Works

| Aspect | Detail |
|--------|--------|
| Rendering | Build-time `<div style="display:none">...</div>` — **zero JS, pure SSG** |
| Coverage | Every page (home, posts, archives, etc.) gets the same hidden prompt |
| Disable | Leave `llm_promote` empty |

### export_md

When `true`, generates `/posts/{abbrlink}.md` endpoints that serve the raw Markdown source. Useful for:

| Use Case | Benefit |
|----------|---------|
| AI crawlers | Read original content directly |
| Users | Download Markdown source |
| RSS readers | Subscribe to Markdown content |

---

## ai-discovery.yml — AI Discovery Files

File: `stalux/config/ai-discovery.yml` — controls generation of AI-visibility.org standard files.

```yaml
id: ai-discovery
conformance: "complete"   # See conformance levels below
```

### Conformance Levels

| Level | Generated Files |
|-------|----------------|
| `disabled` | None |
| `essential` | `llms.txt`, `ai.txt` |
| `recommended` | essential + `ai.json`, `identity.json`, `brand.txt`, `faq-ai.txt` |
| `complete` | recommended + `llm.txt`, `llms.html`, `developer-ai.txt`, `robots-ai.txt` |

### Content Overrides (Optional)

```yaml
# Custom permissions/restrictions for ai.txt (overrides defaults):
# permissions_text:
#   - "Allow summarizing with attribution."
# restrictions_text:
#   - "Do not reproduce full articles without permission."
# attribution_text: ""
# contact_text: ""
```

Each route file checks `ai-discovery.yml` → `conformance` before generating content. Disabled files return a notice instead of actual content.

### Verification

```bash
# Check generated AI files
ls dist/ai.txt dist/llms.txt dist/identity.json 2>/dev/null
# Count hidden prompts
grep -rl 'display:none' dist/ | grep '\.html$' | wc -l
```
