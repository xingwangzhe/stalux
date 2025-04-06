<template>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ title }}</title>
    <link rel="icon" :href="favicon || '/favicon.ico'" sizes="32x32" />
    <link rel="apple-touch-icon" :href="appleTouchIcon || '/apple-touch-icon.ico'" sizes="180x180" />
    <description>{{ description }}</description>
    <meta name="description" :content="description" />
    <meta name="robots" content="index, follow" />
    <meta property="og:title" :content="title" />
    <meta property="og:description" :content="description" />
    <meta property="og:type" content="website" />
    <meta property="og:url" :content="url" />
  </head>
</template>
<script lang="ts" setup>
const props = defineProps<{
  title: string;
  description: string;
  favicon?: string;
  appleTouchIcon?: string;
  url?: string;
}>();
</script>