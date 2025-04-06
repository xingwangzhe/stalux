import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
	loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		updated: z.coerce.date().optional(),
		tags: z.array(z.string()).optional(),
		categories: z.array(z.string()).optional(),
		abbrlink: z.union([z.string(), z.number()]).optional(),
	}),
});

export const collections = { posts };
