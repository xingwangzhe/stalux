---
title: 美化Grub界面
abbrlink: 5f776910
date: 2025-09-09 12:43:44
updated: 2025-09-09 16:24:14
categories:
    - Linux
tags:
    - Linux
    - Grub
    - 美化
---

:::tip
本机使用环境为Ubuntu,其它发行版可能会有所差别，但文件路径都是一致的
:::

## 什么是Grub

GNU GRUB（GRand Unified Bootloader简称“GRUB”）是一个来自GNU项目的多操作系统启动程序。GRUB是多启动规范的实现，它允许用户可以在计算机内同时拥有多个操作系统，并在计算机启动时选择希望运行的操作系统。GRUB可用于选择操作系统分区上的不同内核，也可用于向这些内核传递启动参数。

默认的Grub启动界面都是很丑的黑白选项界面，所以要美化一下。

### 备份启动项

```bash title="备份启动项"
sudo cp /etc/default/grub /etc/default/grub.bak
sudo cp -r /boot/grub/ /boot/grub.bak
```

### 选择主题

我认为[grub2-themes](https://github.com/vinceliuice/grub2-themes)这个主题就非常不错，于是打算安装这个

![好看的启动界面](https://i.ibb.co/pvGd7gPv/preview.webp)

### 克隆项目到本地

打开终端，执行以下命令：

```bash
git clone https://github.com/vinceliuice/grub2-themes.git
cd grub2-themes
```

### 运行安装脚本（推荐方式）

你可以直接运行安装脚本，它会自动识别系统并安装主题：

```bash
sudo ./install.sh
```

安装过程中会提示你选择：

| 主题风格             | 图标颜色       | 分辨率        |
| -------------------- | -------------- | ------------- |
| tela、vimix、stylish | color 或 white | 1080p、2k、4k |

使用方向键选择，按空格键勾选，回车确认即可。

### 安装完成后更新 GRUB(可选)

安装脚本会自动更新 GRUB 配置，但你可以手动再执行一次以确保生效：

```bash
sudo update-grub
```

### 重启系统

```bash
sudo reboot
```

重启后你应该能看到新的 GRUB 主题界面。

---

祝使用愉快♥️
