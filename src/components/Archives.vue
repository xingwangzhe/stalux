<template>
  <div>
    <ul class="list-disc list-inside">
      <li v-for="post in posts" :key="post.abbrlink">
        <a :href="'/posts/' + post.data.abbrlink">{{ post.data.title }}</a>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { type CollectionEntry, getCollection } from 'astro:content';

const posts = await getCollection('posts');



</script>

<style>

</style>