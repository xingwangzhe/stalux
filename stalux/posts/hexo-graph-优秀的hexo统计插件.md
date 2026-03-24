---
title: hexo-graph:优秀的hexo统计插件
abbrlink: 55581
date: "2024-12-14 10:11:05"
updated: "2025-07-04 18:44:32"
categories:
    - hexo
tags:
    - 博客
    - 记录
    - 教程
    - hexo
    - Layout
    - 统计
    - 插件
---

hexo-graph，一个基于echarts，集成博客热力图，博客月份统计图，分类统计图，标签统计图的多元化插件。

仓库地址: [https://github.com/codepzj/hexo-graph](https://github.com/codepzj/hexo-graph)

效果:[https://haohanxinghe.com/social/stats/](https://haohanxinghe.com/social/stats/)

<!--more-->

## 喜欢的话别忘了点个Star⭐

## 安装依赖

```
pnpm i moment # 使用hexo-graph先安装相关依赖
pnpm i hexo-graph
```

## 可选设置

在根目录的`config.yml`中配置: **light/dark 主题配置**

```xml
hexo_graph:
theme: "light" #light/dark 不设置或不填默认是light
```

## 开始使用

以下皆为`<div>`,可以写在md里面或者通过更改主题文件来硬插入

### 热力图

```html
<div
    id="heatmapChart"
    style="width: 100%; height: 200px; margin: 0 auto; border-radius: 10px; padding: 10px;box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);"
></div>
```

<div
  id="heatmapChart"
  style="width: 100%; height: 200px; margin: 0 auto; border-radius: 10px; padding: 10px;box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);"
></div>

### 月份统计图

```html
<div
    id="monthlyChart"
    style="width: 100%; height: 350px; margin: 0 auto; border-radius: 10px; padding: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);"
></div>
```

<div
  id="monthlyChart"
  style="width: 100%; height: 350px; margin: 0 auto; border-radius: 10px; padding: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);"
></div>

### 标签统计图

```
<div
  id="tagsChart"
  style="width: 100%; height: 400px; margin: 0 auto; border-radius: 10px; padding: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);"
></div>
```

<div
  id="tagsChart"
  style="width: 100%; height: 400px; margin: 0 auto; border-radius: 10px; padding: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);"
></div>

### 分类统计图

```
<div
  id="categoriesChart"
  style="width: 100%; height: 350px; margin: 0 auto; border-radius: 10px; padding: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);"
></div>
```

<div
  id="categoriesChart"
  style="width: 100%; height: 350px; margin: 0 auto; border-radius: 10px; padding: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);"
></div>

## 喜欢就别忘了点个Star⭐
