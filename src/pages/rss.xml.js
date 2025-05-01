import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { config_site } from '../utils/config-adapter';
import {processFrontmatter} from '../utils/process-frontmatter.ts';

export async function GET(context) {
	let posts = await getCollection('blog');
	posts = posts.map((post) => {
		return processFrontmatter(post);
	})
	return rss({
		title: config_site.title,
		description: config_site.description,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/posts/${post.data.abbrlink}`,
		})),
	});
}
// export async function GET(context) {
// 	const posts = await getCollection('blog');

// 	return rss({
// 		title: config_site.title,
// 		description: config_site.description,
// 		site: context.site,
// 		items: posts.map(() => ({
// 			...post.data,
// 			link: `/posts/${post.abbrlink}/`,
// 		})),
// 	});
// }
