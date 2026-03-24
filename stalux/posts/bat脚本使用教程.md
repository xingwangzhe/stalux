---
title: bat脚本使用教程
abbrlink: 50463
date: 2024-12-11 20:10:06
updated: 2025-07-04 18:44:32
categories:
    - 开发
tags:
    - 记录
    - 教程
    - 学习
    - 进步
---

`.bat` 文件是 Windows 批处理文件（Batch File）的扩展名。批处理文件是一种包含一系列命令的脚本文件，这些命令可以由 Windows 命令解释器（cmd.exe）执行。批处理文件用于自动化简单的任务，如文件操作、程序执行、系统配置等。

<!--more-->

## 配置环境变量

为方便我们快速打开脚本，可以先配置环境变量

![2024-12-11-211228](https://i.ibb.co/mttQfCZ/2024-12-11-211228.png)

如图，为系统环境变量的`path`添加文件目录，这个文件目录下包含bat脚本文件

![2024-12-11-211534](https://i.ibb.co/2Z4v72Z/2024-12-11-211534.png)

那么让我们来简单了解一下。bat文件

## 基本使用

| 操作                 | 命令                          | 描述                                             |
| -------------------- | ----------------------------- | ------------------------------------------------ |
| 关闭命令回显         | `@echo off`                   | 关闭命令回显，使批处理文件执行时不显示执行的命令 |
| 显示文本             | `echo 你好，世界！`           | 在命令行显示文本                                 |
| 暂停                 | `pause`                       | 暂停执行，等待用户按任意键继续                   |
| 创建目录             | `mkdir 新目录名`              | 创建一个新目录                                   |
| 删除目录             | `rmdir 目录名`                | 删除一个空目录                                   |
| 删除文件             | `del 文件名`                  | 删除一个文件                                     |
| 复制文件             | `copy 源文件名 目标文件名`    | 复制文件到新位置                                 |
| 移动文件             | `move 源文件名 目标文件名`    | 移动或重命名文件                                 |
| 查找字符串           | `find 字符串 文件名`          | 在文件中查找字符串                               |
| 退出批处理           | `exit`                        | 退出批处理文件执行                               |
| 调用另一个批处理文件 | `call 另一个批处理文件名.bat` | 调用并执行另一个批处理文件                       |
| 设置变量             | `set 变量名=值`               | 设置或修改环境变量                               |
| 使用变量             | `%变量名%`                    | 在批处理文件中使用变量                           |
| 循环操作             | `for %变量名 in (集) do 命令` | 对集合中的每个项执行命令                         |
| 条件判断             | `if 条件 命令`                | 根据条件执行命令                                 |
| 跳转至标签           | `goto 标签名`                 | 跳转到批处理文件中的标签位置                     |
| 错误检查             | `errorlevel`                  | 检查命令执行后的错误代码                         |

## 示例

```bat
@echo off
set "appName=%1"
set "url=%2"

if "%appName%" == "qq" (
    start "" "D:\QQQQ\QQ.exe"
) else if "%appName%" == "edg" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "%url%"
) else if "%appName%" == "edge" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "%url%"
) else if "%appName%" == "chrome" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "%url%"
) else if "%appName%" == "chrom" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "%url%"
) else if "%appName%" == "steam" (
    start "" "D:\steamm\steam.exe"
) else if "%appName%" == "stm" (
    start "" "D:\steamm\steam.exe"
) else if "%appName%" == "vs" (
    start "" "C:\Users\20984\AppData\Local\Programs\Microsoft VS Code\Code.exe"
) else if "%appName%" == "ide" (
    start "" "D:\IntelliJ IDEA Community Edition 2024.1.1\bin\idea64.exe"
) else if "%appName%" == "c" (
    start ""  "C:\Program Files\RedPanda-Cpp\RedPandaIDE.exe"
) else if "%appName%" == "cpp" (
    start ""  "C:\Program Files\RedPanda-Cpp\RedPandaIDE.exe"
) else if "%appName%" == "xwz" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "xingwangzhe.fun"
) else (
    echo Invalid application name or no application specified.
)
```

方便我快速打开qq,steam等
还可以快速打开我的网站：）
