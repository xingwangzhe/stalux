---
title: 解决ubuntu智能卡验证问题,取消智能卡验证
abbrlink: c1775752
date: "2025-07-04 18:44:32"
updated: "2025-07-04 18:44:32"
categories:
    - 疑难杂症
tags:
    - 记录
    - 教程
    - 解决
    - Ubuntu
---

## 起因

可能是我昨晚瞎折腾，今天起来开机输入`sudo su`,发现需要智能卡验证？我寻思我从来没在ubuntu上设置什么智能卡啊，我只在windows上设置过物理密钥，这肯定出了问题

但更严重的是

:::warning

修改智能卡配置需要使用**root**

但是使用root登录时也需要**智能卡验证**

这就导致了**死循环**

:::

问了三遍ai,解决方案大致是通过启动盘来进入ubuntu系统,再挂载系统分区，修改配置文件来解决配置问题，从而绕过原系统的权限验证，更进一步地，是可以绕过**配置文件下的所有验证**(理论上)

下面是Ai解释的原理
:::tip
Ubuntu系统在解锁时提示插入智能卡的问题，通常是因为PAM（Pluggable Authentication Modules）配置文件中启用了智能卡认证模块

而系统并未正确配置或未安装相应的智能卡认证软件包。

通过 Ubuntu 启动盘（Live USB）来修改系统配置文件，可以解决此问题。
:::

## 环境准备

- Ubuntu 启动盘（Live USB）
- 基本的 Linux 系统操作知识

## 操作步骤

### 1. 从 Ubuntu 启动盘启动

1. 将 Ubuntu 启动盘插入电脑。
2. 重启电脑，并在启动过程中按下特定按键（通常是 `F12`、`Esc` 或 `F2`）以选择启动设备。
3. 选择从 USB 驱动器启动，进入 Ubuntu Live 环境。

### 2. 打开终端

在 Live 环境中，打开终端（可以通过应用程序菜单搜索"终端"或按 `Ctrl + Alt + T`）。

### 3. 查看分区信息

运行以下命令查看磁盘分区信息：

```bash title="查看磁盘分区"
lsblk -f
```

找到包含 `ext4` 文件系统且大小较大的分区，这通常是 Ubuntu 的根分区（`/`）。例如：

```bash title="分区信息示例"
NAME        FSTYPE FSVER LABEL UUID                                 MOUNTPOINT
nvme0n1
├─nvme0n1p1 vfat   FAT32 SYSTEM           90BF-9404
├─nvme0n1p2
├─nvme0n1p3 ntfs                Windows    3C625A326259F15E
├─nvme0n1p4 ntfs                Data       36E2D0B6E2D07B95
├─nvme0n1p5 vfat   FAT32 WINPE            688C-E17C
├─nvme0n1p6 ntfs                Onekey     E4CE8F24CE8EEDDC
├─nvme0n1p7 ntfs                WinRE      8AB0BC78B0BC6BF7
└─nvme0n1p8 ext4   1.0                   257a987f-1b7c-4140-a50a-2eb64520fc28
```

可以使用以下命令查看分区大小，这有助于识别Ubuntu分区（通常较大），而且当时分区的时候你一定对分区大小有印象！：

```bash title="查看分区大小"
lsblk
```

```bash title="分区大小信息示例"
nvme0n1     259:0    0 476.9G  0 disk
├─nvme0n1p1 259:1    0   200M  0 part /boot/efi
├─nvme0n1p2 259:2    0    16M  0 part
├─nvme0n1p3 259:3    0   120G  0 part
├─nvme0n1p4 259:4    0  87.1G  0 part
├─nvme0n1p5 259:5    0   512M  0 part
├─nvme0n1p6 259:6    0    18G  0 part
├─nvme0n1p7 259:7    0     1G  0 part
└─nvme0n1p8 259:8    0 250.1G  0 part /

```

在这个例子中，`/dev/nvme0n1p8` 是根分区。

### 4. 挂载系统分区

挂载根分区到 `/mnt`：

```bash title="挂载根分区"
sudo mount /dev/nvme0n1p8 /mnt
```

### 5. 挂载必要的系统目录

为了能够修改系统配置，还需要挂载 `/dev`、`/proc` 和 `/sys`：

```bash title="挂载系统目录"
sudo mount --bind /dev /mnt/dev
sudo mount --bind /proc /mnt/proc
sudo mount --bind /sys /mnt/sys
```

### 6. 切换到系统根目录

使用 `chroot` 命令切换到系统根目录：

```bash title="切换到系统根目录"
sudo chroot /mnt
```

### 7. 修改 PAM 配置文件

使用文本编辑器（如 `nano`）编辑 `/etc/pam.d/common-auth` 文件：

```bash title="编辑PAM配置文件"
nano /etc/pam.d/common-auth
```

找到以下行：

```text title="需要注释的配置行"
auth    [success=4 ignore=ignore default=die]    pam_sss.so allow_missing_name require_cert_auth
```

将其注释掉（在行首添加 `#`）：

```text title="注释后的配置"
# auth    [success=4 ignore=ignore default=die]    pam_sss.so allow_missing_name require_cert_auth
```

保存并退出（按 `Ctrl + X`，然后按 `Y` 确认保存，最后按 `Enter`）。

### 8. 退出并重启

退出 `chroot` 环境并重启系统：

```bash title="清理并重启"
exit
sudo umount /mnt/dev
sudo umount /mnt/proc
sudo umount /mnt/sys
sudo umount /mnt
sudo reboot
```

### 9. 验证问题是否解决

重启后拔掉启动盘，进入ubuntu系统，尝试使用 `sudo su` 命令，检查是否仍然需要智能卡验证。
如果不再提示智能卡验证，则问题已解决。

## 注意事项

- 在修改配置文件时，请仔细操作以避免错误。
- 如果不确定分区，请先确认分区的文件系统类型和大小。
- 如果问题仍未解决，可以检查其他 PAM 配置文件或查阅系统日志以获取更多信息(可以多注释，但要慎之又慎)。
