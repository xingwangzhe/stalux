/**
 * Post-build HTML minification using @minify-html/node (Rust NAPI)
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { minify } from "@minify-html/node";

const cfg = {
    keep_spaces_between_attributes: true,
    keep_comments: false,
    minify_js: false,  // 已由 oxc 处理
    minify_css: false, // 已由 lightningcss 处理
};

function walkHtml(dir: string): string[] {
    const results: string[] = [];
    for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        try {
            if (statSync(fullPath).isDirectory()) {
                results.push(...walkHtml(fullPath));
            } else if (entry.endsWith(".html")) {
                results.push(fullPath);
            }
        } catch {}
    }
    return results;
}

const files = walkHtml("dist");
let totalBefore = 0;
let totalAfter = 0;

for (const file of files) {
    const src = readFileSync(file);
    const before = src.length;
    const minified = minify(src, cfg);
    const after = minified.length;
    totalBefore += before;
    totalAfter += after;
    writeFileSync(file, minified);
}

const saved = totalBefore - totalAfter;
const pct = totalBefore > 0 ? ((saved / totalBefore) * 100).toFixed(1) : "0";
console.log(
    `HTML minified: ${files.length} files, ${(totalBefore / 1024).toFixed(1)}KB → ${(totalAfter / 1024).toFixed(1)}KB (${saved} bytes, ${pct}%)`,
);
