import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import packageJson from "../package.json" with { type: "json" };

const root = process.cwd();
const dist = path.join(root, "dist");

function assert(condition, message) {
    if (!condition) throw new Error(`[verify-build] ${message}`);
}

function read(relativePath) {
    return readFileSync(path.join(dist, relativePath), "utf8");
}

function walk(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory() ? walk(target) : [target];
    });
}

function verifyJsonLd(html, route) {
    const blocks = [
        ...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gu),
    ];
    assert(blocks.length > 0, `${route} has no JSON-LD`);
    for (const block of blocks) {
        const parsed = JSON.parse(block[1]);
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
assert(
    pages.home.includes("unicode-range:U+0020-007E"),
    "body font does not expose its valid ASCII unicode range",
);
assert(!/unicode-range:[^;}]*-U\+/u.test(pages.home), "body font contains invalid CSS ranges");
assert(pages.home.includes('class="agent-home-summary"'), "agent home summary is missing");
assert(
    /\.agent-home-summary[^}]*clip:rect\(0,\s*0,\s*0,\s*0\)[^}]*position:absolute/gu.test(
        pages.home,
    ),
    "agent home summary is not visually hidden",
);
for (const [route, html] of Object.entries(pages)) verifyJsonLd(html, route);

const sitemap = read("sitemap-0.xml");
assert(!sitemap.includes(".md</loc>"), "sitemap contains Markdown endpoints");
assert(!sitemap.includes("<lastmod>"), "sitemap contains synthetic build-time lastmod values");

const files = walk(dist);
const htmlCount = files.filter((file) => file.endsWith(".html")).length;
const fontCount = files.filter((file) => file.endsWith(".woff2")).length;
assert(htmlCount >= 40, `expected at least 40 HTML pages, found ${htmlCount}`);
assert(fontCount >= 24, `expected sliced body and code fonts, found ${fontCount}`);
assert(statSync(path.join(dist, "pagefind", "pagefind.js")).size > 0, "Pagefind output is missing");

console.info(
    `[verify-build] ${htmlCount} HTML pages, ${fontCount} fonts, SEO and agent output verified`,
);
