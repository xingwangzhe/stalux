<template>
  <div>
    你好啊
    <li  v-for="(item, index) in data"  :key="index">
    <NuxtLink v-if="item.abbrlink"  :to="`/posts/${item.abbrlink}`">{{ item.title }}</NuxtLink>
</li>
  </div>
</template>

<script lang="ts" setup>
  const { data , error} =await useAsyncData('posts',()=>{
  return queryCollection('posts').all();
})
</script>

<style>

</style>