---
name: astro-css-modules
description: 默认应用css时,优先使用模块化的方式导入css
allowed-tools: Bash(bun:*) Read
---

# css导入规则


## 对于静态dom 

```ts
// 1. 将 './style.module.css' 转换为类名唯一、有范围的值。
// 2. 返回对象，并将原始类名映射到其最终范围值的。
import styles from './style.module.css';

// This example uses JSX, but you can use CSS Modules with any framework.
return <div className={styles.error}>Your Error Message</div>;
```

Astro 支持使用 `[name].module.css` 命名约定的 CSS 模块。像导入任何 CSS 文件一样，导入 CSS 会应用到页面。然而，CSS 模块默认导出特殊的 styles 对象，并将你的原始类名映射到唯一的标识符。

CSS 模块帮助你在前端强制执行组件样式隔离，并生成唯一的样式表类名。

## 对于动态dom


由于动态dom不会在编译期与导入的css模块同时hash,所以不能在`[name].module.css`定义动态dom的css,必须在动态dom所在的页面的`<style>`标签里使用