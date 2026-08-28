import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

declare const __STALUX_RUNTIME_CACHE_KEY__: string;

export function hashRuntimeSources(sources: ReadonlyArray<readonly [string, string]>): string {
    const hash = createHash("sha256");
    for (const [name, contents] of [...sources].sort(([left], [right]) =>
        left.localeCompare(right),
    )) {
        hash.update(name);
        hash.update("\0");
        hash.update(contents);
        hash.update("\0");
    }
    return hash.digest("hex").slice(0, 16);
}

function collectFiles(directory: string, root = directory): Array<readonly [string, string]> {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectFiles(target, root);
        return [[path.relative(root, target), readFileSync(target, "utf8")] as const];
    });
}

export function createRuntimeCacheKey(scriptsDirectory: string, packageJson: string): string {
    return hashRuntimeSources([
        ...collectFiles(scriptsDirectory),
        ["package.json", readFileSync(packageJson, "utf8")],
    ]);
}

export const getRuntimeCacheKey = (): string => __STALUX_RUNTIME_CACHE_KEY__;
