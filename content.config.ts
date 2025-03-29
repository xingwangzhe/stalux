import { Title } from '#components'
import { defineContentConfig, defineCollection ,z } from '@nuxt/content'

export default defineContentConfig({
    collections: {
        posts: defineCollection({
          type: 'page',
          source: 'posts/*.md',
          schema: z.object({
            abbrlink: z.string(),
            date: z.string(),
            title: z.string(),
            tags: z.array(z.string()),
            categories: z.array(z.string()),
          })
        })
      }
})