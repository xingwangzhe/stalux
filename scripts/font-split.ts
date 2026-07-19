import { readFileSync } from "node:fs";

import { globSync } from "glob";

const SCAN_GLOBS = [
    "stalux/posts/**/*.md",
    "stalux/about/**/*.md",
    "stalux/words/**/*.md",
    "src/pages/**/*.astro",
    "src/components/**/*.astro",
    "src/layouts/**/*.astro",
];

function collectChars(): number[] {
    const chars = new Set<number>();
    for (let i = 0x20; i <= 0x7e; i++) chars.add(i);
    [
        0x3000, 0xff0c, 0x3002, 0xff01, 0xff1f, 0xff1b, 0xff1a, 0x201c, 0x201d, 0x3010, 0x3011,
        0x300a, 0x300b, 0xff08, 0xff09, 0x2026, 0x2014, 0xff5e, 0x00b7, 0x3001,
    ].forEach((cp) => chars.add(cp));

    for (const pattern of SCAN_GLOBS) {
        for (const f of globSync(pattern, { cwd: process.cwd() })) {
            try {
                for (const ch of readFileSync(f, "utf-8")) chars.add(ch.codePointAt(0)!);
            } catch {}
        }
    }
    return [...chars].filter((c) => c != null).sort((a, b) => a - b);
}

const cps = collectChars();
console.log(
    `[font-split] Content scan: ${cps.length} unique CJK chars (from ${SCAN_GLOBS.length} globs)`,
);
console.log(`[font-split] vite-plugin-font + cn-font-split@7.x will handle actual splitting`);
