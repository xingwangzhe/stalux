<template>
  <div>
    <div v-if="pending">加载中...</div>
    <div v-else-if="error">{{ error.message }}</div>
    <article v-else class="article">
      <header class="mb-6">
        <h1 class="title is-2">{{ data.title }}</h1>
        <div class="subtitle is-5 has-text-grey">
          <time>{{ formatDate(data.date) }}</time>
          <span v-if="data.tags" class="ml-4">
            <span v-for="tag in data.tags" :key="tag" class="tag is-info is-light mr-2">{{ tag }}</span>
          </span>
        </div>
      </header>
      
      <!-- 渲染内容 -->
      <ContentRenderer :value="data" />
    </article>
  </div>
</template>

<script setup>
// 从路由获取slug参数
const { slug } = useRoute().params;

// 将slug数组转为路径
const path = Array.isArray(slug) ? `/${slug.join('/')}` : '/';

// 获取文章内容
const { data, pending, error } = await useAsyncData(`content-${path}`, () => {
  return queryContent().where({ _path: path }).findOne();
});

// 如果没有找到内容，显示404
if (!data.value && !pending.value) {
  throw createError({ statusCode: 404, message: '页面不存在' });
}

// 日期格式化函数
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>

<style scoped>
.article {
  max-width: 768px;
  margin: 0 auto;
}
</style>
