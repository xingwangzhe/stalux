import path from "node:path";

declare const __STALUX_RUNTIME_CACHE_KEY__: string;

export function hashRuntimeSources(sources: ReadonlyArray<readonly [string, string]>): string {
    const hash = new Bun.CryptoHasher("sha256");
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

/** Bun.Glob keeps directory walks in the runtime instead of node:fs. */
async function collectFiles(
    directory: string,
    root = directory,
    include = (_name: string) => true,
): Promise<Array<readonly [string, string]>> {
    let names: string[];
    try {
        names = [...new Bun.Glob("**/*").scanSync({ cwd: directory, onlyFiles: true })];
    } catch {
        return [];
    }
    return Promise.all(
        names
            .filter((name) => include(path.basename(name)))
            .map(async (name): Promise<readonly [string, string]> => {
                const target = path.join(directory, name);
                return [
                    path.relative(root, target).replaceAll(path.sep, "/"),
                    await Bun.file(target).text(),
                ];
            }),
    );
}

export async function createRuntimeCacheKey(
    scriptsDirectory: string,
    packageJson: string,
    stylesDirectory?: string,
    styleMapping?: string,
    configDirectory?: string,
): Promise<string> {
    const styleNames = stylesDirectory
        ? [...new Bun.Glob("generated*.css").scanSync({ cwd: stylesDirectory })]
              .filter((name) => /^generated(?:-[a-z]+)?\.css$/u.test(name))
              .map(
                  async (name): Promise<readonly [string, string]> => [
                      `styles/${name}`,
                      await Bun.file(path.join(stylesDirectory, name)).text(),
                  ],
              )
        : [];
    return hashRuntimeSources([
        ...(await collectFiles(scriptsDirectory)),
        ...(configDirectory
            ? (
                  await collectFiles(configDirectory, configDirectory, (name) =>
                      /\.ya?ml$/iu.test(name),
                  )
              ).map(([name, contents]) => [`config/${name}`, contents] as const)
            : []),
        ...(await Promise.all(styleNames)),
        ...(styleMapping ? [["style-names", styleMapping] as const] : []),
        ["package.json", await Bun.file(packageJson).text()],
    ]);
}

export const getRuntimeCacheKey = (): string => __STALUX_RUNTIME_CACHE_KEY__;
