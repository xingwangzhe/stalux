/**
 * Stalux 封装的 Expressive Code 集成 —— 默认启用代码块行号。
 *
 * 插件模式下直接从包导入，无需单独安装 @expressive-code/plugin-line-numbers：
 * ```js
 * import { expressiveCode } from "@xingwangzhe/stalux";
 *
 * export default defineConfig({
 *     integrations: [stalux({ contentDir: "stalux" }), expressiveCode({ themes: [...] })],
 * });
 * ```
 *
 * 行号插件是 Expressive Code 引擎级插件（必须通过 expressiveCode() 的 plugins 选项传入，
 * 无法由 stalux 集成自动注入），因此这里把 pluginLineNumbers 与用户配置合并，
 * 让行号成为默认行为。
 */
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import expressiveCodeBase from "astro-expressive-code";

type ExpressiveCodeOptions = NonNullable<Parameters<typeof expressiveCodeBase>[0]>;

/**
 * 创建带默认行号插件的 Expressive Code 集成。
 * @param options - 透传 astro-expressive-code 的选项；用户传入的 plugins 会追加在行号插件之后
 */
export function expressiveCode(options: ExpressiveCodeOptions = {}) {
    const plugins = [pluginLineNumbers(), ...(options.plugins ?? [])];
    return expressiveCodeBase({ ...options, plugins });
}

export default expressiveCode;
