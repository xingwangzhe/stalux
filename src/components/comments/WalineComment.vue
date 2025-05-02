<script setup lang="ts">
/**
 * Waline评论组件 - Vue版本
 * 集成Waline评论系统
 */
import { ref, onMounted, watch } from 'vue';
import { init } from '@waline/client';
import '@waline/client/waline.css'; // 正确导入CSS，使用官方推荐的路径

// 引入站点配置
import { config_site } from '../../utils/config-adapter';

// 定义组件参数
interface Props {
  path?: string;
  title?: string;
  serverURL?: string;
}

const props = withDefaults(defineProps<Props>(), {
  path: '',
  title: '',
  serverURL: config_site.comment?.waline?.serverURL || '',
});

const walineConfig = config_site.comment?.waline || {};
const commentRef = ref<HTMLElement | null>(null);
const walineInstance = ref(null);

// 初始化Waline评论系统
const initWaline = () => {
  if (!props.serverURL || !commentRef.value) return;
  
  // 销毁之前的实例
  if (walineInstance.value) {
    walineInstance.value.destroy();
  }

  // 创建新实例
  walineInstance.value = init({
    el: commentRef.value,
    serverURL: props.serverURL,
    path: props.path || window.location.pathname,
    lang: walineConfig.lang || 'zh-CN',
    emoji: walineConfig.emoji || ['https://unpkg.com/@waline/emojis@1.1.0/weibo'],
    requiredFields: walineConfig.requiredFields || [],
    reaction: walineConfig.reaction || true,
    meta: walineConfig.meta || ['nick', 'mail', 'link'],
    wordLimit: walineConfig.wordLimit || 200,
    pageSize: walineConfig.pageSize || 10,
    title: props.title,
    dark: true // 固定使用暗色模式
  });
};

// 监听路径变化，重新初始化评论
watch(() => props.path, () => {
  initWaline();
});

// 组件挂载时初始化Waline
onMounted(() => {
  if (props.serverURL) {
    initWaline();
  }
});

// 组件卸载前清理
const onBeforeUnmount = () => {
  if (walineInstance.value) {
    walineInstance.value.destroy();
  }
};
</script>

<template>
  <div class="waline-comment-container dark-theme" v-if="serverURL">
    <div ref="commentRef" class="waline-comment"></div>
  </div>
</template>

<style>
.waline-comment-container {
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 8px;
  background-color: var(--card-bg-dark, #1a1a1a);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.waline-comment-container .wl-editor,
.waline-comment-container .wl-input {
  background-color: var(--card-bg-dark, #1a1a1a);
  color: var(--text-color-dark, #f0f0f0);
  border-color: var(--border-color-dark, #333);
}

/* 始终保持暗色模式样式 */
.waline-comment-container .wl-btn {
  background-color: var(--primary-color, #3b70fc);
  color: #ffffff;
}

.waline-comment-container .wl-header label {
  color: var(--text-color-dark, #f0f0f0);
}

/* 移动设备样式调整 */
@media (max-width: 768px) {
  .waline-comment-container {
    padding: 1rem;
    margin-top: 1.5rem;
  }
}
</style>