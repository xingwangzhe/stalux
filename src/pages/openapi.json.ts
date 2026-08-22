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
                "Read-only machine-readable endpoints for discovering and retrieving published Stalux blog content.",
        },
        servers: server ? [{ url: server }] : undefined,
        paths: {
            "/api/posts.json": {
                get: {
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
                        "404": { description: "Post not found" },
                    },
                },
            },
        },
    };

    return new Response(JSON.stringify(document, null, 2), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
    });
};
