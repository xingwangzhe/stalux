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
  },
  nitro: {
    prerender: {
      // 添加failOnError选项以防错误时退出预渲染
      failOnError: false,
      routes: [
        // 你的预渲染路由配置
      ],
      // @ts-ignore: 忽略类型检查以使用自定义错误处理逻辑
      onError: (error, route) => {
        // 自定义错误处理逻辑
        console.error(`Prerender error for route ${route}:`, error);

        // 根据错误类型决定重定向到404或403
        if (error.code === 'IPX_FORBIDDEN_PATH') {
          return {
            status: 403,
            headers: {
              Location: '/403',
            },
          };
        } else if (error.code === 'IPX_FILE_NOT_FOUND') {
          return {
            status: 404,
            headers: {
              Location: '/404',
            },
          };
        }

        // 默认返回404
        return {
          status: 404,
          headers: {
            Location: '/404',
          },
        };
      },
    },
  },
})
