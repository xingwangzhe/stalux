import { exec } from "child_process";
import { writeFile, readFile } from "fs/promises";
import { dirname, join } from "path";
import { promisify } from "util";

const execP = promisify(exec);

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
        const scopeBase = scopeDir.split("/").pop();

        if (scopeBase?.startsWith("@")) {
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

            const parentBase = parent.split("/").pop();
            if (parentBase?.startsWith("@")) {
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
function isFlagged(license: string) {
    return FLAGGED_PATTERNS.some((rx) => rx.test(license));
}

async function runChecker(args = "--json --production") {
    const { stdout } = await execP(`bun license-checker-rseidelsohn ${args}`);
    try {
        return JSON.parse(stdout) as Record<string, any>;
        // oxlint-disable-next-line no-unused-vars
    } catch (e) {
        // If parsing fails, throw with original stdout for debugging
        const err = new Error("Failed to parse JSON output from license-checker");
        (err as any).raw = stdout;
        throw err;
    }
}

async function main() {
    const data = await runChecker();

    const flagged = new Set<string>();
    const permissive = new Set<string>();

    for (const fullName of Object.keys(data)) {
        const info = data[fullName];
        const licensesRaw = (info.licenses ?? info.license ?? "UNKNOWN") as string;
        let license = String(licensesRaw).trim();

        // package name without the version
        const at = fullName.lastIndexOf("@");
        const pkgName = at > 0 ? fullName.slice(0, at) : fullName;

        // If flagged, try to read the actual LICENSE file to verify
        if (isFlagged(license) && info.licenseFile) {
            const detected = await detectLicenseFromFile(info.licenseFile);
            if (detected) {
                license = detected;
            } else {
                // For binary packages, try parent package's LICENSE
                const parentDetected = await detectLicenseFromParentPackage(info.path);
                if (parentDetected) {
                    license = parentDetected;
                }
            }
        }

        const line = `${license.toUpperCase()} ${pkgName}`;

        if (isFlagged(license)) flagged.add(line);
        else permissive.add(line);
    }

    const headerFlagged = "=== POSSIBLY NOT COMPATIBLE WITH MIT (REVIEW REQUIRED) ===";
    const headerPermissive = "=== LIKELY MIT-COMPATIBLE (PERMISSIVE) ===";

    const outParts: string[] = [];
    outParts.push("=== THIRD-PARTY RESOURCES (NOT NPM DEPENDENCIES) ===");
    outParts.push(
        "OFL-1.1 Google Sans Code Font — https://fonts.google.com/specimen/Google+Sans+Code",
    );
    outParts.push("  Copyright: Google LLC. Licensed under SIL Open Font License 1.1");
    outParts.push("OFL-1.1 LXGW WenKai Font — https://github.com/lxgw/LxgwWenKai");
    outParts.push("  Copyright: LXGW & contributors. Licensed under SIL Open Font License 1.1");
    outParts.push("");
    outParts.push(headerFlagged);
    outParts.push(...Array.from(flagged).sort((a, b) => a.localeCompare(b)));
    outParts.push("");
    outParts.push(headerPermissive);
    outParts.push(...Array.from(permissive).sort((a, b) => a.localeCompare(b)));
    outParts.push("");

    const out = outParts.join("\n");

    await writeFile("licenses.txt", out, "utf8");
    console.log("Wrote licenses.txt — flagged:", flagged.size, "permissive:", permissive.size);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
