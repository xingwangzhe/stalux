import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';

const execP = promisify(exec);

// Patterns considered possibly not compatible with MIT and need review
const FLAGGED_PATTERNS = [
    /LGPL/i,
    /\bGPL\b/i,
    /AGPL/i,
    /CC-BY/i,
    /BLUEOAK/i,
    /UNKNOWN/i,
    /MIT\*/i
];

function isFlagged(license: string) {
    return FLAGGED_PATTERNS.some((rx) => rx.test(license));
}

async function runChecker(args = '--json --production') {
    const { stdout } = await execP(`bun license-checker-rseidelsohn ${args}`);
    try {
        return JSON.parse(stdout) as Record<string, any>;
    } catch (e) {
        // If parsing fails, throw with original stdout for debugging
        const err = new Error('Failed to parse JSON output from license-checker');
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
        const licensesRaw = (info.licenses ?? info.license ?? 'UNKNOWN') as string;
        const license = String(licensesRaw).trim();

        // package name without the version
        const at = fullName.lastIndexOf('@');
        const pkgName = at > 0 ? fullName.slice(0, at) : fullName;

        const line = `${license.toUpperCase()} ${pkgName}`;

        if (isFlagged(license)) flagged.add(line);
        else permissive.add(line);
    }

    const headerFlagged = '=== POSSIBLY NOT COMPATIBLE WITH MIT (REVIEW REQUIRED) ===';
    const headerPermissive = '=== LIKELY MIT-COMPATIBLE (PERMISSIVE) ===';

    const outParts: string[] = [];
    outParts.push(headerFlagged);
    outParts.push(...Array.from(flagged).sort((a, b) => a.localeCompare(b)));
    outParts.push('');
    outParts.push(headerPermissive);
    outParts.push(...Array.from(permissive).sort((a, b) => a.localeCompare(b)));
    outParts.push('');

    const out = outParts.join('\n');

    await writeFile('licenses.txt', out, 'utf8');
    console.log('Wrote licenses.txt — flagged:', flagged.size, 'permissive:', permissive.size);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});