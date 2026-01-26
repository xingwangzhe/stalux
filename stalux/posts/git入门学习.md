---
title: git入门学习
abbrlink: 63416
date: 2024-11-10 19:48:05+00:00
updated: '2025-07-04T18:44:32.348+08:00'
categories:
- 开发
tags:
- 学习
- 记录
- 教程
- github
---

![Git Logo](https://git-scm.com/images/logos/downloads/Git-Logo-1788C.svg)

*它应该被视作一种基本功，这也是为什么我看别的教程，往往在git命令上困惑的原因:(*

<!--more-->

*由于我使用windows,所以以下配置教程均默认为windows.*

## 什么是git

`git`是一个免费开源的分布式版本控制系统。是的它是一个工具。[github](https://github.com),[gitlab](https://gitlab.com),[gitee](https://gitee.com)等都是基于git的代码托管网站，可以说：**前者是后者的技术基础，后者是前者的应用平台**。

## 下载并使用

### 官网下载

[Git - Downloads](https://git-scm.com/downloads)

当然，直接用主流搜索引擎也是能直接找到官网的，~~广告流氓就不好说了~~。

### 配置使用

对着桌面右键，选中`Open git Bash here`
![2024-11-10-200858](https://i.ibb.co/CB4J9xL/2024-11-10-200858.png)

> 如果你第一眼看不到的话，你应该选则`显示更多选项`，这样你才能看见上面的git bash。
>
> ![image](https://i.ibb.co/gz0ZwgK/image.png)

在新出现的窗口里输入

![2024-11-10-203421](https://i.ibb.co/JdZrrvS/2024-11-10-203421.png)

```bash
$ git config --global user.name "Your Name"
$ git config --global user.email "email@example.com"
```

> 哦，对了，git bash默认会有$符号，复制粘贴的时候记得把多余符号去除

### 创建版本仓库

```bash
$ mkdir object      # 创建一个名为 object 的新目录
$ cd object        # 切换当前工作目录到 learngit 目录
$ pwd               # 打印当前工作目录的完整路径
/Users/michael/object  # 这是 pwd 命令的输出，显示当前目录的路径
```

> 当然，方便的方法就是你创建一个文件夹，然后在那个文件夹里面右键打开`git bash`。

接着输入

```bash
$ git init
```

把这个文件夹变成可以用git来管理的仓库

接下来就是经典的流程了

#### git add

首先我们先创建一个简单的文本文件readme.txt

> 这里建议使用[Visual Studio Code](https://code.visualstudio.com/)

然后输入这个命令

```bash
$ git add readme.txt
```

顾名思义，这是把readme添加了，添加到哪了？当然是git的暂存区(缓存区)里面了。

当然，你也可以使用

```bash
$ git add . #注意.之前有空格
```

来把所有文件添加到暂存区

你会发现没有任何消息提醒，那就对了！Unix的哲学是 “**没有消息就是好消息**”，说明添加成功

#### git commit -m "Your commit message"

接下来输入这个

```bash
git commit -m "Your commit message"
```

然后命令窗口就会有消息提醒了。暂时到这里，以后接着写

## 参考

[简介 - Git教程 - 廖雪峰的官方网站](https://liaoxuefeng.com/books/git/introduction/index.html)
[30分钟弄懂所有工作Git必备操作 / Git 入门教程\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV1pX4y1S7Dq/?spm_id_from=333.337.search-card.all.click&vd_source=15276cfc65b1ac8fad46ad8f5ed33307)

