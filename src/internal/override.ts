/**
 * 组件覆盖解析系统
 *
 * 借鉴 Starlight 的 components override 模式，
 * 允许用户通过集成选项自定义任意主题组件。
 *
 * 所有默认路径相对于包内的 src/components/stalux/ 目录。
 */

import type { ComponentOverrideMap } from "../config";

// ---------------------------------------------------------------------------
// 可覆盖组件清单（相对于包内 src/ 目录）
// ---------------------------------------------------------------------------

export const STALUX_COMPONENTS = {
    // Layout
    Head: "layouts/head.astro",
    Footer: "layouts/footer.astro",
    Navs: "layouts/navs.astro",
    ListPage: "layouts/listPage.astro",

    // Common
    Author: "common/author.astro",
    Date: "common/date.astro",
    Search: "common/search.astro",
    TextType: "common/textType.astro",
    VerCount: "common/verCount.astro",

    // Home
    SocialMedia: "links/socialMedia.astro",
    ToArchive: "archives/toArchive.astro",

    // Posts
    PostLeft: "posts/postLeft.astro",
    PostContent: "posts/postContent.astro",
    PostRight: "posts/postRight.astro",
    PostNavigation: "posts/postNavigation.astro",
    PostCC: "posts/postCC.astro",
    WalineComment: "posts/WalineComment.astro",
    PostToc: "posts/postToc.astro",
    PostAuthor: "posts/postAuthor.astro",
    PostCard: "posts/postCard.astro",
    PostList: "posts/postList.astro",
    PostTaxonomy: "posts/PostTaxonomy.astro",
    PhotoSwipeStyle: "posts/PhotoSwipeStyle.astro",
    RandomPost: "posts/randomPost.astro",

    // Archives
    ArchivesList: "archives/archivesList.astro",

    // Categories
    CategoriesCard: "categories/categoriesCard.astro",
    CategoriesList: "categories/categoriesList.astro",

    // Tags
    TagHeader: "tags/tagHeader.astro",
    TagsCloud: "tags/tagsCloud.astro",

    // Words
    WordCard: "words/wordCard.astro",
    WordList: "words/wordList.astro",

    // Links
    LinkCard: "links/linkCard.astro",
    LinkList: "links/linkList.astro",

    // Footer
    FooterBadges: "footer/FooterBadges.astro",
    FooterBeian: "footer/FooterBeian.astro",
    FooterCopyright: "footer/FooterCopyright.astro",
    FooterStats: "footer/FooterStats.astro",
    FooterThemeInfo: "footer/FooterThemeInfo.astro",

    // Analytics
    Clarity: "analytics/clarity.astro",
    Google: "analytics/google.astro",
    Umami: "analytics/umami.astro",
} as const;

/** 组件键名联合类型 */
export type StaluxComponentKey = keyof typeof STALUX_COMPONENTS;

/**
 * 获取组件的完整包内路径
 *
 * @param key 组件键名
 * @param overrides 用户覆盖映射
 * @param componentsDir 包内 components 目录的绝对路径
 * @returns 组件的绝对路径
 */
export function resolveComponentPath(
    key: StaluxComponentKey,
    overrides: ComponentOverrideMap = {},
    componentsDir: string,
): string {
    const override = overrides[key];
    if (override) return override;
    return `${componentsDir}/stalux/${STALUX_COMPONENTS[key]}`;
}
