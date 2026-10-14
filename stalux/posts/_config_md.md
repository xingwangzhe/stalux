---
title: Markdown File Configuration Reference
tags:
    - Configuration
    - Markdown
    - Content Creation
categories:
    - Theme Config
date: "2025-05-10 16:00:00"
updated: "2026-10-14 14:00:00"
desc: This article is rewritten according to the current schema (see src/schemas/collections.ts), listing the frontmatter requirements and examples for posts, about, and words. Avoid using project-internal relative links to ensure no broken links when published to the site.
abbrlink: f31dae4f
---

## Overview

This article is rewritten according to the current schema (see src/schemas/collections.ts), listing the frontmatter requirements and examples for posts, about, and words. Avoid using project-internal relative links to ensure no broken links when published to the site.

## posts/\*.md frontmatter

Loader: base is `stalux/posts/`, pattern `*.md`/`*.mdx`.

Required fields:

- `title`: Post title.
- `desc`: Non-empty post summary, used by metadata, previews and agent tools.
- `abbrlink`: Permanent link, supports strings or numbers (numbers are automatically converted to strings). It is recommended to manually set this to keep URLs stable.
- `date`: Publish time, **string type**, recommended format `YYYY-MM-DD HH:mm:ss`, must be wrapped in double quotes to prevent YAML from automatically converting it to a Date object.

Optional fields:

- `updated`: Update date, **string type**, same format as `date`, also needs double quotes. If not provided, the update time will not be displayed.
- `draft`: Boolean, default false; drafts are excluded from published pages, indexes and Markdown exports.
- `tags`: Tag array; a string or single string will be preprocessed into an array.
- `categories`: Category array; a string or single string will be preprocessed into an array.
- `cc`: Copyright license, default `CC-BY-NC-SA-4.0`.
- `cover`: Optional image URL.

Example:

```markdown
---
title: Astro Getting Started Guide
desc: A practical guide to starting an Astro blog.
abbrlink: astro-guide
date: "2025-05-10 09:30:00"
updated: "2025-05-12 18:00:00"
tags:
    - Astro
    - Frontend
categories:
    - Tech Tutorial
cc: CC-BY-NC-SA-4.0
draft: false
---

Body content...
```

Writing tips:

- **Recommended date format**: `YYYY-MM-DD HH:mm:ss` (e.g., `"2025-05-10 09:30:00"`).
- Must be wrapped in **double quotes**, otherwise YAML will automatically convert it to a Date object, causing schema validation to fail.
- `abbrlink` can be a string (e.g., `"astro-guide"`) or a number (e.g., `123456`); numbers are automatically converted to strings.
- `tags`/`categories` support a single string or an array; they are automatically converted to arrays internally.
- If `cc` is not provided, the default value `CC-BY-NC-SA-4.0` is used; if no copyright notice is needed, it can be set to an empty string.

## about/\*.md frontmatter

Loader: base is `stalux/about/`, pattern `**/*.{md,mdx}`.

Fields:

- `title` is required.
- `description` is required (used for page description/SEO).

Example:

```markdown
---
title: About the Author
description: Personal introduction, skills, and contact information
---

Here is the about page body...
```

## words/\*.md frontmatter

Loader: base is `stalux/words/`, pattern `*.md`/`*.mdx`.

All fields are optional:

- `source`: Source or author name.
- `link`: Source link; when present, `source` will render as a clickable external link.
- `sourceDate`: The date associated with the source, displayed in italics at the bottom-right of the card.
- `date`: The date this quote was written, displayed at the bottom-left of the card and used for sorting; same format as posts' `date`.
- `updated`: Update date, string, same format as `date`.
- `draft`: Boolean, default `false`; when `true`, not displayed.

Example:

```markdown
---
source: "Quake III Arena"
link: "https://en.wikipedia.org/wiki/Fast_inverse_square_root"
sourceDate: "1999"
date: "2026-06-18 20:45:00"
updated: "2026-06-18 21:00:00"
draft: false
---

Talk is cheap. Show me the `code`.
```

## promote.yml: Markdown Export (`export_md`)

Field in `stalux/config/promote.yml`:

- `export_md`: Boolean, default `false`. Markdown export is opt-in: only a strict `true` generates `.md` routes for the home page, posts, about, words, links, archives, categories, and tags.

Published article endpoints use `Content-Type: text/markdown`. Frontmatter is serialized from the collection metadata through a YAML Document AST; the Markdown body is preserved and a copyright footer is appended. This is a content-equivalent export, not a byte-for-byte copy of the source file. List and taxonomy endpoints render Markdown summaries.

Example:

```yaml title="stalux/config/promote.yml"
id: promote
export_md: true
```

Note:

- `export_md` is a site-level opt-in config, not a per-article frontmatter field.
- When disabled or omitted, no `.md` export files are generated.
- Only non-draft articles get post `.md` endpoints.
- When `promote.export_md` is `true`, published post `.md` endpoints are included in the sitemap. Other Markdown mirrors remain excluded by default.
- Browser WebMCP reads this export when available, or falls back to Pagefind indexed plain text when export is disabled. Disabling both sources prevents full article reads.

## Writing and Validation

- Place frontmatter at the top of the file, wrapped in three dashes.
- Leave a space after colons, maintain correct indentation for arrays/objects.
- After saving, run `bun run dev`; if any required fields are missing or types don't match, the build log will indicate the specific fields.
