import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

// 这个端点在构建时预渲染，产出静态 JSON 供客户端按需 fetch
export const prerender = true;

export const GET: APIRoute = async () => {
  const posts = await getCollection("posts");

  // 按年份-月份分组并返回简化字段
  const byYear: Record<string, any[]> = {};
  posts.forEach((p) => {
    const d = new Date(p.data.date || 0);
    if (isNaN(d.getTime())) return;
    const y = String(d.getFullYear());
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push({
      title: p.data.title,
      date: p.data.date,
      updated: p.data.updated,
      link: `/posts/${p.data.abbrlink}/`,
      abbrlink: p.data.abbrlink,
      tags: p.data.tags || [],
      categories: p.data.categories || [],
    });
  });

  const years = Object.keys(byYear)
    .map((y) => ({ year: Number(y), count: byYear[y].length }))
    .sort((a, b) => b.year - a.year);

  return new Response(JSON.stringify({ Years: years, PostsByYear: byYear }), {
    headers: { "Content-Type": "application/json" },
  });
};
