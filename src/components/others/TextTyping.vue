<template>
    <div id="textyping">{{ displayText }}</div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { site } from "../../consts";
import { config_site } from "../../_config";

// 获取配置的文字
const texts = computed(() => config_site.textyping || site.textyping || [site.title, site.description]);

// 状态变量
const displayText = ref('');
let currentTextIndex = Math.floor(Math.random() * texts.value.length);
let currentCharIndex = 0;
let isDeleting = false;
let typingDelay = 40; // 打印速度
let deletingDelay = 80;  // 删除速度
let pauseDelay = 1000;   // 暂停时间

// 打字效果函数
function typeText() {
    const currentText = texts.value[currentTextIndex];
    
    if (isDeleting) {
        displayText.value = currentText.slice(0, currentCharIndex--);
        typingDelay = deletingDelay;
        
        if (currentCharIndex < 0) {
            isDeleting = false;
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * texts.value.length);
            } while (newIndex === currentTextIndex && texts.value.length > 1);
            currentTextIndex = newIndex;
            setTimeout(typeText, pauseDelay);
            return;
        }
    } else {
        displayText.value = currentText.substring(0, currentCharIndex++);
        typingDelay = 80;
        
        if (currentCharIndex > currentText.length) {
            isDeleting = true;
            currentCharIndex = currentText.length;
            setTimeout(typeText, pauseDelay);
            return;
        }
    }
    
    setTimeout(typeText, typingDelay);
}

// 组件加载时启动打字效果
onMounted(() => {
    typeText();
});
</script>

<style scoped>
#textyping {
    position: relative;
    text-align: center;
    font-size: 2.5rem;
    margin: 20px auto;
    width: 60%;
    min-height: 2rem;
    color: #ffffff;
    text-shadow: 0.1rem 0.1rem 0.2rem rgb(1, 162, 190);
}

#textyping::after {
    content: '|';
    position: relative;
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}
</style>