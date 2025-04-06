<template>
  <div class="markdown-editor">
    <div class="metadata-editor">
      <div class="metadata-section">
        <h3>文章元数据</h3>
        <div class="metadata-grid">
          <div class="metadata-item">
            <label>标题:</label>
            <input v-model="metadata.title" placeholder="文章标题">
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
            <label>描述:</label>
            <textarea v-model="metadata.description" placeholder="文章描述" rows="2"></textarea>
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
      <div class="articles-section">
        <h3>文章列表</h3>
        <div class="articles-list">
          <div v-for="article in articles" :key="article._id" class="article-item">
            <span class="article-title">{{ article.title }}</span>
            <div class="article-actions">
              <button class="edit-btn" @click="loadArticle(article._id)">编辑</button>
              <button class="delete-btn" @click="confirmDelete(article._id, article._path)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="editor-header">
      <input v-model="fileName" placeholder="文件名 (例如: my-post.md)" class="file-input">
      <button class="save-btn" @click="handleSave">保存</button>
    </div>
    <ClientOnly>
      <MdEditor
        v-model="content"
        :toolbars="toolbars"
        :preview="true"
        language="zh-CN"
        preview-class="markdown-body"
        preview-theme="github"
        code-theme="github"
        :config="editorConfig"
        style="height: calc(100vh - 400px)"
        @change="handleChange"
        @save="handleSave"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
// 导入 GitHub 主题样式
import '@/assets/css/github.css'
import { ref, onMounted, watch } from 'vue'
import jsYaml from 'js-yaml'
import { queryCollection, useAsyncData } from '#imports'

interface Metadata {
  title: string;
  date: string;
  updated: string | null;
  abbrlink: string;
  tags: string[];
  categories: string[];
  description: string;
  fmContentType: string;
}

interface Article {
  _id: string;
  _path: string;
  title: string;
  tags?: string[];
  categories?: string[];
}

const fileName = ref('')
const content = ref('')
const metadata = ref<Metadata>({
  title: '',
  date: new Date().toISOString().split('T')[0],
  updated: null,
  abbrlink: '',
  tags: [],
  categories: [],
  description: '',
  fmContentType: 'stalux'
})
const existingTags = ref(new Set<string>())
const existingCategories = ref(new Set<string>())
const articles = ref<Article[]>([])

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

// 编辑器配置，使用GitHub风格
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

// 生成文章短链接
const generateAbbrlink = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  metadata.value.abbrlink = `${timestamp}-${random}`
}

const fetchExistingArticles = async () => {
  try {
    console.log('开始获取文章列表...');

    // 检查内容目录是否存在
    try {
      const dirCheckResponse = await fetch('/api/check-content-dir', {
        method: 'POST'
      });
      if (!dirCheckResponse.ok) {
        console.warn('内容目录检查失败，但这可能不是主要问题。');
      } else {
        const dirCheckResult = await dirCheckResponse.json();
        console.log('内容目录检查结果:', dirCheckResult);
      }
    } catch (dirError) {
      console.error('内容目录检查失败:', dirError);
    }

    // 使用 queryCollection.all() 查询所有文章
    const { data, error } = await useAsyncData('articles', () => 
      queryCollection('posts')
        .all()
    );

    if (error.value) {
      console.error('查询文章时出错:', error.value);
      return;
    }

    if (data.value && Array.isArray(data.value)) {
      articles.value = data.value;
      console.log('成功获取文章列表:', articles.value);

      // 处理标签和分类
      existingTags.value.clear();
      existingCategories.value.clear();
      data.value.forEach((article) => {
        if (Array.isArray(article.tags)) {
          article.tags.forEach((tag) => existingTags.value.add(tag));
        }
        if (Array.isArray(article.categories)) {
          article.categories.forEach((category) => existingCategories.value.add(category));
        }
      });
    } else {
      console.warn('未找到任何文章。');
      if (confirm('未找到任何文章。是否创建一篇示例文章？')) {
        await createExampleArticle();
        setTimeout(fetchExistingArticles, 1000); // 延迟后重新尝试获取文章
      }
    }
  } catch (error) {
    console.error('获取文章列表时发生意外错误:', error);
    alert('获取文章列表失败: ' + (error instanceof Error ? error.message : String(error)));
  }
};

const createExampleArticle = async () => {
  try {
    const exampleFileName = 'example-article.md'
    const exampleContent = `---
title: 示例文章
date: ${new Date().toISOString().split('T')[0]}
updated: ${new Date().toISOString().split('T')[0]}
abbrlink: example-${Date.now()}
tags: ["示例", "Markdown"]
categories: ["教程"]
description: "这是一篇自动创建的示例文章，用于测试Markdown编辑器功能。"
fmContentType: stalux
---

# 示例文章

这是一篇示例文章，用于测试Markdown编辑器功能。

## Markdown语法演示

### 文本格式化

**粗体文本** 和 *斜体文本*

### 列表

无序列表:
- 项目1
- 项目2
- 项目3

有序列表:
1. 第一项
2. 第二项
3. 第三项

### 代码

行内代码: \`const example = "hello world"\`

代码块:
\`\`\`javascript
function greeting() {
  console.log("Hello, world!");
}
\`\`\`

### 引用

> 这是一段引用文本。

### 表格

| 标题1 | 标题2 | 标题3 |
|-------|-------|-------|
| 单元格1 | 单元格2 | 单元格3 |
| 单元格4 | 单元格5 | 单元格6 |

### 链接和图片

[链接文本](https://example.com)

![图片alt文本](https://via.placeholder.com/150)
`

    const filePath = `/content/posts/${exampleFileName}`
    const response = await fetch('/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: filePath,
        content: exampleContent
      })
    })

    if (response.ok) {
      alert('示例文章创建成功!')
      return true
    } else {
      throw new Error('创建示例文章失败')
    }
  } catch (error) {
    console.error('创建示例文章失败:', error)
    alert('创建示例文章失败: ' + (error instanceof Error ? error.message : String(error)))
    return false
  }
}

const loadArticle = async (id: string) => {
  try {
    console.log('开始加载文章:', id)
    content.value = ''
    
    // 使用 Nuxt Content v3 的 queryCollection API 加载文章
    const { data: article } = await useAsyncData(`article-${id}`, () => 
      queryCollection('posts')
        .where({ _id: id })
        .first()
    )
    
    console.log('文章加载结果:', article.value)
    
    if (article.value) {
      // 从文件路径提取文件名
      const pathParts = article.value._path.split('/')
      fileName.value = pathParts[pathParts.length - 1]
      
      // 设置元数据
      metadata.value = {
        title: article.value.title || '',
        date: article.value.date || new Date().toISOString().split('T')[0],
        updated: article.value.updated,
        abbrlink: article.value.abbrlink || '',
        tags: article.value.tags || [],
        categories: article.value.categories || [],
        description: article.value.description || '',
        fmContentType: article.value.fmContentType || 'stalux'
      }
      
      // 获取原始Markdown内容
      try {
        const response = await fetch(`/api/raw-content?id=${id}`)
        if (response.ok) {
          const rawContent = await response.text()
          content.value = rawContent
        } else {
          throw new Error('获取原始内容失败')
        }
      } catch (err) {
        console.error('获取原始内容失败:', err)
        // 如果无法获取原始内容，则尝试从已解析的内容构建
        if (article.value.body) {
          if (typeof article.value.body === 'string') {
            content.value = article.value.body
          } else if (article.value.body.text) {
            content.value = article.value.body.text
          }
        }
      }
    } else {
      console.warn('未找到文章:', id)
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
      const parsedMetadata = jsYaml.load(frontMatterMatch[1]) as Partial<Metadata>
      // 合并解析出的元数据，但保留现有的值
      metadata.value = {
        ...metadata.value,
        ...parsedMetadata
      }
    } catch (error) {
      console.error('解析 front matter 失败:', error)
    }
  }
}

// 确认删除文章
const confirmDelete = async (id: string, path: string) => {
  if (confirm(`确定要删除文章 "${path.split('/').pop()}" 吗？此操作不可恢复。`)) {
    try {
      const response = await fetch('/api/content', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: path
        })
      })

      if (response.ok) {
        alert('删除成功!')
        // 刷新文章列表
        await fetchExistingArticles()
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败: ' + (error as Error).message)
    }
  }
}

// 更新保存方法以包含元数据
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

  // 设置更新日期
  metadata.value.updated = new Date().toISOString().split('T')[0]

  // 生成 YAML front matter
  const frontMatter = `---
title: ${metadata.value.title || ''}
date: ${metadata.value.date || ''}
updated: ${metadata.value.updated || ''}
abbrlink: ${metadata.value.abbrlink}
tags: ${JSON.stringify(metadata.value.tags)}
categories: ${JSON.stringify(metadata.value.categories)}
description: ${metadata.value.description || ''}
fmContentType: ${metadata.value.fmContentType}
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
          content: frontMatter + content.value.replace(/^---[\s\S]*?---\n/, '')
        })
      })

      if (response.ok) {
        alert('保存成功!')
        // 刷新数据
        await useAsyncData('articles', () => 
          queryCollection('posts').first()
        ).refresh()
        // 重新加载文章列表
        await fetchExistingArticles()
      } else {
        throw new Error('保存失败')
      }
    }
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败: ' + (error as Error).message)
  }
}

// 当组件挂载时获取现有文章
onMounted(() => {
  fetchExistingArticles()
})

// 监听文件名变化，当文件名变化时自动设置标题
watch(fileName, (newFileName) => {
  if (newFileName && !metadata.value.title) {
    // 从文件名提取标题并格式化
    const titleFromFileName = newFileName
      .replace(/\.md$/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
    
    if (titleFromFileName) {
      metadata.value.title = titleFromFileName
    }
  }
})
</script>

<style scoped>
.markdown-editor {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metadata-editor {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.metadata-section, .articles-section {
  padding: 15px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

.metadata-item input, .metadata-item textarea {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: inherit;
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

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.article-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f8f8f8;
  border-radius: 4px;
}

.article-title {
  flex: 1;
  font-size: 0.9em;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-actions {
  display: flex;
  gap: 8px;
}

.edit-btn {
  padding: 4px 8px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn {
  padding: 4px 8px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.editor-header {
  display: flex;
  gap: 10px;
}

.file-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.save-btn {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn:hover {
  background: #45a049;
}

:deep(.md-editor) {
  border: 1px solid #ddd;
  border-radius: 4px;
}

:deep(.markdown-body) {
  padding: 20px;
}
</style>