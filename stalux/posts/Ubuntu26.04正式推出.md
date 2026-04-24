---
title: Ubuntu26.04正式推出
date: "2026-04-24 01:00:00"
abbrlink: ubuntu-26-04-official-release
tags:
    - Linux
    - Ubuntu
categories:
    - Linux
---

![ubuntu26.04](https://res.cloudinary.com/canonical/image/fetch/f_auto,q_auto,fl_sanitize,c_fill,w_1920/https%3A%2F%2Fubuntu.com%2Fwp-content%2Fuploads%2F1c6c%2FUbuntu-26.04-LTS-Apps.png)

## 引言

期待许久，Ubuntu 26.04 正式版——代号**坚毅浣熊**（Resolute Raccoon）[终于推出](https://ubuntu.com/blog/canonical-releases-ubuntu-26-04-lts-resolute-raccoon)。面对 AI 时代的浪潮，Ubuntu 正在努力把自己打造成 AI 开发的优先易用平台 🦝

这个代号的由来也值得一提——它是为纪念前 Debian 和 Ubuntu 发布经理 Steve Langasek 而命名的，他在 2025 年初不幸离世。

<div style="position: relative; width: 100%; aspect-ratio: 16 / 9;">
    <iframe src="//player.bilibili.com/player.html?isOutside=true&aid=116459464366037&bvid=BV1ssojB8EYz&cid=37784519368&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="position: absolute; inset: 0; width: 100%; height: 100%;"></iframe>
</div>

## 桌面环境全面升级

### GNOME 50 引入

Ubuntu 26.04 搭载了全新的 `GNOME 50` 桌面环境，这是从 24.04 LTS 的 GNOME 46 直接跨越四个版本的升级。

最值得一提的变化是 **GNOME 桌面现在彻底拥抱 Wayland**，X.org 会话正式退出历史舞台。当然，legacy 的 X11 应用依然可以通过 `XWayland` 兼容层运行，这点不用太担心。而且这次针对 NVIDIA 显卡的 Wayland 支持做了大幅优化，掉帧时间从毫秒级降到了微秒级，N 卡用户终于不用再为卡顿发愁了 😅

GNOME 50 的主要改进包括：

| 功能                 | 说明                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| **HDR 支持**         | 支持录制和共享 HDR 内容，色彩管理升级到最新 Wayland 标准                                |
| **VRR 与分数缩放**   | 可变刷新率和分数缩放正式转正，不再是实验性功能                                          |
| **远程桌面硬件加速** | 支持 Vulkan 和 VAAPI 加速，新增摄像头重定向功能                                         |
| **家长控制**         | 可设置屏幕使用时间、就寝时间，还能限制应用安装(话说能玩Linux的小孩，家长真能控制住吗😄) |
| **文件管理器优化**   | 更快的缩略图加载、更低的内存占用、网格视图可自定义显示字段                              |
| **数字健康**         | 新增屏幕时间统计和休息提醒功能                                                          |

### 全新默认应用

除了 GNOME 50 本身，一批系统默认应用也迎来了 Rust 重写的新面孔：

| 新应用      | 被替换者       | 亮点                                   |
| ----------- | -------------- | -------------------------------------- |
| `Papers`    | Evince         | 基于 GTK4，部分代码用 Rust 重写        |
| `Loupe`     | Eye of GNOME   | Rust 编写，基于 Glycin 库              |
| `Ptyxis`    | GNOME Terminal | 支持 Podman/Toolbox/Distrobox 快速访问 |
| `Resources` | System Monitor | Rust 编写，支持 GPU/NPU 监控           |
| `Showtime`  | Totem          | 新的默认视频播放器                     |

其中 `Resources` 这个系统监控工具特别有意思——它能按应用分组显示进程，还能追踪 **NPU（神经网络处理单元）** 的使用情况，这明显是为 AI 时代做的准备。

## **锈蚀**核心化

如果说桌面环境的变化是"看得见"的，那么 Rust 渗透系统核心则是"看不见"但影响深远的变革。Ubuntu 26.04 成为了**首个将 Rust 工具链作为系统默认**的主流 Linux 发行版 LTS 版本 🦀

### 两大核心组件被替换

| 新组件                     | 原组件         | 说明                            |
| -------------------------- | -------------- | ------------------------------- |
| `sudo-rs` (0.2.12)         | 传统 C 版 sudo | 内存安全实现，默认启用密码反馈  |
| `uutils/coreutils` (0.7.0) | GNU coreutils  | Rust 版的 ls、cp、mv 等基础命令 |

Ubuntu作为世界上最大的Linux发行版之一迈开了坚实的一步，预计26.10将会有更多锈化，这是为了安全保障，还是为了规避GPL？我不得而知...
当然为了绝对的稳定性，Canonical 也没把事情做绝——原来的 GNU coreutils 和 `sudo.ws`（原 sudo）仍然保留在仓库里，遇到兼容性问题可以随时切回去。

## AI第一战略

Ubuntu 26.04 最显著的定位变化，就是它要把自己的旗帜插在 AI 开发的山顶上。Canonical 这次的动作很大，而且是在多个维度同时发力。

### GPU 计算栈原生入库

以前装 NVIDIA CUDA 或者 AMD ROCm，总要折腾第三方仓库、手动解决依赖冲突。现在好了，两者都直接进了 Ubuntu 官方仓库：

| 平台            | 安装方式                          | 说明                       |
| --------------- | --------------------------------- | -------------------------- |
| **NVIDIA CUDA** | `apt install nvidia-cuda-toolkit` | 首次原生分发，自动检测硬件 |
| **AMD ROCm**    | `apt install rocm`                | Canonical 组建专门团队维护 |

ROCm 的入库尤其有意义——AMD 终于能和 NVIDIA 站在同一起跑线上了。对于用 `PyTorch`、`TensorFlow`、`JAX` 的开发者来说，`apt install` 就能搞定一切，不用再去翻各种安装指南

### Inference Snaps：沙盒化 AI 部署

Canonical 还推出了 **Inference Snaps**——基于 Snap 容器的预配置 AI 运行环境。它的特点是：

- **开箱即用**：自动检测 CPU/GPU/NPU，选择最优运行后端
- **沙盒隔离**：解决 AI 代理运行时的权限安全问题
- **一键部署**：本地运行大模型不再需要繁琐配置

这对于想在本地跑 `Llama`、`Qwen` 这类开源模型的开发者来说，门槛降低了不少。

### NPU 与异构计算支持

`Linux kernel 7.0` 带来了对新一代硬件的支持，包括 Intel Core Ultra 和 AMD Ryzen AI 平台中的 NPU。`Resources` 监控工具能显示 NPU 占用率，`sched_ext` eBPF 调度框架也让异构计算的调度更加灵活。

当然，NPU 目前更适合跑 1-4B 参数的小模型做低功耗推理，大模型还是乖乖用 GPU 吧 😅

### 其他值得关注的基础变更

| 组件         | 版本/变化            | 影响                                            |
| ------------ | -------------------- | ----------------------------------------------- |
| Linux Kernel | 7.0                  | 支持 Intel Nova Lake、AMD Zen 6，新增 sched_ext |
| systemd      | 259                  | 强制 cgroup v2，`/tmp` 默认挂载为 tmpfs         |
| Dracut       | 替代 initramfs-tools | 更好的 systemd 集成，支持蓝牙早期引导           |
| APT          | 3.x 系列             | 移除 apt-key，改进包管理体验                    |
| Python       | 3.14                 | 默认版本升级                                    |
| GCC          | 15.2                 | 编译器工具链更新                                |

## 总结

Ubuntu 26.04 LTS "Resolute Raccoon" 是一个承前启后的版本。它既有 GNOME 50 带来的桌面体验革新，也有 Rust 核心化带来的安全根基重塑，更有面向 AI 时代的战略布局。

对于桌面用户来说，Wayland 的成熟、NVIDIA 优化的到位、分数缩放的默认启用，都是实实在在的体验提升。对于开发者来说，CUDA 和 ROCm 的原生支持、Inference Snaps 的便利，让 Ubuntu 作为 AI 开发平台的吸引力大增。

如果你追求稳定，可以继续留守 24.04 LTS 到 2029 年。但如果你想要体验最新的桌面技术，或者正在搭建 AI 开发环境，26.04 值得一试 😊
