<template>
  <div class="social-links" :aria-label="ariaLabel">
    <ul>
      <li v-for="item in mediaLinks" :key="item.url">
        <a 
          :href="item.url" 
          target="_blank" 
          :aria-label="item.title" 
          rel="noopener noreferrer" 
          :title="item.title"
        >
          <i  :class="`fa-brands fa-${normalizeIconName(item.icon)}`" aria-hidden="true"></i>
          <span class="sr-only">{{ item.title }}</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'SocialLinks',
  props: {
    mediaLinks: {
      type: Array,
      required: true,
      validator: (value) => {
        return value.every(item => 
          item.url && 
          item.title && 
          item.icon
        );
      }
    },
    ariaLabel: {
      type: String,
      default: '社交媒体链接'
    }
  },
  methods: {
    // 规范化图标名称，处理特殊情况
    normalizeIconName(iconName) {
      const iconMap = {
        'x-twitter': 'twitter', // x-twitter 仍使用 twitter 图标
        'qq': 'qq',
        'weibo': 'weibo',
        'github': 'github',
        'telegram': 'telegram',
        'discord': 'discord'
      };
      
      return iconMap[iconName] || iconName; // 如果没有特殊映射，使用原名
    }
  }
}
</script>

<style scoped>
.social-links {
  margin-left: auto;
}

.social-links ul {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
  list-style: none;
  padding: 0;
  margin: 0;
}

.social-links li {
  margin: 0;
}

.social-links a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: all 0.3s ease;
  color: #ffffff;
  text-decoration: none;
}

.social-links a:hover {
  background-color: rgba(0, 255, 255, 0.2);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 255, 255, 0.3);
}

.social-links i {
  font-size: 1.5rem;
}

/* 为bilibili自定义图标 */
.custom-icon {
  font-style: normal;
  font-weight: bold;
  font-size: 1.3rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>