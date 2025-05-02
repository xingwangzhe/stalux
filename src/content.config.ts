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
    // 自定义描述字段，用于 SEO
    description: z.string().optional(),
    // 摘要字段，如果没有描述，则用作备选
    excerpt: z.string().optional(),
    // 文章封面图
    cover: z.string().optional(),
    // 文章作者
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    // 分类支持多种格式的数组
    categories: z.array(categorySchema).optional(),
    abbrlink: z.union([z.string(), z.number()]).optional(),
    // 是否不被搜索引擎索引
    noindex: z.boolean().optional().default(false),
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
