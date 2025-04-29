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
  transition: all 0.3s ease;
  color: #ffffff;
  text-decoration: none;
}

.social-links a:hover {
  transform: translateY(-3px);
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
</style>