/**
 * 组件覆盖解析 Vite 插件
 *
 * 提供 Vite 别名 `@stalux/component/*`，实现可覆盖的组件导入。
 *
 * 页面中使用：
 * ```astro
 * import Navs from "@stalux/component/Navs";
 * ```
 *
 * 用户在集成选项中覆盖：
 * ```ts
 * stalux({ components: { Navs: "./src/CustomNavs.astro" } })
 * ```
 *
 * 插件自动将别名解析为用户提供的路径或包内默认路径。
 */

import { fileURLToPath } from "node:url";

import type { AstroIntegrationLogger } from "astro";
import type { Plugin } from "vite";

import type { ComponentOverrideMap } from "../config";
import { resolveComponentPath, type StaluxComponentKey } from "./override";

const VIRTUAL_PREFIX = "@stalux/component/";

/**
 * 创建 Vite 别名插件，处理 `@stalux/component/*` → 实际组件路径
 */
export function staluxComponentsAlias(
    overrides: ComponentOverrideMap = {},
    logger?: AstroIntegrationLogger,
): Plugin {
    // 包内 components 目录的绝对路径
    const componentsDir = fileURLToPath(new URL("../components", import.meta.url));

    return {
        name: "stalux:components-alias",
        resolveId(id: string, importer: string | undefined) {
            if (!id.startsWith(VIRTUAL_PREFIX)) return null;

            const componentName = id.slice(VIRTUAL_PREFIX.length) as StaluxComponentKey;

            // 使用 resolveComponentPath 获取实际路径
            const resolvedPath = resolveComponentPath(componentName, overrides, componentsDir);

            logger?.debug(`${componentName}: ${overrides[componentName] ? "override" : "default"}`);

            // 如果是用户提供的相对路径，相对于项目根解析
            if (overrides[componentName]) {
                return this.resolve(resolvedPath, importer, { skipSelf: true });
            }

            return resolvedPath;
        },
    } satisfies Plugin;
}
