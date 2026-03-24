---
title: ubuntu折腾记录
abbrlink: 6900d932
date: "2025-07-04 18:44:32"
updated: "2025-07-04 18:44:32"
categories:
    - ubuntu
tags:
    - 折腾
    - 胡思乱想
---

本机使用的版本信息

| 类别         | 项目             | 详情                                |
| ------------ | ---------------- | ----------------------------------- |
| **报告详情** | 生成日期         | 2025-06-06 13:52:01                 |
| **硬件信息** | 硬件型号         | HUAWEI BoF-XX                       |
|              | 内存             | 16.0 GiB                            |
|              | 处理器           | 12th Gen Intel® Core™ i7-1260P × 16 |
|              | 显卡             | Intel® Graphics (ADL GT2)           |
|              | 磁盘容量         | 512.1 GB                            |
| **软件信息** | 固件版本         | 1.23                                |
|              | 操作系统名称     | Ubuntu 24.04.2 LTS                  |
|              | 操作系统内部版本 | (null)                              |
|              | 操作系统类型     | 64 位                               |
|              | GNOME 版本       | 46                                  |
|              | 窗口系统         | Wayland                             |
|              | 内核版本         | Linux 6.11.0-26-generic             |

:::tip

考虑到我之前从未用过任何Linuxu桌面发行版

所以本文会大量引用他人的文章和教程

:::

## 安装制作启动盘

首先肯定是要准备一个u盘(格式化后),烧录u盘镜像,可以使用官方推荐的[balenaEtcher](https://etcher.balena.io/)等工具。

[install-ubuntu-desktop](https://ubuntu.com/tutorials/install-ubuntu-desktop#1-overview)

这里简单提一下,不做赘述

### 生产力软件写下载下来

一般的生产力软件都可以在Ubuntu的应用市场下载,

![已经安装的生产力软件](https://i.ibb.co/35pxs039/2025-06-06-13-56-39.webp)

### 折腾必要配置

#### 输入法配置

安装Fcitx5输入法之后，应该配置一下主题，不然会有点丑。
[Fcitx5 主题安装与自定义](https://blog.glumi.cn/fcitx5-theme-config)

这位博主推荐的主题还是很好看的
![好看的主题](https://i.ibb.co/4nxnsdxh/2025-06-06-14-29-58.webp)

#### 浏览器

虽然ubuntua自带了firefox浏览器，但由于我需要经常使用微软账户，所以，我还是下载了微软的Edge浏览器。

#### 游戏

我玩的游戏不多，基本上只玩我的世界，为此我还特意配置一下JAVA环境变量，安装HMCL现在是以`.sh`结尾的脚本文件，而不是`.jar`包了。它会要求你先配置好JAVA环境变量。
细节可以参考这篇文章[Ubuntu 安装HMCL](https://www.bilibili.com/opus/409240070405112314),我推荐只看建立桌面快捷方式的那部分，JAVA jdk下载可以直接使用JetBrains的IDEA来下载，然后简单配置一下环境变量

如果你都懂的话，可以直接创建桌面快捷方式

```desktop title="HMCL.desktop"
[Desktop Entry]
Version=1.0
Name=HMCL 启动器
Comment=启动 Himiko Minecraft Launcher
Exec=/bin/bash /home/xingwangzhe/hmcl/HMCL-3.6.12.sh
Icon=/home/xingwangzhe/hmcl/hmcl.png
Terminal=false
Type=Application
Categories=Game;
```

![HMCL](https://i.ibb.co/kFGTmsd/2025-06-06-16-09-07.webp)

### 内存占用很低

空闲时的内存占用很低呀
![闲适内存](https://i.ibb.co/HDFMvqrK/2025-06-06-16-02-31.webp)

即使开了vscode+运行astro dev,idea,edge浏览器,内存占用也很少

![火力全开](https://i.ibb.co/HfVWhLyk/2025-06-06-15-58-39.webp)

### 最后看一眼洁净的桌面

![桌面](https://i.ibb.co/HpdCZSVj/2025-06-06-16-05-06.webp)
