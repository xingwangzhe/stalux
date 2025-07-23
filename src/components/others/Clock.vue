<template>
    <div class="clock-container" ref="clockContainer">
        <div class="date" v-if="showDate" :style="dateStyle">{{ formattedDate }}</div>
        <div class="clock" :style="clockStyle">{{ formattedTime }}</div>
    </div>
</template>

<script setup vapor>
import { ref, computed, onBeforeUnmount, watchEffect, onMounted } from 'vue';

/**
 * Clock Component Props:
 * 
 * @prop {Boolean} showDate - 控制是否显示日期，默认为false，仅显示时间
 * @prop {String} format - 时间显示格式，可选值：
 *   - 'default': 使用浏览器默认的本地化时间格式
 *   - '24hour': 使用24小时制显示时间 (如: 14:30:45)
 *   - '12hour': 使用12小时制显示时间 (如: 下午2:30:45)
 * @prop {Number} updateInterval - 时钟更新频率，单位为毫秒，默认1000ms(1秒)
 *                                可根据需求调整，值越小更新越频繁
 */
const props = defineProps({
    showDate: {
        type: Boolean,
        default: false
    },
    format: {
        type: String,
        default: 'default' // 'default', '24hour', '12hour'
    },
    updateInterval: {
        type: Number,
        default: 1000 // 默认1秒更新一次
    }
});

// 初始值为空或固定值，避免服务器和客户端渲染不一致
const time = ref(new Date('2000-01-01T00:00:00')); 
let timer = null;

// 容器引用和尺寸状态
const clockContainer = ref(null);
const containerWidth = ref(0);
let resizeObserver = null;

// 根据容器宽度计算字体大小
const clockStyle = computed(() => {
    // 基础字体大小调整因子
    const fontSize = calculateFontSize(containerWidth.value, 3.0, 1.5);
    return {
        fontSize: `${fontSize}rem`,
        // 保持其他样式不变
        fontWeight: 'normal',
        textShadow: '0.1rem 0.1rem 0.2rem rgb(1, 162, 190)',
        textAlign: 'center',
        whiteSpace: 'nowrap'
    };
});

const dateStyle = computed(() => {
    // 日期字体稍小一些
    const fontSize = calculateFontSize(containerWidth.value, 1.8, 0.9);
    return {
        fontSize: `${fontSize}rem`,
        marginBottom: `${fontSize * 0.3}rem`,
        textShadow: '0.1rem 0.1rem 0.2rem rgb(1, 162, 190)',
        textAlign: 'center',
        whiteSpace: 'nowrap'
    };
});

// 根据容器宽度计算字体大小的函数
function calculateFontSize(width, maxSize, minSize) {
    if (!width) return maxSize; // 默认值
    
    // 设定边界值
    const maxWidth = 600; // 最大宽度，超过此宽度使用最大字体
    const minWidth = 150; // 最小宽度，低于此宽度使用最小字体
    
    if (width >= maxWidth) return maxSize;
    if (width <= minWidth) return minSize;
    
    // 线性插值计算合适的字体大小
    const ratio = (width - minWidth) / (maxWidth - minWidth);
    const fontSize = minSize + ratio * (maxSize - minSize);
    
    // 保留一位小数
    return Math.round(fontSize * 10) / 10;
}

// 格式化时间显示
const formattedTime = computed(() => {
    if (props.format === '24hour') {
        return time.value.toLocaleTimeString('zh-CN', { hour12: false });
    } else if (props.format === '12hour') {
        return time.value.toLocaleTimeString('zh-CN', { hour12: true });
    } else {
        return time.value.toLocaleTimeString();
    }
});

// 格式化日期显示
const formattedDate = computed(() => {
    return time.value.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
});

function updateTime() {
    time.value = new Date();
}

function updateContainerWidth() {
    if (clockContainer.value) {
        containerWidth.value = clockContainer.value.offsetWidth;
    }
}

// 使用 onMounted 钩子，确保只在客户端执行
onMounted(() => {
    // 组件挂载后更新时间
    updateTime();
    
    // 创建定时器
    timer = setInterval(updateTime, props.updateInterval);
    
    // 如果updateInterval属性变化，重新设置定时器
    watchEffect(() => {
        if (timer) {
            clearInterval(timer);
        }
        timer = setInterval(updateTime, props.updateInterval);
    });

    // 初始获取容器宽度
    updateContainerWidth();
    
    // 创建ResizeObserver监视容器尺寸变化
    if (window.ResizeObserver) {
        resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.target === clockContainer.value) {
                    containerWidth.value = entry.contentRect.width;
                }
            }
        });
        
        if (clockContainer.value) {
            resizeObserver.observe(clockContainer.value);
        }
    } else {
        // 降级方案：监听window的resize事件
        window.addEventListener('resize', updateContainerWidth);
    }
});

onBeforeUnmount(() => {
    // 组件卸载前清除定时器
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    
    // 清除ResizeObserver
    if (resizeObserver && clockContainer.value) {
        resizeObserver.unobserve(clockContainer.value);
        resizeObserver.disconnect();
        resizeObserver = null;
    } else {
        // 如果使用的是降级方案
        window.removeEventListener('resize', updateContainerWidth);
    }
});
</script>

<style scoped>
.clock-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 10px 0;
    overflow: hidden;
}

/* 基础样式 - 将大部分样式转移到了动态计算的style中 */
.clock {
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
}

.date {
    text-align: center;
    white-space: nowrap;
}

/* 保留媒体查询以支持不支持ResizeObserver的浏览器作为后备方案 */
@media (max-width: 1200px) {
    /* 媒体查询样式会被内联样式覆盖 */
}
</style>
