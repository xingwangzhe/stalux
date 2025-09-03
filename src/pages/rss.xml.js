
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { config_site } from '../utils/yaml-config-adapter.ts';
import { processFrontmatter } from '../integrations/process-frontmatter.ts';
export async function GET(context) {
  // 获取所有文章
  let posts = await getCollection('posts');
  // 处理frontmatter
  posts = await Promise.all(posts.map(async (post) => {
    return await processFrontmatter(post);
  }));
  
  const sortedPosts = posts.sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
  const lastBuildDate = sortedPosts.length > 0 ? new Date(sortedPosts[0].data.date) : new Date();
  
  return rss({
    title: config_site.siteName || 'Blog',
    description: config_site.description || '博客描述',
    site: context.site,
    
    // 添加更多RSS规范信息
    xmlns: {
      content: "http://purl.org/rss/1.0/modules/content/",
      wfw: "http://wellformedweb.org/CommentAPI/", 
      dc: "http://purl.org/dc/elements/1.1/",
      atom: "http://www.w3.org/2005/Atom",
      sy: "http://purl.org/rss/1.0/modules/syndication/",
      slash: "http://purl.org/rss/1.0/modules/slash/"
    },
    
    customData: [
      `<language>${config_site.lang || 'zh-CN'}</language>`,
      `<copyright>Copyright © ${new Date().getFullYear()} ${config_site.author || config_site.siteName}</copyright>`,
      `<managingEditor>${config_site.author || 'webmaster'}@${(config_site.url || context.site).replace(/^https?:\/\//, '')}</managingEditor>`,
      `<webMaster>${config_site.author || 'webmaster'}@${(config_site.url || context.site).replace(/^https?:\/\//, '')}</webMaster>`,
      `<lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>`,
      `<pubDate>${lastBuildDate.toUTCString()}</pubDate>`,
      `<generator>Astro RSS</generator>`,
      `<docs>https://cyber.harvard.edu/rss/rss.html</docs>`,
      `<ttl>60</ttl>`,
      `<image>
        <url>${config_site.url || context.site}${config_site.avatarPath || '/avatar.webp'}</url>
        <title>${config_site.siteName || config_site.title || 'Blog'}</title>
        <link>${config_site.url || context.site}</link>
        <width>144</width>
        <height>144</height>
        <description>${config_site.short_description || config_site.description || '博客头像'}</description>
      </image>`,
      `<atom:link href="${config_site.url || context.site}/rss.xml" rel="self" type="application/rss+xml" />`,
      `<sy:updatePeriod>hourly</sy:updatePeriod>`,
      `<sy:updateFrequency>1</sy:updateFrequency>`
    ].join('\n'),
    
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/posts/${post.data.abbrlink}/`,
      
      // 添加更多文章信息
      author: config_site.author || 'Admin',
      categories: [
        ...(post.data.categories ? (Array.isArray(post.data.categories) ? post.data.categories : [post.data.categories]) : ['未分类']),
        ...(post.data.tags ? (Array.isArray(post.data.tags) ? post.data.tags : [post.data.tags]) : [])
      ],
      
      customData: [
        `<dc:creator>${config_site.author || 'Admin'}</dc:creator>`,
        `<guid isPermaLink="true">${config_site.url || context.site}/posts/${post.data.abbrlink}/</guid>`,
        post.data.description ? `<content:encoded><![CDATA[${post.data.description}]]></content:encoded>` : ''
      ].filter(Boolean).join('\n')
    })),
    });
}