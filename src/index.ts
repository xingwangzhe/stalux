/**
 * Stalux — Astro 博客主题集成入口
 *
 * 可作为：
 * 1. Astro Integration（插件模式）：`integrations: [stalux()]`
 * 2. 源码模板（Template 模式）：额外提供 create-stalux CLI 脚手架
 *
 * 基于 Astro 7.1.3 Integration API（astro:config:setup / injectRoute / injectScript）
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sitemap from "@astrojs/sitemap";
import { mermaidHast, mermaidMdast } from "@xingwangzhe/satteri-mermaid";
import { photoswipe } from "@xingwangzhe/satteri-photoswipe";
import type { AstroIntegration } from "astro";
import { fontProviders } from "astro/config";
// pagefind 是 ESM-only 包，需要在模块顶层导入
// 因为 astro:build:done 钩子中 Vite module runner 已关闭，无法动态 import
import { createIndex as pagefindCreateIndex } from "pagefind";

import type { StaluxOptions } from "./config";
import { expressiveCode } from "./expressive-code";
import { staluxComponentsAlias } from "./internal/components-plugin";
import { type FontSlice, runFontSlicing } from "./internal/font-slices";
import { createInjectedRoutes } from "./internal/injected-routes";
import { createRuntimeCacheKey } from "./internal/runtime-cache-key";
import {
    appendUniquePlugin,
    collectPluginNames,
    prepareSatteriProcessor,
} from "./internal/satteri-config";
import { featureFlagsHast, featureFlagsMdast } from "./plugins/feature-flags";
import { temml } from "./plugins/satteri-temml";

// 字体配置（Astro Fonts API）通过 updateConfig 注入，两种模式（源码模板/npm 插件）都生效。
// 官方 local provider 完全本地读文件（readFile），不联网；
// 7.2.2 已修复 Fonts API 随机端口污染 incrementalBuild dependencyHash 的问题（PR #17659）。
function buildFontsConfig(slices: FontSlice[], codeNormal: string, codeItalic?: string) {
    return [
        {
            // 正文：LXGW WenKai 按 unicode-range 分片，浏览器只下载命中区间的分片
            provider: fontProviders.local(),
            name: "LXGW WenKai",
            cssVariable: "--font-body",
            fallbacks: ["Noto Sans SC", "Noto Sans CJK SC", "system-ui", "sans-serif"],
            optimizedFallbacks: true,
            options: {
                variants: slices.map((slice) => ({
                    weight: 400,
                    style: "normal",
                    src: [slice.src],
                    unicodeRange: slice.unicodeRange,
                })),
            },
        },
        {
            // 代码：Google Sans Code 可变字体，原样注册，不切片
            provider: fontProviders.local(),
            name: "Google Sans Code",
            cssVariable: "--font-code",
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
function syncBackgroundSvgs(srcDir: string): { copied: number; skipped: number } {
    const srcBg = path.join(srcDir, "../public/background");
    if (!existsSync(srcBg)) return { copied: 0, skipped: 0 };

    const destBg = path.resolve(process.cwd(), "public", "background");
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

// ---------------------------------------------------------------------------
// Vite 别名配置（供页面使用 @components etc.）
// ---------------------------------------------------------------------------

function getViteAliases(srcDir: string) {
    return {
        "@components": path.resolve(srcDir, "components"),
        "@assets": path.resolve(srcDir, "assets"),
        "@layouts": path.resolve(srcDir, "layouts"),
        "@scripts": path.resolve(srcDir, "scripts"),
        "@styles": path.resolve(srcDir, "styles"),
        "@utils": path.resolve(srcDir, "utils"),
        "@i18n": path.resolve(srcDir, "i18n"),
        "@plugins": path.resolve(srcDir, "plugins"),
        "@schemas": path.resolve(srcDir, "schemas"),
    };
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

    // 探测是否为插件模式（通过 npm 安装）vs 源码开发模式
    // 安装在 node_modules 中时，页面的文件路由不可用，需要通过 injectRoute 注入
    const isPluginMode = import.meta.url.includes("node_modules");

    const coreIntegration: AstroIntegration = {
        name: "stalux",
        hooks: {
            "astro:config:setup": async ({
                injectRoute,
                injectScript,
                updateConfig,
                addDevToolbarApp,
                config,
                logger,
            }) => {
                const srcDir = fileURLToPath(new URL(".", import.meta.url));
                const runtimeCacheKey = createRuntimeCacheKey(
                    path.join(srcDir, "scripts"),
                    path.resolve(srcDir, "../package.json"),
                );

                // 1. 注入 Vite 别名 + 组件覆盖插件 + Vue 特性标记（Waline 依赖）
                updateConfig({
                    vite: {
                        resolve: {
                            alias: getViteAliases(srcDir),
                        },
                        plugins: [staluxComponentsAlias(opt.components)],
                        define: {
                            __VUE_OPTIONS_API__: true,
                            __VUE_PROD_DEVTOOLS__: false,
                            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
                            __STALUX_RUNTIME_CACHE_KEY__: JSON.stringify(runtimeCacheKey),
                        },
                    },
                });

                // 2. 注入全局 CSS
                injectScript("page-ssr", `import "${srcDir}/styles/base/init.css";`);
                injectScript("page", `import "${srcDir}/scripts/core-runtime.ts";`);

                // 2.5 同步背景 SVG 到用户项目 public/background/
                // 纯客户端引入：SVG 以静态 URL（/background/pattern-*.svg）被 background.ts 硬编码引用，
                // 不经过 Astro 资源管线（import.meta.glob 会打上每次构建随机的 __ASTRO_ASSET_IMAGE__ 占位符，
                // 破坏增量构建依赖图 hash）。Astro 不会合并集成的 public 目录，这里显式同步一次。
                // 判别式：内容一致跳过（幂等），内容不同才覆盖，用户新增文件保留。
                try {
                    const { copied, skipped } = syncBackgroundSvgs(srcDir);
                    if (copied > 0) {
                        logger.info(`Stalux: 同步背景 SVG ${copied} 个（跳过 ${skipped} 个不变）`);
                    } else if (skipped > 0) {
                        logger.debug(`Stalux: 背景 SVG 无变化（跳过 ${skipped} 个）`);
                    }
                } catch (error) {
                    logger.warn(`Stalux: 同步背景 SVG 失败: ${String(error)}`);
                }

                // 3. 注入所有页面路由（仅插件模式，源码模式下使用文件路由）
                if (isPluginMode) {
                    const routes = createInjectedRoutes(new URL(".", import.meta.url));
                    for (const route of routes) {
                        injectRoute(route);
                    }
                    logger.debug(`Stalux: injected ${routes.length} routes`);
                } else {
                    logger.info("Stalux: running in source mode, file-based routing active");
                }

                // 4. 可选：添加 Dev Toolbar 应用
                if (opt.devToolbar) {
                    addDevToolbarApp({
                        id: "stalux",
                        name: "Stalux",
                        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
                        entrypoint: fileURLToPath(
                            new URL("./internal/dev-toolbar.ts", import.meta.url),
                        ),
                    });
                }

                logger.info(`Stalux initialized (contentDir: ${opt.contentDir})`);

                // 5. 注入 satteri 插件（Mermaid/字数统计/特性标记/数学公式/PhotoSwipe），按插件 name 去重
                // 两种模式都由集成补齐默认插件。Astro 7 的 markdown.processor 默认为 satteri()，
                // 消费方即使完全不配置 processor，这里也会对默认 processor 的 options 做幂等合并：
                //   - features：默认开启 math / frontmatter / gfm / smartPunctuation（用户显式 false 则尊重）
                //   - mdastPlugins：mermaidMdast + temml（数学公式）+ featureFlagsMdast（字数统计）
                //   - hastPlugins：photoswipe（图片灯箱）+ mermaidHast + featureFlagsHast
                // 去重是必须的：重复注册 Mermaid 或 featureFlagsMdast 会导致渲染异常或字数统计翻倍。
                try {
                    const processorOptions = prepareSatteriProcessor(config.markdown?.processor);
                    if (processorOptions) {
                        const seen = collectPluginNames(processorOptions);
                        appendUniquePlugin(processorOptions.mdastPlugins, mermaidMdast(), seen);
                        appendUniquePlugin(processorOptions.mdastPlugins, temml(), seen);
                        appendUniquePlugin(processorOptions.mdastPlugins, featureFlagsMdast, seen);
                        appendUniquePlugin(
                            processorOptions.hastPlugins,
                            mermaidHast({
                                responsive: true,
                                theme: "dark",
                                themeOverrides: { clusterBorder: "#cccccc" },
                            }),
                            seen,
                        );
                        appendUniquePlugin(processorOptions.hastPlugins, photoswipe(), seen);
                        appendUniquePlugin(processorOptions.hastPlugins, featureFlagsHast, seen);
                        logger.debug(
                            "Stalux: injected satteri plugins (mermaid/temml/photoswipe/feature-flags)",
                        );
                    } else {
                        logger.warn(
                            "Stalux: markdown.processor 不是 satteri，无法注入字数统计/数学公式/PhotoSwipe 插件。" +
                                "请在 astro.config 中配置 `processor: satteri({...})`。",
                        );
                    }
                } catch (error) {
                    logger.warn(`Stalux: 注入 markdown 插件失败: ${String(error)}`);
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
                    const siteYaml = readFileSync(siteYamlPath, "utf-8");
                    const urlMatch = siteYaml.match(/^url\s*:\s*(.+)$/m);
                    const rawYamlUrl = urlMatch?.[1];
                    const yamlUrl = rawYamlUrl
                        ?.trim()
                        .replace(/^["']|["']$/g, "")
                        .replace(/\/+$/, "");
                    if (yamlUrl) {
                        const configuredSite = config.site?.replace(/\/+$/, "");
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
                } catch {
                    logger.debug("Stalux: site.yml not found, skip site sync");
                }

                // 7. 字体：构建期把正文切成 unicode-range 分片，通过官方 Fonts API 注入
                // （config:setup 阶段执行，保证 dev/build 都能生成；local provider 纯本地读文件）
                try {
                    const sliced = await runFontSlicing(process.cwd(), logger);
                    if (sliced) {
                        updateConfig({
                            fonts: buildFontsConfig(
                                sliced.body,
                                sliced.codeNormal,
                                sliced.codeItalic,
                            ),
                        });
                        logger.info(
                            `Stalux: injected ${sliced.body.length} body font chunks + code font via Fonts API`,
                        );
                    }
                } catch (error) {
                    logger.warn(`Stalux: font injection failed: ${String(error)}`);
                }
            },

            "astro:build:done": async ({ dir, logger }) => {
                const outDir = fileURLToPath(dir);

                // 后处理：Pagefind 搜索索引。启用时任何失败都必须让构建失败，
                // 避免发布一个页面正常但搜索已损坏的产物。
                if (opt.pagefind) {
                    logger.info("Running Pagefind indexer...");

                    try {
                        const { index, errors } = await pagefindCreateIndex();

                        if (!index) {
                            throw new Error(
                                `Pagefind failed to create index: ${errors?.join("; ") ?? "unknown error"}`,
                            );
                        }

                        const { page_count } = await index.addDirectory({ path: outDir });
                        if (page_count === 0) {
                            throw new Error("Pagefind did not index any pages");
                        }

                        const { outputPath } = await index.writeFiles({
                            outputPath: path.join(outDir, "pagefind"),
                        });

                        logger.info(`Pagefind indexed ${page_count} pages → ${outputPath}`);
                    } catch (error) {
                        logger.error(`Pagefind indexing failed: ${String(error)}`);
                        throw error;
                    }
                }
            },
        },
    };

    // 打包内置集成：Astro 的 integrations 配置支持嵌套数组并自动展平（schema 里 val.flat(Infinity)），
    // 因此这里返回 [coreIntegration, sitemap, expressiveCode]，让消费方一行 `integrations: [stalux()]` 即可完成配置。
    const bundled: AstroIntegration[] = [coreIntegration];

    if (opt.sitemap !== false) {
        const userSitemap = opt.sitemap === true ? undefined : opt.sitemap;
        // 默认过滤：不把 Markdown 源码端点（/posts/*.md）写入 sitemap；用户自定义 filter 与之叠加
        const defaultFilter = (page: string) => !page.endsWith(".md");
        const userFilter = userSitemap?.filter;
        const filter = userFilter
            ? (page: string) => defaultFilter(page) && userFilter(page)
            : defaultFilter;
        bundled.push(
            sitemap({
                ...userSitemap,
                filter,
            }),
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
