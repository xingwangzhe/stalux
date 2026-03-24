---
title: 重构:hexo-theme-wang
abbrlink: 42609
date: 2024-12-09 19:08:45
updated: 2025-07-04 18:44:32
categories:
    - 开发
tags:
    - 记录
    - Vue3
    - 前端
    - CSS
    - HTML
    - hexo
---

![2024-12-09-190959](https://i.ibb.co/YjV3ym8/2024-12-09-190959.png)

诚如标题所言，我又重构了

<!--more-->

## 我为什么重构

> 因为之前写的一堆💩💩，改起来太麻烦了，尤其是css,真不是任何意义上的便于识别的结构：（
> 想试试vue，所以开始重构：）

## 引入vue+element-plus+tailwind CSS

![2024-12-09-191432](https://i.ibb.co/g7jX3XL/2024-12-09-191432.png)

### 使用element

快速生成需要的页面组件，美观且易修改，而且我最看重的是它的响应式设计，之前我自己手写的时候一团糟，有了这个就可以避免很多麻烦

#### 使用tailwind css

主要是方便写css,直接在class里面写，确实方便了不少，省去了很多css的麻烦

### vue

呃呃，其实没用上多少，主要是为了渲染element ui和tailwind才使用vue。
但说实话，我完全可以使用vitepress对吧，不过我还是七扭八歪地结合了hexo+vue

> 众所周知，hexo站长特有的爱折腾：）

也许寒假我可以精修一下主题，或者也搞搞vitepress玩玩😋
