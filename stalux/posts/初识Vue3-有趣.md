---
title: 初识Vue3,有趣
abbrlink: 218fcad3
date: "2024-09-27 22:19:55"
updated: "2024-09-27 22:19:53"
categories:
    - 前端
tags:
    - Vue3
    - 前端
    - HTML
    - CSS
    - Typescript
    - 记录
    - 教程
---

_初识前端工程_

![Vue3](https://cn.vuejs.org/logo.svg)

<!--more-->

## 基础扎实

老三件：`html` `css` `javascript`虽然不敢说熟练吧，但也算是基本掌握，但是我想如果构建前端页面的话，写这些似乎有点太过冗杂，看来前端工程化是必要的！

## Vue3是什么

正如它官网介绍的：

> 易学易用，性能出色，适用场景丰富的 Web 前端框架。

Vue 3是一个重构的Vue.js版本，它带来了更快的性能、更小的体积、更好的TypeScript支持以及全新的Composition API，这些改进让Vue开发更加高效、灵活和可维护。Vue 3通过Proxy实现了更强大的响应式系统，支持更全面的数据监测，并引入了Fragment、Teleport和Suspense等新组件，以及Tree-shaking等优化手段，进一步提升了用户体验和开发效率。同时，Vue 3的生态系统也在不断发展壮大，为开发者提供了更多选择和可能性。

## 相比于传统开发

### 性能提升

更快的渲染速度：Vue 3通过优化虚拟DOM算法、响应式系统以及编译器，实现了更快的渲染速度。其中，Vue 3使用了基于Proxy的响应式系统，相比Vue 2的Object.defineProperty，Proxy的代理模式无需深度遍历整个对象，因此性能更高。此外，Vue 3还引入了静态提升（Static Tree Hoisting）和基于Proxy的观察者（Proxy-based Observer），进一步提升了渲染性能。
更小的体积：Vue 3通过Tree-shaking技术和优化打包方式，使得包体积更小，加载速度更快。这有助于减少前端页面的加载时间，提升用户体验。

### 全新的Composition API

更灵活的代码组织方式：Vue 3引入了Composition API，允许开发者通过函数的方式组织代码，而不是像Vue 2那样通过选项式API来组织。这种方式使得代码更加模块化、可重用和可维护。
更清晰的逻辑复用：Composition API中的setup函数允许开发者将组件的逻辑组织在一起，并通过ref、reactive等函数创建响应式数据，通过computed、watch等函数实现计算属性和侦听器，从而实现了更清晰的逻辑复用。

### 更好的TypeScript支持

原生支持TypeScript：Vue 3原生支持TypeScript，这使得开发者可以更方便地编写类型安全的代码，减少运行时错误，并提高开发效率。同时，Vue 3也提供了更丰富的TypeScript类型定义和类型推断功能，进一步提升了TypeScript的使用体验。

### 生态系统的发展

丰富的第三方库和工具：随着Vue 3的发布和普及，其生态系统也在不断发展壮大。现在已经有大量的第三方库和工具支持Vue 3，这为开发者提供了更多的选择和可能性。

### 改进的开发体验

更简洁的语法：Vue 3的语法相比Vue 2更加简洁明了，去除了一些不常用的功能，使得代码更加易于阅读和维护。
更好的错误处理和调试：Vue 3提供了更强大的错误处理和调试功能，使得开发者可以更快地定位和解决问题。
综上所述，Vue3开发相较于传统前端开发在性能、API设计、TypeScript支持、生态系统以及开发体验等方面都展现出了显著的区别和优势。这些改进使得Vue 3成为构建高性能、高效、可维护的Web应用的强大工具。

### 我自己的小实现

看b站[尚硅谷Vue3入门到实战，最新版vue3+TypeScript前端开发教程](https://www.bilibili.com/video/BV1Za4y1r7KE?p=1)动手实现了一下简单的示例，感觉很有趣，等我再熟悉熟悉，看看能不能做个小项目：）
