/**
 * 构建期搜索文本收集器 — Sätteri MDAST 插件在每篇文章渲染时将
 * searchText 写入此 Map，search-index.json.ts 构建时直接读取，
 * 无需 render() 重复渲染。
 */
const store = new Map<string, string>();

export function setSearchText(abbrlink: string, text: string): void {
    store.set(abbrlink, text);
}

export function getSearchText(abbrlink: string): string | undefined {
    return store.get(abbrlink);
}

export function getAllSearchTexts(): Map<string, string> {
    return store;
}
