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
updated: "2026-10-14 14:00:00"
desc: Configure static agent context, Markdown exports, llms discovery files and read-only browser WebMCP tools.
abbrlink: a1b2c3d4
---

## Static agent context: promote.yml

`stalux/config/promote.yml` controls a static site-context section and optional Markdown exports. It does not call an AI model.

```yaml title="stalux/config/promote.yml"
id: promote
llm_promote: |
    This is a personal blog owned by {author}.
    Site: {url}
    Content License: {cc} unless otherwise stated.
export_md: true
```

| Variable | Replaced with |
| --- | --- |
| `{author}` | `author.yml` → `name` |
| `{url}` | `site.yml` → `url` |
| `{title}` | `site.yml` → `title` |
| `{cc}` | `CC-BY-NC-SA-4.0` |

| Behavior | Detail |
| --- | --- |
| Rendering | Build-time `<section data-stalux-ai-prompt>` with text, clipped to one pixel by CSS |
| Visibility | Outside normal visual layout; no `display:none`, `hidden`, `inert` or `aria-hidden` on the context section |
| Coverage | The same configured context on all themed HTML pages |
| Disable context | Leave `llm_promote` empty; this is independent of the WebMCP switch |
| Privacy | All context is public build output; do not place secrets in this field |

## Markdown export

`export_md` defaults to `false`. Only a strict `true` emits Markdown mirrors for the homepage, posts, about, words, links, archives, categories and tags. Published article URLs are `/posts/{abbrlink}.md` and are included in the sitemap when enabled; other Markdown mirrors stay filtered by default.

Article frontmatter is serialized from parsed collection metadata with a YAML Document AST. The original body is preserved and a copyright footer is appended. Exports preserve content, rather than the exact original frontmatter formatting. Draft articles are excluded.

## AI discovery and WebMCP

`stalux/config/ai-discovery.yml` controls discovery file contents and browser tool registration:

```yaml title="stalux/config/ai-discovery.yml"
id: ai-discovery
conformance: essential
```

| Level | Current discovery contents | Browser WebMCP |
| --- | --- | --- |
| `disabled` | Discovery endpoints return their disabled notice | Tools are not registered |
| `essential` | `llms.txt`, `llms-full.txt` | Enabled |
| `recommended` | The same two files; retained compatibility level | Enabled |
| `complete` | The same two files; retained compatibility level | Enabled |

The theme currently emits no `ai.txt`, `ai.json`, `identity.json`, `brand.txt`, `faq-ai.txt`, `llm.txt`, `llms.html`, `developer-ai.txt` or `robots-ai.txt` routes. The compatibility level names do not promise additional files or external certification. Inspect current schemas for supported override fields; obsolete keys are not documented as active configuration.

WebMCP runs in the page through `document.modelContext`, with a polyfill where required. A compatible browser agent can list, find, search and read published posts. It is not a remotely connectable HTTP `/mcp` JSON-RPC service. All tools are read-only and use static artifacts.

| Tool behavior | Data and limits |
| --- | --- |
| Metadata | `/api/posts.json`, published posts only |
| Search | Metadata matches plus Pagefind indexed body hits; at most 10 results, title matches first |
| Partial search | When Pagefind fails, metadata matches explicitly return `fullText: false`; a failed index is not a successful empty full-text result |
| Article read | Markdown export first; otherwise exact Pagefind `post` filter, returning indexed plain text |
| Long reads | `offset` and `maxChars` (maximum 50000 UTF-16 units), with `totalChars`, `truncated` and `nextOffset`; surrogate pairs stay intact |
| Lifecycle | Register on `astro:page-load`; unregister and cancel old work before swap |
| Static HTTP | Status codes and rate limiting depend on the host; the theme exposes no dynamic quota API |

## Verification

Run the theme validation and inspect the generated files:

```bash title="Validate static build artifacts"
bun run validate
rg --files dist | rg '(^|/)(llms(-full)?\.txt|openapi\.json|posts\.json)$'
```

A route's existence alone does not prove its enabled content. Check `llms.txt` and `llms-full.txt` against the configured level, verify the context section is visually clipped, and invoke the seven tools through the actual browser API. Test both `export_md: true` and `false`: Pagefind fallback requires a production build and its search assets. Development mode may have no full-text index.
