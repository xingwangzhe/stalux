---
title: "ubuntu的openvpn异常暂停推送更新"
categories:
    - ubuntu
tags:
    - openvpn
    - ubuntu
abbrlink: "error-push-openvpn-on-ubuntu"
date: "2026-03-10 13:54:01"
---

## **本文具有时效性，不代表长期状况，请注意文章发布时间，问题可能会很快解决**

> ⚠️ **过期提醒**：如果本文信息已过期（例如 [Bug #2112561](https://bugs.launchpad.net/bugs/2112561) 已修复），请勿依赖本文建议。建议读者在操作前先检查以下 Bug 的最新状态：
>
> - [Bug #2112561](https://bugs.launchpad.net/bugs/2112561) — NetworkManager OpenVPN 认证失败（**撰文时仍处于 Confirmed 状态**）

---

今天是东八区2026年3月10日13:54:01时，这已经是我不知道第几次`sudo apt update && sudo apt upgrade`了，但是依然存在两个依赖迟迟不更新，重要的是，**已经好几天**都在推迟

```bash title="bash| 更新依赖"
sudo apt upgrade
正在读取软件包列表... 完成
正在分析软件包的依赖关系树... 完成
正在读取状态信息... 完成
正在计算更新... 完成
下列软件包新版本的升级因阶段更新而被推迟：
  network-manager-openvpn network-manager-openvpn-gnome
升级了 0 个软件包，新安装了 0 个软件包，要卸载 0 个软件包，有 2 个软件包未被升级。
```

---

```bash title="bash| 查看推送进度 "
# 查看特定软件包的候选版本和阶段信息
apt-cache policy network-manager-openvpn network-manager-openvpn-gnome
```

---

```bash title="bash| 推送进度：0% "
zsh: command not found: #
network-manager-openvpn:
  已安装：1.10.2-4build2
  候选： 1.10.2-4ubuntu0.1
  版本列表：
     1.10.2-4ubuntu0.1 500 (阶段更新 0%)
        500 http://cn.archive.ubuntu.com/ubuntu  noble-updates/main amd64 Packages
 *** 1.10.2-4build2 500
        500 http://cn.archive.ubuntu.com/ubuntu  noble/main amd64 Packages
        100 /var/lib/dpkg/status
network-manager-openvpn-gnome:
  已安装：1.10.2-4build2
  候选： 1.10.2-4ubuntu0.1
  版本列表：
     1.10.2-4ubuntu0.1 500 (阶段更新 0%)
        500 http://cn.archive.ubuntu.com/ubuntu  noble-updates/main amd64 Packages
 *** 1.10.2-4build2 500
        500 http://cn.archive.ubuntu.com/ubuntu  noble/main amd64 Packages
        100 /var/lib/dpkg/status
```

目前情况异常，一般来说，48小时之内，就会完成大规模推送更新，但这次，已经超过48小时几天了，说明出现了**重大问题**，于是我去ubuntu论坛上找找线索.

---

## 查到的 Bug 线索

在 Launchpad 上，我找到了与 `network-manager-openvpn` 相关的 Bug，可以解释为什么这次阶段性更新（phased update）被异常暂停。

### [Bug #2112561](https://bugs.launchpad.net/bugs/2112561) — NetworkManager 在 Ubuntu 24.04 上 OpenVPN 认证失败

**状态： 仍处于 Confirmed 状态（撰文时未修复）**

这是与 `network-manager-openvpn` 更新暂停**直接相关**的功能性回归 Bug，也是最核心的问题所在。

**现象描述**：

在 Ubuntu 24.04 LTS 全新安装环境下，使用 NetworkManager 图形界面连接需要 TLS 证书 + 用户名/密码双重认证的 OpenVPN 服务器时，连接会**持续失败**。日志显示：

```
AUTH_FAILED
ERROR: could not read Auth username/password/ok/string from management interface
```

更诡异的是，`nm-openvpn` 插件会**完全忽略** `.ovpn` 配置文件中的 `auth-user-pass /path/to/auth.txt` 指令（即从文件读取凭据），转而弹出交互式密码框，但输入正确密码后依然认证失败。

**这是一个回归（regression）**：同样的配置文件和凭据在 Ubuntu 22.04 LTS 上通过 NetworkManager GUI 完全正常工作。命令行直接执行 `sudo openvpn --config client.ovpn` 在 24.04 上也完全正常，**问题被精确隔离到 `network-manager-openvpn` 插件本身**。

另外有用户反馈，即使在 NetworkManager 编辑界面中手动将认证类型设置为「Password with Certificate (TLS)」并填写用户名密码，仍然无法连接，密码框会反复弹出。

**目前状态**：

截至本文撰写时（2026-03-10），此 Bug 已被多人确认（`Confirmed`），但尚未分配开发者、尚无修复计划、尚无修复版本。Launchpad Janitor 曾因 60 天无活动将其标记为 `Expired`，后于 2026-02-20 被重新确认为 `Confirmed`。

**这正是 `network-manager-openvpn` 和 `network-manager-openvpn-gnome` 的阶段性更新被系统自动暂停的根本原因**——Ubuntu 的阶段性更新机制会在检测到更新包导致用户报告 Bug 数量异常上升时，自动降低或暂停该包的推送比例，以防止大规模破坏用户环境。

---

## 强制安装被暂停的更新（不推荐，风险自负）

如果你明确知晓风险，想强制安装被阶段性暂停的包，可以：

```bash
sudo apt install network-manager-openvpn network-manager-openvpn-gnome
```

直接指定包名安装会绕过阶段性更新限制。但鉴于 [Bug #2112561](https://bugs.launchpad.net/bugs/2112561) 尚未修复，强制更新后 NetworkManager GUI 的 OpenVPN 认证功能大概率仍然无法正常使用。

---

## 临时解决方案

如果你头铁不小心真更新了不稳定版本，再想要正常使用 OpenVPN，可以绕过 NetworkManager，直接使用命令行：

```bash
sudo openvpn --config /path/to/your.ovpn
```

命令行方式不受 `network-manager-openvpn` 插件 Bug 影响，在 Ubuntu 24.04 上完全正常工作。

---
