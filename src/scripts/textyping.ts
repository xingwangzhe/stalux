import { config_site } from "../utils/yaml-config-adapter";

document.addEventListener("DOMContentLoaded", () => {
    const textTypingElement = document.getElementById("textyping");
    if(!textTypingElement) return;

    const texts: string[] = config_site.textyping || [];
    if (texts.length === 0) return;
    let currentTextIndex = Math.floor(Math.random() * texts.length);
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingDelay = 40; // 打印速度
    let deletingDelay = 80;  // 删除速度
    let pauseDelay = 1000;   // 暂停时间

    function typeText(){
        const currentText = texts[currentTextIndex];
        if(!textTypingElement) return;
        
        if(isDeleting){
            textTypingElement.textContent = currentText.slice(0, currentCharIndex--);
            typingDelay = deletingDelay;
            
            if(currentCharIndex < 0){
                isDeleting = false;
                let newIndex;
                do {
                    newIndex = Math.floor(Math.random() * texts.length);
                } while (newIndex === currentTextIndex && texts.length > 1);
                currentTextIndex = newIndex;
                setTimeout(typeText, pauseDelay);
                return;
            }
        } else {
            textTypingElement.textContent = currentText.substring(0, currentCharIndex++);
            typingDelay = 80;
            
            if(currentCharIndex > currentText.length){
                isDeleting = true;
                currentCharIndex = currentText.length;
                setTimeout(typeText, pauseDelay);
                return;
            }
        }
        
        setTimeout(typeText, typingDelay);
    }
    
    // 开始打字效果
    typeText();
});