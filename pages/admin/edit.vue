<template>
  <div class="editor-page">
    <div class="editor-header">
      <div class="header-left">
        <h1>{{ isNewArticle ? '新建文章' : '编辑文章' }}</h1>
      </div>
      <div class="header-actions">
        <button class="back-btn" @click="goBack">返回列表</button>
        <button class="save-btn" @click="handleSave">保存文章</button>
      </div>
    </div>

    <div class="editor-container">
      <div class="metadata-panel">
        <h3>文章元数据</h3>
        <div class="metadata-grid">
          <div class="metadata-item">
            <label>标题:</label>
            <input v-model="metadata.title" placeholder="文章标题">
          </div>
          <div class="metadata-item">
            <label>文件名:</label>
            <input v-model="fileName" placeholder="文件名 (例如: my-post.md)" :disabled="!isNewArticle">
          </div>
          <div class="metadata-item">
            <label>日期:</label>
            <input v-model="metadata.date" type="date">
          </div>
          <div class="metadata-item">
            <label>更新日期:</label>
            <input v-model="metadata.updated" type="date">
          </div>
          <div class="metadata-item">
            <label>短链接:</label>
            <div class="abbrlink-container">
              <input v-model="metadata.abbrlink" placeholder="自动生成的短链接" readonly>
              <button class="generate-btn" @click="generateAbbrlink">重新生成</button>
            </div>
          </div>
          <div class="metadata-item">
            <label>标签:</label>
            <div class="tags-manager">
              <div class="tags-input">
                <template v-for="tag in metadata.tags" :key="tag">
                  <span class="tag">
                    {{ tag }}
                    <button class="remove-tag" @click="metadata.tags = metadata.tags.filter(t => t !== tag)">×</button>
                  </span>
                </template>
              </div>
              <div class="tags-selector">
                <select 
                  @change="
                    (e) => {
                      const value = (e.target as HTMLSelectElement).value
                      if (value && !metadata.tags.includes(value)) {
                        metadata.tags.push(value)
                      }
                      (e.target as HTMLSelectElement).value = ''
                    }
                  "
                >
                  <option value="">选择或输入标签...</option>
                  <option 
                    v-for="tag in Array.from(existingTags).filter(t => !metadata.tags.includes(t))"
                    :key="tag"
                    :value="tag"
                  >
                    {{ tag }}
                  </option>
                </select>
                <input
                  placeholder="输入新标签"
                  @keydown.enter="
                    $event.preventDefault()
                    const value = ($event.target as HTMLInputElement).value.trim()
                    if (value && !metadata.tags.includes(value)) {
                      metadata.tags.push(value)
                      ;($event.target as HTMLInputElement).value = ''
                    }
                  "
                >
              </div>
            </div>
          </div>
          <div class="metadata-item">
            <label>分类:</label>
            <div class="categories-manager">
              <div class="categories-input">
                <template v-for="category in metadata.categories" :key="category">
                  <span class="category">
                    {{ category }}
                    <button class="remove-category" @click="metadata.categories = metadata.categories.filter(c => c !== category)">×</button>
                  </span>
                </template>
              </div>
              <div class="categories-selector">
                <select 
                  @change="
                    (e) => {
                      const value = (e.target as HTMLSelectElement).value
                      if (value && !metadata.categories.includes(value)) {
                        metadata.categories.push(value)
                      }
                      (e.target as HTMLSelectElement).value = ''
                    }
                  "
                >
                  <option value="">选择或输入分类...</option>
                  <option 
                    v-for="category in Array.from(existingCategories).filter(c => !metadata.categories.includes(c))"
                    :key="category"
                    :value="category"
                  >
                    {{ category }}
                  </option>
                </select>
                <input
                  placeholder="输入新分类"
                  @keydown.enter="
                    $event.preventDefault()
                    const value = ($event.target as HTMLInputElement).value.trim()
                    if (value && !metadata.categories.includes(value)) {
                      metadata.categories.push(value)
                      ;($event.target as HTMLInputElement).value = ''
                    }
                  "
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="content-editor">
        <ClientOnly>
          <MdEditor
            v-model="content"
            :toolbars="toolbars"
            :preview="true"
            language="zh-CN"
            preview-class="markdown-body"
            :config="editorConfig"
            style="height: calc(100vh - 250px)"
            @change="handleChange"
          />
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
// 导入 GitHub 主题样式
import '@/assets/css/github.css'
import { ref, onMounted, computed } from 'vue'
import jsYaml from 'js-yaml'
import { queryCollection, useAsyncData, useRoute } from '#imports'
import type { BlogCollectionItem } from '@nuxt/content'

// 获取路由参数，检查是否有文件参数
const route = useRoute()
const fileParam = computed(() => route.query.file as string | undefined)
const isNewArticle = computed(() => !fileParam.value)

const fileName = ref('')
const content = ref('')
const metadata = ref({
  title: '',
  date: new Date().toISOString().split('T')[0],
  updated: '',
  abbrlink: '',
  tags: [] as string[],
  categories: [] as string[]
})
const existingTags = ref(new Set<string>())
const existingCategories = ref(new Set<string>())

const toolbars = [
  'bold',
  'underline',
  'italic',
  '-',
  'title',
  'strikethrough',
  'sub',
  'sup',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'mermaid',
  '-',
  'revoke',
  'next',
  'save',
  '=',
  'pageFullscreen',
  'fullscreen',
  'preview',
  'htmlPreview',
  'catalog'
]

// 编辑器配置
const editorConfig = {
  htmlPreview: true,
  previewOnly: false,
  theme: 'light',
  previewTheme: 'github',
  codeTheme: 'github',
  previewThemeConfig: {
    customStyle: {
      // 在这里可以添加任何你需要的自定义样式
    }
  }
}

const generateAbbrlink = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  metadata.value.abbrlink = `${timestamp}-${random}`
}

const fetchExistingTags = async () => {
  try {
    // 获取所有文章以收集标签和分类
    const { data } = await useAsyncData('all-articles-metadata', () => {
      return queryCollection('blog').all()
    })

    if (data.value && Array.isArray(data.value)) {
      // 清空并重新收集标签和分类
      existingTags.value.clear()
      existingCategories.value.clear()
      
      data.value.forEach((item) => {
        if (Array.isArray(item.tags)) {
          item.tags.forEach((tag: string) => existingTags.value.add(tag))
        }
        if (Array.isArray(item.categories)) {
          item.categories.forEach((category: string) => existingCategories.value.add(category))
        }
      })
      
      console.log('已收集的标签:', Array.from(existingTags.value))
      console.log('已收集的分类:', Array.from(existingCategories.value))
    }
  } catch (error) {
    console.error('获取标签和分类失败:', error)
  }
}

const loadArticle = async (filePath: string) => {
  try {
    console.log('开始加载文章:', filePath)
    // 重置编辑器状态
    content.value = ''
    metadata.value = {
      title: '',
      date: new Date().toISOString().split('T')[0],
      updated: '',
      abbrlink: '',
      tags: [],
      categories: []
    }
    
    // 设置文件名
    fileName.value = `${filePath}.md`
    
    // 使用 queryCollection API 加载文章
    const { data } = await useAsyncData(`article-${filePath}`, () => {
      return queryCollection<BlogCollectionItem>('blog')
        .where({ _file: { $regex: `/${filePath}\\.md$` } })
        .findOne()
    }, {
      fresh: true
    })
    
    console.log('文章加载结果:', data.value)
    
    if (data.value) {
      const article = data.value
      // 设置元数据
      metadata.value = {
        title: article.title || '',
        date: article.date || new Date().toISOString().split('T')[0],
        updated: article.updated || '',
        abbrlink: article.abbrlink || '',
        tags: article.tags || [],
        categories: article.categories || []
      }
      
      // 如果存在内容则设置
      if (article.body && article.body.text) {
        content.value = article.body.text
      } else if (article.body && typeof article.body === 'string') {
        content.value = article.body
      } else {
        console.warn('文章内容不存在或格式不正确:', article)
      }
    } else {
      console.warn('未找到文章:', filePath)
      alert(`未找到文章: ${filePath}`)
      navigateTo('/admin')
    }
  } catch (error) {
    console.error('加载文章失败:', error)
    alert('加载文章失败: ' + (error as Error).message)
  }
}

const handleChange = (v: string) => {
  content.value = v
  // 从内容的开头解析 YAML front matter
  const frontMatterMatch = v.match(/^---\n([\s\S]*?)\n---/)
  if (frontMatterMatch) {
    try {
      const parsedMetadata = jsYaml.load(frontMatterMatch[1])
      metadata.value = {
        ...metadata.value,
        ...parsedMetadata
      }
    } catch (error) {
      console.error('解析 front matter 失败:', error)
    }
  }
}

const handleSave = async () => {
  if (!fileName.value) {
    alert('请输入文件名')
    return
  }

  // 确保文件名有 .md 扩展名
  if (!fileName.value.endsWith('.md')) {
    fileName.value += '.md'
  }

  // 如果没有 abbrlink,生成一个
  if (!metadata.value.abbrlink) {
    generateAbbrlink()
  }

  // 生成 YAML front matter
  const frontMatter = `---
title: ${metadata.value.title || ''}
date: ${metadata.value.date || ''}
updated: ${metadata.value.updated || ''}
abbrlink: ${metadata.value.abbrlink}
tags: ${JSON.stringify(metadata.value.tags)}
categories: ${JSON.stringify(metadata.value.categories)}
---

`

  try {
    const filePath = `/content/posts/${fileName.value}`
    if (import.meta.dev) {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: filePath,
          content: frontMatter + content.value
        })
      })

      if (response.ok) {
        alert('保存成功!')
        // 保存成功后返回管理页面
        navigateTo('/admin')
      } else {
        throw new Error('保存失败')
      }
    }
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败: ' + (error as Error).message)
  }
}

const goBack = () => {
  navigateTo('/admin')
}

// 组件挂载时，根据路由参数加载数据
onMounted(async () => {
  await fetchExistingTags()
  
  if (fileParam.value) {
    // 编辑现有文章
    await loadArticle(fileParam.value)
  } else {
    // 新建文章，生成一个默认的 abbrlink
    generateAbbrlink()
  }
})
</script>

<style scoped>
.editor-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.back-btn, .save-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.back-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
}

.editor-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metadata-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 20px;
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.metadata-item label {
  font-weight: bold;
  color: #666;
}

.metadata-item input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.abbrlink-container {
  display: flex;
  gap: 10px;
}

.generate-btn {
  padding: 8px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.tags-manager,
.categories-manager {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.tags-input,
.categories-input {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 8px;
  min-height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.tags-selector,
.categories-selector {
  display: flex;
  gap: 8px;
}

.tags-selector select,
.categories-selector select {
  flex: 2;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.tags-selector input,
.categories-selector input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.tag,
.category {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  background: #e3f2fd;
  border-radius: 16px;
  font-size: 0.9em;
  color: #1976d2;
  border: 1px solid #90caf9;
}

.remove-tag,
.remove-category {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-size: 14px;
  border-radius: 50%;
}

.remove-tag:hover,
.remove-category:hover {
  background: rgba(25, 118, 210, 0.1);
}

.content-editor {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

:deep(.md-editor) {
  border: 1px solid #ddd;
  border-radius: 4px;
}

:deep(.markdown-body) {
  padding: 20px;
}
</style>