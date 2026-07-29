#!/usr/bin/env node

/**
 * Stalux CLI — 主题初始化工具
 *
 * 用法：
 *   bunx stalux init              # 在当前目录初始化内容模板
 *   bunx stalux init my-blog      # 在子目录初始化项目
 *
 * 说明：
 *   - 只在 stalux/ 目录下生成内容配置文件、示例文章等
 *   - 不会覆盖已有的 package.json、astro.config.mjs、tsconfig.json、
 *     src/content.config.ts 等用户项目文件
 *   - 用交互式问答生成个性化配置
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve as pathResolve } from "node:path";
import { createInterface } from "node:readline";

// ---------------------------------------------------------------------------
// 默认内容模板数据
// ---------------------------------------------------------------------------

function ask(question, defaultVal) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(`  ${question} [${defaultVal}]: `, (answer) => {
            rl.close();
            resolve(answer.trim() || defaultVal);
        });
    });
}

function getConfigYamls(siteTitle) {
    return {
        "site.yml": `id: site
lang: en
title: ${siteTitle}
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
# clarityId: "xxxxxxxxxx"
# umamiWebsiteId: ""
# umamiSrc: ""
# anyhead: ""
`,
        "footer.yml": `id: footer
buildtime: "${new Date().toISOString()}"
copyright:
    enabled: true
    startYear: ${new Date().getFullYear()}
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
        "media-links.yml": `id: medialinks
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
      url: "https://astro.build"
      icon: "https://astro.build/favicon.svg"
`,
        "comment.yml": `id: comment
enabled: false
waline:
    serverURL: ""
    lang: ""
    locale: ""
    pageSize: 10
    recaptchaV3Key: ""
`,
        "promote.yml": `id: promote
export_md: false
# llm_promote: |
`,
        "ai-discovery.yml": `id: ai-discovery
conformance: "none"
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

function getExamplePost(abbrlink, title, tags, categories, desc) {
    const date = new Date().toISOString().replace("T", " ").slice(0, 19);
    return `---
title: ${title}
abbrlink: ${abbrlink}
date: "${date}"
tags: [${tags}]
categories: [${categories}]
desc: ${desc}
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

function getAboutMd() {
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

function getWordsTemplate() {
    return `---
source: "Author Name"
link: ""
sourceDate: ""
date: "${new Date().toISOString().replace("T", " ").slice(0, 19)}"
---

> A quote or short note...
`;
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

async function main() {
    const args = process.argv.slice(2);

    if (args[0] === "--help" || args[0] === "-h" || !args[0]) {
        printHelp();
        process.exit(0);
    }

    if (args[0] !== "init") {
        console.error(`❌ Unknown command: ${args[0]}`);
        printHelp();
        process.exit(1);
    }

    const targetArg = args[1] || ".";
    const targetPath = pathResolve(process.cwd(), targetArg);

    console.log("");
    console.log("  📦  Stalux — Content Initializer");
    console.log("  " + "=".repeat(40));
    console.log("");

    // 交互式问答
    const siteTitle = await ask("What's your site title?", "My Blog");

    console.log("");
    console.log(`  📂  Target: ${targetPath}`);
    console.log("");

    // 创建 stalux/ 目录结构
    const contentRoot = join(targetPath, "stalux");
    const dirs = ["config", "posts", "about", "words"];
    for (const dir of dirs) {
        mkdirSync(join(contentRoot, dir), { recursive: true });
    }

    // 生成 config YAML 文件（不覆盖已有）
    const configs = getConfigYamls(siteTitle);
    for (const [file, content] of Object.entries(configs)) {
        const filePath = join(contentRoot, "config", file);
        if (existsSync(filePath)) {
            console.log(`  ⏭  stalux/config/${file} (exists, skipped)`);
            continue;
        }
        writeFileSync(filePath, content);
        console.log(`  ✅  stalux/config/${file}`);
    }

    // 生成示例文章（不覆盖已有）
    const postPath = join(contentRoot, "posts", "hello-stalux.md");
    if (!existsSync(postPath)) {
        writeFileSync(
            postPath,
            getExamplePost(
                "hello-stalux",
                "Hello Stalux!",
                "Stalux, Getting Started",
                "Blog",
                "Welcome to Stalux!",
            ),
        );
        console.log(`  ✅  stalux/posts/hello-stalux.md`);
    } else {
        console.log(`  ⏭  stalux/posts/hello-stalux.md (exists, skipped)`);
    }

    // 生成 about 页面
    const aboutPath = join(contentRoot, "about", "index.md");
    if (!existsSync(aboutPath)) {
        writeFileSync(aboutPath, getAboutMd());
        console.log(`  ✅  stalux/about/index.md`);
    } else {
        console.log(`  ⏭  stalux/about/index.md (exists, skipped)`);
    }

    // 生成 words 模板
    const wordsDir = join(contentRoot, "words");
    const wordsTemplatePath = join(wordsDir, "_template.md");
    if (!existsSync(wordsTemplatePath)) {
        writeFileSync(wordsTemplatePath, getWordsTemplate());
        console.log(`  ✅  stalux/words/_template.md`);
    } else {
        console.log(`  ⏭  stalux/words/_template.md (exists, skipped)`);
    }

    // 可选的原子示例
    const einsteinPath = join(wordsDir, "einstein-imagination.md");
    if (!existsSync(einsteinPath)) {
        writeFileSync(
            einsteinPath,
            `---
source: "Albert Einstein"
link: ""
sourceDate: ""
date: "${new Date().toISOString().replace("T", " ").slice(0, 19)}"
---

> Imagination is more important than knowledge.
`,
        );
        console.log(`  ✅  stalux/words/einstein-imagination.md`);
    } else {
        console.log(`  ⏭  stalux/words/einstein-imagination.md (exists, skipped)`);
    }

    console.log("");
    console.log("  " + "=".repeat(40));
    console.log("  ✅  Done! Stalux content initialized.");
    console.log("");
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
    - Does NOT overwrite your existing package.json, astro.config.mjs, etc.

  Prerequisites:
    1. Create an Astro project:  bun create astro
    2. Install stalux:           bun add @xingwangzhe/stalux
    3. Run init:                 bunx stalux init
    4. Configure astro.config.mjs and src/content.config.ts (see docs)
`);
}

function printNextSteps() {
    console.log("  📝  Next Steps:");
    console.log("");
    console.log("    1. Add stalux to your astro.config.mjs:");
    console.log('       import stalux from "@xingwangzhe/stalux";');
    console.log('       integrations: [stalux({ contentDir: "stalux" })],');
    console.log("");
    console.log("    2. Add content collections to your src/content.config.ts:");
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

main().catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});
