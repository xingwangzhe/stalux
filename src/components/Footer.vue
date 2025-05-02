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
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { site } from '../consts';
import { generateBadge, svgToDataUrl } from '../utils/badge-generator';
import type { BadgeLink, BadgeOptions } from '../types';

// --- 配置读取 ---
const author = ref(site.author || 'Stalux');
const copyrightConfig = ref(site.copyright || { enabled: true });
const showPoweredBy = ref(site.showPoweredBy !== false);
const showThemeInfo = ref(site.showThemeInfo !== false);
const enableIcpBeian = ref(site.enableIcpBeian !== false); // 默认启用 ICP 备案
const icpBeian = ref(site.icpBeian || '');
const enablePublicSecurityBeian = ref(site.enablePublicSecurityBeian !== false); // 默认启用公安备案
const publicSecurityBeian = ref(site.publicSecurityBeian || '');
const publicSecurityBeianNumber = ref(site.publicSecurityBeianNumber || '');
const customBadgeOptions = ref<BadgeOptions[]>(site.customBadges || []);

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