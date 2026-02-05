---
title: hexo-theme-wang:应该是最后一个大版本了
abbrlink: 38915
date: 2024-12-28 20:35:19+00:00
updated: "2025-07-04T18:44:32.349+08:00"
categories:
  - 自己的博客
tags:
  - 博客
  - 编程
  - 记录
  - 前端
  - 解决
---

![2024-12-28-201604](https://i.ibb.co/dJhV1Fk/2024-12-28-201604.webp)

我去这应该是最满意的一版了：）

[xingwangzhe/hexo-theme-wang: 一个简约的hexo主题](https://github.com/xingwangzhe/hexo-theme-wang)

<!--more-->

## 主题介绍

## hexo-theme-wang

一个基于hexo的简约的暗色主题
hexo-theme-wang

i18n:zh-CN,zh-TW,zh-HK,en

我的站点:[https://xingwangzhe.fun](https://xingwangzhe.fun)

## 在此感谢

[Copilot](https://github.com/features/copilot)提供的样式帮助
[hexo-theme-landscape](https://github.com/hexojs/hexo-theme-landscape)官方的hexo主题模板结构
[Mozila](https://developer.mozilla.org/zh-CN/)的文档
~~最不感谢改了三版的自己~~

## 如何使用

1. gitclone本仓库到你的hexo主题文件夹下

```bash
git clone https://github.com/xingwangzhe/hexo-theme-wang.git
```

或者使用npm安装到hexo的依赖中

```bash
npm install hexo-theme-wang
```

2. 在hexo更目录下的\_config.yml中更改使用主题

```yml
theme: hexo-theme-wang
```

3. 运行hexo s 查看效果

## 主题配置文件说明(示例)

```yml
## 主题配置文件，图片路径都是在主题文件夹下的source文件夹下
### 额外的<head>标签内插入内容，你可能会需要插入一些第三方的js库，例如统计代码等
head: '<script>
  console.log("Hello hexo-theme-wang");
  </script>'

## 头像配置
avatar:
  src: images/avatar.webp #头像路径
  isround: true #是否是圆形

## 导航栏菜单 用 || 隔开，前面是菜单名称，后面是图标名称，位置在source/images/menu_ico
menu:
  Home: / ||home
  Archives: /archives ||archives
  Categories: /categories || categories
  Tags: /tags || tags
  About: /about || about
  Links: /links || links
  RSS: /atom.xml || rss ##需要安装 hexo-generator-feed
  Travelling: https://www.travellings.cn/go.html || train

## 展示社交媒体链接 前面是名称，后面是图标名称 位置在source/images/social_links
social_links:
  Github: https://github.com/xingwangzhe || github
  Email: mailto:xingwangzhe@outloock.com || envelope

  # 需要安装hexo-generator-searchdb
search:
  enable: false # 是否启用搜索功能
  path: /search.xml # 添加前导斜杠，表示从网站根目录开始

## 时间是否显示秒
time:
  show_seconds: true

## Waline评论,需要设置serverURL，详情请访问Waline官网:https://waline.js.org
comments:
  enable: false # 是否启用评论功能
  serverURL: ""

## 友链,需要设置name，link，img，description
friend_links:
  - name: 姓王者
    link: https://xingwangzhe.fun/
    img: https://i.ibb.co/vLC0cft/202406212107148.jpg
    description: 记录学习生活的琐事，或技术文章
  - name:
    link:
    img:
    description:

## 底部链接,需要设置name，link，img
footer_links:
  - name: 开往-友链接力
    link: https://www.travellings.cn/go.html
    img: https://www.travellings.cn/assets/logo.gif
  - name: 阿里云支持
    link: https://www.aliyun.com/minisite/goods?userCode=lmvvqvl9
    img: https://i.ibb.co/h7XJkfm/LOGO.png
  - name: 大佬论坛
    link: https://www.dalao.net/
    img: https://www.dalao.net/img/dalao-svg.svg
  - name: BlogFinder
    link: https://bf.zzxworld.com/
    img: https://bf.zzxworld.com/images/logo-v2.png
  - name: 2024-10-29-133009
    link: https://storeweb.cn/
    img: https://i.ibb.co/tc0z0Y5/2024-10-29-133009.png
  - name: 空间穿梭-随机访问BlogsClub成员博客
    link: https://www.blogsclub.org/go
    img: https://www.blogsclub.org/images/shuttle_4.png

## 底部文字链接,需要设置name，link
footer_links_text:
  - name: 文字链接
    link:
```

## 最后，祝您使用愉快！

## ~~呕心沥血~~

还好有ai，在设计样式上避免了重复劳动，还顺便学了一些技巧，不过有些资料太过老旧，可能也是因为html标准十多年都没大更新了吧

折腾了这么长时间，也该歇歇了，过几天就到2025年了，我想，是时候该写年终总结了......
