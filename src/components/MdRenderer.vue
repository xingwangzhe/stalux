<template>
  <div class="md-renderer">
    <MdPreview 
    theme="dark"
    :modelValue="content" 
    :previewTheme="theme" 
    :showCodeRowNumber="true" 
    codeTheme="github"
     />
  </div>
</template>

<script setup lang="ts">
import { MdPreview } from 'md-editor-v3';
import 'md-editor-v3/lib/preview.css';
import { computed, onMounted, ref } from 'vue';

const props = defineProps<{
  content: string;
  theme?: string;
}>();

const theme = ref(props.theme || 'default');

// 可以在此处添加更多自定义配置，如主题切换、代码高亮等
</script>

<style>
.md-renderer {
    width: 100%;
    max-width: 1200px; 
    margin: 0 auto;
}

/* 磨砂玻璃效果 */
.md-editor-preview {
    background-color: rgba(255, 255, 255, 0.021) !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.034);
    font-family: var(--font-body);
    line-height: 1.6;
}

.md-editor-preview h1,
.md-editor-preview h2,
.md-editor-preview h3,
.md-editor-preview h4,
.md-editor-preview h5,
.md-editor-preview h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
}

.md-editor-preview p {
    margin-bottom: 1em;
}

.md-editor-preview blockquote {
    border-left: 4px solid rgba(204, 204, 204, 0.7);
    padding-left: 1em;
    color: #aaa;
    font-style: italic;
}

.md-editor-preview pre {
    margin-bottom: 1em;
    border-radius: 6px;
    background-color: rgba(30, 30, 30, 0.7) !important;
}

.md-editor-preview table {
    width: 100%;
    margin-bottom: 1em;
    border-collapse: collapse;
}

.md-editor-preview th,
.md-editor-preview td {
    padding: 8px;
    border: 1px solid rgba(221, 221, 221, 0.5);
}

.md-editor-preview img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
    border-radius: 6px;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .md-editor-preview {
        font-size: 0.95em;
        padding: 15px;
    }
    
    .md-renderer {
        max-width: 95%;
    }
}
</style>