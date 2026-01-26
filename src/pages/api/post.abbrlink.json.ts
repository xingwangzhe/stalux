import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = async () => {
  const posts = await getCollection("posts");

  const payload = posts.map((post) => ({
    title: post.data.title,
    abbrlink: post.data.abbrlink,
  }));

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
