import type { APIRoute } from "astro";

export const prerender = true;

const responseSchema = {
    type: "array",
    items: { type: "object", additionalProperties: true },
};

export const GET: APIRoute = async ({ site }) => {
    const server = site?.toString().replace(/\/$/, "") || "";
    const document = {
        openapi: "3.1.0",
        info: {
            title: "Stalux Blog Read API",
            version: "1.0.0",
            description:
                "Version 1 read-only machine-readable endpoints for discovering and retrieving published Stalux blog content. The static site does not expose writes, authentication, or a server-side rate-limit enforcement API.",
        },
        tags: [{ name: "Posts", description: "Published post discovery and Markdown retrieval." }],
        externalDocs: {
            description: "Agent guidance and usage recommendations",
            url: server ? `${server}/llms.txt` : "/llms.txt",
        },
        servers: server ? [{ url: server }] : undefined,
        paths: {
            "/api/posts.json": {
                get: {
                    tags: ["Posts"],
                    operationId: "listPublishedPosts",
                    summary: "List published posts",
                    description: "Returns metadata for every published post, newest first.",
                    responses: {
                        "200": {
                            description: "Published post metadata",
                            content: { "application/json": { schema: responseSchema } },
                        },
                    },
                },
            },
            "/api/post.abbrlink.json": {
                get: {
                    tags: ["Posts"],
                    operationId: "listPostIdentifiers",
                    summary: "List post identifiers",
                    description: "Returns the title and stable abbrlink for every published post.",
                    responses: {
                        "200": {
                            description: "Published post identifiers",
                            content: { "application/json": { schema: responseSchema } },
                        },
                    },
                },
            },
            "/posts/{abbrlink}.md": {
                get: {
                    tags: ["Posts"],
                    operationId: "readPostMarkdown",
                    summary: "Read one post as Markdown",
                    description:
                        "Returns normalized Markdown when promote.export_md is enabled. Otherwise this file is absent; HTTP errors and their body format are controlled by the static host.",
                    parameters: [
                        {
                            name: "abbrlink",
                            in: "path",
                            required: true,
                            description: "Stable post identifier returned by the post index.",
                            schema: { type: "string" },
                        },
                    ],
                    responses: {
                        "200": {
                            description: "Markdown post content",
                            content: { "text/markdown": { schema: { type: "string" } } },
                        },
                    },
                },
            },
        },
        "x-stalux-api-policy": {
            versioning:
                "The documented surface is v1. Future breaking APIs use /api/v2/; existing static paths remain compatibility aliases.",
            deprecation:
                "Breaking changes are announced in the documentation and a Deprecation/Sunset response header may be added before removal.",
            rateLimits:
                "These files are static. Stalux does not enforce per-client quotas or generate dynamic rate-limit/error responses; any hosting limits belong to the deployment provider.",
        },
    };

    return new Response(JSON.stringify(document, null, 2), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
    });
};
