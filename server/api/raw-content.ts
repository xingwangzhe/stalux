import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  // 仅在开发环境中运行
  if (!process.dev) {
    return createError({
      statusCode: 403,
      message: '此 API 仅在开发环境可用'
    })
  }

  try {
    const query = getQuery(event)
    const { id } = query

    if (!id) {
      throw new Error('缺少文章ID参数')
    }

    // 使用 Nuxt Content v3 的 queryCollection API 查找文章的文件路径
    const article = await queryCollection('posts')
      .where({ _id: id })
      .only(['_path'])
      .findOne()

    if (!article || !article._path) {
      throw new Error('未找到文章')
    }

    // 获取项目根目录
    const rootDir = process.cwd()
    
    // 构建完整的文件路径
    // 在 Nuxt Content v3 中，_path 是相对路径，不包含 .md 扩展名
    const filePath = join(rootDir, 'content', `${article._path}.md`)
    
    console.log('读取文件路径:', filePath)

    // 读取文件内容
    const content = await readFile(filePath, 'utf-8')

    return content
  } catch (error: any) {
    console.error('获取原始内容失败:', error)
    return createError({
      statusCode: 500,
      message: `获取原始内容失败: ${error.message}`
    })
  }
})