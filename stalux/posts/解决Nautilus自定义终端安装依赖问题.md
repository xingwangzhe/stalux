---
title: 解决 Nautilus 自定义终端插件安装依赖问题
abbrlink: nautilus-open-any-terminal
date: "2026-03-18 14:40:00"
desc: 默认的 GNOME Nautilus 只支持打开 gnome-terminal，如果你像我一样使用 Ghostty、Alacritty 或 Kitty 这样的第三方终端，就需要一个扩展来添加右键菜单。
categories:
    - ubuntu
tags:
    - ubuntu
    - Nautilus
    - 终端
    - Linux
---

> 事实上，本文为了追求最新，采用了源码安装。对于一般用户，直接去Release里下载deb包安装，快速解决冲突，配置才是理想选择

![自定义终端打开效果](/shell/ghostyy-any.webp)

## 问题背景

默认的 GNOME Nautilus 只支持打开 gnome-terminal，如果你像我一样使用 [Ghostty](https://mitchellh.com/ghostty)、[Alacritty](https://alacritty.org/) 或 [Kitty](https://sw.kovidgoyal.net/kitty/) 这样的第三方终端，就需要一个扩展来添加右键菜单。

[nautilus-open-any-terminal](https://github.com/Stunkymonkey/nautilus-open-any-terminal) 正是这样一个优秀开源扩展，支持**数十种**终端模拟器的开箱即用，还支持自定义快捷键。

但是在 Ubuntu 24.04 上直接安装官方提供的 `.deb` 包会遇到依赖错误：

```bash
$ sudo apt install ./nautilus-extension-any-terminal_xxx.deb
正在读取软件包列表... 完成
正在分析依赖关系树... 完成
下列软件包有未满足的依赖关系：
 nautilus-extension-any-terminal : 依赖: python3-nautilus 但是它将不会被安装
```

## 问题分析

Ubuntu 24.04 搭载的 Nautilus 版本是 46，使用 GTK 4 作为界面工具包。官方 deb 包的 `debian/control` 文件中缺少了两个关键依赖：

- `gir1.2-gtk-4.0` - GTK 4 的 GObject 内省数据
- `gir1.2-nautilus-4.0` - Nautilus 4.0 扩展接口的 GObject 内省数据

这导致 `python3-nautilus` 因为缺少依赖无法安装，整个扩展安装流程卡住。

## 解决方案

### 修复依赖，重新安装

我们需要更新 `debian/control` 添加缺失的依赖，然后从源码编译安装。

**1. 安装基础依赖**

```bash
sudo apt install gettext python3-nautilus gir1.2-gtk-4.0 gir1.2-nautilus-4.0 libglib2.0-dev-bin
```

如果之前安装失败了，先修复：

```bash
sudo apt --fix-broken install
```

**2. 克隆源码**

```bash
git clone https://github.com/Stunkymonkey/nautilus-open-any-terminal.git
cd nautilus-open-any-terminal
```

**3. （可选）修复 debian/control**

如果你想重新打包 deb，可以在 `debian/control` 的 `Depends` 部分添加缺失依赖.

```diff
 Depends: ${python3:Depends},
          ${misc:Depends},
          python3-nautilus,
+         gir1.2-gtk-4.0,
+         gir1.2-nautilus-4.0,
          nautilus
```

**4. 编译并从源码安装**

```bash
make
sudo make install-nautilus schema
```

**5. 重启 Nautilus 生效**

```bash
nautilus -q
```

## 配置你喜欢的终端

安装完成后，通过 `gsettings` 命令配置你想要的终端：

```bash
# 设置为 Ghostty
gsettings set com.github.stunkymonkey.nautilus-open-any-terminal terminal ghostty

# 设置为 Alacritty
gsettings set com.github.stunkymonkey.nautilus-open-any-terminal terminal alacritty

# 设置为 Kitty
gsettings set com.github.stunkymonkey.nautilus-open-any-terminal terminal kitty

# 设置快捷键 Ctrl+Alt+T 快速打开
gsettings set com.github.stunkymonkey.nautilus-open-any-terminal keybindings '<Ctrl><Alt>t'

# 开启新标签页打开（支持的终端）
gsettings set com.github.stunkymonkey.nautilus-open-any-terminal new-tab true
```

完整支持的终端列表可以查看项目[README](https://github.com/Stunkymonkey/nautilus-open-any-terminal#supported-terminal-emulators)，从 alacritty 到 xterm 应有尽有。

## 常见问题

### 右键出现两个相同的"Open in XXX"

大概率是因为你使用的终端模拟器本身就自带**Nautilus**插件，在你kill Nautilus之后又显示罢了，只需要删除冗余就好

```bash
# 检查是否有重复安装
find /usr/share/nautilus-python/extensions/ -name "*.py"

# 删除冗余的扩展
sudo rm /usr/share/nautilus-python/extensions/xyz.py
# 重启 Nautilus
nautilus -q
```

## 小结

通过添加缺失的 `gir1.2-gtk-4.0` 和 `gir1.2-nautilus-4.0` 依赖，就能在 Ubuntu 24.04 上成功安装这个很棒的扩展。现在你可以在 Nautilus 右键直接打开你喜欢的任意终端了。
