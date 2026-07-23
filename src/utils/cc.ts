import type { Translator } from "@utils/i18n";

/**
 * 从许可证代码（如 "CC-BY-NC-SA-4.0"）推导 CC 官网链接。
 *
 * "CC-BY-NC-SA-4.0" → "https://creativecommons.org/licenses/by-nc-sa/4.0/"
 * "CC0-1.0"         → "https://creativecommons.org/publicdomain/zero/1.0/"
 */
export function buildCCLink(licenseCode: string): string {
    if (licenseCode === "CC0-1.0") {
        return "https://creativecommons.org/publicdomain/zero/1.0/";
    }

    const match = licenseCode.match(/^CC-?(.+)-(\d+(?:\.\d+))$/);
    if (!match) {
        return "https://creativecommons.org/licenses/by-nc-sa/4.0/";
    }

    const [, pathPart, version] = match;
    return `https://creativecommons.org/licenses/${pathPart.toLowerCase()}/${version}/`;
}

/**
 * 用 i18n 翻译组装许可证显示名称。
 *
 * "CC-BY-NC-SA-4.0" + zh-CN  → "知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议"
 * "CC-BY-NC-SA-4.0" + en     → "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License"
 * "CC0-1.0"         + zh-CN  → "CC0 1.0 通用"
 */
export function buildCCName(licenseCode: string, t: Translator["t"]): string {
    if (licenseCode === "CC0-1.0") {
        return t("cc.zero");
    }

    const match = licenseCode.match(/^CC-?(.+)-(\d+(?:\.\d+))$/);
    if (!match) {
        // 无法解析时回退为默认 CC-BY-NC-SA-4.0
        const elements = ["BY", "NC", "SA"].map((code) => t("cc." + code)).join("-");
        return t("cc.format", { elements, version: "4.0" });
    }

    const [, pathPart, version] = match;
    const codes = pathPart.split("-");
    const elements = codes.map((code) => t("cc." + code)).join("-");
    return t("cc.format", { elements, version });
}
