---
title: "Ubuntu 24.04 安装 Win10 虚拟机"
date: "2026-03-06 17:40:01"
desc: 我看网上太多教程都是win安装ubuntu虚拟机的了，所以这次来写一下如何在ubuntu上安装win10虚拟机。
tags: ["Ubuntu", "Win10", "QEMU", "KVM"]
categories: ["虚拟机"]
abbrlink: "ubuntu-24.04-install-win10-vm"
---

我看网上太多教程都是win安装ubuntu虚拟机的了，所以这次来写一下如何在ubuntu上安装win10虚拟机。
别问为什么不用win11，既然都要安装虚拟机了，肯定要选择简洁实用的

**前提条件**

- 系统：Ubuntu 24.04 LTS 桌面版
- CPU：支持硬件虚拟化（需要验证`egrep -c '(vmx|svm)' /proc/cpuinfo`结果大于0）

## 步骤

### 更新系统软件包（强烈建议先执行）

```bash title="bash"
sudo apt update && sudo apt upgrade -y
```

### 一次性安装 KVM 及图形化管理工具所需的所有软件包

```bash title="bash"
sudo apt install qemu-kvm libvirt-clients libvirt-daemon-system virt-manager bridge-utils virtinst -y
```

安装完成后大约占用 200–400MB 空间，视网络速度通常 1–3 分钟完成。

### 启动 libvirtd 服务并设置为开机自启

```bash title="bash"
sudo systemctl enable --now libvirtd
```

### 将当前用户加入必要的权限组（非常重要！无此步 virt-manager 会报错）

```bash title="bash"
sudo adduser $USER libvirt
sudo adduser $USER libvirt-qemu
```

### 让权限生效

**推荐方式**：  
点击右上角电源图标 → 选择 **注销**（Log Out），然后使用同一账号重新登录。

**替代方式**：直接重启电脑

```bash title="bash"
# 可选：重启系统
sudo reboot
```

### 验证安装是否成功

重新登录后，在终端运行以下命令：

```bash title="bash"
virt-host-validate
```

**期望输出**：大部分项目显示 **PASS**，重点关注：

```bash title="bash"
 QEMU: Checking for hardware virtualization support → PASS
 KVM: Checking for KVM support → PASS
 CPU: Checking for hardware virtualization → PASS
```

剩下的就是启动管理器，安装镜像，并启用了，内存，CPU分配自己根据本机设备调整一下就行了
![安装后的效果](/vm/vmwin10.webp)
