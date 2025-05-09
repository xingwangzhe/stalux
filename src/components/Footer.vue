<template>
  <footer class="site-footer">
    <div class="footer-content">
      <!-- 版权信息 -->
      <div class="copyright" v-if="showCopyright">
        <span>&copy; {{ copyrightYear }} {{ site.author || 'Stalux' }}.</span>
        <span v-if="copyrightText">{{ copyrightText }}</span>
        <span v-else> 保留所有权利.</span>
      </div>

      <!-- 徽章展示区 -->
      <div class="badges" v-if="allBadges.length > 0">
        <template v-for="badge in allBadges" :key="badge.alt">
          <a v-if="badge.href" :href="badge.href" target="_blank" rel="noopener noreferrer">
            <img :src="badge.src" :alt="badge.alt" class="badge">
          </a>
          <img v-else :src="badge.src" :alt="badge.alt" class="badge">
        </template>
      </div>

      <!-- 备案信息区 -->
      <div class="beian-info" v-if="showBeian">
        <a
          v-if="enableIcpBeian && icpBeian"
          :href="`https://beian.miit.gov.cn/`"
          target="_blank"
          rel="noopener noreferrer"
        >{{ icpBeian }}</a>

        <a
          v-if="enablePublicSecurityBeian && publicSecurityBeian && publicSecurityBeianNumber"
          :href="`http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=${publicSecurityBeianNumber}`"
          target="_blank"
          rel="noopener noreferrer"
          class="public-security-beian"
        >
          <img src="https://beian.mps.gov.cn/img/logo01.dd7ff50e.png" alt="公安备案图标" />
          {{ publicSecurityBeian }}
        </a>
      </div>

      <!-- 主题信息 -->
      <div class="theme-info" v-if="showThemeInfoSection">
        <span v-if="showPoweredBy">
          Powered by
          <a href="https://astro.build" target="_blank" rel="noopener noreferrer">Astro</a>
        </span>
        <span v-if="showPoweredBy && showThemeInfo"> | </span>
        <span v-if="showThemeInfo">
          Theme is
          <a href="https://stalux.needhelp.icu" target="_blank" rel="noopener noreferrer">Stalux</a>
        </span>
      </div>      <div class="site-build-time">
        <span>本站已正常运行<span v-html="buildTime"></span></span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import { site } from '../consts';
import { generateBadge, svgToDataUrl } from '../utils/badge-generator';
import type { BadgeLink, BadgeOptions } from '../types';

// --- 配置读取 ---
// 获取页脚配置，优先使用footer对象中的配置，兼容旧版配置
const footerConfig = ref(site.footer || {});

// 作者信息
const author = ref(site.author || 'Stalux');

// 版权配置
const copyrightConfig = ref(
  footerConfig.value.copyright || 
  site.copyright || 
  { enabled: true }
);

// 主题信息配置
const showPoweredBy = ref(
  footerConfig.value.theme?.showPoweredBy !== undefined 
    ? footerConfig.value.theme.showPoweredBy 
    : site.showPoweredBy !== false
);
const showThemeInfo = ref(
  footerConfig.value.theme?.showThemeInfo !== undefined 
    ? footerConfig.value.theme.showThemeInfo 
    : site.showThemeInfo !== false
);

// 备案信息配置
const enableIcpBeian = ref(
  footerConfig.value.beian?.icp?.enabled !== undefined
    ? footerConfig.value.beian.icp.enabled
    : site.enableIcpBeian !== false
);
const icpBeian = ref(
  footerConfig.value.beian?.icp?.number || 
  site.icpBeian || 
  ''
);

const enablePublicSecurityBeian = ref(
  footerConfig.value.beian?.security?.enabled !== undefined
    ? footerConfig.value.beian.security.enabled
    : site.enablePublicSecurityBeian !== false
);
const publicSecurityBeian = ref(
  footerConfig.value.beian?.security?.text || 
  site.publicSecurityBeian || 
  ''
);
const publicSecurityBeianNumber = ref(
  footerConfig.value.beian?.security?.number || 
  site.publicSecurityBeianNumber || 
  ''
);

// 徽章配置
const customBadgeOptions = ref<BadgeOptions[]>(
  footerConfig.value.badges || 
  site.customBadges || 
  []
);

// 站点运行时间
const buildTime = ref('');

// 网站运行时间计数器
function buildTimeCounter() {
  if (!site.buildtime) return;
  
  // 解析构建时间，处理多种格式
  let buildDate;
  
  // 尝试解析各种可能的格式
  if (typeof site.buildtime === 'string') {
    // 处理 'YYYY-M-D HH:MM:SS' 格式（空格分隔日期和时间）
    const dateTimePattern1 = /^(\d{4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    // 处理 'YYYY-M-D HH:MM' 格式（空格分隔，无秒数）
    const dateTimePattern2 = /^(\d{4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{1,2})$/;
    // 处理 'YYYY-M-D:HH:MM:SS' 格式（冒号分隔日期和时间）
    const dateTimePattern3 = /^(\d{4})-(\d{1,2})-(\d{1,2}):(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    // 处理 'YYYY-M-D:HH:MM' 格式（冒号分隔，无秒数）
    const dateTimePattern4 = /^(\d{4})-(\d{1,2})-(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    
    // 依次尝试匹配各种模式
    let matches;
    
    // 首先尝试 'YYYY-M-D HH:MM:SS' 格式（最符合当前格式）
    matches = site.buildtime.match(dateTimePattern1);
    if (matches) {
      const year = parseInt(matches[1]);
      const month = parseInt(matches[2]) - 1; // 月份从0开始
      const day = parseInt(matches[3]);
      const hour = parseInt(matches[4]);
      const minute = parseInt(matches[5]);
      const second = parseInt(matches[6]);
      
      buildDate = new Date(year, month, day, hour, minute, second);
    } 
    // 尝试 'YYYY-M-D HH:MM' 格式（无秒数）
    else if ((matches = site.buildtime.match(dateTimePattern2))) {
      const year = parseInt(matches[1]);
      const month = parseInt(matches[2]) - 1; // 月份从0开始
      const day = parseInt(matches[3]);
      const hour = parseInt(matches[4]);
      const minute = parseInt(matches[5]);
      
      buildDate = new Date(year, month, day, hour, minute, 0); // 秒设为0
    }
    // 尝试 'YYYY-M-D:HH:MM:SS' 格式（冒号分隔）
    else if ((matches = site.buildtime.match(dateTimePattern3))) {
      const year = parseInt(matches[1]);
      const month = parseInt(matches[2]) - 1; // 月份从0开始
      const day = parseInt(matches[3]);
      const hour = parseInt(matches[4]);
      const minute = parseInt(matches[5]);
      const second = parseInt(matches[6]);
      
      buildDate = new Date(year, month, day, hour, minute, second);
    }
    // 尝试 'YYYY-M-D:HH:MM' 格式（冒号分隔，无秒数）
    else if ((matches = site.buildtime.match(dateTimePattern4))) {
      const year = parseInt(matches[1]);
      const month = parseInt(matches[2]) - 1; // 月份从0开始
      const day = parseInt(matches[3]);
      const hour = parseInt(matches[4]);
      const minute = parseInt(matches[5]);
      
      buildDate = new Date(year, month, day, hour, minute, 0); // 秒设为0
    }
    // 尝试直接解析（标准格式）
    else {
      // 尝试标准格式解析
      buildDate = new Date(site.buildtime);
    }
  } else {
    buildDate = new Date(site.buildtime);
  }
  
  // 确保构建时间是有效的日期
  if (isNaN(buildDate.getTime())) {
    console.warn('网站构建时间格式无效，无法解析: ' + site.buildtime);
    // 使用备用日期（当前日期减去1天，作为默认值）
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    buildDate = yesterday;
  }
    // 更新函数 - 计算并显示运行时间
  const updateRuntime = () => {
    const now = new Date();
    const diff = now.getTime() - buildDate.getTime();
    
    // 计算天、时、分、秒
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // 添加千分位分隔符并格式化显示
    // 对于大数值（比如天数超过1000天），添加千分位分隔符提高可读性
    const formatNumber = (num: number): string => {
      if (num < 1000) return String(num);
      return num.toLocaleString('zh-CN');
    };
    
    // 格式化显示，添加带有特殊样式的文本
    buildTime.value = `${formatNumber(days)}<span class="time-unit">天</span>${hours}<span class="time-unit">时</span>${minutes}<span class="time-unit">分</span>${seconds}<span class="time-unit">秒</span>`;
  };
  
  // 初次运行
  updateRuntime();
  
  // 设置定时器，每秒更新一次
  const timer = setInterval(updateRuntime, 1000);
  
  // 组件卸载时清除定时器
  const app = getCurrentInstance();
  if (app) {
    onUnmounted(() => {
      clearInterval(timer);
    });
  }
}

// --- 计算属性 ---
// 是否显示版权
const showCopyright = computed(() => copyrightConfig.value.enabled !== false);

// 计算版权年份
const copyrightYear = computed(() => {
  const currentYear = new Date().getFullYear();
  const startYear = copyrightConfig.value.startYear;
  if (startYear && startYear < currentYear) {
    return `${startYear}-${currentYear}`;
  }
  return currentYear;
});

// 版权自定义文本
const copyrightText = computed(() => copyrightConfig.value.customText || '');

// 是否显示备案信息
const showBeian = computed(() => 
  (enableIcpBeian.value && !!icpBeian.value) || 
  (enablePublicSecurityBeian.value && !!publicSecurityBeian.value && !!publicSecurityBeianNumber.value)
);

// 是否显示主题信息部分
const showThemeInfoSection = computed(() => showPoweredBy.value || showThemeInfo.value);

// 生成所有本地徽章
const allBadges = computed<BadgeLink[]>(() => {
  if (!customBadgeOptions.value || customBadgeOptions.value.length === 0) {
    return [];
  }
  
  return customBadgeOptions.value.map(options => ({
    src: svgToDataUrl(generateBadge(options)),
    alt: options.alt || `${options.label}: ${options.message}`,
    href: options.href
  }));
});

// 在组件挂载时启动网站运行时间计数器
onMounted(() => {
  buildTimeCounter();
});
</script>

<style scoped>
.site-footer {
  width: 100%;
  padding: 1.5rem 0;
  text-align: center;
  margin-top: auto;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  background-color: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.copyright {
  font-weight: 500;
}
.copyright span {
  margin-right: 0.3em; /* 给版权信息各部分之间增加一点间距 */
}

.badges {
  display: flex;
  justify-content: center;
  align-items: center; /* 垂直居中对齐徽章 */
  flex-wrap: wrap;
  gap: 0.5rem;
}

.badge {
  height: 20px;
  vertical-align: middle; /* 确保图片基线对齐 */
}

.beian-info {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.beian-info a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.3s ease;
}

.beian-info a:hover {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: underline;
}

.public-security-beian {
  display: inline-flex; /* 改为 inline-flex 使其能与其他备案号在同一行 */
  align-items: center;
  gap: 5px;
}

.public-security-beian img {
  width: 15px;
  height: 15px;
  display: inline-block; /* 确保图片能正确对齐 */
}

.theme-info {
  font-size: 0.85rem;
}

.theme-info a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: color 0.3s ease;
}

.theme-info a:hover {
  color: rgba(255, 255, 255, 1);
  text-decoration: underline;
}

.site-build-time {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
}

.site-build-time .time-unit {
  font-size: 0.8em;
  opacity: 0.85;
  margin: 0 2px;
  color: rgba(255, 255, 255, 0.7);
}

@media (max-width: 768px) {
  .site-footer {
    padding: 1.2rem 0;
    font-size: 0.8rem;
  }

  .footer-content {
    gap: 0.6rem;
  }

  .theme-info {
    font-size: 0.75rem;
  }
}
</style>