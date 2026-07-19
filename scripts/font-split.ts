import { execSync } from "node:child_process";
import { readFileSync, mkdirSync, statSync } from "node:fs";

import { globSync } from "glob";

const SCAN_GLOBS = [
    "stalux/posts/**/*.md",
    "stalux/about/**/*.md",
    "stalux/words/**/*.md",
    "src/pages/**/*.astro",
    "src/components/**/*.astro",
    "src/layouts/**/*.astro",
];

const FONT = "src/assets/fonts/LXGWWenKai-Regular.ttf";
const OUT = "public/fonts/";

function collectChars(): number[] {
    const chars = new Set<number>();
    for (let i = 0x20; i <= 0x7e; i++) chars.add(i);
    [
        0x3000, 0xff0c, 0x3002, 0xff01, 0xff1f, 0xff1b, 0xff1a, 0x201c, 0x201d, 0x3010, 0x3011,
        0x300a, 0x300b, 0xff08, 0xff09, 0x2026, 0x2014, 0xff5e, 0x00b7, 0x3001, 0x2500, 0x2502,
        0x2514, 0x251c, 0x252c, 0x2534,
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

function toRanges(cps: number[]): (number | [number, number])[] {
    const r: (number | [number, number])[] = [];
    let s = cps[0],
        e = cps[0];
    for (let i = 1; i < cps.length; i++) {
        if (cps[i] === e + 1) {
            e = cps[i];
        } else {
            r.push(s === e ? s : [s, e]);
            s = e = cps[i];
        }
    }
    r.push(s === e ? s : [s, e]);
    return r;
}

async function main() {
    const cps = collectChars();
    const ranges = toRanges(cps);
    console.log(
        `[font-split] ${cps.length} unique chars → ${ranges.length} ranges (content-aware)`,
    );
    mkdirSync(OUT, { recursive: true });

    try {
        const { fontSplit } = await import("@konghayao/cn-font-split");
        await fontSplit({
            FontPath: FONT,
            destFold: OUT,
            subsets: [ranges],
            autoChunk: true,
            chunkSize: 51200,
            testHTML: false,
            css: {
                fontFamily: "LXGW WenKai",
                fontWeight: "400",
                fontStyle: "normal",
                fontDisplay: "swap",
                localFamily: "LXGW WenKai",
            },
        });
    } catch (e: any) {
        console.warn(
            `[font-split] Content-aware mode unavailable (${e.message?.split("\n")[0]}), fallback to full split`,
        );
        execSync(`bun x cn-font-split -i=./${FONT} -o=./${OUT}`, { stdio: "inherit" });
    }

    const outFiles = globSync("public/fonts/*.woff2", { cwd: process.cwd() });
    const totalSize = outFiles.reduce((s, f) => {
        try {
            return s + statSync(f).size;
        } catch {
            return s;
        }
    }, 0);
    console.log(`[font-split] Done: ${outFiles.length} woff2, ${(totalSize / 1024).toFixed(0)}KB`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
