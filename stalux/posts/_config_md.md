---
title: Markdown File Configuration Reference
tags:
    - Configuration
    - Markdown
    - Content Creation
categories:
    - Theme Config
date: "2025-05-10 16:00:00"
updated: "2026-01-26 00:00:00"
desc: This article is rewritten according to the current schema (see src/content.config.ts), listing the frontmatter requirements and examples for posts, about, and words. Avoid using project-internal relative links to ensure no broken links when published to the site.
abbrlink: f31dae4f
---

## Overview

This article is rewritten according to the current schema (see src/content.config.ts), listing the frontmatter requirements and examples for posts, about, and words. Avoid using project-internal relative links to ensure no broken links when published to the site.

## posts/\*.md frontmatter

Loader: base is `stalux/posts/`, pattern `*.md`/`*.mdx`.

Required fields:

- `title`: Post title.
- `abbrlink`: Permanent link, supports strings or numbers (numbers are automatically converted to strings). It is recommended to manually set this to keep URLs stable.
- `date`: Publish time, **string type**, recommended format `YYYY-MM-DD HH:mm:ss`, must be wrapped in double quotes to prevent YAML from automatically converting it to a Date object.

Optional fields:

- `updated`: Update date, **string type**, same format as `date`, also needs double quotes. If not provided, the update time will not be displayed.
- `draft`: Boolean, default false; when true, can be used for local draft control.
- `tags`: Tag array; a string or single string will be preprocessed into an array.
- `categories`: Category array; a string or single string will be preprocessed into an array.
- `cc`: Copyright license, default `CC-BY-NC-SA-4.0`.

Example:

```markdown
---
title: Astro Getting Started Guide
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

## config.yml: Markdown Source Export (`export_md`)

Field in the site-level config (see `config.yml`):

- `export_md`: Boolean, default `false`. When `true`, Astro generates `/posts/{abbrlink}.md` routes at build time, serving each published article's raw Markdown source with `Content-Type: text/markdown`.

The source is read directly from the original `.md` file when available, falling back to a reconstruction from frontmatter + body data.

Example:

```yaml
stalux:
    export_md: true
```

Note:

- `export_md` is a site-level config, not a per-article frontmatter field.
- Only non-draft articles get `.md` endpoints.
- The sitemap filters out `.md` pages to avoid duplicate content issues.
- Useful for readers who want to view or reuse the raw source.

## Writing and Validation

- Place frontmatter at the top of the file, wrapped in three dashes.
- Leave a space after colons, maintain correct indentation for arrays/objects.
- After saving, run `bun run dev`; if any required fields are missing or types don't match, the build log will indicate the specific fields.
