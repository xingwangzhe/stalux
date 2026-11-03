import path from "node:path";

/** Bun.Glob reports a missing directory as an empty scan instead of throwing here. */
function listFiles(directory: string, patterns: readonly string[]): string[] {
    const names = new Set<string>();
    for (const pattern of patterns) {
        try {
            for (const name of new Bun.Glob(pattern).scanSync({
                cwd: directory,
                onlyFiles: true,
            }))
                names.add(name);
        } catch {
            // Missing source directory: nothing to sync.
        }
    }
    return [...names].sort();
}

async function sameContents(left: string, right: string): Promise<boolean> {
    const [leftBytes, rightBytes] = await Promise.all([
        Bun.file(left).bytes(),
        Bun.file(right).bytes(),
    ]);
    if (leftBytes.length !== rightBytes.length) return false;
    for (let index = 0; index < leftBytes.length; index++)
        if (leftBytes[index] !== rightBytes[index]) return false;
    return true;
}

// ---------------------------------------------------------------------------
// 背景资源判别式同步
// ---------------------------------------------------------------------------

/**
 * 把主题包的 public/background/ SVG 原图及 WebP 同步到用户 public/background/。
 *
 * 判别式（非无条件覆盖）：
 * - 同名文件：内容一致则跳过（幂等）；内容不同才覆盖（主题更新了 SVG）
 * - 用户新增的文件：保留，不删除（避免误删用户自定义背景）
 * - 不做整目录 force 复制
 */
export async function syncBackgroundSvgs(
    srcDir: string,
    publicDir: string,
): Promise<{ copied: number; skipped: number }> {
    const srcBg = path.join(srcDir, "../public/background");
    const names = listFiles(srcBg, ["*.svg", "*.webp"]);
    if (names.length === 0) return { copied: 0, skipped: 0 };

    const destBg = path.join(publicDir, "background");
    let copied = 0;
    let skipped = 0;
    for (const name of names) {
        const srcFile = path.join(srcBg, name);
        const destFile = path.join(destBg, name);
        if ((await Bun.file(destFile).exists()) && (await sameContents(srcFile, destFile))) {
            skipped++; // 内容一致，跳过
            continue;
        }
        await Bun.write(destFile, Bun.file(srcFile));
        copied++;
    }
    return { copied, skipped };
}

/** Sync packaged math fonts and licensing notices; Astro does not merge integration public directories. */
export async function syncFontAssets(srcDir: string, publicDir: string): Promise<void> {
    const source = path.join(srcDir, "../public/fonts");
    const names = listFiles(source, ["*.woff2", "*.txt"]);
    const destination = path.join(publicDir, "fonts");
    for (const name of names) {
        const from = path.join(source, name);
        const to = path.join(destination, name);
        if ((await Bun.file(to).exists()) && (await sameContents(from, to))) continue;
        await Bun.write(to, Bun.file(from));
    }
}
