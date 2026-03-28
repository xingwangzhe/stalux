---
title: Ubuntu26.04-beta体验:坚毅浣熊!
abbrlink: a8f2c7d9
date: "2026-03-28 14:17:00"
updated: "2026-03-28 14:50:00"
categories:
    - ubuntu
tags:
    - ubuntu
    - 体验
---

## beta版发布

[Ubuntu 26.04 LTS (Resolute Raccoon) Beta released](https://discourse.ubuntu.com/t/ubuntu-26-04-lts-resolute-raccoon-beta-released/79205)

![桌面](/ubuntu26/桌面图片.webp)

当地时间 3 月 26 日，Ubuntu 26.04 LTS beta(代号“坚毅浣熊”)如期发布，面向公众开放测试。Ubuntu 26.04 LTS 正式版将于 4 月 23 日发布。此次更新有许多亮点.

### 全新的系统资源监控器:Resources (nokyan)

![资源监控器](/ubuntu26/nokyan.webp)

最引人注目的变化是，Ubuntu 26.04 **用全新的 Resources (nokyan) 取代了沿用多年的 GNOME System Monitor**。这款新的系统监控器版本为 1.10.2，开发团队选择它的主要原因是其拥有更出色的无障碍支持。

从界面上看，Resources 的设计更加现代化，左侧边栏分类清晰：应用、进程、处理器、内存、显卡、磁盘、Wi-Fi、网络接口等一目了然。每个硬件的实时使用率都以曲线图展示，直观清晰。

### 默认预装的性能分析工具:Sysprof

![Sysprof关于页面](/ubuntu26/Sysorif.webp)

Sysprof 是一款系统性能分析工具，现在在 Ubuntu 26.04 中**默认预装**。它可以帮助开发者记录和分析系统性能，找出性能瓶颈，对系统调试和优化非常有帮助。当前版本为 50.beta。

### 核心底层:Linux 内核 7.0

![fastfetch系统信息](/ubuntu26/fastfetch.webp)

Ubuntu 26.04 搭载了全新的 **Linux 内核 7.0**，相比 6.x 系列带来了这些重要改进：

| 特性               | 说明                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| 新一代硬件支持     | 提前做好了对 AMD Zen 6 和 Intel Nova Lake / Diamond Rapids 下一代CPU的支持 |
| 性能优化           | 文件缓存内存回收速度提升高达 **75%**，带来更流畅的系统响应                 |
| Rust 成熟化        | 内核开发官方宣称 "Rust for Linux 已经站稳脚跟"，持续推进Rust架构现代化     |
| 架构改进           | ARM64 新增支持 64字节单拷贝原子指令，RISC-V 支持用户空间 CFI               |
| 默认开启 Intel TSX | 对没有安全问题的Intel CPU默认开启事务同步扩展，提升相关应用性能            |
| 清理陈旧代码       | 移除了一批过时老旧驱动，让内核更加干净精简                                 |

### 桌面环境:GNOME 50 "Tokyo"

GNOME 也升级到了 **50** 版本，这次的版本代号是 "Tokyo"，以纪念 GNOME.Asia Summit 2025 本地组织者的工作。主要新特性包括：

| 特性           | 说明                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 全新家长控制   | 首次支持屏幕时间限制和就寝计划，到达限制自动锁屏，家长可按需延长时间。底层已添加网页过滤基础设施                                |
| 无障碍大幅增强 | Orca屏幕阅读器全新偏好设置窗口，所有设置全局化无需每个应用单独保存；新增自动语言切换；支持Wayland下鼠标审查；新增"减少动画"选项 |
| 文档标注功能   | 文档查看器终于支持PDF标注，可以添加文字、线条、高亮，支持选择颜色和线粗                                                         |
| 文件管理器优化 | 缩略图和图标加载更快，整体内存占用降低；批量重命名功能重做更直观；搜索支持多过滤器同时使用                                      |
| 远程桌面升级   | 新增硬件加速(Vulkan/VA-API)，远控更加流畅低功耗；支持HiDPI自动缩放、摄像头重定向、Kerberos认证                                  |
| 显示技术改进   | VRR可变刷新率和分数缩放默认开启；VRR模式下鼠标光标低延迟独立运行；修复NVIDIA显卡卡顿；支持HDR屏幕共享                           |
| 日历更新       | 新增参会者列表查看功能；支持ICS导出；月视图体验优化，尊重系统"每周第一天"设置                                                   |

> GNOME上的家长控制给我逗笑了，能玩上Linux的孩子能被这点雕虫小技困住吗?

可以看到我安装的 Ubuntu 26.04-beta 已经升级到了 Linux 内核 7.0.0-10-generic，GNOME 版本也更新到了 50.0，配合 Yaru-dark 深色主题，整体视觉效果非常协调。终端使用的是我自己安装的的 [ghostty](https://ghostty.org/)，体验很棒。

## 参考链接

- [Introducing GNOME 50, "Tokyo" (官方发布说明)](https://release.gnome.org/50/)
- [Linux 7.0 Features Include More Preparations For AMD Zen 6 & Intel Nova Lake (Phoronix)](https://www.phoronix.com/review/linux-7-features-changes)
- [Ubuntu 26.04 Beta Released: Powered By Linux 7.0 + GNOME 50 (Phoronix)](https://www.phoronix.com/news/Ubuntu-26.04-Beta)
