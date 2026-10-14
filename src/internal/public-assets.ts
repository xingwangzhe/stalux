import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// 背景 SVG 判别式同步
// ---------------------------------------------------------------------------

/**
 * 把主题包的 public/background/*.svg 同步到用户项目 public/background/。
 *
 * 判别式（非无条件覆盖）：
 * - 同名文件：内容一致则跳过（幂等）；内容不同才覆盖（主题更新了 SVG）
 * - 用户新增的文件：保留，不删除（避免误删用户自定义背景）
 * - 不做整目录 force 复制
 */
export function syncBackgroundSvgs(
    srcDir: string,
    publicDir: string,
): { copied: number; skipped: number } {
    const srcBg = path.join(srcDir, "../public/background");
    if (!existsSync(srcBg)) return { copied: 0, skipped: 0 };

    const destBg = path.join(publicDir, "background");
    mkdirSync(destBg, { recursive: true });

    let copied = 0;
    let skipped = 0;
    for (const name of readdirSync(srcBg)) {
        if (!name.endsWith(".svg")) continue;
        const srcFile = path.join(srcBg, name);
        const destFile = path.join(destBg, name);
        if (existsSync(destFile)) {
            const srcBuf = readFileSync(srcFile);
            const destBuf = readFileSync(destFile);
            if (srcBuf.equals(destBuf)) {
                skipped++; // 内容一致，跳过
                continue;
            }
        }
        copyFileSync(srcFile, destFile);
        copied++;
    }
    return { copied, skipped };
}

/** Sync packaged math fonts and licensing notices; Astro does not merge integration public directories. */
export function syncFontAssets(srcDir: string, publicDir: string): void {
    const source = path.join(srcDir, "../public/fonts");
    if (!existsSync(source)) return;
    const destination = path.join(publicDir, "fonts");
    mkdirSync(destination, { recursive: true });
    for (const name of readdirSync(source)) {
        if (!/\.(?:woff2|txt)$/u.test(name)) continue;
        const from = path.join(source, name);
        const to = path.join(destination, name);
        if (existsSync(to) && readFileSync(from).equals(readFileSync(to))) continue;
        copyFileSync(from, to);
    }
}
