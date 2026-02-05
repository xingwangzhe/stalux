---
title: Hexo Pro体验
abbrlink: 32951
date: 2024-10-29 09:21:27+00:00
updated: "2025-07-04T18:44:32.346+08:00"
categories:
  - hexo
tags:
  - 记录
  - 教程
  - 前端
  - github
  - hexo
---

<center>

## Hexo_pro是一个非常棒的hexo编辑器

项目地址:[https://github.com/wuzheng228/hexo-pro](https://github.com/wuzheng228/hexo-pro)

</center>

<!--more-->

## 作者视频

<iframe src="https://player.bilibili.com/player.html?isOutside=true&aid=113215572807515&bvid=BV1qyxqeZEZj&cid=26049055473&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" width="800px" height="450px"></iframe>

### 可视化编辑

能够及时预览
![2024-10-29-092927](https://i.ibb.co/b2fK6Py/2024-10-29-092927.png)

### 使用教程

#### npm安装

```
npm install --save hexo-pro
```

#### 配置博客根目录的\_config.yml配置项

需要在hexo的\_config.yml中增加以下配置来使用账户密码登陆后台，不配置后台会直接登陆。 配置后使用jwt来保护后台访问的接口

```yaml
hexo_pro:
  username: admim
  password: 123
  avatar: https: image for your own avata
  secret: xxx // jwt secret key
```

#### 启用

```
hexo server -d
open http://localhost:4000/pro/
```

输入账号密码，然后开始你的写作吧！

我的博客即将同步至腾讯云开发者社区，邀请大家一同入驻：[https://cloud.tencent.com/developer/support-plan?invite_code=wmzg31unp3h2](https://cloud.tencent.com/developer/support-plan?invite_code=wmzg31unp3h2)
