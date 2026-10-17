import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, expect, it } from "vitest";
import { isPluginProject } from "../src/internal/project-mode";

const temporary: string[] = [];
afterEach(() => {
    for (const directory of temporary.splice(0))
        rmSync(directory, { recursive: true, force: true });
});

it("distinguishes a linked consumer from the theme template using real roots", () => {
    const root = mkdtempSync(path.join(tmpdir(), "stalux-mode-"));
    temporary.push(root);
    const theme = path.join(root, "theme");
    const consumer = path.join(root, "consumer");
    mkdirSync(theme);
    mkdirSync(consumer);
    const linked = path.join(root, "linked-theme");
    symlinkSync(theme, linked, "dir");
    expect(isPluginProject(pathToFileURL(consumer), pathToFileURL(linked))).toBe(true);
    expect(isPluginProject(pathToFileURL(theme), pathToFileURL(theme))).toBe(false);
    expect(isPluginProject(pathToFileURL(linked), pathToFileURL(theme))).toBe(false);
});
