import { defineIntegration } from 'astro';

export default defineIntegration({
  name: 'astro-theme-stalux',
  hooks: {
    'astro:config:setup': ({ updateConfig }: { updateConfig: (config: any) => void }) => {
      // 这里可以添加自动配置主题所需的内容
      console.log('🌟 Stalux 主题已激活，感谢您的使用！');
    },
  },
});
