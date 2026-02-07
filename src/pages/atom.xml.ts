import rss from "@astrojs/rss";
import { getCollection, render } from "astro:content";
import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const configCollection = await getCollection("config");
  const stalux = configCollection[0]?.data;

  // 获取所有非草稿文章
  const posts = await getCollection("posts", ({ data }) => !data.draft);

  // 按日期排序
  const sortedPosts = posts.sort((a, b) => {
    const dateA = new Date(b.data.updated || b.data.date);
    const dateB = new Date(a.data.updated || a.data.date);
    return dateA.getTime() - dateB.getTime();
  });

  // 获取每篇文章的 remarkPluginFrontmatter 以使用动态生成的描述
  const items = await Promise.all(
    sortedPosts.map(async (post) => {
      const { remarkPluginFrontmatter } = await render(post);
      
      // 构建自定义数据，包含更新时间和版权信息
      let customData = '';
      if (post.data.updated) {
        customData += `<updated>${post.data.updated.toISOString()}</updated>`;
      }
      if (post.data.cc) {
        customData += `<rights>${post.data.cc}</rights>`;
      }
      
      return {
        title: post.data.title,
        pubDate: new Date(post.data.date),
        // 优先使用 remark 插件生成的描述，如果没有则使用文章自身的 desc
        description: remarkPluginFrontmatter.desc || post.data.desc || "",
        link: `/posts/${post.data.abbrlink}/`,
        categories: post.data.categories || [],
        customData: customData,
      };
    }),
  );

  return rss({
    title: stalux?.title || "Stalux Blog",
    description: stalux?.description || "A blog powered by Stalux theme",
    site: context.site?.toString() || stalux?.url || "https://stalux.needhelp.icu",
    items,
    customData: `<language>zh-cn</language>`,
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
    },
  });
};
