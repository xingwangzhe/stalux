# JS规范

ES6格式,**禁止**使用()包裹,这是浪费!


# css

```astro
---
// 1. 将 './style.module.css' 转换为类名唯一、有范围的值。
// 2. 返回对象，并将原始类名映射到其最终范围值的。
import styles from './style.module.css';
// This example uses JSX, but you can use CSS Modules with any framework.
return <div className={styles.error}>Your Error Message</div>;
```

Astro 支持使用 [name].module.css 命名约定的 CSS 模块。像导入任何 CSS 文件一样，导入 CSS 会应用到页面。然而，CSS 模块默认导出特殊的 styles 对象，并将你的原始类名映射到唯一的标识符。

CSS 模块帮助你在前端强制执行组件样式隔离，并生成唯一的样式表类名。因此,动态dom无法同步hash,所以不要写入到这个css里面

