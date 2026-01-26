---
title: 为Hexo博客提供订阅服务
abbrlink: 261d7eb2
date: 2024-09-19 07:59:02+00:00
updated: '2024-09-19 07:58:59'
categories:
- hexo
tags:
- webpusher
- 记录
- 教程
- hexo
---

Web-push的优势
与传统的邮件列表相比，Web push Notification 有这样几点不同：
使用邮件推送，只有打开邮件的人才能看到推送的内容。如果使用 Web push Notification，任何一个在使用浏览器的人都会看到推送的内容。
由于阅读信息的比例高，点击通知的比例也会更高。更多的人会跳转到你的站点。PushEngage 曾看到过百分之五十的点击率。
Web push notification 还是一个较新的技术。浏览器通知的信噪比没有邮件那么高。

![12](https://i.ibb.co/5gZ8LHsH/12.png)

<!--more-->

## hexo+webpusher实现博客订阅功能

##  安装插件

插件的GitHub仓库[hexo-web-push-notification](https://github.com/glazec/hexo-web-push-notification)

### 在博客根目录下执行命令

`npm i hexo-web-push-notification --save`

### 紧接着再你的博客站点目录下的配置文件——config.yml，而不是主题配置文件，添加以下配置：
```yml
webPushNotification:
  webpushrKey: "your webpushr rest api key"
  webpushrAuthToken: "your webpushr authorize token"
  trackingCode: "AEGlpbdgvBCWXqXI6PtsUzobY7TLV9gwJU8bzMktrwfrSERg_xnLVbjpCw8x2GmFmi1ZcLTz0ni6OnX5MAwoM88"
```

记住这三个关键词`Key Token Code`
接下来会用到

## 官网注册

[webpusher](https://app.webpushr.com/signup)

>在登录时需要进行人机身份验证，但中国大陆网络原因，时常无法验证，请~~神秘~~自行解决

### 填写网站信息
![13](https://i.ibb.co/zWZYCGN1/13.png)

### 下载文件上传，修改博客模板
![14](https://i.ibb.co/39MmfKZz/14.png)

>第二步是把代码复制到你博客模板`<body>`之前,该文件路径可能随博客主题有所不同，我使用了next主题，位置在`blog\themes\next\layout\_layout.swig`

修改后进行下一步

### 获取所需参数

![15](https://i.ibb.co/pvJXwzKD/15.png)
![16](https://i.ibb.co/tpyKWnrh/16.png)

把上述三个参数添加进刚才在博客根目录下的_config.yml
```yml
webPushNotification:
  webpushrKey: "your webpushr rest api key"
  webpushrAuthToken: "your webpushr authorize token"
  trackingCode: "AEGlpbdgvBCWXqXI6PtsUzobY7TLV9gwJU8bzMktrwfrSERg_xnLVbjpCw8x2GmFmi1ZcLTz0ni6OnX5MAwoM88"
```
设置基本完成

## 自定义样式
![17](https://i.ibb.co/pvk06k6K/17.png)



## 某些问题
不显示订阅可能是因为
## CORS阻止
```
Access to XMLHttpRequest at 'http://localhost:9999/user/info' from origin 'http://localhost:7000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```
你需要在这个界面进行操作
![18](https://i.ibb.co/r2PD2hR2/18.png)


## 参考
[Hexo博客订阅文章通知功能|yafine](https://yafine.github.io/posts/20200426173435-ebb2)

