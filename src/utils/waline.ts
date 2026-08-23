import type { CommentData } from "@schemas/config";

export interface WalineComponentProps {
    serverURL?: string;
    lang?: string;
    locale?: unknown;
    emoji?: string[];
    requiredMeta?: string[];
    reaction?: boolean;
    meta?: string[];
    wordLimit?: number;
    pageSize?: number;
    login?: string;
    recaptchaV3Key?: string;
    turnstileKey?: string;
    dark?: string | boolean;
    noCopyright?: boolean;
    commentSorting?: string;
    imageUploader?: unknown;
    highlighter?: unknown;
    texRenderer?: unknown;
    search?: unknown;
}

type WalineSection = NonNullable<CommentData["waline"]>;

/** Build the one typed component boundary shared by article and About comments. */
export function buildWalineProps(config: WalineSection): WalineComponentProps {
    return {
        serverURL: config.serverURL,
        lang: config.lang,
        locale: config.locale,
        emoji: config.emoji,
        requiredMeta: config.requiredMeta,
        reaction: config.reaction,
        meta: config.meta,
        wordLimit: config.wordLimit,
        pageSize: config.pageSize,
        login: config.login,
        recaptchaV3Key: config.recaptchaV3Key,
        turnstileKey: config.turnstileKey,
        dark: config.dark,
        noCopyright: config.noCopyright,
        commentSorting: config.commentSorting,
        imageUploader: config.imageUploader,
        highlighter: config.highlighter,
        texRenderer: config.texRenderer,
        search: config.search,
    };
}
