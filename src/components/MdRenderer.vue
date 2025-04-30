<template>
  <div class="md-renderer">
    <MdPreview 
      :modelValue="content" 
      :showCodeRowNumber="true" 
      codeTheme="atom"
      :noMermaid="false"
      :noKatex="false" 
      :customClass="'custom-md-preview'"
    />
  </div>
</template>

<script setup lang="ts">
import { MdPreview } from 'md-editor-v3';
import 'md-editor-v3/lib/preview.css';

const props = defineProps<{
  content: string;
}>();
</script>

<style lang="stylus">
// 主容器样式
.md-renderer {
  width: 100%;
  
  // 自定义预览区域样式
  .custom-md-preview {
    font-size: 16px;
    line-height: 1.8;
  }
  
  // 移除预设样式和边框
  .md-editor {
    border: none;
    background: transparent;
    box-shadow: none;
    
    // 修改暗色主题为透明
    &.md-editor-dark {
      background: transparent;
    }
    
    // 预览容器调整
    .md-editor-preview-wrapper {
      padding: 0;
      
      // 预览区样式
      .md-editor-preview {
        background: transparent;
        color: #fff;
        font-family: inherit;
        padding: 0;
      }
    }
  }
  
  // 标题样式
  h1, h2, h3, h4, h5, h6 {
    color: #fff;
    margin: 1.5em 0 0.5em;
    font-weight: 600;
    line-height: 1.25;
    border: none;
  }
  
  h1 {
    font-size: 2.2em;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    padding-bottom: 0.3em;
    margin-top: 0;
  }
  
  h2 {
    font-size: 1.8em;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    padding-bottom: 0.3em;
  }
  
  h3 {
    font-size: 1.5em;
  }
  
  h4 {
    font-size: 1.25em;
  }
  
  h5 {
    font-size: 1em;
  }
  
  h6 {
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.7);
  }
  
  // 段落样式
  p {
    margin-bottom: 1.2em;
    line-height: 1.8;
  }
  
  // 引用块样式
  blockquote {
    margin: 1.2em 0;
    padding: 0.8em 1.2em;
    color: rgba(255, 255, 255, 0.8);
    border-left: 4px solid rgba(255, 255, 255, 0.4);
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 0 4px 4px 0;
    
    p {
      margin: 0.5em 0;
      
      &:first-child {
        margin-top: 0;
      }
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  
  // 列表样式
  ul, ol {
    margin: 1.2em 0;
    padding-left: 2em;
    
    li {
      margin-bottom: 0.5em;
      
      p {
        margin: 0.3em 0;
      }
    }
  }
  
  ul {
    list-style-type: disc;
    
    ul {
      list-style-type: circle;
      
      ul {
        list-style-type: square;
      }
    }
  }
  
  ol {
    list-style-type: decimal;
    
    ol {
      list-style-type: lower-alpha;
      
      ol {
        list-style-type: lower-roman;
      }
    }
  }
  
  // 代码块样式 - 特别优化
  .md-editor-code {
    margin: 1.5em 0;
    border-radius: 8px;
    overflow: hidden;
    background: #2a2a2a;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.08);
    
    // 代码头部
    .md-editor-code-head {
      background: #333;
      padding: 8px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      // 装饰点
      .md-editor-code-flag {
        display: flex;
        gap: 6px;
        
        span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          
          &:nth-child(1) {
            background-color: #ff5f56;
          }
          
          &:nth-child(2) {
            background-color: #ffbd2e;
          }
          
          &:nth-child(3) {
            background-color: #27c93f;
          }
        }
      }
      
      // 动作按钮
      .md-editor-code-action {
        display: flex;
        align-items: center;
        gap: 8px;
        
        // 语言标签
        .md-editor-code-lang {
          background-color: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.8em;
          letter-spacing: 0.5px;
          text-transform: lowercase;
        }
        
        // 复制按钮
        .md-editor-copy-button {
          background-color: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.7);
          padding: 2px 10px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.8em;
          
          &:hover {
            background-color: rgba(255, 255, 255, 0.1);
            color: #fff;
            border-color: rgba(255, 255, 255, 0.3);
          }
        }
        
        // 折叠提示
        .md-editor-collapse-tips {
          opacity: 0.6;
          cursor: pointer;
          
          &:hover {
            opacity: 1;
          }
        }
      }
    }
    
    // 代码内容
    pre {
      background: transparent;
      margin: 0;
      padding: 1.2em;
      overflow: auto;
      
      &::-webkit-scrollbar {
        height: 8px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: #555;
        border-radius: 4px;
      }
      
      &::-webkit-scrollbar-track {
        background: #333;
      }
      
      code {
        font-family: "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        font-size: 0.9em;
        line-height: 1.5;
        tab-size: 2;
        
        .md-editor-code-block {
          display: inline-block;
          min-width: 100%;
          
          .hljs-keyword, .hljs-built_in {
            color: #ff79c6;
          }
          
          .hljs-string {
            color: #f1fa8c;
          }
          
          .hljs-title, .hljs-title.function_ {
            color: #50fa7b;
          }
          
          .hljs-comment {
            color: #6272a4;
          }
          
          .hljs-number {
            color: #bd93f9;
          }
        }
      }
    }
  }
  
  // 内联代码样式
  :not(pre) > code {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    padding: 0.2em 0.4em;
    font-size: 0.9em;
    margin: 0 0.2em;
    font-family: "JetBrains Mono", monospace;
    color: #ffb86c;
  }
  
  // 表格样式
  table {
    width: 100%;
    margin: 1.5em 0;
    border-collapse: separate;
    border-spacing: 0;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
    
    th, td {
      border: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.8em 1em;
      text-align: left;
    }
    
    th {
      background-color: rgba(255, 255, 255, 0.1);
      font-weight: bold;
      border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    }
    
    tr {
      &:last-child {
        td {
          border-bottom: none;
        }
      }
      
      &:nth-child(2n) {
        background-color: rgba(255, 255, 255, 0.03);
      }
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }
    }
  }
  
  // 链接样式
  a {
    color: #8be9fd;
    text-decoration: none;
    transition: all 0.2s;
    border-bottom: 1px dotted rgba(139, 233, 253, 0.4);
    
    &:hover {
      color: #50fa7b;
      border-bottom-color: rgba(80, 250, 123, 0.4);
    }
  }
  
  // 图片样式
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 1.5em auto;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    
    &.medium-zoom-image {
      transition: all 0.3s ease;
      cursor: zoom-in;
      
      &:hover {
        transform: scale(1.02);
      }
    }
  }
  
  // 水平线样式
  hr {
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    border: none;
    margin: 2em 0;
  }
  
  // 强调和加粗样式
  em {
    font-style: italic;
    color: #bd93f9;
  }
  
  strong {
    font-weight: bold;
    color: #ff79c6;
  }
}

// 响应式调整
@media (max-width: 768px) {
  .md-renderer {
    .custom-md-preview {
      font-size: 14px;
    }
    
    h1 {
      font-size: 1.8em;
    }
    
    h2 {
      font-size: 1.6em;
    }
    
    h3 {
      font-size: 1.4em;
    }
    
    blockquote {
      padding: 0.5em 1em;
    }
    
    .md-editor-code {
      .md-editor-code-head {
        padding: 6px 8px;
        
        .md-editor-code-flag {
          span {
            width: 10px;
            height: 10px;
          }
        }
      }
      
      pre {
        padding: 1em;
      }
    }
  }
}

@media (max-width: 480px) {
  .md-renderer {
    .custom-md-preview {
      font-size: 13px;
    }
    
    h1 {
      font-size: 1.6em;
    }
    
    h2 {
      font-size: 1.4em;
    }
    
    h3 {
      font-size: 1.2em;
    }
    
    ul, ol {
      padding-left: 1.5em;
    }
    
    blockquote {
      padding: 0.5em 0.8em;
    }
    
    .md-editor-code {
      margin: 1.2em 0;
      
      .md-editor-code-head {
        padding: 4px 6px;
        
        .md-editor-code-flag {
          span {
            width: 8px;
            height: 8px;
          }
        }
        
        .md-editor-code-action {
          .md-editor-code-lang {
            padding: 1px 6px;
          }
          
          .md-editor-copy-button {
            padding: 1px 8px;
          }
        }
      }
      
      pre {
        padding: 0.8em;
      }
    }
  }
}
</style>