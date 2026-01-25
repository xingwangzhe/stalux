---
title: 自定义head与header导航
tags: 
    - 配置
    - 自定义
categories: 
    - 主题配置
    - 布局定制
date: 2025-5-10T12:00:00+08:00
updated: 2025-5-10T12:00:00+08:00
abbrlink: 0035a0ee
---

## head的自定义

在Stalux主题中，你可以通过配置文件自定义`head`标签内容，这允许你添加自定义脚本、样式表、元标签或其他HTML元素到页面的`<head>`部分。

### 基本配置

```yaml title="_config.yml"
# 自定义head
head: |
  <script>console.log("你好世界")</script>
```

是的，这是自定义head标签的配置，本质上是**硬插入**HTML内容到页面的head部分。
>你最好知道你插入内容的性质，尤其是`script`标签，即使是这种**纯静态站点**也要注意**安全与风险防范**

### 常见用途

你可以使用head自定义功能来实现以下常见需求：

1. 添加Google Analytics或百度统计等分析工具
2. 插入自定义CSS样式
3. 添加网站验证标签
4. 设置网站图标(favicon)
5. 加载第三方字体或CDN资源

### 实际示例

```yaml title="_config.yml"
# 自定义head
head: |
  <!-- 网站图标 -->
  <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">

  <!-- 自定义样式 -->
  <style>
    :root {
       --theme-color: #42b883;
    }
  </style>

  <!-- 分析工具 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  </script>
```

## header的自定义

导航栏（header）是网站的重要组成部分，Stalux主题提供了灵活的配置选项，让你可以根据个人需求定制导航菜单。

### 基本配置

```yaml title="_config.yml"
# 站点导航配置
nav:
  - title: "首页"
    path: "/"
    icon: "home"
  - title: "归档"
    path: "/archives"
    icon: "archive"
  - title: "分类"
    path: "/categories"
    icon: "folder"
  - title: "标签"
    path: "/tags"
    icon: "tag"
  - title: "友链"
    path: "/links"
    icon: "link"
  - title: "关于"
    path: "/about"
    icon: "user"
```

这是导航栏的配置，默认最后一个是搜索，不用刻意设置，`path`选项可以填**外链**，icon图标名字来自于网站[feathericons](https://feathericons.com/)的开源组件图标。

### 外部链接配置

如果你想在导航栏添加外部链接，可以这样配置：

```yaml title="_config.yml"
# 站点导航配置
nav:
  - title: "首页"
    path: "/"
    icon: "home"
  - title: "GitHub"
    path: "https://github.com/yourusername"
    icon: "github"
```

