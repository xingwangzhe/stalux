---
title: css-flex样式学习推荐
abbrlink: 7658
date: 2024-11-08 19:32:56
updated: 2025-07-04 18:44:32
categories:
    - 前端
tags:
    - 学习
    - 记录
    - 进步
    - 教程
    - CSS
---

_有趣的学习网站_

[![学习flex](https://i.ibb.co/c234mGP/2024-11-08-192755.png)](https://codingfantasy.com/games/flexboxadventure)

[Learn CSS, HTML and JavaScript by Playing Coding Games](https://codingfantasy.com/games/flexboxadventure)

<!--more-->

## `flex`:重要的布局格式

`flex`作为现代web中重要的css3模型，在布局排版上起到了重要作用，这个网站可以带你快速学习`flex`.

### 选择难度

![2024-11-08-195424](https://i.ibb.co/Bj1CvQ9/2024-11-08-195424.png)

可以选择easy,这样会有提示，适合初学者。

### 开始练习

![2024-11-08-195656](https://i.ibb.co/G7yzF3x/2024-11-08-195656.png)

有了提示，还算简单，如果你看不懂英文的话(我想你应该能看懂)，浏览器一般都会有翻译的。

## Flexbox 属性及参数表格

### 容器属性（应用于 flex 容器）

| 属性              | 参数                                                                                                 | 默认值       | 描述                           |
| ----------------- | ---------------------------------------------------------------------------------------------------- | ------------ | ------------------------------ |
| `display`         | `flex` / `inline-flex`                                                                               | -            | 定义容器为 flex 容器。         |
| `flex-direction`  | `row` / `row-reverse` / `column` / `column-reverse`                                                  | `row`        | 定义主轴的方向。               |
| `flex-wrap`       | `nowrap` / `wrap` / `wrap-reverse`                                                                   | `nowrap`     | 定义项目是否换行。             |
| `justify-content` | `flex-start` / `flex-end` / `center` / `space-between` / `space-around` / `space-evenly` / `stretch` | `flex-start` | 定义项目在主轴上的对齐方式。   |
| `align-items`     | `flex-start` / `flex-end` / `center` / `baseline` / `stretch`                                        | `stretch`    | 定义项目在交叉轴上的对齐方式。 |
| `align-content`   | `flex-start` / `flex-end` / `center` / `space-between` / `space-around` / `stretch`                  | `stretch`    | 定义多行项目在交叉轴上的分布。 |

### 项目属性（应用于 flex 项目）

| 属性          | 参数                                                                   | 默认值 | 描述                                                        |
| ------------- | ---------------------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| `order`       | 整数（默认为 0）                                                       | `0`    | 定义项目的顺序。数值越小，排列越靠前。                      |
| `flex-grow`   | 无单位的数（默认为 0）                                                 | `0`    | 定义项目放大的比例。                                        |
| `flex-shrink` | 无单位的数（默认为 1）                                                 | `1`    | 定义项目缩小的比例。                                        |
| `flex-basis`  | `auto` / `content` / 长度值                                            | `auto` | 定义项目在主轴上的初始大小。                                |
| `flex`        | `flex-grow` `flex-shrink` `flex-basis` 的简写形式                      | -      | 定义项目的放大、缩小和基础大小。                            |
| `align-self`  | `auto` / `flex-start` / `flex-end` / `center` / `baseline` / `stretch` | `auto` | 覆盖容器的 `align-items` 属性，单独定义单个项目的对齐方式。 |
