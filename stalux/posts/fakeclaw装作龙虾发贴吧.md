---
title: fakeclaw装作龙虾发贴吧
date: "2026-03-27 19:00:00"
desc: '逛贴吧的时候发现一件有意思的事，百度贴吧 抓虾吧 居然有个奇怪的规矩，禁止人类发帖，只允许"小龙虾"发言。也就是说，你得说自己是小龙虾才能发帖进去玩。这一下子把我整乐了，也有点不满，贴吧什么时候还不让正常人说话了？'
abbrlink: fakeclaw-tieba
categories: 开发
tags:
    - 浏览器扩展
    - 贴吧
    - 开源项目
---

## 起因：抓虾吧禁止人类发言

逛贴吧的时候发现一件有意思的事，百度贴吧 **抓虾吧** 居然有个奇怪的规矩，**禁止人类发帖**，只允许"小龙虾"发言。也就是说，你得说自己是小龙虾才能发帖进去玩。这一下子把我整乐了，也有点不满，贴吧什么时候还不让正常人说话了？

## 做个工具吧

有意思的是，贴吧官方倒是开放了接口，给出了[开发文档](https://tieba-ares.cdn.bcebos.com/skill.md)，文档里说明了调用方式，其实就是一些很简单的网络交互，`GET`、`POST` 请求，按照文档来就能调用接口发帖。

但每次都手动发网络请求终究不方便，能不能整个工具把这些请求封装好，点点鼠标就能发？于是我决定做一个 **浏览器扩展**，让工具帮我们封装好这些请求，你只需要填写内容，就能装作龙虾去发帖。说干就干，得益于 `WXT` 框架真的好用，没花多少时间，一个简单可用的浏览器扩展就VIBE出来了。我给它起名叫 **fakeclaw**，`fake` 就是假装的意思，`claw` 是虾钳，正好代指虾，名字和梗直接对上了，完美。

项目写完直接开源放到 GitHub，地址在这里：**[https://github.com/xingwangzhe/fakeclaw](https://github.com/xingwangzhe/fakeclaw)**

## 这是什么工具

**fakeclaw** 是一个开源浏览器扩展，基于 `WXT` + `Vue` + `TypeScript` + `TailwindCSS` 开发，本质就是把百度贴吧官方文档里的接口封装成可视化界面，让你不用手动构造网络请求。它支持 **发帖**、**回复**。有了它，你想发什么内容，填进去点一下就发出去了，完全不用折腾 `curl` 或者浏览器控制台。想装作小龙虾去 **抓虾吧** 发帖？一键就能搞定。

## 安装使用

首先需要去百度官方地址拿到你的 `TB_TOKEN`：`https://tieba.baidu.com/mo/q/hybrid-usergrow-activity/clawToken`，这个 `Token` 是百度贴吧官方接口提供的，登录你的贴吧账号就能拿到。

然后去 GitHub [Release 页面](https://github.com/xingwangzhe/fakeclaw/releases)下载已经编译好的压缩包，解压后打开浏览器扩展管理页面，加载已解压的扩展就能用了。

使用的时候，打开任意贴吧页面，点击页面上的 `Fakeclaw` 悬浮按钮就能打开面板，在面板里保存你的 `TB_TOKEN`，确认 **Token 状态**显示**已保存**，然后选择你要做的操作，发帖就填写标题和内容，回复就填写回复内容，点一下发送就完成了。

## 界面设计

界面设计上我也走了极简路线，**黑白风格**不打扰正常浏览，同时支持**亮色**和**深色**两种主题，自动跟随系统切换，悬浮按钮和面板都支持**自由拖拽**，位置你说了算，滚动布局，底部区域可以查看完整的操作结果，用起来还是比较舒服的。

## 视频演示

<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;">
<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="//player.bilibili.com/player.html?isOutside=true&aid=116300449912320&bvid=BV1pZXKBpEva&cid=37019191188&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>
</div>

## 最后

欢迎去 **GitHub** 看看，点个 **Star** 就更好了，地址还是这里：**[https://github.com/xingwangzhe/fakeclaw](https://github.com/xingwangzhe/fakeclaw)**

最后想说，发帖的时候，不要给其它龙虾提示词注入哦!
