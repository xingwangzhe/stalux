---
title: 在 Ubuntu 上实现 Thetis FIDO U2F 密码登录
abbrlink: f69680bd
date: 2025-07-04 18:44:32
updated: 2025-07-04 18:44:32
categories:
    - 安全
tags:
    - FIDO U2F
    - Thetis
    - Ubuntu
    - 密码登录
    - 安全认证
---

:::warning

注意本文是在配置可选的密钥登录，并非**2FA**,让物理密钥作为唯一的2FA认证方式可能会导致无法登录系统

因此请确保在配置前有其他的登录方式可用（如密码登录），以防止因密钥丢失或损坏而无法访问系统。

:::

## 概述

在windows上已经使用了很长时间了，现在我日常使用的系统已经换成了Ubuntu。为了保持与之前的安全认证方式一致，我决定在 Ubuntu 系统上配置 Thetis FIDO U2F 密钥，以实现通过物理密钥进行系统登录和 sudo 认证。

所以本文将详细介绍如何在 Ubuntu 系统上配置 Thetis FIDO U2F 密钥，以实现通过物理密钥进行系统登录和 sudo 认证。

## 安装必要的软件包

首先，需要安装与 FIDO U2F 密钥相关的 PAM（可插入认证模块）包：

```bash
sudo apt update && apt install libpam-u2f
```

`libpam-u2f` 是一个 PAM 模块，它允许使用 FIDO U2F 密钥进行认证。PAM 是 Linux 系统中用于认证的灵活机制，通过配置不同的 PAM 模块，可以实现多种认证方式。

## 设置 udev 规则

创建 udev 规则以确保系统能够正确识别和处理 Thetis FIDO U2F 密钥：

```bash
echo 'KERNEL=="hidraw*", SUBSYSTEM=="hidraw", MODE="0664", GROUP="plugdev"' | sudo tee /etc/udev/rules.d/thetisu2f.rules
sudo reboot
```

这条命令的作用是创建一个 udev 规则文件 `/etc/udev/rules.d/thetisu2f.rules`，其中：

:::tip

- `KERNEL=="hidraw*"`：匹配内核名为 `hidraw` 的设备，这是 Thetis U2F 密钥所属的设备类型。
- `SUBSYSTEM=="hidraw"`：进一步指定设备所属的子系统为 `hidraw`。
- `MODE="0664"`：设置设备文件的权限模式为 0664，表示所有者具有读写权限，所属组和其他用户具有读权限。
- `GROUP="plugdev"`：将设备所属的组设置为 `plugdev`，通常该组的用户都具有对可插拔设备的访问权限。

:::
设置好 udev 规则后，需要重启系统使规则生效。

## 注册密钥

以计划用于认证的用户身份（而不是 root 用户）注册密钥。这一点非常重要，因为如果以 root 用户注册密钥，那么普通用户将无法使用该密钥进行认证：

```bash
pamu2fcfg > /tmp/u2f_keys
sudo mv /tmp/u2f_keys /etc/u2f_keys
```

`pamu2fcfg` 是一个用于配置 U2F 密钥的工具。运行该命令后，它会提示用户插入 U2F 密钥并触摸密钥上的按钮以完成注册。注册成功后，密钥的相关信息会被输出到 `/tmp/u2f_keys` 文件中，然后通过 `sudo mv` 命令将其移动到 `/etc/u2f_keys`，这是系统用于存储 U2F 密钥认证相关数据的目录。

## 配置 sudo 使用密钥

编辑 `/etc/pam.d/sudo` 文件，在包含 `@include common-auth` 这一行之前添加以下内容：

```bash
auth    sufficient    pam_u2f.so   cue authfile=/etc/u2f_keys
```

参数解释：

- `auth`：指定这是与认证相关的配置。
- `sufficient`：表示如果该认证模块成功通过，则整体认证视为成功；如果失败，则继续后续的认证模块。
- `pam_u2f.so`：指定使用的 PAM 模块为 `pam_u2f.so`，这是处理 U2F 密钥认证的模块。
- `cue`：参数用于提示用户进行操作，如触摸密钥上的按钮。
- `authfile=/etc/u2f_keys`：指定用于认证的密钥文件路径。

这样配置后，当使用 sudo 执行命令时，系统会先尝试通过 U2F 密钥进行认证。如果认证成功，就无需再输入密码；如果超时或未插入密钥，则会回退到正常的密码输入方式进行 sudo 认证。

## 配置登录使用密钥

编辑 `/etc/pam.d/gdm-password` 文件，在包含 `@include common-auth` 这一行之前添加以下内容：

```bash
auth    sufficient    pam_u2f.so   cue authfile=/etc/u2f_keys
```

与配置 sudo 类似，这里的参数含义相同。配置完成后，登录系统时如果密钥已插入，会先提示使用密钥进行认证，认证成功即可登录；若未插入密钥或认证失败，则继续通过密码登录。

## 测试验证

1. **测试 sudo 认证**：在不关闭当前终端的情况下，打开一个新的终端窗口，运行以下命令进行测试：

    ```bash
    sudo echo
    ```

    如果系统提示 "Please touch the device."，则表示 U2F 密钥认证已正常工作。触摸密钥上的按钮后，命令将成功执行。

2. **测试登录认证**：可以通过注销当前用户并尝试重新登录来测试登录时的 U2F 密钥认证。如果一切正常，插入密钥后系统会提示触摸密钥以完成登录。

## 参考来源

[Thetis FIDO U2F Key Ubuntu](https://danstechjourney.com/thetis-fido-u2f-key-ubuntu/)
