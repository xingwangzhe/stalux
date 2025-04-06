import { writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  // 仅在开发环境中运行
  if (!process.dev) {
    return createError({
      statusCode: 403,
      message: '此 API 仅在开发环境可用'
    })
  }

  const method = event.node.req.method

  // POST 请求用于保存文件
  if (method === 'POST') {
    try {
      const body = await readBody(event)
      const { fileName, content } = body

      // 安全检查：确保文件名合法且在允许的目录内
      if (!fileName.startsWith('/content/') || fileName.includes('..')) {
        throw new Error('无效的文件路径')
      }

      // 获取项目根目录
      const rootDir = process.cwd()
      // 构建完整的文件路径
      const filePath = join(rootDir, fileName)

      // 写入文件
      await writeFile(filePath, content, 'utf-8')

      return {
        success: true,
        message: '文件保存成功'
      }
    } catch (error: any) {
      return createError({
        statusCode: 500,
        message: `保存失败: ${error.message}`
      })
    }
  }
  // DELETE 请求用于删除文件
  else if (method === 'DELETE') {
    try {
      const body = await readBody(event)
      const { fileName } = body

      // 安全检查：确保文件名合法且在允许的目录内
      if (!fileName.startsWith('/content/') || fileName.includes('..')) {
        throw new Error('无效的文件路径')
      }

      // 获取项目根目录
      const rootDir = process.cwd()
      // 构建完整的文件路径
      const filePath = join(rootDir, fileName)

      // 删除文件
      await unlink(filePath)

      return {
        success: true,
        message: '文件删除成功'
      }
    } catch (error: any) {
      return createError({
        statusCode: 500,
        message: `删除失败: ${error.message}`
      })
    }
  }
  else {
    return createError({
      statusCode: 405,
      message: '不支持的请求方法'
    })
  }
})