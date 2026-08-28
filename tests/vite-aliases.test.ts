import path from "node:path";

import { describe, expect, it } from "vitest";

import { createViteAliases } from "../src/internal/vite-aliases";

describe("consumer Vite aliases", () => {
    it("resolves runtime cache helpers used by injected routes", () => {
        const sourceDirectory = path.resolve("node_modules/@xingwangzhe/stalux/src");

        expect(createViteAliases(sourceDirectory)["@internal"]).toBe(
            path.join(sourceDirectory, "internal"),
        );
    });
});
