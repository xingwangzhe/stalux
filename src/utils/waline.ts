/**
 * 从主题配置（stalux.comment.waline，类型较宽松）中提取 Waline 组件所需的 props，
 * 集中处理字段透传，避免在每个调用处（about / PostLayout）重复十几行 as any 赋值块。
 */
export function buildWalineProps(walineConfig: unknown) {
    const c = (walineConfig ?? {}) as Record<string, unknown>;
    return {
        serverURL: c.serverURL,
        lang: c.lang,
        locale: c.locale,
        emoji: c.emoji,
        reaction: c.reaction,
        meta: c.meta,
        wordLimit: c.wordLimit,
        pageSize: c.pageSize,
        login: c.login,
        recaptchaV3Key: c.recaptchaV3Key,
        turnstileKey: c.turnstileKey,
        dark: c.dark,
        noCopyright: c.noCopyright,
        commentSorting: c.commentSorting,
        imageUploader: c.imageUploader,
        highlighter: c.highlighter,
        texRenderer: c.texRenderer,
        search: c.search,
    };
}
