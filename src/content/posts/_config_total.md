---
title: 总配置概览
tags:
    - 配置
    - 总览
categories:
    - 主题配置
date: 2025-5-10T10:00:00+08:00
---
```ts
console.log('欢迎使用Stalux主题博客')
```
## 总配置使用

### 文章放在哪?

当然是放在`src>content>posts`下
关于页面放在`src>content>about`下
默认已经有了这些文件,你可以看这些文件的frontmatter配置格式,当然,更多**内容合集**的frontmatter配置可以在`src>content.config.ts`下找到,在此不做赘述

## 默认配置与自定义配置

下面的是默认配置,这是当前站点未启用自定义配置时的默认配置
`src>consts.ts`
> 这个默认配置不要修改,只是作为对照,方便维护查看使用,更关键的是,尽管我定义了一大堆变量,但实际上能用的其实很少

下面的是自定义配置,通过一个变量`useConfig`作为开关来决定是否使用
`src>_config.ts`

接下来,将要分别介绍站点基本信息,导航栏,页脚,友链等设置



