import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

// 定义分类的递归结构，支持两种格式：
// 1. 简单字符串格式：- '分类名'
// 2. 嵌套格式：- '父分类'
//               - '子分类'
const categorySchema = z.lazy(() => 
  z.union([
    z.string(),
    z.object({
      name: z.string(),
      next: z.array(categorySchema).optional()
    })
  ])
);

const posts = defineCollection({
	loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		// 接受日期字符串或 Date 对象
		date: z.union([z.string(), z.coerce.date()]).optional(),
		// 更新时间可选，接受日期字符串或 Date 对象
		updated: z.union([z.string(), z.coerce.date()]).optional(),
		tags: z.array(z.string()).optional(),
		// 更新分类为树形结构，支持简单数组和嵌套结构
		categories: z.array(categorySchema).optional(),
		abbrlink: z.union([z.string(), z.number()]).optional(),
	}),
});

export const collections = { posts };
