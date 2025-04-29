<template>
  <div class="social-links" :aria-label="ariaLabel">
    <ul>
      <li v-for="item in safeMediaLinks" :key="item.url">
        <a 
          :href="item.url" 
          target="_blank" 
          :aria-label="item.title" 
          rel="noopener noreferrer" 
          :title="item.title"
        >
          <i :class="`fa-brands fa-${normalizeIconName(item.icon)}`" aria-hidden="true"></i>
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
      default: () => [],
    },
    ariaLabel: {
      type: String,
      default: '社交媒体链接'
    }
  },
  computed: {
    safeMediaLinks() {
      // 确保 mediaLinks 是一个数组且每个项目都有必要的属性
      return Array.isArray(this.mediaLinks) ? this.mediaLinks.filter(item => 
        item && item.url && item.title && item.icon
      ) : [];
    }
  },
  methods: {
    normalizeIconName(icon) {
      if (!icon) return 'link';
      // 处理特殊情况
      if (icon === 'bilibili') return 'bilibili';
      return icon;
    }
  }
}
</script>

<style scoped>
.social-links {
  display: flex;
  margin-left: auto;
  margin-right: 15px;
}

.social-links ul {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
}

.social-links li {
  margin: 0 5px;
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