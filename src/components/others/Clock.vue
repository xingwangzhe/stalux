<template>
    <div class="clock-container">
        <div class="date" v-if="showDate">{{ formattedDate }}</div>
        <div class="clock">{{ formattedTime }}</div>
    </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, watchEffect } from 'vue';

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

const time = ref(new Date());
let timer = null;

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

// 直接在组件定义时启动计时器，不依赖于onMounted
// 初始更新一次时间
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

onBeforeUnmount(() => {
    // 组件卸载时清除定时器
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
});
</script>

<style scoped>
.clock-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 60%;
    margin: 20px auto;
    padding: 15px 0;
    background-color: rgba(0, 0, 0, 0.021);
    backdrop-filter: blur(25px);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 10px 35px rgba(0, 0, 0, 0.226);
}

.clock {
    font-size: 3.0rem;
    font-weight: normal;
    text-shadow: 0.1rem 0.1rem 0.2rem rgb(1, 162, 190);
}

.date {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
    text-shadow: 0.1rem 0.1rem 0.2rem rgb(1, 162, 190);
}
</style>
