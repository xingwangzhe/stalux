<template>
  <div class="social-links" :aria-label="ariaLabel">
    <ul>
      <li class="socila_icon" v-for="item in safeMediaLinks" :key="item.url">
        <a 
          :href="item.url" 
          target="_blank" 
          :aria-label="item.title" 
          rel="noopener noreferrer" 
          :title="item.title"
        >
          <i :class="`fa-brands fa-${item.icon}`" aria-hidden="true"></i>
          <span class="sr-only">{{ item.title }}</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { animate,waapi} from 'animejs';
onMounted(()=>{
  animate('.socila_icon',{
    y: [
        { to: '-2.75rem', ease: 'outExpo', duration: 600 },
        { to: 0, ease: 'outBounce', duration: 800, delay: 100 }
      ],
      rotate: {
        from: '-1turn',
        delay: 0
      },
      delay: (_, i) => i * 50, // Function based value
      ease: 'inOutCirc',
      loopDelay: 1000,
      loop: true
});
})
const props = defineProps<{
  mediaLinks: Array<any>,
  ariaLabel?: string
}>();


const safeMediaLinks = computed(() => {
  // 确保 mediaLinks 是一个数组且每个项目都有必要的属性
  return Array.isArray(props.mediaLinks) 
    ? props.mediaLinks.filter(item => item && item.url && item.title && item.icon) 
    : [];
});

</script>

<style scoped>
.social-links {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 25px auto;
  width: 90%;
  max-width: 800px;
}

.social-links ul {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 10px;
}

.social-links li {
  margin: 5px;
}

.social-links a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  transition: all 0.3s ease;
  color: #ffffff;
  text-decoration: none;
  background-color: rgba(255, 255, 255, 0.1);
}

.social-links a:hover {
  transform: translateY(-3px);
  background-color: rgba(255, 255, 255, 0.2);
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
}

/* 响应式调整 */
@media (max-width: 768px) {
  .social-links {
    margin: 20px auto;
  }
  
  .social-links ul {
    gap: 5px;
  }
  
  .social-links a {
    width: 44px;
    height: 44px;
  }
}

@media (max-width: 480px) {
  .social-links a {
    width: 40px;
    height: 40px;
  }
  
  .social-links i {
    font-size: 1.2rem;
  }
}
</style>