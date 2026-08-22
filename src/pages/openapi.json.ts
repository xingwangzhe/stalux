import type { APIRoute } from "astro";

export const prerender = true;

const responseSchema = {
    type: "array",
    items: { type: "object", additionalProperties: true },
};

const problemSchema = {
    type: "object",
    required: ["type", "title", "status", "code", "detail"],
    properties: {
        type: { type: "string", format: "uri", description: "Stable problem type URI." },
        title: { type: "string" },
        status: { type: "integer", minimum: 400, maximum: 599 },
        code: { type: "string", description: "Machine-readable error code." },
        detail: { type: "string" },
        resolution: { type: "string" },
    },
};

const rateLimitHeaders = {
    "RateLimit-Limit": {
        description: "Maximum requests in the advertised window.",
        schema: { type: "integer" },
    },
    "RateLimit-Remaining": {
        description: "Remaining requests in the advertised window.",
        schema: { type: "integer" },
    },
    "RateLimit-Reset": {
        description: "Seconds until the advertised window resets.",
        schema: { type: "integer" },
    },
};

const problemResponse = (description: string, status: number) => ({
    description,
    content: { "application/problem+json": { schema: problemSchema } },
    headers: status === 429 ? { "Retry-After": { schema: { type: "integer" } } } : undefined,
});

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
                            headers: rateLimitHeaders,
                        },
                        "400": problemResponse("Invalid request.", 400),
                        "429": problemResponse("Rate limit exceeded.", 429),
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
                            headers: rateLimitHeaders,
                        },
                        "400": problemResponse("Invalid request.", 400),
                        "429": problemResponse("Rate limit exceeded.", 429),
                    },
                },
            },
            "/posts/{abbrlink}.md": {
                get: {
                    tags: ["Posts"],
                    operationId: "readPostMarkdown",
                    summary: "Read one post as Markdown",
                    description: "Returns the normalized Markdown source for a published post.",
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
                        "404": problemResponse("Post not found.", 404),
                        "429": problemResponse("Rate limit exceeded.", 429),
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
                "Static exports publish RateLimit-* documentation headers but cannot enforce a dynamic quota or emit Retry-After without a server runtime.",
        },
    };

    return new Response(JSON.stringify(document, null, 2), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
    });
};
