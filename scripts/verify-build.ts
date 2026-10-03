import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import packageJson from "../package.json" with { type: "json" };
import { findMissingAssetReferences } from "./verify-build-utils.ts";

const root = process.cwd();
const dist = path.join(root, "dist");

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(`[verify-build] ${message}`);
}

function read(relativePath: string): string {
    return readFileSync(path.join(dist, relativePath), "utf8");
}

function walk(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory() ? walk(target) : [target];
    });
}

function verifyJsonLd(html: string, route: string): void {
    const blocks = [
        ...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gu),
    ];
    assert(blocks.length > 0, `${route} has no JSON-LD`);
    for (const block of blocks) {
        const json = block[1];
        assert(json !== undefined, `${route} has malformed JSON-LD`);
        const parsed = JSON.parse(json);
        assert(
            parsed["@context"] === "https://schema.org",
            `${route} JSON-LD has no schema context`,
        );
    }
}

const pages = {
    home: read("index.html"),
    post: read("posts/a1b2c3d4/index.html"),
    tags: read("tags/index.html"),
    categories: read("categories/index.html"),
    notFound: read("404.html"),
};

const searchStyle = pages.home.match(/<link\b[^>]*data-stalux-search-style[^>]*>/u)?.[0];
assert(searchStyle, "search CSS asset link is missing");
const initialStyleLinks = [
    ...pages.home.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"#]+)"[^>]*>/gu),
];
const initialStyles = [
    ...[...pages.home.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gu)].map(
        (match) => match[1] ?? "",
    ),
    ...initialStyleLinks.map((match) => read((match[1] ?? "").replace(/^\//u, ""))),
].join("\n");
assert(initialStyles.includes(".stalux-main"), "initial render has no blocking layout stylesheet");
assert(initialStyleLinks.length > 0, "shared CSS must be a cacheable stylesheet asset");
assert(!initialStyles.includes(".stalux-cloud-tag-card"), "homepage includes unused tag-cloud CSS");
assert(!initialStyles.includes(".stalux-prose"), "homepage includes unused article typography CSS");
assert(searchStyle.includes('rel="prefetch"'), "search CSS must not block the first paint");
assert(searchStyle.includes('as="style"'), "search CSS must be emitted as a stylesheet asset");
assert(
    /<noscript><link[^>]+rel="stylesheet"/u.test(pages.home),
    "search CSS needs a no-script fallback",
);

assert(
    pages.home.includes('<link rel="canonical" href="https://stalux.needhelp.icu/">'),
    "home canonical is incorrect",
);
assert(
    pages.post.includes(
        '<link rel="canonical" href="https://stalux.needhelp.icu/posts/a1b2c3d4/">',
    ),
    "post canonical is incorrect",
);
assert(
    pages.tags.includes('type="text/markdown" title="Markdown source" href="/tags/index.md"'),
    "tags Markdown alternate does not match the registered route",
);
assert(
    pages.categories.includes(
        'type="text/markdown" title="Markdown source" href="/categories/index.md"',
    ),
    "categories Markdown alternate does not match the registered route",
);
assert(
    pages.notFound.includes('<meta name="robots" content="noindex, nofollow">'),
    "404 robots policy is incorrect",
);
assert(
    pages.home.includes(`name="stalux-version" content="${packageJson.version}"`),
    "generated Stalux version is out of sync with package.json",
);
assert(pages.home.includes("Google Sans Code"), "Astro local code font is missing");
assert(pages.home.includes("data-stalux-typewriter"), "local typewriter is missing");
assert(
    /data-typewriter-text[^>]*aria-hidden="true"[^>]*>[^<]+<\/span>/u.test(pages.home),
    "typewriter must include a visible static first sentence without JavaScript",
);
assert(
    pages.home.includes("stalux-typewriter-accessible"),
    "typewriter accessible text is missing",
);
assert(!pages.home.includes("<astro-typewriter"), "third-party typewriter remains in output");

assert(pages.home.includes('class="agent-home-summary"'), "agent home summary is missing");
assert(
    /\.agent-home-summary[^}]*clip:rect\(0,\s*0,\s*0,\s*0\)[^}]*position:absolute/gu.test(
        initialStyles,
    ),
    "agent home summary is not visually hidden",
);
for (const [route, html] of Object.entries(pages)) verifyJsonLd(html, route);

for (const file of walk(dist).filter((file) => file.endsWith(".html"))) {
    const html = readFileSync(file, "utf8");
    if (!html.includes('class="stalux-root')) continue;
    assert(
        (html.match(/data-stalux-back-to-top/g) ?? []).length === 1,
        `${path.relative(dist, file)} must have exactly one back-to-top button`,
    );
    assert(
        /<footer\b[^>]*>[\s\S]*?data-stalux-back-to-top[\s\S]*?<\/footer>/u.test(html),
        `${path.relative(dist, file)} back-to-top button must stay inside the footer`,
    );
    assert(
        /<button[^>]*data-stalux-back-to-top[^>]*aria-label=[^>]*hidden/u.test(html),
        `${path.relative(dist, file)} back-to-top button must be accessible and initially hidden`,
    );
}

const sitemap = read("sitemap-0.xml");
assert(
    sitemap.includes("/posts/0035a0ee.md</loc>"),
    "sitemap is missing the generated Markdown post endpoint",
);
assert(
    !sitemap.includes("/about.md</loc>"),
    "sitemap contains a non-canonical Markdown page endpoint",
);
assert(!sitemap.includes("<lastmod>"), "sitemap contains synthetic build-time lastmod values");

const files = walk(dist);
const htmlCount = files.filter((file) => file.endsWith(".html")).length;
const fontCount = files.filter((file) => file.endsWith(".woff2")).length;

const assetSources = files.filter((file) => /\.(?:css|html|js)$/u.test(file));
const assetContents = new Map(
    assetSources.map((source) => [path.relative(dist, source), readFileSync(source, "utf8")]),
);
assert(
    [...assetContents.values()].some((content) =>
        content.includes('--font-body:"Noto Sans SC", "Noto Sans CJK SC"'),
    ),
    "body font fallback stack is missing",
);
const existingAssets = new Set(
    files.map((file) => `/${path.relative(dist, file).split(path.sep).join("/")}`),
);
const missingAssetReferences = findMissingAssetReferences(assetContents, existingAssets);

assert(htmlCount >= 40, `expected at least 40 HTML pages, found ${htmlCount}`);
assert(fontCount >= 2, `expected normal and italic code fonts, found ${fontCount}`);
assert(statSync(path.join(dist, "pagefind", "pagefind.js")).size > 0, "Pagefind output is missing");
assert(
    missingAssetReferences.length === 0,
    `generated files reference missing assets:\n${missingAssetReferences.join("\n")}`,
);
console.info(
    `[verify-build] ${htmlCount} HTML pages, ${fontCount} fonts, ${assetSources.length} asset sources, SEO and agent output verified`,
);
