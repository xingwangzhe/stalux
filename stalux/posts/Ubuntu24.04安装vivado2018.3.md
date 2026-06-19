---
title: Ubuntu 24.04 安装 Vivado 2018.3
abbrlink: 1a282b79
date: "2025-07-08 14:35:39"
updated: "2025-07-08 15:18:52"
desc: 如果你想省流直接找安装报错、仿真报错解决方法
categories:
    - ubuntu
tags:
    - vivado
    - ubuntu
    - 折腾
---

## 折腾永不止步

:::tip

如果你想省流直接找安装报错、仿真报错解决方法

可以跳转到这 [省流方法](#省流方法)

:::

![Ubuntu 24.04 上运行 Vivado 2018.3](https://i.ibb.co/Q7D83jYT/2025-07-08-14-32-52.webp)

折腾好久，终于能够正常安装使用 Vivado 2018.3 了。虽然本学期结课了，但下学期还有课设，前置课好像是计算机组成原理，所以安排到下学期，估计也得是下学期的期中之后了。我用 Ubuntu 已经用习惯了，本着能不用 Windows 就不用的想法，准备开始在 Ubuntu 24.04 版本上搞。

但是问题是 AMD 文档上推荐的应该是 Ubuntu 2018.4，隔了那么多 LTS 版本，势必有些库不兼容，所以我为此折腾了很长时间！

### 下载安装包

**1.** 可以去 AMD 官网下载，非常慢，而且由于美国的出口管制措施，你还得填上地址等个人敏感信息才允许下载。不过幸运的是我下载的时候没被阻碍，可能是因为管制取消了还是我没进管制黑名单😄？

![详细信息以来通过美国出口管制验证](https://i.ibb.co/0kVWm7n/8-7-2025-145913-account-amd-com.webp)

**2.** [Vivado 2018.3 Linux 包 - 百度网盘下载](https://pan.baidu.com/s/1PnOsfXrgueS8v83g9DNbIw?pwd=1234) 所以为了方便大家，我自己下载下来了并分享（包含许可证，到期时间为 2037 年）

### 我的失败尝试

| 方法             | 问题描述                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| 虚拟机           | 各种虚拟机都很卡，虚拟机文件与主机文件交互非常费劲                                              |
| Wine             | 缺少某些方法，运行卡住且有严重乱码，尤其是 Wine 的文件管理器，Vivado 在 Wine 下也出现口口口乱码 |
| 安装奇异搞笑依赖 | 找不到 Ubuntu 24.04 所需的旧包，只有更新版本，强行安装旧包可能导致依赖问题，也会增加系统冗余    |

我真是服了，我数字逻辑与数字系统的期末考试都考完了，在其中的复习期间折腾这事也算是做放松运动了，尝试各种可能，终于是在今天搞完了。

## 省流方法

先执行

```bash title="创建符号链接，解决问题"
# 解决安装时最后一步 generating installed device list 问题
sudo ln -sf /lib/x86_64-linux-gnu/libtinfo.so.6 /lib/x86_64-linux-gnu/libtinfo.so.5

# 解决仿真测试 [XSIM 43-3409] Failed to compile generated C file 问题
sudo ln -sf /lib/x86_64-linux-gnu/libncurses.so.6 /lib/x86_64-linux-gnu/libncurses.so.5
sudo ln -sf /lib/x86_64-linux-gnu/libncursesw.so.6 /lib/x86_64-linux-gnu/libncursesw.so.5
```

后运行 xsetup.sh 安装脚本，安装之后需要再安装 USB 驱动

```bash title="USB 驱动安装"
cd [your_path]/Xilinx/Vivado/2022.2/data/xicom/cable_drivers/lin64/install_script/install_drivers
sudo ./install_drivers
```

最后就可以了，网上给的安装各种依赖实在是不靠谱，而且时间都过于久远，我可是尝试了各种可能总结下来并写下本文的！
