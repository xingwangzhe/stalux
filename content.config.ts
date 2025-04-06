import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    posts: defineCollection({
      // 使用 page 类型处理 Markdown 文件
      type: 'page',
      // 更新 source 配置，使用更准确的模式匹配所有子目录下的 .md 文件
      source: {
        include: 'posts/*.md',
        exclude: []
      },
      schema: z.object({
        title: z.string(),
        date: z.string().optional(),
        updated: z.string().nullable().optional(),
        abbrlink: z.string().optional(),
        tags: z.array(z.string()).optional(),
        categories: z.array(z.string()).optional(),
        description: z.string().optional(),
        fmContentType: z.string().optional(),
      })
    })
  }
})
