import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const cli = fileURLToPath(new URL("../scripts/cli.ts", import.meta.url));
let tempDir: string;

function run(...args: string[]) {
    return spawnSync("node", [cli, ...args], {
        cwd: tempDir,
        encoding: "utf8",
    });
}

beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "stalux-cli-"));
});

afterEach(() => rmSync(tempDir, { recursive: true, force: true }));

describe("Stalux CLI", () => {
    it("prints help without a command", () => {
        const result = run();

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("stalux init");
    });

    it("returns a failure for unknown commands", () => {
        const result = run("unknown");

        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Unknown command: unknown");
    });

    it("creates the content scaffold and leaves existing files untouched", () => {
        expect(run("init").status).toBe(0);

        const config = join(tempDir, "stalux/config/site.yml");
        const post = join(tempDir, "stalux/posts/hello-stalux.md");
        expect(existsSync(config)).toBe(true);
        expect(readFileSync(post, "utf8")).toContain("title: Hello Stalux!");

        writeFileSync(config, "custom config\n");
        const secondRun = run("init");

        expect(secondRun.status).toBe(0);
        expect(secondRun.stdout).toContain("stalux/config/site.yml (exists, skipped)");
        expect(readFileSync(config, "utf8")).toBe("custom config\n");
    });
});
