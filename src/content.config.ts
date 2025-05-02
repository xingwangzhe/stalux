import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

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

// 添加 about 集合
const about = defineCollection({
  loader: glob({ base: './src/content/about', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    priority: z.number().default(1), // 优先级，数字越大优先级越高
  }),
});

export const collections = { posts, about };
