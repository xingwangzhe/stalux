import en from "@i18n/en.json";
import zhCN from "@i18n/zh-CN.json";

const dicts: Record<string, Record<string, unknown>> = {
    "zh-CN": zhCN as Record<string, unknown>,
    en: en as Record<string, unknown>,
};

export interface Translator {
    t(key: string, params?: Record<string, string | number>): string;
    lang: string;
}

export function createTranslator(lang: string): Translator {
    const normalizedLang = lang.toLowerCase();
    const language = normalizedLang.startsWith("en") ? "en" : "zh-CN";
    const dict = dicts[language] ?? dicts["zh-CN"] ?? en;

    function t(key: string, params?: Record<string, string | number>): string {
        const keys = key.split(".");
        let text: unknown = dict;
        for (const k of keys) {
            if (text && typeof text === "object") {
                text = (text as Record<string, unknown>)[k];
            } else {
                return lookup(en, key) ?? key;
            }
        }
        if (typeof text !== "string" || !text.trim()) text = lookup(en, key) ?? key;

        let result = text as string;
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                result = result.replace(`{${k}}`, String(v));
            }
        }
        return result;
    }

    return { t, lang: language };
}

function lookup(dictionary: Record<string, unknown>, key: string): string | undefined {
    let value: unknown = dictionary;
    for (const part of key.split(".")) {
        if (!value || typeof value !== "object") return;
        value = (value as Record<string, unknown>)[part];
    }
    return typeof value === "string" && value.trim() ? value : undefined;
}

/**
 * Map config lang value to OpenGraph locale format.
 * e.g. "zh-CN" → "zh_CN", "en" → "en_US"
 */
export function langToOpenGraphLocale(lang: string): string {
    const map: Record<string, string> = {
        "zh-CN": "zh_CN",
        "zh-TW": "zh_TW",
        en: "en_US",
        "en-US": "en_US",
        "en-GB": "en_GB",
        ja: "ja_JP",
        ko: "ko_KR",
    };
    return map[lang] || lang;
}

/**
 * Map config lang value to RSS/Atom feed language tag.
 * e.g. "zh-CN" → "zh-cn", "en" → "en-us"
 */
export function langToFeedLanguage(lang: string): string {
    return lang.toLowerCase();
}
