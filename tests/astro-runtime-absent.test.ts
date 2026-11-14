import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = new URL("../src/", import.meta.url);
const read = (file: URL) => readFileSync(file, "utf8");

function walk(dir: URL, extension: string): URL[] {
    const entries = readdirSync(dir, { withFileTypes: true });
    const files: URL[] = [];
    for (const entry of entries) {
        const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, dir);
        if (entry.isDirectory()) files.push(...walk(child, extension));
        else if (entry.name.endsWith(extension)) files.push(child);
    }
    return files;
}

/**
 * Astro 的 View Transitions 运行时从未进入这个主题：没有 ClientRouter，
 * 没有 transition:* 指令，也没有 view-transition-name。这些标记一旦回到组件里
 * 就会误导读者（以为 Astro 在负责过渡），并把预取职责同时交给 Astro 和 Swup。
 */
describe("no Astro client router or view transition residue", () => {
    it("keeps Astro prefetch out of every component", () => {
        const offenders = walk(root, ".astro").filter((file) =>
            read(file).includes("data-astro-prefetch"),
        );
        expect(offenders.map((file) => path.basename(file.pathname))).toEqual([]);
    });

    it("emits no Astro transition directives", () => {
        const directives = ["transition:name", "transition:animate", "transition:persist"];
        const offenders = walk(root, ".astro").flatMap((file) => {
            const source = read(file);
            return directives
                .filter((directive) => source.includes(directive))
                .map((directive) => `${path.basename(file.pathname)}:${directive}`);
        });
        expect(offenders).toEqual([]);
    });

    it("declares no view-transition-name in stylesheets or markup", () => {
        const offenders = [...walk(root, ".astro"), ...walk(root, ".css")].filter((file) =>
            /view-transition-name\s*:/u.test(read(file)),
        );
        expect(offenders.map((file) => path.basename(file.pathname))).toEqual([]);
    });

    it("leaves route classification as the only view-transitions export", () => {
        const source = read(new URL("utils/view-transitions.ts", root));
        expect(source).toContain("getRouteKind");
        expect(source).not.toContain("getRouteAnimation");
        expect(source).not.toContain("getSidebarAnimation");
        expect(source).not.toContain("getPostTitleTransitionName");
        expect(source).not.toContain("productionStyleName");
    });

    it("disables Astro prefetch so Swup owns preloading", () => {
        const config = readFileSync(new URL("../astro.config.ts", import.meta.url), "utf8");
        expect(config).toMatch(/prefetch:\s*false/u);
        expect(config).not.toMatch(/defaultStrategy/u);
    });
});
