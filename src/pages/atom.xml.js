
import { getCollection } from 'astro:content';
import { config_site } from '../utils/yaml-config-adapter';
import { processFrontmatter } from '../integrations/process-frontmatter.ts';

export async function GET(context) {
  // 获取所有文章
  let posts = await getCollection('posts');
  // 处理frontmatter
  posts = await Promise.all(posts.map(async (post) => {
    return await processFrontmatter(post);
  }));
  
  const sortedPosts = posts.sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
  const lastUpdated = sortedPosts.length > 0 ? new Date(sortedPosts[0].data.date) : new Date();
  const siteUrl = config_site.url || context.site;
  
  // 手动构建 Atom XML
  const atomXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" 
      xmlns:media="http://search.yahoo.com/mrss/" 
      xml:lang="${config_site.lang || 'zh-CN'}">
  <title type="text">${config_site.siteName || config_site.title || 'Blog'}</title>
  <subtitle type="text">${config_site.description || '博客描述'}</subtitle>
  <link href="${siteUrl}/atom.xml" rel="self" type="application/atom+xml" />
  <link href="${siteUrl}/" rel="alternate" type="text/html" />
  <id>${siteUrl}/</id>
  <updated>${lastUpdated.toISOString()}</updated>
  <generator uri="https://astro.build/" version="4.x">Astro</generator>
  <icon>${siteUrl}${config_site.favicon || '/favicon.ico'}</icon>
  <logo>${siteUrl}${config_site.avatarPath || '/avatar.webp'}</logo>
  <rights>Copyright © ${new Date().getFullYear()} ${config_site.author || config_site.siteName}</rights>
  <author>
    <name>${config_site.author || 'Admin'}</name>
    <email>${config_site.author || 'webmaster'}@${siteUrl.replace(/^https?:\/\//, '')}</email>
    <uri>${siteUrl}</uri>
  </author>
${sortedPosts.map((post) => `  <entry>
    <title type="text">${post.data.title}</title>
    <id>${siteUrl}/posts/${post.data.abbrlink}/</id>
    <link href="${siteUrl}/posts/${post.data.abbrlink}/" rel="alternate" type="text/html" />
    <published>${new Date(post.data.date).toISOString()}</published>
    <updated>${new Date(post.data.date).toISOString()}</updated>
    <summary type="text">${post.data.description || post.data.title}</summary>
    <content type="html"><![CDATA[${post.data.description || post.data.title}]]></content>
    <author>
      <name>${config_site.author || 'Admin'}</name>
      <email>${config_site.author || 'webmaster'}@${siteUrl.replace(/^https?:\/\//, '')}</email>
      <uri>${siteUrl}</uri>
    </author>
${post.data.categories ? (Array.isArray(post.data.categories) ? post.data.categories : [post.data.categories]).map(cat => `    <category term="${cat}" label="${cat}" />`).join('\n') : '    <category term="未分类" label="未分类" />'}
${post.data.tags && Array.isArray(post.data.tags) ? post.data.tags.map(tag => `    <category term="${tag}" label="${tag}" />`).join('\n') : ''}
  </entry>`).join('\n')}
</feed>`;

  return new Response(atomXml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}