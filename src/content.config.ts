import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

// 定义分类的递归类型，支持多种格式:
// 1. 字符串格式: 'category'
// 2. 对象格式-有标签: { name: 'category', subcategories: [...] }
// 3. 对象格式-无标签: { 'category': [...subcategories] }
const categorySchema: z.ZodType<any> = z.lazy(() => 
  z.union([
    z.string(), 
    z.object({
      name: z.string(),
      subcategories: z.array(categorySchema).optional()
    }),
    z.record(z.string(), z.array(categorySchema))
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
    // 分类支持多种格式的数组
    categories: z.array(categorySchema).optional(),
    abbrlink: z.union([z.string(), z.number()]).optional(),
  }),
});

export const collections = { posts };
