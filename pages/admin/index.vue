<template>
  <div class="admin-page">
    <h1>文章管理 <small>静态博客CMS</small></h1>
    
    <div class="admin-actions">
      <button class="new-btn" @click="createNewArticle">新建文章</button>
      <button class="refresh-btn" @click="refreshArticleList">刷新列表</button>
      <button class="generate-btn" @click="confirmGenerate">生成静态页面</button>
    </div>
    
    <div class="status-panel" v-if="statusMessage">
      <div class="status-message" :class="statusType">
        <span class="message-text">{{ statusMessage }}</span>
        <button class="close-btn" @click="statusMessage = ''">×</button>
      </div>
    </div>
    
    <div class="stats-panel">
      <div class="stat-item">
        <div class="stat-value">{{ articles.length }}</div>
        <div class="stat-label">文章数量</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ Array.from(allTags).length }}</div>
        <div class="stat-label">标签数量</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ Array.from(allCategories).length }}</div>
        <div class="stat-label">分类数量</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ lastUpdatedDate }}</div>
        <div class="stat-label">最近更新</div>
      </div>
    </div>
    
    <div class="article-list-container">
      <table class="article-table">
        <thead>
          <tr>
            <th>标题</th>
            <th>发布日期</th>
            <th>标签</th>
            <th>分类</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="article in articles" :key="article.path">
            <td>{{ article.title || '无标题' }}</td>
            <td>{{ article.date || '-' }}</td>
            <td>
              <span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
              <span v-if="!article.tags || article.tags.length === 0">-</span>
            </td>
            <td>
              <span v-for="category in article.categories" :key="category" class="category">{{ category }}</span>
              <span v-if="!article.categories || article.categories.length === 0">-</span>
            </td>
            <td class="actions">
              <button class="edit-btn" @click="editArticle(article)">编辑</button>
              <button class="preview-btn" @click="previewArticle(article)">预览</button>
              <button class="delete-btn" @click="confirmDelete(article)">删除</button>
            </td>
          </tr>
          <tr v-if="!articles || articles.length === 0">
            <td colspan="5" class="empty-message">
              暂无文章，点击"新建文章"按钮创建一篇吧！
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { queryCollection, useAsyncData } from '#imports'

interface Article {
  title: string
  path: string
  date?: string
  tags?: string[]
  categories?: string[]
  _file?: string
}

const articles = ref<Article[]>([])
const allTags = ref(new Set<string>())
const allCategories = ref(new Set<string>())
const statusMessage = ref('')
const statusType = ref('info')
const isLoading = ref(false)

// 计算最近更新日期
const lastUpdatedDate = computed(() => {
  if (articles.value.length === 0) return '-'
  
  // 找出最新的文章日期
  const dates = articles.value
    .map(a => a.date || '')
    .filter(d => d)
    .sort()
    .reverse()
  
  return dates[0] || '-'
})

const fetchArticles = async () => {
  try {
    isLoading.value = true
    statusMessage.value = '正在获取文章列表...'
    statusType.value = 'info'
    
    console.log('开始获取文章列表...')
    const { data } = await useAsyncData('posts', () => {
      return queryCollection('posts').all()
    })

    console.log('查询结果:', data.value)
    
    if (data.value && Array.isArray(data.value)) {
      articles.value = data.value.map((article: any) => {
        let path = ''
        console.log('处理文章:', article)
        if (article._path) {
          const parts = article._path.split('/')
          path = parts[parts.length - 1].replace(/\.md$/, '')
        }
        
        return {
          title: article.title || '无标题',
          path: path,
          date: article.date,
          tags: article.tags || [],
          categories: article.categories || [],
          _file: article._file
        }
      })
      
      // 按日期排序，最新的在前面
      articles.value.sort((a, b) => {
        if (!a.date) return 1
        if (!b.date) return -1
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
      
      console.log('处理后的文章列表:', articles.value)
      
      // 收集所有标签和分类
      allTags.value.clear()
      allCategories.value.clear()
      
      articles.value.forEach(article => {
        if (article.tags) {
          article.tags.forEach(tag => allTags.value.add(tag))
        }
        if (article.categories) {
          article.categories.forEach(category => allCategories.value.add(category))
        }
      })
      
      statusMessage.value = `成功加载 ${articles.value.length} 篇文章`
      statusType.value = 'success'
      setTimeout(() => {
        if (statusMessage.value === `成功加载 ${articles.value.length} 篇文章`) {
          statusMessage.value = ''
        }
      }, 3000)
    } else {
      console.warn('未获取到文章数据或数据格式不正确')
      statusMessage.value = '获取文章列表失败，请检查内容目录'
      statusType.value = 'error'
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
    statusMessage.value = '获取文章列表出错: ' + (error as Error).message
    statusType.value = 'error'
  } finally {
    isLoading.value = false
  }
}

const createNewArticle = () => {
  // 跳转到编辑页面，不带参数表示新建文章
  navigateTo('/admin/edit')
}

const editArticle = (article: Article) => {
  // 跳转到编辑页面，带上文章路径参数
  const filePathWithoutExt = article.path.replace(/\.md$/, '')
  console.log('准备编辑文章:', filePathWithoutExt)
  navigateTo(`/admin/edit?file=${filePathWithoutExt}`)
}

const previewArticle = (article: Article) => {
  // 在新标签页中预览文章
  // 使用内容预览API
  console.log('准备预览文章:', article.path)
  const previewPath = `/dev/editor?preview=${article.path}`
  window.open(previewPath, '_blank')
}

const confirmDelete = async (article: Article) => {
  if (confirm(`确定要删除文章 "${article.title}" 吗？此操作不可恢复！`)) {
    try {
      statusMessage.value = `正在删除文章: ${article.title}...`
      statusType.value = 'info'
      
      // 调用删除API
      const response = await fetch('/api/content', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: `/content/posts/${article.path}.md`
        })
      })

      if (response.ok) {
        // 删除成功后刷新列表
        statusMessage.value = `已删除文章: ${article.title}`
        statusType.value = 'success'
        
        // 从本地列表中移除
        articles.value = articles.value.filter(a => a.path !== article.path)
        
        // 重新统计标签和分类
        allTags.value.clear()
        allCategories.value.clear()
        articles.value.forEach(article => {
          if (article.tags) {
            article.tags.forEach(tag => allTags.value.add(tag))
          }
          if (article.categories) {
            article.categories.forEach(category => allCategories.value.add(category))
          }
        })
      } else {
        throw new Error('服务器返回错误')
      }
    } catch (error) {
      console.error('删除失败:', error)
      statusMessage.value = '删除失败: ' + (error as Error).message
      statusType.value = 'error'
      alert('删除失败，请确保您有权限执行此操作。\n错误: ' + (error as Error).message)
    }
  }
}

const confirmGenerate = async () => {
  if (confirm('确定要生成静态页面吗？这可能需要一些时间。')) {
    try {
      statusMessage.value = '正在生成静态页面...'
      statusType.value = 'info'
      
      // 调用生成静态页面的API
      const response = await fetch('/api/generate', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        statusMessage.value = `静态页面生成成功！共生成 ${result.pages || 0} 个页面`
        statusType.value = 'success'
      } else {
        throw new Error('生成静态页面失败')
      }
    } catch (error) {
      console.error('生成静态页面失败:', error)
      statusMessage.value = '生成静态页面失败: ' + (error as Error).message
      statusType.value = 'error'
    }
  }
}

const refreshArticleList = () => {
  fetchArticles()
}

onMounted(() => {
  fetchArticles()
})
</script>

<style scoped>
.admin-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  color: #333;
}

h1 small {
  font-size: 0.6em;
  color: #777;
  font-weight: normal;
  margin-left: 10px;
}

.admin-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.new-btn, .refresh-btn, .generate-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.new-btn {
  background-color: #4CAF50;
  color: white;
}

.refresh-btn {
  background-color: #2196F3;
  color: white;
}

.generate-btn {
  background-color: #FF9800;
  color: white;
}

.status-panel {
  margin-bottom: 20px;
}

.status-message {
  padding: 12px 16px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-message.info {
  background-color: #e3f2fd;
  color: #0d47a1;
  border: 1px solid #bbdefb;
}

.status-message.success {
  background-color: #e8f5e9;
  color: #1b5e20;
  border: 1px solid #c8e6c9;
}

.status-message.error {
  background-color: #ffebee;
  color: #b71c1c;
  border: 1px solid #ffcdd2;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
  color: inherit;
}

.stats-panel {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-value {
  font-size: 2em;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

stat-label {
  color: #666;
  font-size: 0.9em;
}

.article-list-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.article-table {
  width: 100%;
  border-collapse: collapse;
}

.article-table th, 
.article-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.article-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #555;
}

.article-table tr:hover {
  background-color: #f5f5f5;
}

.tag, .category {
  display: inline-block;
  padding: 2px 6px;
  margin: 2px;
  border-radius: 12px;
  font-size: 0.8em;
}

.tag {
  background-color: #e3f2fd;
  color: #1976d2;
  border: 1px solid #90caf9;
}

.category {
  background-color: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #ce93d8;
}

.actions {
  display: flex;
  gap: 5px;
}

.edit-btn, .preview-btn, .delete-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.edit-btn {
  background-color: #2196F3;
  color: white;
}

.preview-btn {
  background-color: #9C27B0;
  color: white;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.empty-message {
  text-align: center;
  padding: 30px;
  color: #666;
  font-style: italic;
}
</style>