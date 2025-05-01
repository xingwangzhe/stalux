import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
	loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		// 接受日期字符串或 Date 对象
		date: z.union([z.string(), z.coerce.date()]),
		// 更新时间可选，接受日期字符串或 Date 对象
		updated: z.union([z.string(), z.coerce.date()]),
		tags: z.array(z.string()).optional(),
		categories: z.array(z.string()).optional(),
		abbrlink: z.union([z.string(), z.number()])
	}),
});

export const collections = { posts };
