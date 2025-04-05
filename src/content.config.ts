import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';
import { date } from 'astro:schema';
import { onUpdated } from 'vue';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		date: z.string().optional(),
		updated: z.string().optional(),
		abbrlink: z.string().optional(),
	}),
});

export const collections = { blog };
