---
title: 总配置概览
tags:
    - 配置
categories:
    - 主题配置
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

下面的是默认配置,这是当前站点在没有自定义配置或者自定义配置某些选项为空或找不到时采取默认配置
`src>consts.ts`
> 这个默认配置不要修改,只是作为对照,方便维护查看使用,

你可以在下面的路径下创建`_config.ts`文件来实现自定义配置,当然同级目录下已经存在了`_config.ts.template`文件,方便修改
`src>_config.ts`


### 站点基本信息

### 