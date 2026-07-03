---
title: Site Basic Information
tags:
    - Configuration
    - Basic Config
categories:
    - Theme Config
date: "2025-05-10 11:00:00"
updated: "2026-01-26 12:00:00"
desc: Site basic information configuration guide, including file structure, content collection locations, required and optional frontmatter fields, and writing notes.
abbrlink: ad81245d
---

## Main File Structure

```bash
stalux/
├── public/  # Public resources folder
├── src/
│   ├── assets/  # Static assets, generally don't modify
│   ├── components/ # Components
│   │   └── stalux/ # Theme components
│   │       ├── archives/ # Archives
│   │       ├── categories/ # Categories
│   │       ├── common/ # Common components
│   │       ├── footer/ # Footer
│   │       ├── layout/ # Layout
│   │       ├── links/  # Friend links
│   │       ├── posts/  # Posts
│   │       ├── tags/   # Tags
│   │       └── words/  # Words cards
│   ├── layouts/ # Layout files
│   ├── pages/ # Page files
│   │   ├── api/ # API folder
│   │   ├── categories/ # Categories page
│   │   ├── posts/ # Posts page
│   │   ├── tags/ # Tags page
│   │   └── words.astro # Words page
│   ├── scripts/ # Script files
│   ├── styles/
│   │   ├── base/ # Base styles
│   │   ├── components/ # Component styles
│   │   │   ├── archives/ # Archives
│   │   │   ├── categories/ # Categories
│   │   │   ├── common/ # Common components
│   │   │   ├── footer/ # Footer
│   │   │   ├── layout/ # Layout
│   │   │   ├── links/  # Friend links
│   │   │   ├── markdown.css # Markdown styles
│   │   │   ├── posts/  # Posts
│   │   │   ├── search.css # Search styles
│   │   │   ├── tags/   # Tags
│   │   │   └── words/  # Words
│   │   └── pages/ # Page styles
│   ├── utils/ # Utility files
│   └── content.config.ts # Content configuration file
├── stalux
│   ├── about/ # About .md
│   ├── posts/ # Posts .md
│   └── words/ # Words .md
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── README.md
└── (other files)
```

## Content Collection Locations

Content collections use `astro:content` and are stored by default under the root `stalux/` directory:

- `stalux/posts/`: Post Markdown/MDX files, constrained by the posts collection schema.
- `stalux/about/`: About page Markdown/MDX files, constrained by the about collection schema.
- `stalux/words/`: Words/quotes Markdown files, constrained by the words collection schema.

## posts/\*.md frontmatter

Required:

- `title`: Post title.
- `abbrlink`: Permanent link identifier, string or number (numbers are automatically converted to strings); used to generate the `/posts/{abbrlink}` route.
- `date`: Publish time, supports ISO 8601 format (e.g., `2025-05-10T09:30:00+08:00`) or `YYYY-MM-DD HH:mm:ss` format.
- `desc`: Post description, used for SEO meta description and Open Graph. **Must be manually written**, cannot be empty, recommended 50–160 characters.

Optional:

- `updated`: Update date, supports ISO 8601 format or `YYYY-MM-DD HH:mm:ss` format.
- `draft`: Draft status, default `false`; when `true` the post will not appear in the published list.
- `tags`: Tag array; a single string will also be converted to an array.
- `categories`: Category array; a single string will also be converted to an array.
- `cc`: Copyright license, default `CC-BY-NC-SA-4.0`.

Example:

```markdown
---
title: Sample Post
abbrlink: sample-post
date: 2025-05-10T12:00:00+08:00
desc: This is a sample post demonstrating Stalux theme frontmatter writing.
updated: 2025-05-12T09:00:00+08:00
tags:
    - Tech
    - Essay
categories:
    - Frontend
cc: CC-BY-NC-SA-4.0
draft: false
---

Body content...
```

## about/\*.md frontmatter

Required:

- `title`: Page title.
- `description`: Page description (used for page intro/SEO).

Example:

```markdown
---
title: About This Site
description: Personal introduction and site information
---

Content...
```

## words/\*.md frontmatter

Used for the `/words` quotes page, suitable for collecting short phrases, code snippets, or sayings.

Required: None.

Optional:

- `source`: Source or author name.
- `link`: Source link; when present, `source` will render as a clickable external link.
- `sourceDate`: The date associated with the source, displayed in italics at the bottom-right of the card.
- `date`: The date this quote was written, displayed at the bottom-left of the card; also used for sorting.
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

## Writing Notes

- Wrap frontmatter with `---` at the top; leave a space after colons, maintain indentation for arrays/objects.
- It is recommended to use ISO 8601 format (with timezone offset) for dates, for easier sorting and display.
- It is recommended to use custom strings for `abbrlink` to ensure stable links independent of the title.
