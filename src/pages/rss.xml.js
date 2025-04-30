import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { config_site } from '../utils/config-adapter';

export async function GET(context) {
	const posts = await getCollection('blog');
	return rss({
		title: config_site.title,
		description: config_site.description,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/blog/${post.id}/`,
		})),
	});
}
