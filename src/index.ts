/// <reference path="./env.d.ts" />
import { forEachBounded } from "./internal/bounded-tasks.ts";
import { compactStylesPlugin } from "./internal/compact-styles.ts";
import { modernCssTargets } from "./internal/modern-css.ts";
import { styleNames } from "./internal/style-names.generated.ts";
import { swupDebugPlugin } from "./internal/swup-debug-plugin.ts";
/**
 * Stalux — Astro 博客主题集成入口
 *
 * 可作为：
 * 1. Astro Integration（插件模式）：`integrations: [stalux()]`
 * 2. 源码模板（Template 模式）：额外提供 create-stalux CLI 脚手架
 *
 * 基于 Astro 7.1.3 Integration API（astro:config:setup / injectRoute / injectScript）
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import sitemap from "@astrojs/sitemap";
import { mermaidHast, mermaidMdast } from "@xingwangzhe/satteri-mermaid";
import { photoswipe } from "@xingwangzhe/satteri-photoswipe";
import type { AstroIntegration } from "astro";
import { fontProviders } from "astro/config";
// pagefind 是 ESM-only 包，需要在模块顶层导入
// 因为 astro:build:done 钩子中 Vite module runner 已关闭，无法动态 import
import { createIndex as pagefindCreateIndex } from "pagefind";
import { parse } from "parse5";
import { parse as parseYaml } from "yaml";
import type { StaluxOptions } from "./config";
import { expressiveCode } from "./expressive-code";
import { writeCjkSearchIndex } from "./internal/cjk-search-index";
import { staluxComponentsAlias } from "./internal/components-plugin";
import {
    clearPageFontSubsets,
    collectSharedFontGlyphs,
    createSharedFontGlyphs,
    readLinkedStylesheetText,
    removePageFontStyles,
    resolveFontInputs,
    sharedFontCacheKey,
    writePageFontSubsetIntoDocumentAsync,
    writeSharedFontSubsetsAsync,
} from "./internal/font-slices";
import { findHtmlImages } from "./internal/html-images";
import { createHtmlMutationEmitter } from "./internal/html-output";
import { promoteCodeStyles } from "./internal/html-styles";
import { type ImageDimensions, updateLocalImageDimensions } from "./internal/image-dimensions";
import { createInjectedRoutes } from "./internal/injected-routes";
import { markdownPropagationPlugin } from "./internal/markdown-propagation";
import { containMermaidSvgs } from "./internal/offscreen-layout";
import { createPageOutputCache } from "./internal/page-output-cache";
import { loadCoverEncoder, restoreCoverFiles, upgradeCoverImages } from "./internal/post-cover";
import { isPluginProject } from "./internal/project-mode";
import { syncBackgroundSvgs, syncFontAssets } from "./internal/public-assets";
import { normalizeRouteHrefs } from "./internal/route-hrefs";
import { createRuntimeCacheKey } from "./internal/runtime-cache-key";
import {
    appendUniquePlugin,
    collectPluginNames,
    prepareSatteriProcessor,
} from "./internal/satteri-config";
import { searchStylePlugin } from "./internal/search-style";
import { createViteAliases } from "./internal/vite-aliases";
import { featureFlagsHast, featureFlagsMdast } from "./plugins/feature-flags";
import { imageCaptions } from "./plugins/image-captions";
import { imageDimensions } from "./plugins/image-dimensions";
import { temml } from "./plugins/satteri-temml";
import { describeError } from "./utils/diagnostics";
import { toRoutePath } from "./utils/public-routes";

// 代码字体通过 Astro Fonts API 注入；正文字体由 native N-API 生成共享壳层与页面子集。
function buildFontsConfig(codeNormal: string, codeItalic?: string) {
    return [
        {
            // 代码：Google Sans Code 可变字体，原样注册，不切片
            provider: fontProviders.local(),
            name: "Google Sans Code",
            cssVariable: "--font-code",
            display: "optional" as const,
            fallbacks: ["JetBrains Mono", "Fira Code", "Consolas", "Courier New", "monospace"],
            optimizedFallbacks: true,
            options: {
                variants: [
                    {
                        weight: "100 900",
                        style: "normal",
                        src: [codeNormal],
                    },
                    ...(codeItalic
                        ? [{ weight: "100 900", style: "italic", src: [codeItalic] }]
                        : []),
                ],
            },
        },
    ];
}

// ---------------------------------------------------------------------------
// 集成入口
// ---------------------------------------------------------------------------

/**
 * Stalux 博客主题集成
 *
 * @example
 * ```ts
 * // astro.config.mjs
 * import { defineConfig } from "astro/config";
 * import stalux from "stalux";
 *
 * export default defineConfig({
 *   integrations: [stalux({ contentDir: "./content" })]
 * });
 * ```
 */
export function stalux(options: StaluxOptions = {}): AstroIntegration[] {
    const opt: StaluxOptions = {
        contentDir: options.contentDir ?? "stalux",
        pagefind: options.pagefind ?? true,
        devToolbar: options.devToolbar ?? true,
        sitemap: options.sitemap ?? true,
        expressiveCode: options.expressiveCode ?? true,
        ...options,
    };

    const socialCardPaths = { publicDir: "", cacheDir: "", base: "/", fontPath: "" };
    // Content-addressed card covers, kept outside the build output so a page that
    // is served from the page-output cache still finds its file on disk.
    let coverCacheDir = "";

    let searchBase = "/";
    let pageFontData: { fontBuffer: Buffer; outputDir: string; cacheDir: string } | undefined;

    const coreIntegration: AstroIntegration = {
        name: "stalux",
        hooks: {
            "astro:config:setup": async ({
                injectRoute,
                injectScript,
                updateConfig,
                addDevToolbarApp,
                config,
                command,
                logger,
            }) => {
                searchBase = config.base;
                const started = performance.now();
                const isPluginMode = isPluginProject(config.root, new URL("../", import.meta.url));
                const configLogger = logger.fork("stalux/config");
                const routesLogger = logger.fork("stalux/routes");
                const markdownLogger = logger.fork("stalux/markdown");
                const fontsLogger = logger.fork("stalux/fonts");
                configLogger.debug(`setup started; mode=${isPluginMode ? "plugin" : "source"}`);
                const srcDir = Bun.fileURLToPath(new URL(".", import.meta.url));
                const runtimeCacheKey = await createRuntimeCacheKey(
                    path.join(srcDir, "scripts"),
                    path.resolve(srcDir, "../package.json"),
                    path.join(srcDir, "styles"),
                    JSON.stringify([styleNames, modernCssTargets]) +
                        (await Bun.file(path.join(srcDir, "internal/compact-styles.ts")).text()) +
                        (await Bun.file(path.join(srcDir, "internal/offscreen-layout.ts")).text()),
                    path.resolve(
                        Bun.fileURLToPath(config.root),
                        opt.contentDir ?? "stalux",
                        "config",
                    ),
                );

                // 1. 注入 Vite 别名 + 组件覆盖插件 + Vue 特性标记（Waline 依赖）
                updateConfig({
                    // Reuse shared theme CSS across routes instead of embedding the full bundle.
                    // Respect callers that explicitly request inline styles.
                    build: {
                        inlineStylesheets:
                            config.build.inlineStylesheets === "always" ? "always" : "never",
                    },
                    vite: {
                        optimizeDeps: {
                            exclude: ["@w3c/webmcp-polyfill"],
                            // Discover lazy page features before the first visit:
                            // Vite re-optimization would otherwise reload the
                            // entire document midway through a Swup navigation.
                            include: [
                                "swup",
                                "@swup/a11y-plugin",
                                "@swup/body-class-plugin",
                                "@swup/fragment-plugin",
                                "@swup/parallel-plugin",
                                "@swup/route-name-plugin",
                                "@swup/scripts-plugin",
                                "@swup/head-plugin",
                                "@swup/js-plugin",
                                "@swup/preload-plugin",
                                "@swup/scroll-plugin",
                                "@microsoft/clarity",
                                "@pagefind/component-ui",
                                "@waline/client",
                                "@xingwangzhe/tags-cloud",
                                "photoswipe",
                                "photoswipe/lightbox",
                            ],
                        },
                        css: { lightningcss: { targets: modernCssTargets } },
                        build: {
                            target: config.vite.build?.target ?? "esnext",
                            cssMinify: "lightningcss",
                            // 默认不产出 sourcemap；消费方显式开启时（如 SONDA=1 做体积分析）尊重其设置
                            sourcemap: config.vite.build?.sourcemap ?? false,
                        },
                        resolve: {
                            alias: createViteAliases(srcDir),
                        },
                        plugins: [
                            {
                                name: "stalux:social-card-paths",
                                resolveId: (id) =>
                                    id === "virtual:stalux-social-card-paths"
                                        ? `\0${id}`
                                        : undefined,
                                load: (id) =>
                                    id === "\0virtual:stalux-social-card-paths"
                                        ? `export default ${JSON.stringify(socialCardPaths)}`
                                        : undefined,
                            },
                            swupDebugPlugin(command === "dev"),
                            searchStylePlugin(command === "dev", config.base),
                            ...(command === "build"
                                ? [markdownPropagationPlugin(), compactStylesPlugin(srcDir)]
                                : []),
                            staluxComponentsAlias(opt.components, logger.fork("stalux/components")),
                        ],
                        define: {
                            __STALUX_COMPACT_STYLES__: JSON.stringify(command === "build"),
                            __STALUX_DEBUG__: JSON.stringify(
                                Bun.env.STALUX_DEBUG === "1" || Bun.argv.includes("--verbose"),
                            ),
                            __VUE_OPTIONS_API__: true,
                            __VUE_PROD_DEVTOOLS__: false,
                            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
                            __STALUX_RUNTIME_CACHE_KEY__: JSON.stringify(runtimeCacheKey),
                        },
                    },
                });

                // 2. 注入全局 CSS
                injectScript("page-ssr", `import "${srcDir}/styles/generated.css";`);
                injectScript("page", `import "${srcDir}/scripts/core-runtime.ts";`);

                // 3. 注入所有页面路由（仅插件模式，源码模式下使用文件路由）
                if (isPluginMode) {
                    const routes = createInjectedRoutes(new URL(".", import.meta.url));
                    for (const route of routes) {
                        injectRoute(route);
                    }
                    routesLogger.debug(`injected ${routes.length} routes`);
                    for (const route of routes) routesLogger.debug(`route=${route.pattern}`);
                } else {
                    routesLogger.debug("source mode; file-based routing active");
                }

                // 4. 可选：添加 Dev Toolbar 应用
                if (opt.devToolbar) {
                    addDevToolbarApp({
                        id: "stalux",
                        name: "Stalux",
                        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
                        entrypoint: Bun.fileURLToPath(
                            new URL("./internal/dev-toolbar.ts", import.meta.url),
                        ),
                    });
                }

                configLogger.debug(
                    `contentDir=${opt.contentDir}; toolbar=${opt.devToolbar}; pagefind=${opt.pagefind}`,
                );

                // 5. 注入 satteri 插件（Mermaid/字数统计/特性标记/数学公式/PhotoSwipe），按插件 name 去重
                // 两种模式都由集成补齐默认插件。Astro 7 的 markdown.processor 默认为 satteri()，
                // 消费方即使完全不配置 processor，这里也会对默认 processor 的 options 做幂等合并：
                //   - features：默认开启 math / frontmatter / gfm / smartPunctuation（用户显式 false 则尊重）
                //   - mdastPlugins：mermaidMdast + temml（数学公式）+ featureFlagsMdast（字数统计）
                //   - hastPlugins：photoswipe（图片灯箱）+ imageCaptions（图注）+ mermaidHast + featureFlagsHast
                // 去重是必须的：重复注册 Mermaid 或 featureFlagsMdast 会导致渲染异常或字数统计翻倍。
                try {
                    const processorOptions = prepareSatteriProcessor(config.markdown?.processor);
                    if (processorOptions) {
                        const seen = collectPluginNames(processorOptions);
                        appendUniquePlugin(processorOptions.mdastPlugins, mermaidMdast(), seen);
                        appendUniquePlugin(
                            processorOptions.mdastPlugins,
                            temml(undefined, markdownLogger),
                            seen,
                        );
                        appendUniquePlugin(processorOptions.mdastPlugins, featureFlagsMdast, seen);
                        appendUniquePlugin(
                            processorOptions.hastPlugins,
                            mermaidHast({
                                responsive: true,
                                theme: "dark",
                                themeVariables: { background: "transparent" },
                                themeOverrides: { clusterBorder: "#cccccc" },
                            }),
                            seen,
                        );
                        // Dimensions must land before PhotoSwipe copies them onto the link.
                        appendUniquePlugin(processorOptions.hastPlugins, imageDimensions, seen);
                        appendUniquePlugin(processorOptions.hastPlugins, photoswipe(), seen);
                        appendUniquePlugin(processorOptions.hastPlugins, imageCaptions, seen);
                        appendUniquePlugin(processorOptions.hastPlugins, featureFlagsHast, seen);
                        markdownLogger.debug(
                            "injected satteri plugins (mermaid/temml/photoswipe/image-captions/feature-flags)",
                        );
                    } else {
                        markdownLogger.warn(
                            "markdown.processor 不是 satteri，无法注入字数统计/数学公式/PhotoSwipe 插件。" +
                                "请在 astro.config 中配置 `processor: satteri({...})`。",
                        );
                    }
                } catch (error) {
                    markdownLogger.warn(`注入 markdown 插件失败: ${describeError(error)}`);
                }

                // 6. 站点 URL 单源化：以 stalux/config/site.yml 的 url 为准
                // sitemap 与 context.site 都派生自 astro.config 的 site 字段，
                // 这里在构建前将其与主题配置对齐，避免输出与配置不一致的 URL
                // （例如 README 里的 https://example.com 占位、或用户只改了 site.yml 忘了改 astro.config）。
                try {
                    const contentDir = opt.contentDir ?? "stalux";
                    const siteYamlPath = path.resolve(
                        process.cwd(),
                        contentDir,
                        "config",
                        "site.yml",
                    );
                    const siteYaml = await Bun.file(siteYamlPath).text();
                    const urlMatch = siteYaml.match(/^url\s*:\s*(.+)$/mu);
                    const rawYamlUrl = urlMatch?.[1];
                    const yamlUrl = rawYamlUrl
                        ?.trim()
                        .replace(/^["']|["']$/gu, "")
                        .replace(/\/+$/u, "");
                    if (yamlUrl) {
                        const configuredSite = config.site?.replace(/\/+$/u, "");
                        if (!configuredSite || configuredSite === "https://example.com") {
                            // 未配置或为占位符 → 直接以 site.yml 为准
                            updateConfig({ site: yamlUrl });
                            logger.info(
                                `Stalux: site set to ${yamlUrl} (from ${contentDir}/config/site.yml)`,
                            );
                        } else if (configuredSite !== yamlUrl) {
                            // 用户显式配置了不同的域名 → 保留用户配置，但提示差异
                            logger.warn(
                                `Stalux: astro.config site (${configuredSite}) 与 ${contentDir}/config/site.yml 的 url (${yamlUrl}) 不一致。` +
                                    "sitemap 将使用 astro.config 的 site，llms.txt / *.md 导出将使用 site.yml 的 url，请统一二者。",
                            );
                        }
                    }
                } catch (error) {
                    if ((error as { code?: string }).code === "ENOENT") {
                        configLogger.debug("site.yml not found; site sync skipped");
                    } else {
                        configLogger.warn(`site sync failed: ${describeError(error)}`);
                    }
                }

                // 7. 字体：解析本地字体输入；壳层共享子集与页面正文字形在 build:done 阶段生成。
                try {
                    const sliced = await resolveFontInputs(process.cwd(), fontsLogger);
                    if (sliced) {
                        pageFontData = {
                            fontBuffer: sliced.fontBuffer,
                            outputDir: path.join(
                                Bun.fileURLToPath(config.outDir),
                                "_astro",
                                "fonts",
                            ),
                            cacheDir: sliced.pageSubsetDir,
                        };
                        updateConfig({
                            fonts: buildFontsConfig(sliced.codeNormal, sliced.codeItalic),
                        });
                        fontsLogger.debug(
                            "injected code font via Astro Fonts API; page body subsets use native N-API",
                        );
                    }
                } catch (error) {
                    fontsLogger.warn(`font injection failed: ${describeError(error)}`);
                }
                configLogger.info(`initialized in ${(performance.now() - started).toFixed(1)}ms`);
            },

            // Read final paths after every integration has finished updating configuration.
            // Public assets must exist before Astro creates its Vite server/build asset pipeline.
            "astro:config:done": async ({ config, logger }) => {
                const srcDir = Bun.fileURLToPath(new URL(".", import.meta.url));
                const publicDir = Bun.fileURLToPath(config.publicDir);
                Object.assign(socialCardPaths, {
                    publicDir,
                    cacheDir: Bun.fileURLToPath(new URL("stalux-social-cards/", config.cacheDir)),
                    base: config.base,
                    fontPath: path.join(srcDir, "assets/fonts/LXGWWenKai-Regular.ttf"),
                });
                coverCacheDir = Bun.fileURLToPath(new URL("stalux-post-covers/", config.cacheDir));
                const assetsLogger = logger.fork("stalux/assets");
                if (pageFontData) {
                    pageFontData.outputDir = path.join(
                        Bun.fileURLToPath(config.outDir),
                        "_astro",
                        "fonts",
                    );
                }
                try {
                    await syncFontAssets(srcDir, publicDir);
                    const { copied, skipped } = await syncBackgroundSvgs(srcDir, publicDir);
                    if (copied > 0) {
                        assetsLogger.info(`同步背景 SVG ${copied} 个（跳过 ${skipped} 个不变）`);
                    } else if (skipped > 0) {
                        assetsLogger.debug(`背景 SVG 无变化（跳过 ${skipped} 个）`);
                    }
                } catch (error) {
                    assetsLogger.warn(`同步主题静态资源失败: ${describeError(error)}`);
                }
            },

            "astro:build:done": async ({ dir, logger: rootLogger }) => {
                const logger = rootLogger.fork("stalux/build");
                const started = performance.now();
                const outDir = pageFontData
                    ? path.dirname(path.dirname(pageFontData.outputDir))
                    : Bun.fileURLToPath(new URL(String(dir)));

                // Astro's Markdown image transform drops arbitrary lazy-loading hints
                // added during HAST processing. Reapply the policy to emitted HTML.
                const htmlFiles = [
                    ...new Bun.Glob("**/*").scanSync({ cwd: outDir, onlyFiles: true }),
                ].sort();
                const sourceDir = Bun.fileURLToPath(new URL(".", import.meta.url));
                const moduleDir = Bun.fileURLToPath(new URL(".", import.meta.url));
                const resolveModule = (id: string) => Bun.resolveSync(id, moduleDir);
                const requireModule = createRequire(import.meta.url);
                const coverEncoder = coverCacheDir
                    ? loadCoverEncoder(requireModule, logger)
                    : undefined;
                const parserEntry = resolveModule("parse5");
                const imageSizeEntry = resolveModule("image-size");
                const nativeEntry = resolveModule("@xingwangzhe/cjk-font-split-native");
                const pageEntries = htmlFiles.filter((entry) => entry.endsWith(".html"));
                let sharedFonts: Awaited<ReturnType<typeof writeSharedFontSubsetsAsync>> = [];
                let sharedFontKey = "";
                if (pageFontData) {
                    const sharedGlyphs = createSharedFontGlyphs();
                    // The common shell is static across soft navigations; scan once, then
                    // reuse each component's content-addressed subset on every route.
                    await forEachBounded(pageEntries, 4, async (entry) => {
                        const html = await Bun.file(path.join(outDir, entry)).text();
                        collectSharedFontGlyphs(parse(html), sharedGlyphs);
                    });
                    sharedFonts = await writeSharedFontSubsetsAsync(
                        pageFontData.fontBuffer,
                        sharedGlyphs,
                        pageFontData.cacheDir,
                    );
                    sharedFontKey = sharedFontCacheKey(sharedFonts);
                }
                const outputCache = await createPageOutputCache(
                    path.resolve("node_modules/.astro/stalux-page-output"),
                    [
                        ...[
                            "index.ts",
                            "internal/font-slices.ts",
                            "internal/image-dimensions.ts",
                            "internal/html-images.ts",
                            "internal/html-output.ts",
                            "internal/html-styles.ts",
                            "internal/route-hrefs.ts",
                            "internal/offscreen-layout.ts",
                            "internal/page-output-cache.ts",
                            "internal/style-names.generated.ts",
                            "plugins/feature-flags.ts",
                            "../package.json",
                        ].map((entry) => path.join(sourceDir, entry)),
                        path.join(path.dirname(nativeEntry), "package.json"),
                        path.resolve(path.dirname(parserEntry), "../package.json"),
                        path.resolve(path.dirname(imageSizeEntry), "../../package.json"),
                    ],
                    pageFontData?.fontBuffer,
                    // Track referenced files regardless of extension, including SVG/AVIF.
                    htmlFiles.map((entry) => path.join(outDir, entry)),
                    sharedFontKey,
                );
                let cacheHits = 0;
                let optimizedImagePages = 0;
                let pageFontPages = 0;
                let pageFontSubsetCacheHits = 0;
                const referencedPageFonts = new Set<string>();
                for (const sharedFont of sharedFonts) {
                    await Bun.write(
                        path.join(pageFontData?.outputDir ?? outDir, sharedFont.filename),
                        Bun.file(sharedFont.sourcePath),
                    );
                    referencedPageFonts.add(sharedFont.filename);
                }
                const linkedCssTextCache = new Map<string, string>();
                const dimensionsCache = new Map<string, Promise<ImageDimensions | undefined>>();
                const processPage = async (entry: string) => {
                    const output = path.join(outDir, entry);
                    const before = await Bun.file(output).text();
                    const cached = await outputCache.get(entry, before);
                    if (cached) {
                        if (cached.font && pageFontData) {
                            if (!referencedPageFonts.has(cached.font.filename)) {
                                await Bun.write(
                                    path.join(pageFontData.outputDir, cached.font.filename),
                                    Bun.file(cached.font.sourcePath),
                                );
                            }
                            referencedPageFonts.add(cached.font.filename);
                            pageFontPages++;
                        }
                        if (cached.html !== before) {
                            await Bun.write(output, cached.html);
                            optimizedImagePages++;
                        }
                        cacheHits++;
                        return;
                    }
                    let cachedFont: { filename: string; sourcePath: string } | undefined;
                    const dependencies = new Set<string>();
                    const document = parse(before, { sourceCodeLocationInfo: true });
                    const emitHtml = createHtmlMutationEmitter(before, document);
                    promoteCodeStyles(document);
                    containMermaidSvgs(document);
                    removePageFontStyles(document);
                    // 正文里手写的 /posts/x/ 也统一成路由器实际提供的形态
                    normalizeRouteHrefs(document);
                    const images = findHtmlImages(before, document);
                    await updateLocalImageDimensions(images, outDir, {
                        cache: dimensionsCache,
                        loadingPolicy: true,
                        dependencies,
                    });
                    // Card covers become content-addressed WebP. The encoded files
                    // are restored into the output at the end of every build, so a
                    // page served from the page-output cache still resolves them.
                    if (coverEncoder) {
                        try {
                            await upgradeCoverImages(images, {
                                outDir,
                                cacheDir: coverCacheDir,
                                sharp: coverEncoder,
                                dependencies,
                                logger,
                            });
                        } catch (error) {
                            logger.warn(`封面转 WebP 失败：${describeError(error)}`);
                        }
                    }
                    if (pageFontData) {
                        const linkedStylesheetText = await readLinkedStylesheetText(
                            "",
                            output,
                            outDir,
                            linkedCssTextCache,
                            document,
                            dependencies,
                        );
                        const pageFont = await writePageFontSubsetIntoDocumentAsync(
                            document,
                            pageFontData.fontBuffer,
                            pageFontData.cacheDir,
                            "/_astro/fonts/",
                            linkedStylesheetText,
                            sharedFonts,
                        );
                        if (pageFont) {
                            pageFontPages++;
                            if (pageFont.cacheHit) pageFontSubsetCacheHits++;
                            cachedFont = {
                                filename: pageFont.filename,
                                sourcePath: pageFont.sourcePath,
                            };
                            if (!referencedPageFonts.has(pageFont.filename)) {
                                await Bun.write(
                                    path.join(pageFontData.outputDir, pageFont.filename),
                                    Bun.file(pageFont.sourcePath),
                                );
                            }
                            referencedPageFonts.add(pageFont.filename);
                        }
                    }
                    const after = emitHtml();
                    if (after !== before) {
                        await Bun.write(output, after);
                        optimizedImagePages++;
                    }
                    await outputCache.set(
                        entry,
                        before,
                        {
                            html: after,
                            font: cachedFont,
                        },
                        [...dependencies],
                    );
                };
                // Bound I/O concurrency without retaining the entire site's HTML in memory.
                await forEachBounded(pageEntries, 4, processPage);
                if (pageFontData) {
                    await clearPageFontSubsets(pageFontData.outputDir, referencedPageFonts);
                }
                logger.info(`applied image loading hints to ${optimizedImagePages} HTML pages`);
                logger.info(
                    `generated page-specific body font subsets for ${pageFontPages} HTML pages (subset cache ${pageFontSubsetCacheHits}/${pageFontPages})`,
                );
                if (sharedFonts.length > 0) {
                    const sharedSummary = sharedFonts
                        .map(
                            ({ group, chars, cacheHit }) =>
                                `${group} ${chars.length} glyphs${cacheHit ? " (cached)" : ""}`,
                        )
                        .join(", ");
                    logger.info(`generated shared shell font subsets (${sharedSummary})`);
                }
                logger.info(
                    `HTML postprocessing ${(performance.now() - started).toFixed(1)}ms; cache ${cacheHits}/${htmlFiles.filter((entry) => entry.endsWith(".html")).length}`,
                );
                // Covers are emitted here rather than only while a page is
                // post-processed: a cached page skips that pass entirely but its
                // HTML already points at these files, so they must always exist.
                if (coverCacheDir) {
                    const restored = await restoreCoverFiles({ outDir, cacheDir: coverCacheDir });
                    if (restored > 0) logger.debug(`restored ${restored} card covers`);
                }

                // 后处理：Pagefind 搜索索引。启用时任何失败都必须让构建失败，
                // 避免发布一个页面正常但搜索已损坏的产物。
                if (opt.pagefind) {
                    logger.info("Running Pagefind indexer...");
                    const pagefindStarted = performance.now();

                    try {
                        const { index, errors } = await pagefindCreateIndex({
                            includeCharacters: "+#._",
                        });

                        if (!index) {
                            throw new Error(
                                `Pagefind failed to create index: ${errors?.join("; ") ?? "unknown error"}`,
                            );
                        }

                        const { page_count, errors: crawlErrors } = await index.addDirectory({
                            path: outDir,
                        });
                        if (crawlErrors.length) throw new Error(crawlErrors.join("; "));
                        if (page_count === 0) {
                            throw new Error("Pagefind did not index any pages");
                        }

                        const { outputPath, errors: writeErrors } = await index.writeFiles({
                            outputPath: path.join(outDir, "pagefind"),
                        });

                        if (writeErrors.length) throw new Error(writeErrors.join("; "));
                        const cjkPages = await writeCjkSearchIndex(outDir, pageEntries, searchBase);
                        logger.info(`CJK substring index: ${cjkPages} pages`);

                        logger.info(
                            `indexed ${page_count} pages → ${outputPath} (${(performance.now() - pagefindStarted).toFixed(1)}ms)`,
                        );
                    } catch (error) {
                        logger.error(`Pagefind indexing failed: ${describeError(error)}`);
                        throw error;
                    }
                } else {
                    logger.debug("disabled; indexing skipped");
                }
            },
        },
    };

    // 打包内置集成：Astro 的 integrations 配置支持嵌套数组并自动展平（schema 里 val.flat(Infinity)），
    // 因此这里返回 [coreIntegration, sitemap, expressiveCode]，让消费方一行 `integrations: [stalux()]` 即可完成配置。
    const bundled: AstroIntegration[] = [coreIntegration];

    if (opt.sitemap !== false) {
        const userSitemap = opt.sitemap === true ? undefined : opt.sitemap;
        const contentDir = opt.contentDir ?? "stalux";
        const promotePath = path.join(process.cwd(), contentDir, "config", "promote.yml");
        const promoteConfig = existsSync(promotePath)
            ? (parseYaml(readFileSync(promotePath, "utf8")) as { export_md?: boolean } | undefined)
            : undefined;
        const exportMarkdown = promoteConfig?.export_md === true;
        const sitePath = path.join(process.cwd(), contentDir, "config", "site.yml");
        const siteConfig = existsSync(sitePath)
            ? (parseYaml(readFileSync(sitePath, "utf8")) as { url?: string } | undefined)
            : undefined;
        const sitemapSite = opt.site ?? siteConfig?.url;
        const sitemapHomeUrl = sitemapSite?.replace(/\/+$/u, "");
        const defaultFilter = (page: string) =>
            exportMarkdown || !new URL(page).pathname.endsWith(".md");
        const userFilter = userSitemap?.filter;
        const filter = userFilter
            ? (page: string) => defaultFilter(page) && userFilter(page)
            : defaultFilter;
        const customPages = [...(userSitemap?.customPages ?? [])];
        if (exportMarkdown) {
            const postsDir = path.resolve(process.cwd(), contentDir, "posts");
            if (existsSync(postsDir)) {
                for (const filename of readdirSync(postsDir)) {
                    if (!(filename.endsWith(".md") || filename.endsWith(".mdx"))) {
                        continue;
                    }
                    const source = readFileSync(path.join(postsDir, filename), "utf8");
                    const opening = source.startsWith("---\r\n")
                        ? 5
                        : source.startsWith("---\n")
                          ? 4
                          : 0;
                    if (!opening) continue;
                    const closing = source.indexOf("\n---", opening);
                    if (closing < 0) continue;
                    const frontmatterText = source.slice(opening, closing);
                    const frontmatter = frontmatterText.endsWith("\r")
                        ? frontmatterText.slice(0, -1)
                        : frontmatterText;
                    const postData = parseYaml(frontmatter) as
                        | { abbrlink?: string | number; draft?: boolean }
                        | undefined;
                    if (postData?.draft || postData?.abbrlink == null) continue;
                    if (!sitemapSite) continue;
                    const normalizedSite = sitemapSite.endsWith("/")
                        ? sitemapSite.slice(0, -1)
                        : sitemapSite;
                    const url = new URL(
                        `posts/${encodeURIComponent(String(postData.abbrlink))}.md`,
                        `${normalizedSite}/`,
                    );
                    customPages.push(url.href);
                }
            }
        }
        bundled.push(
            sitemap({
                ...userSitemap,
                customPages,
                filter,
                // Page routes are served with one trailing slash; keep the root,
                // the 404 document and real files (`.md`, `.json`, images) as built.
                async serialize(item) {
                    const next = userSitemap?.serialize ? await userSitemap.serialize(item) : item;
                    if (!next) return next;
                    const url = new URL(next.url);
                    if (url.pathname === "/") {
                        next.url = url.origin;
                    } else {
                        url.pathname = toRoutePath(url.pathname);
                        next.url = url.href;
                    }
                    return next;
                },
            }),
            {
                name: "stalux/sitemap-alias",
                hooks: {
                    // Run after @astrojs/sitemap has written its output.
                    "astro:build:done": async ({ dir, logger }) => {
                        const base = userSitemap?.filenameBase ?? "sitemap";
                        const source = new URL(`${base}-0.xml`, dir);
                        if (!(await Bun.file(source).exists())) return;
                        const normalizeHomeUrl = (xml: string) =>
                            sitemapHomeUrl
                                ? xml.replaceAll(
                                      `<loc>${sitemapHomeUrl}/</loc>`,
                                      `<loc>${sitemapHomeUrl}</loc>`,
                                  )
                                : xml;
                        const sourceXml = normalizeHomeUrl(await Bun.file(source).text());
                        await Bun.write(source, sourceXml);
                        // Keep every URL discoverable when a site uses multiple chunks.
                        const index = new URL(`${base}-index.xml`, dir);
                        const indexXml = await Bun.file(index).text();
                        const hasMultipleSitemaps =
                            (indexXml.match(/<sitemap>/gu)?.length ?? 0) > 1;
                        await Bun.write(
                            new URL("sitemap.xml", dir),
                            hasMultipleSitemaps ? indexXml : sourceXml,
                        );
                        logger.info("Generated sitemap.xml");
                    },
                },
            },
        );
    }

    if (opt.expressiveCode !== false) {
        const ecOptions = opt.expressiveCode === true ? undefined : opt.expressiveCode;
        bundled.push(expressiveCode(ecOptions));
    }

    return bundled;
}

/** @alias Public default-import form of the named integration export. */
export default stalux;

// 便捷导出：带默认行号的 Expressive Code 集成（也可从 @xingwangzhe/stalux/expressive-code 导入）
export { expressiveCode } from "./expressive-code";
