<template>
  <div class="editor-page">
    <MarkdownEditor v-if="isDev" />
    <div v-else class="dev-notice">
      编辑器仅在开发环境可用
    </div>
  </div>
</template>

<script setup lang="ts">
const isDev = process.dev
</script>

<style scoped>

.editor-page {
  min-height: 100vh;
}

.dev-notice {
  padding: 20px;
  text-align: center;
  color: #666;
}
</style>