---
title: 国产开源的文档转换器:MinerU
abbrlink: 64756
date: "2025-03-27 19:11:43"
updated: "2025-07-04 18:44:32"
desc: MinerU是由OpenDataLab团队打造的大模型时代的文档提取/转换神器
categories:
    - 推荐
tags:
    - 记录
    - github
---

## 简介

[MinerU](https://mineru.net/)是由[OpenDataLab](https://opendatalab.com/aboutUs)团队打造的大模型时代的文档提取/转换神器

支持PDF、Word、PPT等多种文档的智能解析，可用于机器学习、大模型语料生产、RAG等场景..

<!--more-->

## 特点.

- 多语种支持
- 多类型支持
- 导出格式为json markdown
- 客户端无需登录
- 开源免费
- 真国产(上海人工智能实验室)

## 使用效果

我用了一个很长的pdf文档来试了一下,解析的效果很好

![2025-03-27-192249](https://i.ibb.co/5WGYFBS3/2025-03-27-192249.png)

渲染出来的markdown效果很好,但是某些公式识别的不够准确

![2025-03-27-192359](https://i.ibb.co/GGHhY81/2025-03-27-192359.png)

一些复杂图标直接改成图片引用进行处理

转化为markdown方便编辑,转化为json方便数据处理

不过在转换成markdown中.标题都是一级标题,没有层次(这可能是pdf标题格式的问题?),导致我尝试在web渲染markdown时锚点全是h1,seo优化极差 : (

## 总结

总体来说效果还是不错的,未来应该会推出更多的格式转换

推荐大家试一试,有硬件条件的可以本地部署一个玩玩
