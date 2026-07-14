// 搜索索引的字段结构：构建端（pages/search-index.json.ts）与前端
// （components/stalux/common/search.astro）共用同一份定义，
// 避免两端各写一份导致字段不一致、索引建好后前端查不到。
export const searchSchema = {
    id: "string",
    type: "string",
    title: "string",
    description: "string",
    content: "string",
    url: "string",
    date: "string",
    tags: "string[]",
} as const;

export type SearchDoc = {
    id: string;
    type: string;
    title: string;
    description: string;
    content: string;
    url: string;
    date: string;
    tags: string[];
};

// Orama 的 create<T> 需要传入 schema 的精确类型，这里从常量推导出复用。
export type SearchSchema = typeof searchSchema;
