/**
 * Stalux — Astro 博客主题集成入口
 *
 * 可作为：
 * 1. Astro Integration（插件模式）：`integrations: [stalux()]`
 * 2. 源码模板（Template 模式）：额外提供 create-stalux CLI 脚手架
 *
 * 基于 Astro 7.1.3 Integration API（astro:config:setup / injectRoute / injectScript）
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AstroIntegration } from "astro";
// pagefind 是 ESM-only 包，需要在模块顶层导入
// 因为 astro:build:done 钩子中 Vite module runner 已关闭，无法动态 import
import { createIndex as pagefindCreateIndex } from "pagefind";

import type { StaluxOptions } from "./config";
import { staluxComponentsAlias } from "./internal/components-plugin";
import { runFontSubsetting } from "./internal/font-subset";

// ---------------------------------------------------------------------------
// 页面条目定义
// ---------------------------------------------------------------------------

interface RouteEntry {
    pattern: string;
    entrypoint: string;
    prerender?: boolean;
}

/**
 * 获取所有需要注入的路由列表
 */
function getRoutes(baseDir: URL): RouteEntry[] {
    const resolvePage = (relPath: string): string => fileURLToPath(new URL(relPath, baseDir));

    return [
        // ---- 静态页面 ----
        { pattern: "/", entrypoint: resolvePage("./pages/index.astro") },
        { pattern: "/about/", entrypoint: resolvePage("./pages/about.astro") },
        { pattern: "/archives/", entrypoint: resolvePage("./pages/archives.astro") },
        { pattern: "/links/", entrypoint: resolvePage("./pages/links.astro") },
        { pattern: "/words/", entrypoint: resolvePage("./pages/words.astro") },
        { pattern: "/404", entrypoint: resolvePage("./pages/404.astro") },

        // ---- 动态页面 ----
        { pattern: "/posts/[post]", entrypoint: resolvePage("./pages/posts/[post].astro") },
        { pattern: "/tags/", entrypoint: resolvePage("./pages/tags/index.astro") },
        { pattern: "/tags/[tag]", entrypoint: resolvePage("./pages/tags/[tag].astro") },
        { pattern: "/categories/", entrypoint: resolvePage("./pages/categories/index.astro") },
        {
            pattern: "/categories/[category]",
            entrypoint: resolvePage("./pages/categories/[category].astro"),
        },

        // ---- API 端点 ----
        { pattern: "/rss.xml", entrypoint: resolvePage("./pages/rss.xml.ts") },
        { pattern: "/atom.xml", entrypoint: resolvePage("./pages/atom.xml.ts") },
        { pattern: "/llms.txt", entrypoint: resolvePage("./pages/llms.txt.ts") },
        { pattern: "/llms-full.txt", entrypoint: resolvePage("./pages/llms-full.txt.ts") },
        {
            pattern: "/api/post.abbrlink.json",
            entrypoint: resolvePage("./pages/api/post.abbrlink.json.ts"),
        },

        // ---- Markdown 导出端点 ----
        { pattern: "/index.md", entrypoint: resolvePage("./pages/index.md.ts") },
        { pattern: "/about.md", entrypoint: resolvePage("./pages/about.md.ts") },
        { pattern: "/archives.md", entrypoint: resolvePage("./pages/archives.md.ts") },
        { pattern: "/links.md", entrypoint: resolvePage("./pages/links.md.ts") },
        { pattern: "/words.md", entrypoint: resolvePage("./pages/words.md.ts") },
        { pattern: "/tags/index.md", entrypoint: resolvePage("./pages/tags/index.md.ts") },
        { pattern: "/tags/[tag].md", entrypoint: resolvePage("./pages/tags/[tag].md.ts") },
        {
            pattern: "/categories/index.md",
            entrypoint: resolvePage("./pages/categories/index.md.ts"),
        },
        {
            pattern: "/categories/[category].md",
            entrypoint: resolvePage("./pages/categories/[category].md.ts"),
        },
        { pattern: "/posts/[post].md", entrypoint: resolvePage("./pages/posts/[post].md.ts") },
    ];
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
export function stalux(options: StaluxOptions = {}): AstroIntegration {
    const opt: StaluxOptions = {
        contentDir: options.contentDir ?? "stalux",
        pagefind: options.pagefind ?? true,
        devToolbar: options.devToolbar ?? true,
        ...options,
    };

    // 探测是否为插件模式（通过 npm 安装）vs 源码开发模式
    // 安装在 node_modules 中时，页面的文件路由不可用，需要通过 injectRoute 注入
    const isPluginMode = import.meta.url.includes("node_modules");

    return {
        name: "stalux",
        hooks: {
            "astro:config:setup": ({
                injectRoute,
                injectScript,
                updateConfig,
                addDevToolbarApp,
                _config,
                logger,
            }) => {
                const srcDir = fileURLToPath(new URL(".", import.meta.url));

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
                        },
                    },
                });

                // 2. 注入全局 CSS
                injectScript("page-ssr", `import "${srcDir}/styles/base/init.css";`);

                // 3. 注入所有页面路由（仅插件模式，源码模式下使用文件路由）
                if (isPluginMode) {
                    const routes = getRoutes(new URL(".", import.meta.url));
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
            },

      "astro:build:start": async ({ logger }) => {
        // 5. 每路由最小化字体裁剪（构建时）
        try {
          const projectRoot = process.cwd();
          await runFontSubsetting(projectRoot, logger);
        } catch (error) {
          logger.warn(`Font subsetting skipped: ${String(error)}`);
        }
      },

      "astro:server:setup": async ({ logger }) => {
        // 6. 每路由最小化字体裁剪（开发模式）
        try {
          const projectRoot = process.cwd();
          await runFontSubsetting(projectRoot, logger);
        } catch (error) {
          logger.warn(`Font subsetting skipped: ${String(error)}`);
        }
      },

            "astro:build:done": async ({ dir, logger }) => {
                // 6. 后处理：Pagefind 搜索索引
                if (opt.pagefind) {
                    const outDir = fileURLToPath(dir);
                    logger.info("Running Pagefind indexer...");

                    try {
                        const { index, errors } = await pagefindCreateIndex();

                        if (!index) {
                            logger.error("Pagefind failed to create index");
                            errors?.forEach((e) => logger.error(e));
                            return;
                        }

                        const { page_count } = await index.addDirectory({ path: outDir });
                        if (page_count === 0) {
                            logger.warn("Pagefind: no pages indexed");
                            return;
                        }

                        const { outputPath } = await index.writeFiles({
                            outputPath: path.join(outDir, "pagefind"),
                        });

                        logger.info(`Pagefind indexed ${page_count} pages → ${outputPath}`);
                    } catch (error) {
                        logger.error(`Pagefind indexing failed: ${String(error)}`);
                    }
                }
            },
        },
    };
}

export default stalux;
