import path from "node:path";

export function createViteAliases(srcDir: string): Record<string, string> {
    return {
        "@components": path.resolve(srcDir, "components"),
        "@assets": path.resolve(srcDir, "assets"),
        "@layouts": path.resolve(srcDir, "layouts"),
        "@scripts": path.resolve(srcDir, "scripts"),
        "@styles": path.resolve(srcDir, "styles"),
        "@utils": path.resolve(srcDir, "utils"),
        "@i18n": path.resolve(srcDir, "i18n"),
        "@plugins": path.resolve(srcDir, "plugins"),
        "@schemas": path.resolve(srcDir, "schemas"),
        "@internal": path.resolve(srcDir, "internal"),
    };
}
