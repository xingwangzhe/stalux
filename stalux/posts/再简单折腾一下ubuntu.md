---
title: 再简单折腾一下ubuntu
abbrlink: 7b08d50f
date: '2025-07-04T18:44:32.351+08:00'
updated: '2025-07-04T18:44:32.351+08:00'
categories:
- ubuntu
tags:
- 折腾
- 胡思乱想
---

## 接上一回

最近继续折腾ubuntu,着重解决一下输入法问题！！！

**deb包**的程序默认没什么问题,但**snap包**的程序似乎就是不支持输入法（？）

### 解决方案1 ：换成deb包

卸载从应用中心安装的snap包,改用应用官网的**deb包**安装（如果有的话）

```bash title="卸载snap包应用"
# 查看已安装的snap包
sudo snap list

# 卸载指定的snap包
sudo snap remove <包名>

# 例如卸载firefox snap版本
sudo snap remove firefox

# 如果包有多个版本，强制卸载
sudo snap remove --purge <包名>
```

### 解决方案2：配置环境变量

在`/etc/profile`或`~/.profile`或`/etc/environment`或`...(此处忽略)`中添加以下环境变量：

```bash title="添加环境变量"
export GTK_IM_MODULE=fcitx  # 如果你使用 Fcitx 输入法
export QT_IM_MODULE=fcitx   # 如果你使用 Fcitx 输入法
export XMODIFIERS=@im=fcitx # 如果你使用 Fcitx 输入法 尤其注意这个，不要对@im=fcitx加上双引号，不然会导致IDEA无法输入中文（？）
```

至此基本能够解决一些中文输入法的问题了！！！

## 推荐输入法设置
这个博主推荐的中文输入很省心，基本不用改什么就可以直接用
[Ubuntu 24.10 安装 fcitx5 + rime + 雾凇配置](https://hzbk.net/archives/121389.html)
而且版本上来讲，也和我的Ubuntu 24.04.2 LTS差不多

## 浏览器这块

火狐没有**lighthouse**,这块对我来说不方便，又由于我经常使用`微软`，`谷歌`账号所以我安装了`edge`和`chrome`

![2025-06-08-21-36-33桌面信息](https://i.ibb.co/1GkYSTk8/2025-06-08-21-36-33.webp)


## 邮箱轻松配置

基本上常见的邮箱都能自动配置好

![邮箱简单设计](https://i.ibb.co/27qvPvpZ/2025-06-08-21-42-31.webp)