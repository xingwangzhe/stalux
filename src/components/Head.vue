<template>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ title }}</title> 
    <meta name="description" :content="description" />
    <slot name="title" v-if="false"></slot>
    
    <!-- 使用插槽允许自定义 robots meta 标签，否则根据noindex属性设置 -->
    <slot name="robots">
      <meta name="robots" :content="noindex ? 'noindex, nofollow' : 'index, follow'" />
    </slot>
    
    <meta name="keywords" :content="keywords" v-if="keywords" />
    <meta name="author" :content="author" />
    <link rel="canonical" :href="url" v-if="url" />
    
    <meta property="og:title" :content="title" />
    <meta property="og:description" :content="description" />
    <meta property="og:type" content="website" />
    <meta property="og:url" :content="url" />
    
    <meta http-equiv="content-language" :content="lang || 'zh-CN'" />
    <meta property="og:image" :content="ogImage" v-if="ogImage" />
    <meta property="og:locale" :content="locale || 'zh_CN'" />
    <meta property="og:site_name" :content="siteName" v-if="siteName" />
    
    <link rel="icon" :href="favicon || '/favicon.ico'" sizes="32x32" />
    <link rel="apple-touch-icon" :href="appleTouchIcon || '/apple-touch-icon.ico'" sizes="180x180" />
    <!-- 移除了非标准的description标签 -->
    
    <meta name="twitter:card" content="summary_large_image" v-if="twitterImage || ogImage" />
    <meta name="twitter:title" :content="title" v-if="twitterImage || ogImage" />
    <meta name="twitter:description" :content="description" v-if="twitterImage || ogImage" />
    <meta name="twitter:image" :content="twitterImage || ogImage" v-if="twitterImage || ogImage" />
    <meta name="twitter:creator" :content="twitterCreator" v-if="twitterCreator" />
    
    <script type="application/ld+json" v-if="structuredData">{{ structuredData }}</script>
    
    <!-- 通用插槽，用于添加其他head元素 -->
    <slot name="head"></slot>
  </head>
</template>
<script lang="ts" setup>
const props = defineProps<{
  title: string;
  author: string;
  description: string;
  favicon?: string;
  appleTouchIcon?: string;
  url?: string;
  keywords?: string;
  ogImage?: string;
  twitterImage?: string;
  twitterCreator?: string;
  lang?: string;
  locale?: string;
  siteName?: string;
  structuredData?: string;
  noindex?: boolean; // 新增属性：用于控制页面是否被索引
}>();
</script>