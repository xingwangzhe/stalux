import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// LICENSE file content patterns that indicate MIT-compatible licenses
// These are used to verify flagged packages by reading their actual LICENSE files
const MIT_LICENSE_PATTERNS = [
    /Permission is hereby granted, free of charge, to any person obtaining a copy/i,
    /The above copyright notice and this permission notice shall be included in all/i,
    /THE SOFTWARE IS PROVIDED "AS IS"/i,
];

const UNLICENSE_PATTERNS = [
    /This is free and unencumbered software released into the public domain/i,
    /dedicate any and all copyright interest in the software to the public domain/i,
];

const BLUEOAK_PATTERNS = [
    /Blue Oak Model License/i,
    /Permission to use, copy, modify, and\/or distribute this software for any purpose with or without fee is hereby granted/i,
];

async function detectLicenseFromFile(licenseFile: string): Promise<string | null> {
    try {
        const content = await readFile(licenseFile, "utf8");
        if (MIT_LICENSE_PATTERNS.some((p) => p.test(content))) return "MIT";
        if (UNLICENSE_PATTERNS.some((p) => p.test(content))) return "UNLICENSE";
        if (BLUEOAK_PATTERNS.some((p) => p.test(content))) return "BlueOak-1.0.0";
        return null;
    } catch {
        return null;
    }
}

// For native binary packages (e.g. @bruits/satteri-*), the licenseFile often points to README.md
// without license text. Try to find the parent package's LICENSE file by checking sibling packages.
async function detectLicenseFromParentPackage(pkgPath: string): Promise<string | null> {
    try {
        const nodeModulesPath = pkgPath.match(/.*node_modules/)?.[0];
        if (!nodeModulesPath) return null;

        // For scoped packages like @bruits/satteri-linux-x64-gnu, the parent package
        // (satteri) is typically a sibling in the same node_modules directory
        const scopeDir = dirname(pkgPath);
        const scopeBase = basename(scopeDir);

        if (scopeBase.startsWith("@")) {
            // Check sibling packages in the same node_modules
            const siblingLicense = join(nodeModulesPath, "satteri", "LICENSE");
            const detected = await detectLicenseFromFile(siblingLicense);
            if (detected) return detected;
        }

        // Also try walking up the tree for nested dependencies
        let current = pkgPath;
        while (current.includes("node_modules")) {
            const parent = dirname(current);
            if (!parent.includes("node_modules")) break;

            const parentBase = basename(parent);
            if (parentBase.startsWith("@")) {
                current = parent;
                continue;
            }

            const parentLicense = join(parent, "LICENSE");
            const detected = await detectLicenseFromFile(parentLicense);
            if (detected) return detected;

            current = parent;
        }
        return null;
    } catch {
        return null;
    }
}

// Patterns considered possibly not compatible with MIT and need review
const FLAGGED_PATTERNS = [
    /LGPL/i,
    /\bGPL\b/i,
    /AGPL/i,
    /CC-BY/i,
    /BLUEOAK/i,
    /UNKNOWN/i,
    /MIT\*/i,
    /CUSTOM/i,
    /UNLICENSE/i,
];

const isFlagged = (license: string) => FLAGGED_PATTERNS.some((rx) => rx.test(license));

type LicenseInfo = {
    licenses?: string;
    license?: string;
    licenseFile?: string;
    path?: string;
};

async function runChecker(args: string[] = ["--json", "--production"]) {
    const { stdout } = await execFileAsync("bun", ["license-checker-rseidelsohn", ...args], {
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024,
    });
    try {
        return JSON.parse(stdout) as Record<string, LicenseInfo>;
    } catch {
        // If parsing fails, throw with original stdout for debugging
        throw Object.assign(new Error("Failed to parse JSON output from license-checker"), {
            raw: stdout,
        });
    }
}

/** package name without the version suffix (`@scope/pkg@1.0.0` → `@scope/pkg`) */
const packageNameOf = (fullName: string) => {
    const at = fullName.lastIndexOf("@");
    return at > 0 ? fullName.slice(0, at) : fullName;
};

const data = await runChecker();

const flagged = new Set<string>();
const permissive = new Set<string>();

for (const [fullName, info] of Object.entries(data)) {
    const licensesRaw = info.licenses ?? info.license ?? "UNKNOWN";
    let license = String(licensesRaw).trim();
    const pkgName = packageNameOf(fullName);

    // If flagged, try to read the actual LICENSE file to verify
    if (isFlagged(license) && info.licenseFile) {
        const detected =
            (await detectLicenseFromFile(info.licenseFile)) ??
            (info.path ? await detectLicenseFromParentPackage(info.path) : null);
        if (detected) license = detected;
    }

    const line = `${license.toUpperCase()} ${pkgName}`;
    if (isFlagged(license)) flagged.add(line);
    else permissive.add(line);
}

const out = [
    "=== THIRD-PARTY RESOURCES (NOT NPM DEPENDENCIES) ===",
    "OFL-1.1 Google Sans Code Font — https://fonts.google.com/specimen/Google+Sans+Code",
    "  Copyright: Google LLC. Licensed under SIL Open Font License 1.1",
    "OFL-1.1 LXGW WenKai Font — https://github.com/lxgw/LxgwWenKai",
    "  Copyright: LXGW & contributors. Licensed under SIL Open Font License 1.1",
    "",
    "=== POSSIBLY NOT COMPATIBLE WITH MIT (REVIEW REQUIRED) ===",
    ...[...flagged].toSorted((a, b) => a.localeCompare(b)),
    "",
    "=== LIKELY MIT-COMPATIBLE (PERMISSIVE) ===",
    ...[...permissive].toSorted((a, b) => a.localeCompare(b)),
    "",
].join("\n");

await writeFile("license.txt", out, "utf8");
console.log("Wrote license.txt — flagged:", flagged.size, "permissive:", permissive.size);
