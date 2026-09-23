#!/usr/bin/env node

/**
 * Stalux CLI — 主题初始化工具
 *
 * 用法：
 *   bunx stalux init              # 在当前目录初始化内容模板
 *   bunx stalux init my-blog      # 在子目录初始化项目
 *
 * 说明：
 *   - 只在 stalux/ 目录下生成内容配置文件和示例文章
 *   - 不会覆盖已有的 package.json、astro.config.ts、src/content.config.ts
 *   - 静默运行，无交互式问答
 *   - 静默运行，无交互式问答
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

// ---------------------------------------------------------------------------
// 默认内容模板数据
// ---------------------------------------------------------------------------

function timestamp(): string {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function getConfigYamls(): Record<string, string> {
    const year = new Date().getFullYear();
    const now = new Date().toISOString();
    return {
        "site.yml": `id: site
lang: en
title: "My Blog"
description: "A blog built with Stalux theme"
url: "https://example.com"
timezone: "Asia/Shanghai"
`,
        "author.yml": `id: author
name: "Your Name"
avatar: "/avatar.png"
bio: "Blogger & Developer"
`,
        "navs.yml": `id: navs
items:
    - title: "Home"
      link: "/"
      icon: "house"
    - title: "Archives"
      link: "/archives"
      icon: "archive"
    - title: "Tags"
      link: "/tags"
      icon: "tag"
    - title: "Categories"
      link: "/categories"
      icon: "folder"
    - title: "Words"
      link: "/words"
      icon: "quote"
    - title: "Links"
      link: "/links"
      icon: "link"
`,
        "head.yml": `id: head
# googleAnalyticsId: "G-XXXXXXXXXX"
# bingClarityId: "xxxxxxxxxx"
# umami:
#     id: ""
#     url: ""
# anyhead: ""
`,
        "footer.yml": `id: footer
buildtime: "${now}"
copyright:
    enabled: true
    startYear: ${year}
    customText: ""
theme:
    showPoweredBy: true
    showThemeInfo: true
beian:
    icp:
        enabled: false
        number: ""
    security:
        enabled: false
        text: ""
        number: ""
badges:
    - label: "Powered by"
      message: "Astro"
      color: "orange"
      style: "flat-square"
      href: "https://astro.build/"
custom: |
    <div id="custom-footer-hook"></div>
`,
        "media-links.yml": `id: media-links
items:
    - icon: "github"
      link: "https://github.com/yourname"
`,
        "links.yml": `id: links
title: "Links"
description: "Friends & Resources"
sites:
    - name: "Astro"
      description: "The web framework for content-driven websites"
      link: "https://astro.build"
      icon: "https://astro.build/favicon.svg"
`,
        "comment.yml": `id: comment
enabled: false
`,
        "promote.yml": `id: promote
export_md: false
# llm_promote: |
`,
        "ai-discovery.yml": `id: ai-discovery
conformance: "disabled"
`,
        "typetexts.yml": `id: typetexts
items:
    - "Free for free, not free for charge!"
    - "Where's the any key?"
    - "Press F12?"
    - "Hello World!"
`,
    };
}

function getExamplePost(): string {
    const date = timestamp();
    return `---
title: Hello Stalux!
abbrlink: hello-stalux
date: "${date}"
tags: [Stalux, Getting Started]
categories: [Blog]
desc: Welcome to Stalux!
cc: CC-BY-NC-SA-4.0
---

Welcome to **Stalux**!

This is your first post. Edit or delete it, then start writing your own content.

## Features

- 🌙 Dark mode with elegant glassmorphism design
- 🔤 Per-route font subsetting — each page loads only needed characters
- 🔍 Full-text search (Pagefind)
- 📡 RSS & Atom feeds
- 💬 Comment system (Waline)
- 📊 Mermaid diagrams
- 📐 Math formula rendering
- 🖼️ PhotoSwipe lightbox

For more details, visit [Stalux documentation](https://stalux.needhelp.icu).
`;
}

function getAboutMd(): string {
    return `---
title: About Me
description: About this blog and the author
---

Hello! Welcome to my blog.

This is my personal space where I share technology, life, and thoughts.

## About This Site

- Built with [Astro](https://astro.build) + [Stalux](https://stalux.needhelp.icu)
- Content licensed under CC-BY-NC-SA-4.0
- Source code hosted on GitHub
`;
}

function getWordsTemplate(): string {
    const date = timestamp();
    return `---
source: "Author Name"
link: "https://example.com"
sourceDate: ""
date: "${date}"
---

> A quote or short note...
`;
}

function getWordsExample(): string {
    const date = timestamp();
    return `---
source: "Albert Einstein"
link: "https://example.com"
sourceDate: ""
date: "${date}"
---

> Imagination is more important than knowledge.
`;
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

function writeIfMissing(filePath: string, label: string, content: string): void {
    if (existsSync(filePath)) {
        console.log(`  ⏭  ${label} (exists, skipped)`);
        return;
    }

    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content);
    console.log(`  ✅  ${label}`);
}

function main([command, targetArg = "."]: string[] = process.argv.slice(2)): void {
    if (!command || command === "--help" || command === "-h") {
        printHelp();
        return;
    }

    if (command !== "init") {
        console.error(`❌ Unknown command: ${command}`);
        printHelp();
        process.exitCode = 1;
        return;
    }

    const targetPath = resolve(process.cwd(), targetArg);
    const contentRoot = join(targetPath, "stalux");
    console.log(`📦 Initializing Stalux content in ${targetPath}...\n`);

    for (const dir of ["config", "posts", "about", "words"]) {
        mkdirSync(join(contentRoot, dir), { recursive: true });
    }

    const files = {
        ...Object.fromEntries(
            Object.entries(getConfigYamls()).map(([name, content]) => [`config/${name}`, content]),
        ),
        "posts/hello-stalux.md": getExamplePost(),
        "about/index.md": getAboutMd(),
        "words/_template.md": getWordsTemplate(),
        "words/einstein-imagination.md": getWordsExample(),
    };
    for (const [file, content] of Object.entries(files)) {
        writeIfMissing(join(contentRoot, file), `stalux/${file}`, content);
    }

    console.log("\n  ✅  Done! Stalux content initialized.\n");
    printNextSteps();
}

function printHelp() {
    console.log(`
  Stalux — Modern Astro Blog Theme

  Usage:
    stalux init          Initialize Stalux content (configs, posts, pages)
    stalux init my-blog  Initialize in a subdirectory

  What it does:
    - Creates stalux/config/*.yml (all configuration files)
    - Creates stalux/posts/hello-stalux.md (example post)
    - Creates stalux/about/index.md (about page)
    - Creates stalux/words/ (example quotes)
    - Does NOT overwrite existing files

  Prerequisites:
    1. Create an Astro project:  bun create astro
    2. Install stalux:           bun add @xingwangzhe/stalux
    3. Run init:                 bunx stalux init
`);
}

function printNextSteps() {
    console.log("  📝  Next Steps:");
    console.log("");
    console.log("    1. Add stalux to your astro.config.ts:");
    console.log('       import stalux from "@xingwangzhe/stalux";');
    console.log('       integrations: [stalux({ contentDir: "stalux" })],');
    console.log("");
    console.log("    2. Add content collections to src/content.config.ts:");
    console.log(
        '       import { defineCollections } from "@xingwangzhe/stalux/schemas/collections";',
    );
    console.log('       export const collections = defineCollections({ contentDir: "stalux" });');
    console.log("");
    console.log("    3. Start writing content in stalux/posts/");
    console.log("    4. Run: bun run dev");
    console.log("");
    console.log("  📖  Docs: https://stalux.needhelp.icu");
    console.log("");
}

main();
