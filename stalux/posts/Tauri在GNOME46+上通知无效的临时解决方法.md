---
title: Tauri在GNOME46+上通知无效的临时解决方法
abbrlink: 8d9bb0f3
date: "2025-08-29 15:14:05"
updated: "2025-08-29 15:28:35"
desc: 起因是我在我的ubuntu24.04上，无法调用Tauri的同时函数，后来找了一下资料，发现竟然还是bug。
categories:
    - Tauri
tags:
    - Tauri
    - GNOME
    - 通知
    - Wayland
    - 解决方案
---

起因是我在我的ubuntu24.04上，无法调用Tauri的同时函数，后来找了一下资料，发现竟然还是bug。

## 问题描述

在GNOME 46+（如Fedora 41、Ubuntu 24.04等）上，Tauri应用的通知功能出现异常：通知弹出后立即消失，用户根本看不到通知内容。这个问题主要影响Wayland环境，X11环境下可能正常。

## 问题根源分析

经过层层追踪相关issue，我找到了问题的根本原因：

### 1. 核心问题

GNOME 46在Wayland环境下改变了通知处理机制，导致通知需要保持DBus连接打开，否则会立即消失。

### 2. 技术细节

| 方面             | 描述                                                   |
| ---------------- | ------------------------------------------------------ |
| **DBus连接管理** | 通知处理器在`show()`调用后被立即丢弃，导致DBus连接关闭 |
| **进程标识缺失** | 通知缺少`sender-pid`字段，无法正确识别发送者           |
| **环境差异**     | Wayland vs X11的处理机制不同                           |

### 3. 影响链条

```
Tauri应用 → tauri-plugin-notification → notify-rust库 → libnotify → GNOME Shell
```

### 4. 相关Issue追踪

| 类型            | 链接                                                                                             | 描述                                        |
| --------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| **原始Issue**   | [tauri-apps/plugins-workspace#2566](https://github.com/tauri-apps/plugins-workspace/issues/2566) | Tauri插件工作区的主要问题报告               |
| **底层库Issue** | [hoodie/notify-rust#218](https://github.com/hoodie/notify-rust/issues/218)                       | notify-rust库的GNOME 46兼容性问题           |
| **系统库Issue** | [GNOME/libnotify#41](https://gitlab.gnome.org/GNOME/libnotify/-/issues/41)                       | GNOME libnotify的底层问题                   |
| **重复Issue**   | [tauri-apps/tauri#14095](https://github.com/tauri-apps/tauri/issues/14095)                       | Tauri主仓库的重复问题报告(好吧，是我大意了) |

## 临时解决方案

### 方案：使用系统notify-send命令（推荐）

由于Tauri插件和底层库在GNOME 46+的Wayland环境下存在兼容性问题，导致通知无法正常显示。为了解决这一问题，推荐采用一种临时且高效的替代方案：直接调用系统自带的`notify-send`命令。`notify-send`是Linux桌面环境中广泛支持的命令行工具，能够通过DBus接口向系统通知服务发送消息，绕过了Tauri插件和notify-rust库的限制。

**原理说明**：  
`notify-send`直接与系统的通知服务（如GNOME Shell）通信，能够保证通知的正常弹出和显示时长，不受Tauri或第三方库的生命周期影响。它通过命令行参数灵活控制通知内容、显示时间、紧急程度等，适用于绝大多数Linux发行版和桌面环境。

**适用范围**：

- 适用于所有支持`notify-send`的Linux桌面环境（如GNOME、KDE、XFCE等）
- 对Wayland和X11均有效，尤其适合GNOME 46+的Wayland环境

**优缺点**：

| 优点                                  | 缺点                                    |
| ------------------------------------- | --------------------------------------- |
| 兼容性强，几乎所有主流Linux桌面都支持 | 依赖系统命令，需确保`notify-send`已安装 |
| 实现简单，无需等待上游库修复          | 性能略低于原生API调用（但影响极小）     |
| 参数灵活，可定制通知行为              | 需注意参数安全，防止注入风险            |
| 不受Tauri插件生命周期影响             | 仅适用于Linux，无法跨平台               |

下面是具体的Rust调用示例：

```rust title="send_notification.rs"
use std::process::Command;
use std::thread;
use tauri::{command, AppHandle};

#[command]
pub fn send_notification(_app: AppHandle, title: String, body: String) -> Result<(), String> {
    thread::spawn(move || {
        let result = Command::new("notify-send")
            .args([
                "--app-name=wngtools",
                "--urgency=normal",
                "--expire-time=5000",
                "--hint=string:sound-name:message-new-instant",
                &title,
                &body
            ])
            .output();

        match result {
            Ok(output) if output.status.success() => {
                println!("✅ Notification sent: {}", title);
            }
            _ => {
                eprintln!("❌ Notification failed for: {}", title);
            }
        }
    });
    Ok(())
}
```

**参数说明**：

| 参数            | 说明             | 可选值                                   |
| --------------- | ---------------- | ---------------------------------------- |
| `--app-name`    | 应用名称         | 任意字符串                               |
| `--urgency`     | 紧急程度         | low/normal/critical                      |
| `--expire-time` | 显示时长（毫秒） | 数字（毫秒）                             |
| `--hint`        | 额外提示信息     | string:sound-name:message-new-instant 等 |

## 测试验证

### 手动测试

```bash
# 测试系统notify-send是否正常
notify-send "Test" "This is a test notification"

# 测试不同参数
notify-send --app-name="MyApp" --urgency=normal "Title" "Message"
```

## 注意事项

| 方面         | 说明                                     |
| ------------ | ---------------------------------------- |
| **系统依赖** | 确保系统已安装`libnotify`和`notify-send` |
| **权限问题** | 某些系统可能需要额外的权限配置           |
| **兼容性**   | 此解决方案在所有Linux桌面环境下都有效    |
| **性能影响** | 使用系统命令可能会略微影响性能           |
| **安全性**   | 直接调用系统命令需要注意参数注入风险     |

## 未来展望(等待上游更新)

| 版本/项目              | 计划内容                       |
| ---------------------- | ------------------------------ |
| **notify-rust v5.0.0** | 计划添加XDG Desktop Portal支持 |
| **Tauri插件更新**      | 可能集成上述解决方案           |
| **GNOME修复**          | 系统层面可能提供更好的兼容性   |

## 参考资料

- [Tauri Notification Plugin Documentation](https://tauri.app/plugin/notification/)
- [notify-rust Library](https://github.com/hoodie/notify-rust)
- [GNOME libnotify](https://gitlab.gnome.org/GNOME/libnotify)
- [XDG Desktop Portal](https://flatpak.github.io/xdg-desktop-portal/)

---

_如今只能等待上游了修复了_
