/**
 * Stalux 内容集合配置
 *
 * 使用 defineCollections 辅助快速配置四个集合。
 * 插件模式下，用户在自己的项目中类似配置。
 */

import { defineCollections } from "./schemas/collections";

// 默认使用 "stalux" 作为内容目录
export const collections = defineCollections({ contentDir: "stalux" });
