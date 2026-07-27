/**
 * Stalux 内容集合配置
 *
 * 使用 stalux 包提供的 defineCollections 快速配置。
 * 如需自定义内容路径，修改 contentDir 参数即可。
 */
import { defineCollections } from "stalux/schemas";

export const collections = defineCollections({
    contentDir: "stalux",
});
