---
title: Site Basic Information & Content Collections
tags:
    - Configuration
    - Basic Config
categories:
    - Theme Config
date: "2025-05-10 11:00:00"
updated: "2026-07-22 00:00:00"
desc: Site identity configuration (site.yml, author.yml), content collection structure, frontmatter field references, and writing notes.
abbrlink: ad81245d
---

## site.yml — Site Identity

File: `stalux/config/site.yml`

```yaml
id: site
lang: en                              # Language: "en" | "zh-CN"
title: Stalux Blog Theme              # Site title
url: https://stalux.needhelp.icu      # Site URL (used for canonical, RSS, OpenGraph)
description: "Blog theme Stalux ..."  # Site description (SEO, OpenGraph)
timezone: "Asia/Shanghai"             # IANA timezone for date formatting
favicon: "/stalux.ico"                # Favicon path
canonical: "https://stalux.needhelp.icu"  # Canonical URL (optional, falls back to url)
# twitterSite:                        # Twitter/X site handle (optional)
# noindex: false                      # Global noindex (optional, default false)
# nofollow: false                     # Global nofollow (optional, default false)
```

## author.yml — Author Information

File: `stalux/config/author.yml`

```yaml
id: author
name: xingwangzhe        # Display name
avatar: /avatar.png      # Avatar path
bio: Blog Theme Stalux   # Short bio
```

Rendered on: post sidebars, homepage author card, SEO JSON-LD.

## Content Collections

Content is managed through Astro's `astro:content` system under the `stalux/` directory:

```bash
stalux/
├── posts/     # Blog posts (.md / .mdx)
├── about/     # About pages (.md / .mdx)
├── words/     # Quotes & snippets (.md)
└── config/    # Theme configuration (.yml)
```

### Posts (`stalux/posts/*.md`)

Required frontmatter:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Post title |
| `abbrlink` | string\|number | Permanent link ID, generates `/posts/{abbrlink}` route |
| `date` | string | Publish time, ISO 8601 or `YYYY-MM-DD HH:mm:ss` |
| `desc` | string | Post description for SEO/OG. **Must be manually written**, 50–160 chars recommended |

Optional frontmatter:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `updated` | string | — | Update time |
| `draft` | boolean | `false` | Hide from published lists |
| `tags` | string[] | — | Tag array (single string auto-converted) |
| `categories` | string[] | — | Category array |
| `cc` | string | `CC-BY-NC-SA-4.0` | License |
| `cover` | string | — | Post cover image URL/path |

Example:

```markdown
---
title: Sample Post
abbrlink: sample-post
date: 2025-05-10T12:00:00+08:00
desc: A short description for SEO and preview cards.
updated: 2025-05-12T09:00:00+08:00
tags: [Tech, Essay]
categories: [Frontend]
cc: CC-BY-NC-SA-4.0
draft: false
cover: /images/cover.jpg
---

Post body...
```

### About (`stalux/about/*.md`)

Required: `title` (page title), `description` (page description).

### Words (`stalux/words/*.md`)

Optional frontmatter: `source`, `link`, `sourceDate`, `date`, `updated`, `draft`.

## Writing Notes

| Guideline | Detail |
|-----------|--------|
| Delimiter | Wrap frontmatter between `---` |
| Date format | ISO 8601 with timezone offset recommended |
| Permalinks | Choose stable custom `abbrlink` values (independent of title changes) |
| Descriptions | Must be meaningful for SEO and social share cards |
