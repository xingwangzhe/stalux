<template>
  <div>
    <div v-if="error">{{ error.message }}</div>
    <div v-else-if="!data">没有内容</div>
    <article v-else-if="data" class="article">
      <header class="mb-6">
        <h1 class="title is-2">{{ data.title }}</h1>
        <div class="subtitle is-5 has-text-grey">
          <time>{{ data.date }}</time>
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

<script lang="ts" setup>
// 从路由获取slug参数
const route = useRoute();
const { slug } = route.params;

// 将slug数组转为路径
const path = Array.isArray(slug) && slug.length > 0 
  ? `/posts/${slug.join('/')}` 
  : '/';
console.log('path:', path);

const abbrlinkFromSlug = Array.isArray(slug) && slug.length > 0 
  ? slug[0] // 获取第一个段落，即posts/后面的直接参数
  : '';
console.log('abbrlinkFromSlug:', abbrlinkFromSlug);

const { data , error} =await useAsyncData('posts',()=>{
  return queryCollection('posts').where('abbrlink','=',abbrlinkFromSlug).first();
})


</script>

<style scoped>
.article {
  max-width: 768px;
  margin: 0 auto;
}
</style>
