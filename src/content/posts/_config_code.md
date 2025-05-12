---
title: 代码显示配置
tags: 
    - 配置
    - 代码高亮
    - 代码框
categories:
    - 主题配置
date: 2025-5-10T11:30:00+08:00
updated: 2025-5-10T11:30:00+08:00
abbrlink: 55a885fa
---

# 代码显示配置

Stalux主题使用[Expressive Code](https://expressive-code.com/)提供强大的代码显示功能，包括语法高亮、编辑器/终端框架和自动换行等功能。本文将介绍如何配置和使用这些功能。

## 语法高亮

Expressive Code使用与VS Code相同的Shiki引擎提供超过100种语言的准确语法高亮。

### 基本使用

在Markdown中使用代码块时，只需在开头的代码围栏中指定语言标识符即可获得语法高亮：

```js
console.log('这段代码会被语法高亮！');
```

### 支持的语言

默认情况下支持超过100种语言，包括JavaScript、TypeScript、HTML、CSS、Astro、Markdown等。您可以在配置中添加更多语言。

### ANSI转义序列

Expressive Code支持渲染ANSI转义序列，这对于显示格式化的终端输出非常有用。

要使用此功能，请将代码块的语言标识符设置为`ansi`：

```ansi
[1;4m标准ANSI颜色:[0m
- 前景色: [30m黑色 [31m红色 [32m绿色 [33m黄色 [34m蓝色 [35m洋红 [36m青色 [37m白色 [0m
- 背景色: [40m黑色 [41m红色 [42m绿色 [43m黄色 [44m蓝色 [45m洋红 [46m青色 [47m白色 [0m
```

## 编辑器和终端框架

Expressive Code可以在代码块周围渲染框架，使其看起来像代码编辑器或终端窗口。

### 代码编辑器框架

要让代码块看起来像VS Code这样的编辑器窗口，您需要提供一个能在打开的文件标签中显示的文件名。

您可以在开头的代码围栏中设置`title`属性为文件名，或在代码的前几行添加文件名注释：

```js title="my-test-file.js"
console.log('使用title属性的示例');
```

```html
<!-- src/content/index.html -->
<div>使用文件名注释的示例</div>
```

### 终端框架

当遇到通常用于终端会话或shell脚本的语言标识符（如`bash`、`sh`、`powershell`等）的代码块时，Expressive Code会执行额外检查以确定要使用的框架类型：

```bash
echo "这个终端框架没有标题"
```

```powershell title="PowerShell 终端示例"
Write-Output "这个有标题！"
```

### 覆盖框架类型

如果您想覆盖某些代码块的自动框架类型检测，可以在开头的代码围栏中添加`frame="..."`属性。

支持的值为`code`、`terminal`、`none`和`auto`。默认值为`auto`。

```sh frame="none"
echo "看，没有框架！"
```

```ps frame="code" title="PowerShell Profile.ps1"
# 如果不覆盖，这将是一个终端框架
function Watch-Tail { Get-Content -Tail 20 -Wait $args }
New-Alias tail Watch-Tail
```

## 自动换行

当代码块包含长行时，启用自动换行可以使代码保持在容器范围内，避免水平滚动。

### 为单个代码块配置自动换行

您可以使用代码块元信息中的`wrap`布尔属性为单个代码块启用或禁用自动换行：

```js wrap
// 启用自动换行的示例
function getLongString() {
  return '这是一个非常长的字符串，如果容器宽度不是特别大，它很可能无法适应可用空间'
}
```

```js wrap=false
// 禁用自动换行的示例
function getLongString() {
  return '这是一个非常长的字符串，如果容器宽度不是特别大，它很可能无法适应可用空间'
}
```

### 配置换行行的缩进

#### 缩进保留

默认情况下，长行的换行部分将与其行的缩进级别对齐，使换行代码显示在同一列。这增加了换行代码的可读性，对缩进有重要意义的语言（如Python）尤其有用。

您可以使用代码块元信息中的`preserveIndent`布尔属性禁用默认行为：

```js wrap preserveIndent
// 使用preserveIndent的示例（默认启用）
function getLongString() {
  return '这是一个非常长的字符串，如果容器宽度不是特别大，它很可能无法适应可用空间'
}
```

```js wrap preserveIndent=false
// 使用preserveIndent=false的示例
function getLongString() {
  return '这是一个非常长的字符串，如果容器宽度不是特别大，它很可能无法适应可用空间'
}
```

#### 悬挂缩进

您还可以定义换行行应缩进的列数：

```js wrap hangingIndent=2
// 使用hangingIndent=2的示例
function getLongString() {
  return '这是一个非常长的字符串，如果容器宽度不是特别大，它很可能无法适应可用空间'
}
function heavilyIndentedCode() {
          return '这个长行已经以大量缩进开始，由于hangingIndent=2，其换行部分将再缩进2列'
}
```

## 全局配置

您可以在`astro.config.mjs`中配置Expressive Code的默认设置：

```js
import { defineConfig } from 'astro/config'
import astroExpressiveCode from 'astro-expressive-code'

export default defineConfig({
  integrations: [
    astroExpressiveCode({
      // 配置语法高亮
      themes: ['dracula', 'solarized-light'],
      shiki: {
        // 可以在这里传递其他插件选项
      },
      
      // 配置框架
      frames: {
        // 示例：隐藏"复制到剪贴板"按钮
        showCopyToClipboardButton: false,
      },
      
      // 配置默认属性
      defaultProps: {
        // 默认启用自动换行
        wrap: true,
        // 为终端语言禁用换行行缩进
        overridesByLang: {
          'bash,ps,sh': { preserveIndent: false },
        },
      },
      
      // 覆盖默认样式
      styleOverrides: {
        frames: {
          shadowColor: '#124',
        },
      },
    }),
  ],
})
```

更多配置选项和高级功能，请参考[Expressive Code官方文档](https://expressive-code.com/)。