#!/usr/bin/env node

/**
 * Stalux CLI — 主题初始化工具
 *
 * 用法：
 *   npx stalux init          # 在当前目录初始化内容模板
 *   npx stalux init my-blog  # 在子目录初始化项目
 *   npm run init              # 或通过 npm script
 */

import { existsSync, mkdirSync, cpSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, "..");
const TEMPLATE_DIR = join(PACKAGE_ROOT, "template");

function copyDir(src, dest, overwrite = false) {
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src)) {
        const srcPath = join(src, entry);
        const destPath = join(dest, entry);
        if (entry === "node_modules") continue;

        if (statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath, overwrite);
        } else {
            if (!overwrite && existsSync(destPath)) {
                console.log(`  ⏭  ${entry} (already exists, skipped)`);
                continue;
            }
            cpSync(srcPath, destPath);
            console.log(`  ✅  ${entry}`);
        }
    }
}

function printHelp() {
    console.log(`
  Stalux — Modern Astro Blog Theme

  Usage:
    stalux init [dir]     Initialize Stalux content template
    stalux --help         Show this help message

  Examples:
    npx stalux init              Init content in current directory
    npx stalux init my-blog      Init content in ./my-blog
    npm run init                 Init via npm script (after install)

  Source code:
    git clone https://github.com/xingwangzhe/stalux.git
`);
}

function printNextSteps(targetDir) {
    console.log("");
    console.log("  📝  Next Steps:");
    console.log("");
    console.log(`    1. cd ${targetDir}`);
    console.log(`    2. npm install stalux`);
    console.log(`    3. Edit astro.config.mjs to add stalux()`);
    console.log(`    4. Start writing content in ${targetDir}/stalux/posts/`);
    console.log(`    5. npm run dev`);
    console.log("");
    console.log("  📖  Docs: https://stalux.needhelp.icu");
    console.log("");
}

// ---- Main ----
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
}

if (command === "init") {
    const targetArg = args[1] || ".";
    const targetPath = resolve(process.cwd(), targetArg);

    if (!existsSync(TEMPLATE_DIR)) {
        console.error(
            "❌ Template directory not found. Ensure stalux package is properly installed.",
        );
        process.exit(1);
    }

    console.log(`📦 Initializing Stalux content template...`);
    console.log(`📂 Target: ${targetPath}`);
    console.log("");

    copyDir(TEMPLATE_DIR, targetPath, false);

    printNextSteps(targetArg);
    process.exit(0);
}

// Unknown command
console.error(`❌ Unknown command: ${command}`);
console.error(`   Use "stalux init" to initialize Stalux content.`);
process.exit(1);
