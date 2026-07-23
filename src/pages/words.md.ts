import { renderWordsMd } from "@utils/ai-discovery";
import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = async () => {
    const text = await renderWordsMd();
    return new Response(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
};
