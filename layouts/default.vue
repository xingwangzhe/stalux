<template>
  <div>
    <header>
      <nav class="navbar" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
          <a class="navbar-item" href="/">
            <strong class="is-size-5">StaluxLogo</strong>
          </a>

          <a
             role="button" 
             class="navbar-burger" 
             :class="{ 'is-active': isMenuActive }" 
             aria-label="menu" 
             aria-expanded="false" 
             @click="toggleMenu">
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </a>
        </div>
        <div class="navbar-menu" :class="{ 'is-active': isMenuActive }">
          <div class="navbar-end">
            <NuxtLink 
              v-for="(item, index) in navigation" 
              :key="index" 
              :to="item.link" 
              class="navbar-item">
              <span v-if="item.icon" class="icon mr-2">
                <i :class="['fas', item.icon]"/>
              </span>
              <span>{{ item.title }}</span>
            </NuxtLink>
          </div>
        </div>
      </nav>
    </header>
    <div class="container p-5 is-fullheight">
      <slot />
    </div>
    <footer class="footer py-5">
      <div class="content has-text-centered">
        <p class="mb-3">
          <a v-if="footer.icp" :href="footer.icp.url" target="_blank">{{ footer.icp.content }}</a>
          <span v-if="footer.icp && footer.gov" class="mx-2">|</span>
          <a v-if="footer.gov" :href="footer.gov.url" target="_blank">{{ footer.gov.content }}</a>
        </p>
        
        <!-- 没有图标的博客组织 -->
        <div class="is-size-7 mb-4">
          <span v-for="(blog, index) in blogsWithoutIcons" :key="`no-icon-${index}`">
            <a :href="blog.url" target="_blank" rel="noopener" class="has-text-grey">{{ blog.ref }}</a>
            <span v-if="index < blogsWithoutIcons.length - 1" class="mx-1">·</span>
          </span>
        </div>
        
        <!-- 有图标的博客组织 -->
        <div class="is-flex is-flex-wrap-wrap is-justify-content-center is-align-items-center">
          <span v-for="(blog, index) in blogsWithIcons" :key="`with-icon-${index}`" class="mx-2 mb-2 is-flex is-align-items-center">
            <a :href="blog.url" target="_blank" rel="noopener" class="is-flex is-align-items-center">
              <img v-if="blog.icon" :src="blog.icon" :alt="blog.ref" style="height: 16px; width: auto;">
              <span class="ml-1">{{ blog.ref }}</span>
            </a>
            <span v-if="index < blogsWithIcons.length - 1" class="mx-1 is-hidden-mobile">·</span>
          </span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
// import { ref } from 'vue'; 写习惯了
import navigation from '~/config/navigation';
import footer from '~/config/footer';

const isMenuActive = ref(false);
//显示所处状态,是否选中
const toggleMenu = () => {
  isMenuActive.value = !isMenuActive.value;
};

// 分离有图标和无图标的博客
const blogsWithIcons = computed(() => 
  footer.blogs.filter(blog => blog.icon)
);

const blogsWithoutIcons = computed(() => 
  footer.blogs.filter(blog => !blog.icon)
);
</script>

<style>
@import 'bulma/css/bulma.min.css';

@media screen and (min-width: 1024px) {
  .navbar-item {
    padding: 1rem 1.25rem;
    font-size: 1.05rem;
  }
}

.is-fullheight {
  min-height: 100vh;
}
</style>