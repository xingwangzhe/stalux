import { cp, mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import path from "node:path";

async function digestFiles(root: string, entries: readonly string[], salt = ""): Promise<string> {
    const hash = new Bun.CryptoHasher("sha256").update(salt);
    for (const entry of entries) {
        const bytes = await Bun.file(path.join(root, entry)).bytes();
        hash.update(JSON.stringify([entry, bytes.length])).update(bytes);
    }
    return hash.digest("hex");
}

async function indexDigest(indexDir: string): Promise<string> {
    const files = [...new Bun.Glob("**/*").scanSync({ cwd: indexDir, onlyFiles: true })].sort();
    if (!files.includes("index.bin")) {
        throw new Error("Search output is incomplete");
    }
    return digestFiles(indexDir, files);
}

export async function createSearchOutputCache(
    cacheDir: string,
    outDir: string,
    htmlFiles: readonly string[],
    buildKey: string,
) {
    const output = path.join(outDir, "orama");
    const fingerprint = await digestFiles(outDir, htmlFiles, buildKey);
    const cached = path.join(cacheDir, "latest");
    return {
        async restore(): Promise<boolean> {
            let staging: string | undefined;
            try {
                const record = await Bun.file(path.join(cached, "index.json")).json();
                if (record.fingerprint !== fingerprint) return false;
                staging = await mkdtemp(path.join(outDir, ".orama-restore-"));
                const copy = path.join(staging, "orama");
                await cp(path.join(cached, "orama"), copy, { recursive: true });
                if ((await indexDigest(copy)) !== record.digest) return false;
                await rename(copy, output);
                return true;
            } catch {
                return false;
            } finally {
                if (staging) await rm(staging, { recursive: true, force: true }).catch(() => {});
            }
        },
        async save(): Promise<void> {
            await mkdir(cacheDir, { recursive: true });
            const staging = await mkdtemp(path.join(cacheDir, "stage-"));
            try {
                const copy = path.join(staging, "orama");
                await cp(output, copy, { recursive: true });
                const digest = await indexDigest(copy);
                await Bun.write(
                    path.join(staging, "index.json"),
                    JSON.stringify({ fingerprint, digest }),
                );
                await rm(cached, { recursive: true, force: true });
                await rename(staging, cached);
            } finally {
                await rm(staging, { recursive: true, force: true });
            }
        },
    };
}
