---
title: hexon:hexo的可视化编辑
abbrlink: 59a1e261
date: "2024-09-04 15:02:00"
updated: "2024-09-04 15:02:29"
categories:
    - hexo
tags:
    - 记录
    - 教程
    - hexo
---

## <div style="text-align: center;"> 你是否对这些命令感到枯燥乏味？</div>

                        hexo g| hexo d|hexo s

## <div style="text-align: center;">那么就来试试hexon吧！</div>

<!--more-->

找到你的博客目录
(这是我的目录)
![blog](https://i.ibb.co/5xjg4m5b/blog.png)
在此目录执行

```bash
git clone https://github.com/gethexon/hexon --depth 1
cd hexon
pnpm install
pnpm run setup
```

此时你的博客目录下会出现hexon文件夹

## 注册用户

如图接下来会出现这个界面
![blog2](https://i.ibb.co/vxTFSqBj/blog2.png)
按照其中的英文提示进行操作即可

## 登录

执行命令

```bash
npm start
```

此时会出现
![blog3](https://i.ibb.co/sBKC5Bn/blog3.png)
框选的链接既是登录的界面，复制链接到浏览器打开
![blog4](https://i.ibb.co/8DpzY4TC/blog4.png)

> 如果出现Authentication error，这时候你需要把用户名那栏输入为你的系统用户名（看c盘，那里会有显示），密码还是不变，输入完毕后点击登录。
> 至此教程基本结束
> ![blog5](https://i.ibb.co/Mk68FZRY/blog5.png)

## 其他事项

你可以访问hexon目录下的readme.md文件详细浏览

## 参考

[gethexon/hexon: Let's hexo online. - GitHub][99]

[99]: https://github.com/gethexon/hexon
