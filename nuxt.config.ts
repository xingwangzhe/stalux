export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  components: true,
  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils'
  ],
  css:['bulma/css/bulma.min.css',
    '~/assets/css/fonts.css',
    '@fortawesome/fontawesome-free/css/all.min.css',
  ],
  
  // 添加全局页面过渡设置
  app: {
    pageTransition: {
      name: 'page',
      mode: 'out-in'
    }
  }
})