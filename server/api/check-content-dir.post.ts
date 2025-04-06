import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

export default defineEventHandler(async (event) => {
  // 仅在开发环境中运行
  if (!process.dev) {
    return createError({
      statusCode: 403,
      message: '此 API 仅在开发环境可用'
    })
  }

  try {
    // 获取项目根目录
    const rootDir = process.cwd()
    
    // 构建内容目录路径
    const contentDir = join(rootDir, 'content')
    const postsDir = join(contentDir, 'posts')

    // 检查目录是否存在，如果不存在则创建
    if (!existsSync(contentDir)) {
      console.log('创建内容目录:', contentDir)
      await mkdir(contentDir, { recursive: true })
    }
    
    if (!existsSync(postsDir)) {
      console.log('创建文章目录:', postsDir)
      await mkdir(postsDir, { recursive: true })
    }

    return {
      success: true,
      message: '内容目录检查/创建成功',
      contentDir,
      postsDir
    }
  } catch (error: any) {
    console.error('检查/创建内容目录失败:', error)
    return createError({
      statusCode: 500,
      message: `检查/创建内容目录失败: ${error.message}`
    })
  }
})