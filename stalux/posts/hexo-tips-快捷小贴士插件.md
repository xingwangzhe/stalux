---
title: hexo-tips:快捷小贴士插件
abbrlink: 8367
date: "2025-01-03 22:59:59"
updated: "2025-07-04 18:44:32"
categories:
    - 开发
tags:
    - 记录
    - hexo
    - 进步
---

我开发了一个快捷小贴士插件

> 样式当然都是[Copilot](https://github.com/features/copilot)帮我写的，我自己才懒得设计颜色：）

github仓库:[xingwangzhe/hexo-tips: Use tooltips more conveniently in hexo](https://github.com/xingwangzhe/hexo-tips)
npm仓库:[hexo-tips](https://www.npmjs.com/package/hexo-tips)

<!--more-->

## npm安装

> npm i hexo-tips

### 配置config

```yml
hexo_tips:
    warning:
        icon: "⚠"
        style:
            border: "#ffb100"
            light:
                background: "#fff8e6"
            dark:
                background: "#3d371f"
    danger:
        icon: "⛔"
        style:
            border: "#ff4545"
            light:
                background: "#ffeded"
            dark:
                background: "#3d2222"
    tip:
        icon: "💡"
        style:
            border: "#409eff"
            light:
                background: "#e6f4ff"
            dark:
                background: "#1f2f3d"
    mention:
        icon: "💬"
        style:
            border: "#b45fff"
            light:
                background: "#f3e6ff"
            dark:
                background: "#2f1f3d"
    recommend:
        icon: "👍"
        style:
            border: "#67c23a"
            light:
                background: "#e6ffe6"
            dark:
                background: "#1f3d1f"
    note:
        icon: "📝"
        style:
            border: "#9e9e9e"
            light:
                background: "#f5f5f5"
            dark:
                background: "#363636"
    info:
        icon: "ℹ️"
        style:
            border: "#03a9f4"
            light:
                background: "#e3f2fd"
            dark:
                background: "#1f313d"
    success:
        icon: "✅"
        style:
            border: "#4caf50"
            light:
                background: "#e8f5e9"
            dark:
                background: "#1f3d24"
    error:
        icon: "❌"
        style:
            border: "#f44336"
            light:
                background: "#ffebee"
            dark:
                background: "#3d1f22"
    bug:
        icon: "🐛"
        style:
            border: "#e91e63"
            light:
                background: "#fce4ec"
            dark:
                background: "#3d1f2a"
    todo:
        icon: "📋"
        style:
            border: "#9c27b0"
            light:
                background: "#f3e5f5"
            dark:
                background: "#2f1f3d"
    example:
        icon: "🔍"
        style:
            border: "#ff9800"
            light:
                background: "#fff3e0"
            dark:
                background: "#3d311f"
    quote:
        icon: "💭"
        style:
            border: "#607d8b"
            light:
                background: "#eceff1"
            dark:
                background: "#1f292d"
    link:
        icon: "🔗"
        style:
            border: "#3f51b5"
            light:
                background: "#e8eaf6"
            dark:
                background: "#1f2137"
    code:
        icon: "💻"
        style:
            border: "#616161"
            light:
                background: "#fafafa"
            dark:
                background: "#363636"
    update:
        icon: "🔄"
        style:
            border: "#009688"
            light:
                background: "#e0f2f1"
            dark:
                background: "#1f3734"
    star:
        icon: "⭐"
        style:
            border: "#ffd700"
            light:
                background: "#fffde7"
            dark:
                background: "#3d3a1f"
    time:
        icon: "⌛"
        style:
            border: "#795548"
            light:
                background: "#efebe9"
            dark:
                background: "#332824"
```

使用方法

通用格式

```
:::name

content

:::
```

比如说

```
:::warning

这是一个警告提示

:::
```

当然，内部格式支持markdown格式

### 样式展示

:::warning
这是一个警告提示

- 用于提醒用户需要注意的内容
- 适合展示警告信息
  :::

:::danger
这是一个危险提示

> 用于展示危险操作或重要警告
> :::

:::tip
这是一个小贴士

1. 用于展示提示信息
2. 可以包含有用的建议
   :::

:::mention
这是一个提及框
引用或参考其他内容时使用
:::

:::recommend
这是一个推荐框
推荐有价值的内容或最佳实践
:::

:::note
这是一个笔记框
记录重要笔记或要点
:::

:::info
这是一个信息框
展示一般性的信息
:::

:::success
这是一个成功提示
表示操作成功或完成
:::

:::error
这是一个错误提示
展示错误信息或失败原因
:::

:::bug
这是一个Bug提示
用于标记已知问题或Bug
:::

:::todo
这是一个待办事项

- [ ] 第一个任务
- [ ] 第二个任务
      :::

:::example
这是一个示例框

```javascript
console.log("示例代码");
```

:::

:::quote
这是一个引用框

> 引用他人的观点或内容
> :::

:::link
这是一个链接框
[Hexo官网](https://hexo.io)
:::

:::code
这是一个代码框
使用等宽字体展示代码
:::

:::update
这是一个更新提示
最后更新：2024-01-03
:::

:::star
这是一个重点提示
特别重要的内容
:::

:::time
这是一个时间提示
预计耗时：30分钟
:::
